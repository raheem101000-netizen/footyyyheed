/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Math, Scene } from "phaser";
import { Client as ColyseusClient, Room } from "colyseus.js";

import { CollisionCategories, PlayerNumber } from "../lib";
import { Ball, Goal, Player } from "../objects";

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  cursors: Record<string, Phaser.Input.Keyboard.Key>;
  background: Phaser.GameObjects.Image;
  scoreText: Phaser.GameObjects.Text;
  platforms: Phaser.Physics.Matter.Image;
  players: Record<string, Player>;
  ball: Ball;
  room: Room;
  roomData: any;
  client = new ColyseusClient("http://192.168.0.201:2567");

  constructor() {
    super("Game");
    this.players = {};
  }

  async init(data: any) {
    this.roomData = data;
  }

  preload() {
    this.camera = this.cameras.main;
    this.cursors = this.input.keyboard?.addKeys(" W, A, D, space") as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
  }

  async create(_time: number, _delta: number) {
    const { categoryFootball, categoryPlatform, categoryPlayer } =
      CollisionCategories;
    const shapes = this.cache.json.get("shapes");
    const { W, A, D, space } = this.cursors;

    try {
      this.room = await this.client.joinById(this.roomData.roomId, {
        pin: this.roomData.pin,
      });
      console.log("Joined successfully!");
    } catch (e) {
      console.error(e);
    }

    this.scoreText = this.add
      .text(512, 175, "0 : 0", {
        fontFamily: "Arial Black",
        fontSize: 64,
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.matter.world.setBounds();

    this.platforms = this.matter.add
      .image(512, 600, "ground", undefined, { label: "ground" })
      .setStatic(true)
      .setFriction(0.3)
      .setScale(1.3, 1)
      .setCollisionCategory(categoryPlatform)
      .setCollidesWith(categoryPlayer | categoryFootball);
    this.sound.add("ball-touch");
    this.sound.add("jump");
    this.sound.add("die");

    new Goal(this.matter.world, PlayerNumber.One, {
      shape: shapes.goal,
    });
    new Goal(this.matter.world, PlayerNumber.Two, {
      shape: shapes.goal_2,
    });

    this.room.state.players.onAdd((playerState: any, sessionId: string) => {
      console.log(`Player has been added with sessionId: ${sessionId}`);
      // Add player entity to world
      const player = new Player(
        this.matter.world,
        playerState.team,
        undefined,
        {
          shape: shapes[`boot_${playerState.team}`],
        }
      );
      this.players[sessionId] = player;
      player.boot.setData("lastKicked", -1);

      playerState.onChange(() => {
        // Cache updated coordinates for processing
        player.body.setData("serverX", playerState.x);
        player.body.setData("serverY", playerState.y);
        player.body.setData("serverVX", playerState.vx);
        player.body.setData("serverVY", playerState.vy);
        player.body.setData("serverKick", playerState.kick);
      });

      player.body.setOnCollideWith([this.platforms], () => {
        player.isGrounded = true;
      });
    });
    this.room.state.players.onRemove((_: any, sessionId: string) => {
      const player = this.players[sessionId];
      if (player) {
        player.destroy();
        delete this.players[sessionId];
      }
    });

    this.ball = new Ball(this.matter.world, 512, 500);
    this.ball.setOnCollide(
      ({
        bodyA: { label: labelA },
        bodyB: { label: labelB },
      }: Phaser.Types.Physics.Matter.MatterCollisionData) => {
        // Collides with boot
        if (space.isDown && (labelA == "boot-1" || labelB == "boot-1")) {
          this.ball.setVelocity(
            this.ball.getVelocity().x + 5,
            this.ball.getVelocity().y + -8
          );
          this.ball.setAngularVelocity(this.ball.getAngularVelocity() + 0.5);
          this.room.send("kick");
        } else if (space.isDown && (labelA == "boot-2" || labelB == "boot-2")) {
          if (space.isDown) {
            this.ball.setVelocity(
              this.ball.getVelocity().x + -5,
              this.ball.getVelocity().y + -8
            );
            this.room.send("kick");
            this.ball.setAngularVelocity(this.ball.getAngularVelocity() - 0.5);
          }
        }
        // Collides with player
        if (
          (labelA == "player-1" ||
            labelB == "player-1" ||
            labelA == "player-2" ||
            labelB == "player-2") &&
          (W.isDown || A.isDown || D.isDown)
        ) {
          const newVelocity = this.matter.vector.add(
            this.ball.getVelocity(),
            this.ball.getVelocityModifier()
          );
          this.ball.setVelocity(newVelocity.x, newVelocity.y);
        }
        // Scores Goal
        if (labelA == "goal-sensor-1" || labelB == "goal-sensor-1") {
          this.scoreGoal(PlayerNumber.Two);
        } else if (labelA == "goal-sensor-2" || labelB == "goal-sensor-2") {
          this.scoreGoal(PlayerNumber.One);
        }

        // Dead ball
        if (labelA == "goal-sensor-top-1" || labelB == "goal-sensor-top-1") {
          this.ball.setVelocity(4, -4);
        } else if (
          labelA == "goal-sensor-top-2" ||
          labelB == "goal-sensor-top-2"
        ) {
          this.ball.setVelocity(-4, -4);
        }
        this.sound.play("ball-touch");
      }
    );

    this.room.state.ball.onChange(() => {
      const ballState = this.room.state.ball;
      this.ball.setData("ballX", ballState.x);
      this.ball.setData("ballY", ballState.y);
      this.ball.setData("ballVX", ballState.vx);
      this.ball.setData("ballVY", ballState.vy);
      this.ball.setData("ballAngle", ballState.angle);
    });

    this.room.state.score.onChange(() => {
      const score = this.room.state.score;
      this.scoreText.setText(
        `${score[PlayerNumber.One]} : ${score[PlayerNumber.Two]}`
      );
    });

    this.sound.setMute(!!this.matter.config.debug);
  }

  update(time: number, _delta: number) {
    if (!this.room) return;
    const { W, A, D, space } = this.cursors;

    if (A.isDown) {
      this.ball.setVelocityModifier({
        x: -Math.FloatBetween(2, 1.5),
        y: Math.FloatBetween(-2, -0.5),
      });
      this.room.send("move", { direction: "left" });
    } else if (D.isDown) {
      this.ball.setVelocityModifier({
        x: Math.FloatBetween(2, 1.5),
        y: Math.FloatBetween(-2, -0.5),
      });
      this.room.send("move", { direction: "right" });
    }

    for (const sessionId in this.players) {
      const player = this.players[sessionId];
      if (W.isDown && player.isGrounded) {
        this.room.send("move", { direction: "up" });
        this.sound.play("jump");
        player.isGrounded = false;
      }
      if (space.isDown && space.getDuration() < 75) {
        this.room.send("startKick");
      }
      this.interpolatePlayer(player);
    }
    this.interpolateBall();
  }

  interpolatePlayer(player: Player) {
    const { serverX, serverY, serverVX, serverVY, serverKick } =
      player.body.data.values;

    if (serverKick) {
      this.events.emit(`kick-${player.team}`);
      player.boot.setVelocityX(player.team == PlayerNumber.One ? -15 : 15);
    }

    player.body.setPosition(
      Phaser.Math.Linear(player.body.x, serverX, 0.2),
      Phaser.Math.Linear(player.body.y, serverY, 0.2)
    );
    player.body.setVelocity(
      Phaser.Math.Linear(player.body.getVelocity().x, serverVX, 0.2),
      Phaser.Math.Linear(player.body.getVelocity().y, serverVY, 0.2)
    );
  }

  interpolateBall() {
    if (!this.ball.data) return;

    const { ballX, ballY, ballVX, ballVY, ballAngle } = this.ball.data.values;
    this.ball.setPosition(
      Phaser.Math.Linear(this.ball.x, ballX, 0.1),
      Phaser.Math.Linear(this.ball.y, ballY, 0.2)
    );
    this.ball.setVelocity(
      Phaser.Math.Linear(this.ball.getVelocity().x, ballVX, 0.5),
      Phaser.Math.Linear(this.ball.getVelocity().y, ballVY, 0.5)
    );
    this.ball.setAngularVelocity(
      Phaser.Math.Linear(this.ball.getAngularVelocity(), ballAngle, 0.1)
    );
  }

  scoreGoal(playerNumber: PlayerNumber) {
    this.room.send("goal", playerNumber);
    this.matter.pause();
    // this.scene.pause()
    this.sound.play("die");
    this.time.delayedCall(750, () => {
      this.room.send("serve", playerNumber);
      this.serveBall(playerNumber);
      this.matter.resume();
    });
  }

  serveBall(from: PlayerNumber) {
    from == PlayerNumber.One
      ? this.ball.setVelocity(
          Math.FloatBetween(3, 5),
          Math.FloatBetween(-3, -2)
        )
      : this.ball.setVelocity(
          Math.FloatBetween(-5, -3),
          Math.FloatBetween(-3, -2)
        );
  }
}
