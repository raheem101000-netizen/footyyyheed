import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Room } from "colyseus.js";
import { Border, Button, Title } from "../layout";
import { colyseusClient } from "../lib/colyseusClient";

type LobbyListing = {
  roomId: string;
  clients: number;
  maxClients: number;
  metadata?: { name: string; open: boolean; locked: boolean; players: number };
};

type PlayerData = { id: string; name: string; ready: boolean; master: boolean };
type RoomState = {
  id: string;
  name: string;
  locked: boolean;
  master: string;
  players: PlayerData[];
};

/**
 * Room browser + waiting room, ported from puz-royale-clause-'s rooms.html /
 * PuzGameLobby onto FootyHead's React client. Replaces the old PIN+SQLite
 * `/play` flow. On `room:game:start` it hands off to the existing
 * `/play/:roomId` route, which joins FootyHead's untouched `game_room`.
 */
export function Rooms() {
  const navigate = useNavigate();
  const [myName, setMyName] = useState(
    () => localStorage.getItem("footy_name") || `Player${Math.floor(Math.random() * 1000)}`
  );
  const [listings, setListings] = useState<LobbyListing[]>([]);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [mySessionId, setMySessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"browse" | "create" | "join-locked" | "in-lobby" | "launching">(
    "browse"
  );
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [pendingRoomId, setPendingRoomId] = useState("");
  const [error, setError] = useState("");

  const lobbyListRoomRef = useRef<Room | null>(null);
  const gameLobbyRoomRef = useRef<Room | null>(null);

  // Browse the live room list via Colyseus's built-in LobbyRoom.
  useEffect(() => {
    let cancelled = false;

    async function connect() {
      try {
        const lobbyRoom = await colyseusClient.joinOrCreate("lobby");
        if (cancelled) {
          lobbyRoom.leave();
          return;
        }
        lobbyListRoomRef.current = lobbyRoom;

        lobbyRoom.onMessage("rooms", (rooms: LobbyListing[]) => setListings(rooms));
        lobbyRoom.onMessage("+", ([roomId, data]: [string, Partial<LobbyListing>]) => {
          setListings((prev) => {
            const idx = prev.findIndex((r) => r.roomId === roomId);
            const next = { ...prev[idx], ...data, roomId } as LobbyListing;
            if (idx === -1) return [...prev, next];
            const copy = [...prev];
            copy[idx] = next;
            return copy;
          });
        });
        lobbyRoom.onMessage("-", (roomId: string) => {
          setListings((prev) => prev.filter((r) => r.roomId !== roomId));
        });
      } catch (e) {
        console.error("[lobby] connect failed", e);
      }
    }

    connect();
    return () => {
      cancelled = true;
      lobbyListRoomRef.current?.leave();
      lobbyListRoomRef.current = null;
    };
  }, []);

  function saveName(name: string) {
    setMyName(name);
    localStorage.setItem("footy_name", name);
  }

  function attachGameLobbyHandlers(room: Room) {
    gameLobbyRoomRef.current = room;
    setMySessionId(room.sessionId);

    room.onMessage("room:join", ({ room: r }: { room: RoomState }) => {
      setRoomState(r);
      setPhase("in-lobby");
    });
    room.onMessage("room:state", (r: RoomState) => setRoomState(r));
    room.onMessage("room:launch:start", () => setPhase("launching"));
    room.onMessage("room:game:start", ({ roomId, pin }: { roomId: string; pin: string }) => {
      navigate(`${roomId}`, { state: { pin } });
    });
    room.onMessage("room:error", ({ message }: { message: string }) => setError(message));
    room.onLeave(() => {
      gameLobbyRoomRef.current = null;
      setRoomState(null);
      setPhase("browse");
    });

    room.send("room:getState");
  }

  async function createRoom() {
    setError("");
    if (!createName.trim()) {
      setError("Enter a room name");
      return;
    }
    try {
      const room = await colyseusClient.create("room_lobby", {
        name: createName.trim(),
        password: createPassword || null,
        playerName: myName,
      });
      attachGameLobbyHandlers(room);
    } catch (e) {
      setError(`Failed to create room: ${(e as Error).message || e}`);
    }
  }

  async function joinRoom(roomId: string, password?: string) {
    setError("");
    try {
      const room = await colyseusClient.joinById(roomId, {
        playerName: myName,
        password,
      });
      attachGameLobbyHandlers(room);
    } catch (e) {
      setError("Failed to join (wrong password or room is full)");
    }
  }

  function ready() {
    gameLobbyRoomRef.current?.send("room:ready");
  }

  function launch() {
    gameLobbyRoomRef.current?.send("room:launch");
  }

  function leaveLobby() {
    gameLobbyRoomRef.current?.leave();
    gameLobbyRoomRef.current = null;
    setRoomState(null);
    setPhase("browse");
  }

  const visibleListings = listings.filter(
    (r) => r.metadata?.open === true && r.clients < r.maxClients
  );

  const isMaster = !!(roomState && mySessionId && roomState.master === mySessionId);
  const me = roomState?.players.find((p) => p.id === mySessionId);
  const bothReady = !!roomState && roomState.players.length === 2 && roomState.players.every((p) => p.ready);

  if (phase === "in-lobby" || phase === "launching") {
    return (
      <>
        <Title>Footy Head</Title>
        <div className="lobby-card honk-font">
          <div className="lobby-card--title">{roomState?.name}</div>
          {phase === "launching" ? (
            <div className="lobby-card--desc">Kickoff in a moment&hellip;</div>
          ) : (
            <>
              <div className="lobby-card--desc">Waiting for players</div>
              {roomState?.players.map((p) => (
                <div key={p.id} className={`player-row ${p.ready ? "player-row--ready" : ""}`}>
                  {p.name}
                  {p.master ? <span className="badge-master">HOST</span> : null}
                  {p.ready ? " ✓ ready" : " …not ready"}
                </div>
              ))}
              {error ? <div className="error-text">{error}</div> : null}
            </>
          )}
        </div>
        {phase === "in-lobby" ? (
          <div style={{ display: "flex" }}>
            <Button onClick={leaveLobby}>← Leave</Button>
            {!me?.ready ? (
              <Button onClick={ready}>Ready</Button>
            ) : isMaster ? (
              <Button onClick={launch} className={bothReady ? "" : "button--disabled"}>
                Start Match
              </Button>
            ) : (
              <span className="lobby-card--desc" style={{ fontSize: 20 }}>
                Waiting for host&hellip;
              </span>
            )}
          </div>
        ) : null}
      </>
    );
  }

  return (
    <>
      <Title>Footy Head</Title>
      <Border>
        <div className="room-list-wrap">
          <div className="lobby-card--desc" style={{ fontSize: 28 }}>
            Rooms
          </div>
          <input
            className="lobby-input"
            value={myName}
            onChange={(e) => saveName(e.target.value)}
            placeholder="Your name"
          />
          <div className="room-list">
            {visibleListings.length === 0 ? (
              <div className="room-row">No rooms yet. Create one!</div>
            ) : (
              visibleListings.map((r) => (
                <div key={r.roomId} className="room-row">
                  <div>
                    <span className="room-row--name">{r.metadata?.name || r.roomId}</span>
                    {r.metadata?.locked ? <span className="room-row--locked">PRIVATE</span> : null}
                    <div>{r.clients}/{r.maxClients} players</div>
                  </div>
                  <Button
                    className="button--small"
                    onClick={() => {
                      if (r.metadata?.locked) {
                        setPendingRoomId(r.roomId);
                        setPhase("join-locked");
                      } else {
                        joinRoom(r.roomId);
                      }
                    }}
                  >
                    Join
                  </Button>
                </div>
              ))
            )}
          </div>
          {error ? <div className="error-text">{error}</div> : null}
          {phase === "create" ? (
            <div>
              <input
                className="lobby-input"
                placeholder="Room name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
              <input
                className="lobby-input"
                placeholder="Password (optional)"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
              />
              <Button className="button--small" onClick={createRoom}>
                Create
              </Button>
            </div>
          ) : phase === "join-locked" ? (
            <div>
              <input
                className="lobby-input"
                placeholder="Password"
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
              />
              <Button
                className="button--small"
                onClick={() => joinRoom(pendingRoomId, joinPassword)}
              >
                Join
              </Button>
            </div>
          ) : (
            <Button className="button--small" onClick={() => setPhase("create")}>
              Create Room
            </Button>
          )}
        </div>
      </Border>
      <div style={{ display: "flex" }}>
        <Button onClick={() => navigate("/")}>← Go Back</Button>
      </div>
    </>
  );
}

export default Rooms;
