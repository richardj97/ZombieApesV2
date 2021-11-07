import GameState from "./game-state";

export default class Spawner {
  constructor({ app, create }) {
    this.app = app;
    const e = 1e3;
    const n = 1e4;
    this.maxSpawns = 40;
    this.waveSize = 5;
    this.create = create;
    this.spawns = [];

    setInterval(() => this.spawn(), e), setInterval(() => this.wave(), n);
  }

  spawn() {
    if (
      this.app.gameState !== GameState.RUNNING ||
      this.spawns.length >= this.maxSpawns
    ) {
      return;
    }

    let r = this.create();
    this.spawns.push(r);
  }
  wave() {
    if (
      this.app.gameState === GameState.RUNNING &&
      !(this.spawns.length >= this.maxSpawns)
    ) {
      for (let r = 0; r < this.waveSize; r++) {
        let t = this.create();
        this.spawns.push(t);
      }
      this.waveSize *= 1.3;
    }
  }
}
