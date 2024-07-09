import { CollisionCategories, PlayerNumber } from "../lib";
import { BodyType } from "matter";

const { categoryPlayer, categoryFootball, categoryPlatform } =
  CollisionCategories;
const playerPosX = { 1: 200, 2: 824 };

export class Player {
  body: Phaser.Physics.Matter.Image;
  boot: Phaser.Physics.Matter.Image;
  team: PlayerNumber;
  isGrounded: boolean;
  #bootConstraint: MatterJS.ConstraintType | null;

  constructor(
    world: Phaser.Physics.Matter.World,
    team: PlayerNumber,
    playerOptions?: Phaser.Types.Physics.Matter.MatterBodyConfig,
    bootOptions?: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    this.team = team;
    this.isGrounded = false;

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
    this.body.setFlipX(team === PlayerNumber.Two);
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
    this.boot.setMass(1);
    this.boot.setRotation(team === PlayerNumber.One ? -1.3 : 1.3);
    this.boot.setFixedRotation();
    world.scene.add.existing(this.boot);

    // Add joints between boot and body
    this.body.scene.matter.add.constraint(
      this.body.body as BodyType,
      this.boot.body as BodyType,
      30,
      0.2,
      { pointA: { x: 0, y: 0 }, label: `body-${team}-centerConstraint` }
    );
    this.#setBootConstraint();

    // Kick Animation Handling
    this.body.scene.events.on(`kick-${team}`, () => {
      this.#bootConstraint && world.removeConstraint(this.#bootConstraint);
      this.#bootConstraint = null;
      world.scene.time.delayedCall(200, () => {
        this.#setBootConstraint();
      });
    });
  }

  #setBootConstraint() {
    if (!this.#bootConstraint) {
      this.#bootConstraint = this.body.scene.matter.add.constraint(
        this.body.body as BodyType,
        this.boot.body as BodyType,
        0,
        0.8,
        {
          pointA: { x: this.team === PlayerNumber.One ? -15 : 15, y: 25 },
          label: `body-${this.team}-bootConstraint`,
        }
      );
    }
  }

  destroy() {
    this.body.destroy();
    this.boot.destroy();
    this.body.removeAllListeners();
    this.boot.world.getAllConstraints().forEach((c) => {
      if (
        c.label === `body-${this.team}-centerConstraint` ||
        c.label === `body-${this.team}-bootConstraint`
      ) {
        this.boot.world.removeConstraint(c);
      }
    });
  }
}
