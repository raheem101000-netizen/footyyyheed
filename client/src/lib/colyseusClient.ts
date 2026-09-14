import { Client } from "colyseus.js";

// Shared client for the room-browser/lobby layer. The Phaser Game scene
// keeps its own separate Client instance (untouched) for the actual match.
export const colyseusClient = new Client("http://localhost:2567");
