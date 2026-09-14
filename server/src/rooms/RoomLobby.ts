import { Room, Client, matchMaker } from "@colyseus/core";
import crypto from "crypto";

/**
 * Ported from puz-royale-clause-'s PuzGameLobby: room-browser lobby with
 * create/join/ready/master/launch, backed by Colyseus's built-in LobbyRoom
 * for realtime listing. `room:launch` creates a `game_room` (FootyHead's
 * actual head-football match, untouched) instead of Puz Royale's `puz_room`.
 *
 * FootyHead is strictly 1v1, so maxClients is 2 (vs. Puz Royale's 16) and
 * launch requires both players present and ready, rather than "at least 1".
 */
interface PlayerData {
  id: string;
  name: string;
  ready: boolean;
  master: boolean;
}

function generatePin(length = 6) {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let pin = "";
  crypto.randomBytes(length).forEach((byte) => {
    pin += chars[byte % chars.length];
  });
  return pin;
}

export class RoomLobby extends Room {
  maxClients = 2;

  private lobbyPlayers: Record<string, PlayerData> = {};
  private lobbyName: string = "";
  private lobbyLocked: boolean = false;
  private lobbyPassword: string | null = null;

  async onCreate(options: any) {
    this.lobbyName = options.name || "Room";
    this.lobbyPassword = options.password || null;
    this.lobbyLocked = !!this.lobbyPassword;

    // Private rooms stay listed (open: true) so they appear with a lock badge;
    // open only flips to false once the match actually launches.
    await this.setMetadata({
      name: this.lobbyName,
      open: true,
      locked: this.lobbyLocked,
      players: 0,
    });

    this.onMessage("room:getState", (client: Client) => {
      const p = this.lobbyPlayers[client.sessionId];
      if (!p) return;
      client.send("room:join", { room: this.serializeRoom(), player: p });
    });

    this.onMessage("room:ready", (client: Client) => {
      const p = this.lobbyPlayers[client.sessionId];
      if (!p) return;
      p.ready = true;
      this.broadcast("room:player:ready", { player: p });
      this.broadcast("room:state", this.serializeRoom());
    });

    this.onMessage("room:launch", async (client: Client) => {
      const p = this.lobbyPlayers[client.sessionId];
      if (!p || !p.master) return;

      const players = Object.values(this.lobbyPlayers);
      if (players.length < 2) {
        client.send("room:error", { message: "Need a second player to start" });
        return;
      }
      if (!players.every((pp) => pp.ready)) {
        client.send("room:error", { message: "Both players must be ready" });
        return;
      }

      try {
        const pin = generatePin();
        const gameRoom = await matchMaker.createRoom("game_room", { pin });

        // Remove from lobby listing immediately (belt+suspenders, same as
        // Puz Royale: setPrivate alone may not update existing LobbyRoom
        // connections in every Colyseus build).
        await this.setPrivate(true);
        await this.setMetadata({
          name: this.lobbyName,
          open: false,
          locked: this.lobbyLocked,
          players: players.length,
        });

        this.broadcast("room:launch:start", {});
        this.clock.setTimeout(() => {
          this.broadcast("room:game:start", { roomId: gameRoom.roomId, pin });
          // WebSocket flushes queued sends before the close frame, so clients
          // receive room:game:start before disconnect. Force-leave afterward
          // so autoDispose fires even if a client never navigates away.
          this.clock.setTimeout(() => {
            this.clients.forEach((c) => c.leave(1000));
          }, 300);
        }, 2000);
      } catch (e) {
        client.send("room:error", { message: "Failed to start match" });
      }
    });

    this.onMessage("room:leave", (client: Client) => {
      client.leave();
    });
  }

  async onJoin(client: Client, options: any) {
    if (this.lobbyPassword && options.password !== this.lobbyPassword) {
      throw new Error("Wrong password");
    }

    const isMaster = Object.keys(this.lobbyPlayers).length === 0;
    const pd: PlayerData = {
      id: client.sessionId,
      name: options.playerName || "Player",
      ready: false,
      master: isMaster,
    };
    this.lobbyPlayers[client.sessionId] = pd;

    await this.setMetadata({
      name: this.lobbyName,
      open: true,
      locked: this.lobbyLocked,
      players: Object.keys(this.lobbyPlayers).length,
    });

    if (!isMaster) {
      this.broadcast("room:player:join", { player: pd }, { except: client });
      this.broadcast("room:state", this.serializeRoom());
    }
  }

  async onLeave(client: Client) {
    const p = this.lobbyPlayers[client.sessionId];
    if (!p) return;
    delete this.lobbyPlayers[client.sessionId];

    // Early-return before setMetadata when the room is now empty: avoids a
    // 0-player metadata update showing as a ghost listing before autoDispose.
    if (Object.keys(this.lobbyPlayers).length === 0) return;

    await this.setMetadata({
      name: this.lobbyName,
      open: true,
      locked: this.lobbyLocked,
      players: Object.keys(this.lobbyPlayers).length,
    });

    this.broadcast("room:player:leave", { player: client.sessionId });

    if (p.master) {
      const newMasterId = Object.keys(this.lobbyPlayers)[0];
      this.lobbyPlayers[newMasterId].master = true;
      this.broadcast("room:master", { master: newMasterId });
    }
    this.broadcast("room:state", this.serializeRoom());
  }

  private serializeRoom() {
    const players = Object.values(this.lobbyPlayers);
    return {
      id: this.roomId,
      name: this.lobbyName,
      locked: this.lobbyLocked,
      master: players.find((p) => p.master)?.id || "",
      players,
    };
  }
}
