import { CollisionCategories } from "../lib";

const { categoryBoot, categoryPlayer, categoryFootball, categoryPlatform } =
  CollisionCategories;

export class Ball extends Phaser.Physics.Matter.Image {
  #VELOCITY_MODIFIER: Phaser.Types.Math.Vector2Like;
  constructor(
    world: Phaser.Physics.Matter.World,
    x: number,
    y: number,
    ballOptions?: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    super(world, x, y, "football");
    this.#VELOCITY_MODIFIER = { x: 0, y: 0 };
    this.scene.add.existing(this);
    this.setCircle(10, { ...ballOptions, label: "football" });
    this.setMass(3);
    this.setBounce(1);
    this.setFriction(0.05, 0.005);
    this.setCollisionCategory(categoryFootball);
    this.setCollidesWith(categoryBoot | categoryPlayer | categoryPlatform);
  }

  setVelocityModifier(vector: Phaser.Types.Math.Vector2Like) {
    this.#VELOCITY_MODIFIER = vector;
  }
  getVelocityModifier() {
    return this.#VELOCITY_MODIFIER;
  }
}
