import config from "@colyseus/tools";
import { LobbyRoom } from "colyseus";
import { monitor } from "@colyseus/monitor";

/**
 * Import your Room files
 */
import { GameRoom } from "./rooms/GameRoom";
import { RoomLobby } from "./rooms/RoomLobby";

export default config({
  initializeGameServer: (gameServer) => {
    /**
     * Define your room handlers:
     */
    if (process.env.NODE_ENV !== "production") {
      // gameServer.simulateLatency(200);
    }
    // Built-in LobbyRoom: auto-broadcasts room list changes to anyone
    // watching (used by the client's room browser).
    gameServer.define("lobby", LobbyRoom);
    // RoomLobby: one instance per game lobby (create/join/ready/launch).
    // enableRealtimeListing() pushes +/- events into the LobbyRoom feed
    // whenever a lobby is created/updated/removed.
    gameServer.define("room_lobby", RoomLobby).enableRealtimeListing();
    // The actual head-football match, launched by RoomLobby via matchMaker.
    gameServer.define("game_room", GameRoom).filterBy(["pin"]);
  },

  initializeExpress: (app) => {
    // app.use(cors())
    /**
     * Bind your custom express routes here:
     * Read more: https://expressjs.com/en/starter/basic-routing.html
     */

    /**
     * Use @colyseus/monitor
     * It is recommended to protect this route with a password
     * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
     */
    app.use("/colyseus", monitor());
  },

  beforeListen: () => {
    /**
     * Before before gameServer.listen() is called.
     */
  },
});
