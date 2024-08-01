import { BodyType } from "matter";
import { PlayerNumber } from "../lib";

const goalPos = { 1: { x: 25, y: 510 }, 2: { x: 999, y: 513 } };
const sensorPosX = { 1: 45, 2: 979 };
const TOP_ANGLE = 0.05;

export class Goal extends Phaser.Physics.Matter.Image {
  sensor: BodyType;
  sensorTop: BodyType;
  constructor(
    world: Phaser.Physics.Matter.World,
    playerNumber: PlayerNumber,
    goalOptions?: Phaser.Types.Physics.Matter.MatterBodyConfig
  ) {
    super(
      world,
      goalPos[playerNumber].x,
      goalPos[playerNumber].y,
      "goal",
      undefined,
      {
        ...goalOptions,
        label: `goal-${playerNumber}`,
      }
    );

    this.setStatic(true);
    this.setFriction(0);
    this.setBounce(1);
    this.setFlipX(playerNumber == PlayerNumber.Two);

    this.sensor = world.scene.matter.add.rectangle(
      sensorPosX[playerNumber],
      530,
      50,
      110,
      {
        isStatic: true,
        isSensor: true,
        label: `goal-sensor-${playerNumber}`,
      }
    );
    this.sensorTop = world.scene.matter.add.rectangle(
      playerNumber == PlayerNumber.One ? 40 : 984,
      465,
      80,
      5,
      {
        isStatic: true,
        isSensor: true,
        label: `goal-sensor-top-${playerNumber}`,
        angle: playerNumber == PlayerNumber.One ? TOP_ANGLE : -TOP_ANGLE,
      }
    );

    world.scene.add.existing(this);
  }
}
