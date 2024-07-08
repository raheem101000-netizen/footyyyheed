import { Room, Client, matchMaker } from "@colyseus/core";
import { Ball, GameState, Player, Score } from "./schema/GameState";
import {
  Engine,
  Events,
  Bodies,
  Composite,
  World,
  Body,
  Sleeping,
  Collision,
} from "matter-js";
import db from "../../db/init";

/**
 * Footyhead Game Room. First client that joins is designated host
 * and their sessionId is set to `hostId`
 */
export class GameRoom extends Room<GameState> {
  engine: Engine;
  world: World;
  hostId: string;
  playerOne: Body;
  playerTwo: Body;
  ball: Body;

  maxClients = 2;

  onCreate(options: any) {
    if (options.pin) {
      this.setPrivate();
    }

    this.setState(new GameState());

    this.engine = Engine.create({ enableSleeping: true, gravity: { y: 0.7 } });
    this.world = this.engine.world;

    const leftWall = Bodies.rectangle(-10, 300, 20, 768, { isStatic: true });
    const rightWall = Bodies.rectangle(1034, 300, 20, 768, { isStatic: true });
    const ceiling = Bodies.rectangle(400, -10, 1024, 20, { isStatic: true });
    const ground = Bodies.rectangle(512, 600, 1024, 20, {
      isStatic: true,
      friction: 0.3,
    });
    const goalOne = Bodies.rectangle(40, 465, 80, 5, {
      isStatic: true,
      angle: 0.05,
      restitution: 0.4,
    });
    const goalTwo = Bodies.rectangle(984, 465, 80, 5, {
      isStatic: true,
      angle: -0.05,
      restitution: 0.4,
    });
    this.playerOne = Bodies.circle(200, 500, 22, {
      mass: 20,
      restitution: 0.3,
    });
    this.playerTwo = Bodies.circle(824, 500, 22, {
      mass: 20,
      restitution: 0.3,
    });
    this.ball = Bodies.circle(512, 500, 10, {
      mass: 3,
      restitution: 1,
      friction: 0.05,
      frictionAir: 0.005,
    });

    Composite.add(this.world, [
      ground,
      leftWall,
      rightWall,
      ceiling,
      goalOne,
      goalTwo,
      this.ball,
    ]);

    this.setSimulationInterval((timeDelta) => {
      Engine.update(this.engine, timeDelta);
    }, 1000 / 60);

    Events.on(this.engine, "afterUpdate", () => {
      const goalOneTop = Collision.collides(goalOne, this.ball);
      const goalTwoTop = Collision.collides(goalTwo, this.ball);

      if (goalOneTop?.collided) {
        Body.setVelocity(this.ball, { x: 1.5, y: this.ball.velocity.y });
      } else if (goalTwoTop?.collided) {
        Body.setVelocity(this.ball, { x: -1.5, y: this.ball.velocity.y });
      }

      this.state.ball.x = this.ball.position.x;
      this.state.ball.y = this.ball.position.y;
      this.state.ball.vx = this.ball.velocity.x;
      this.state.ball.vy = this.ball.velocity.y;
      this.state.ball.angle = this.ball.angularVelocity;

      this.state.players.forEach((playerState, sessionId) => {
        const player =
          sessionId == this.hostId ? this.playerOne : this.playerTwo;

        playerState.x = player.position.x;
        playerState.y = player.position.y;
        playerState.vx = player.velocity.x;
        playerState.vy = player.velocity.y;
      });
    });

    this.onMessage("move", (client, { direction }) => {
      const player =
        client.sessionId == this.hostId ? this.playerOne : this.playerTwo;
      Sleeping.set(player, false);
      if (direction == "left") {
        Body.setVelocity(player, { x: -4, y: player.velocity.y });
      } else if (direction == "right") {
        Body.setVelocity(player, { x: 4, y: player.velocity.y });
      }
      if (direction == "up") {
        Body.setVelocity(player, { x: player.velocity.x, y: -6 });
      }
    });

    this.onMessage("startKick", (client) => {
      const player = this.state.players.get(client.sessionId);
      player.kick = true;
      this.clock.setTimeout(() => {
        player.kick = false;
      }, 75);
    });

    this.onMessage("kick", (client) => {
      const player = this.state.players.get(client.sessionId);
      switch (player.team) {
        case 1:
          Body.setVelocity(this.ball, {
            x: this.ball.velocity.x + 5,
            y: this.ball.velocity.y - 8,
          });
          Body.setAngularVelocity(this.ball, this.ball.angularVelocity + 0.5);
          break;
        case 2:
          Body.setVelocity(this.ball, {
            x: this.ball.velocity.x - 5,
            y: this.ball.velocity.y - 8,
          });
          Body.setAngularVelocity(this.ball, this.ball.angularVelocity - 0.5);
      }
    });

    this.onMessage("goal", (_, player: 1 | 2) => {
      this.state.score[player]++;
      Body.setVelocity(this.playerOne, { x: 0, y: 0 });
      Body.setVelocity(this.playerTwo, { x: 0, y: 0 });
      this.engine.enabled = false;
    });

    this.onMessage("serve", (_, player: 1 | 2) => {
      this.resetPositions();
      this.serveBall(player);
    });
  }

  onJoin(client: Client, options: any) {
    let player;

    if (!this.hostId) {
      this.hostId = client.sessionId;
      World.add(this.world, this.playerOne);
      player = new Player(1);
    } else {
      World.add(this.world, this.playerTwo);
      player = new Player(2);
    }
    this.state.ball = new Ball();
    this.state.score = new Score();
    this.state.players.set(client.sessionId, player);

    db.prepare("UPDATE game SET active = active + 1 WHERE roomId = ?").run(
      this.roomId
    );
  }

  onLeave(client: Client, consented: boolean) {
    if (client.sessionId == this.hostId) {
      this.disconnect();
      return;
    }
    const player = this.state.players.get(client.sessionId);
    World.remove(
      this.world,
      player.team == 1 ? this.playerOne : this.playerTwo
    );
    this.state.players.delete(client.sessionId);
    db.prepare("UPDATE game SET active = active - 1 WHERE roomId = ?").run(
      this.roomId
    );
  }

  onDispose() {
    db.prepare("DELETE FROM game WHERE roomId = ?").run(this.roomId);
  }

  resetPositions() {
    Body.setPosition(this.playerOne, { x: 200, y: 550 });
    Body.setVelocity(this.playerOne, { x: 0, y: 0 });

    Body.setPosition(this.playerTwo, { x: 824, y: 550 });
    Body.setVelocity(this.playerTwo, { x: 0, y: 0 });

    Body.setPosition(this.ball, { x: 512, y: 400 });
    Body.setVelocity(this.ball, { x: 0, y: 0 });
    Body.setAngularVelocity(this.ball, 0);
  }

  serveBall(from: 1 | 2) {
    from == 1
      ? Body.setVelocity(this.ball, { x: 4, y: -3 })
      : Body.setVelocity(this.ball, { x: -4, y: -3 });
  }
}
