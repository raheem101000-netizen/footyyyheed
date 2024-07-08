import { Context, MapSchema, Schema, type } from "@colyseus/schema";

export class Player extends Schema {
  constructor(team: 1 | 2) {
    super();
    this.team = team;
  }
  @type("string") name: string = "";
  @type("number") team: 1 | 2 = 1;
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") angle: number = 0;
  @type("number") vx: number = 0;
  @type("number") vy: number = 0;
  @type("boolean") kick: boolean = false;
}

export class Ball extends Schema {
  @type("number") x: number = 200;
  @type("number") y: number = 300;
  @type("number") angle: number = 0;
  @type("number") vx: number = 0;
  @type("number") vy: number = 0;
}
export class Score extends Schema {
  @type("number") "1": number = 0;
  @type("number") "2": number = 0;
}

export class GameState extends Schema {
  @type(Score) score: Score = new Score();

  @type(Ball) ball: Ball = new Ball();
  @type({ map: Player }) players = new MapSchema<Player>();
}
