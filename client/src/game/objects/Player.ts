import { CollisionCategories, PlayerNumber } from "../lib";
import { BodyType } from "matter";

const { categoryPlayer, categoryFootball, categoryPlatform } =
  CollisionCategories;
const playerPosX = { 1: 200, 2: 824 };

export class Player {
  body: Phaser.Physics.Matter.Image;
  boot: Phaser.Physics.Matter.Image;
  isGrounded: boolean;
  constraintA: MatterJS.ConstraintType;
  constraintB: MatterJS.ConstraintType;
  team: PlayerNumber;
  constructor(
    world: Phaser.Physics.Matter.World,
    team: PlayerNumber,
    playerOptions?: Phaser.Types.Physics.Matter.MatterBodyConfig,
    bootOptions?: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    this.body = new Phaser.Physics.Matter.Image(
      world,
      playerPosX[team],
      500,
      `sprite-${team}`,
      undefined
    );
    this.body.setCircle(22, {
      ...playerOptions,
      label: `player-${team}`,
    });
    this.body.setMass(20);
    this.body.setBounce(0.3);
    this.body.setFixedRotation();
    this.body.setFlipX(team == PlayerNumber.Two);
    this.body.setCollisionCategory(categoryPlayer);
    this.body.setCollidesWith(
      categoryFootball | categoryPlatform | categoryPlayer
    );
    world.scene.add.existing(this.body);

    this.boot = new Phaser.Physics.Matter.Image(
      world,
      playerPosX[team],
      515,
      `boot-${team}`,
      undefined,
      {
        ...bootOptions,
        label: `boot-${team}`,
      }
    );
    this.boot.setRotation(team == PlayerNumber.One ? -1.3 : 1.3);
    this.boot.setFixedRotation();
    world.scene.add.existing(this.boot);

    // Add joints between boot and body
    if (team == PlayerNumber.One) {
      this.constraintA = this.body.scene.matter.add.constraint(
        this.body.body as BodyType,
        this.boot.body as BodyType,
        7,
        0.2,
        { pointA: { x: 5, y: 20 } }
      );
      this.constraintB = this.body.scene.matter.add.constraint(
        this.body.body as BodyType,
        this.boot.body as BodyType,
        30,
        0.8,
        { pointA: { x: -15, y: 10 } }
      );
    } else if (team == PlayerNumber.Two) {
      this.constraintA = this.body.scene.matter.add.constraint(
        this.body.body as BodyType,
        this.boot.body as BodyType,
        30,
        0.8,
        { pointA: { x: 15, y: 10 } }
      );
      this.constraintB = this.body.scene.matter.add.constraint(
        this.body.body as BodyType,
        this.boot.body as BodyType,
        7,
        0.2,
        { pointA: { x: -5, y: 20 } }
      );
    }
    this.isGrounded = false;
    this.team = team;
  }
  destroy(world: Phaser.Physics.Matter.World) {
    this.body.destroy();
    this.boot.destroy();
    world.removeConstraint([this.constraintA, this.constraintB]);
  }
}
