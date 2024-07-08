import { Scene } from "phaser";
import { EventBus } from "../EventBus";

export class Preloader extends Scene {
  gamePin: { pin: string };
  constructor() {
    super("Preloader");
  }

  init() {
    //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setBaseURL("/assets");

    this.load.image("football", "/images/1.png");
    this.load.image("ground", "/images/2.png");
    this.load.image("goal", "/images/11.png");
    this.load.image("boot-1", "/images/20.png");
    this.load.image("boot-2", "/images/22.png");
    this.load.image("sprite-1", "/images/100.png");
    this.load.image("sprite-2", "/images/101.png");

    this.load.audio("ball-touch", "/sounds/5_KickSound.mp3");
    this.load.audio("jump", "/sounds/6_JumpSound.mp3");
    this.load.audio("die", "/sounds/8_DieSound.mp3");

    this.load.json("shapes", "/json/shapes.json");
  }

  create() {
    EventBus.on("room-ready", (data) => {
      this.scene.start("Game", data);
    });
    EventBus.emit("current-scene-ready", this);
  }
}
