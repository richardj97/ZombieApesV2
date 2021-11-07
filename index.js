import * as PIXI from "pixi.js";
import Player from "./player";
import Zombie from "./zombie";
import Spawner from "./spawner";
import { textStyle, subTextStyle, zombies } from "./globals";
import Weather from "./weather";
import GameState from "./game-state";

let canvasSize = 400;
let scoreSceneContainer = null;
let player = null;

const canvas = document.getElementById("mycanvas");
const app = new PIXI.Application({
  view: canvas,
  width: canvasSize,
  height: canvasSize,
  backgroundColor: 0x312a2b,
  resolution: 2
});

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

// Game Music

const music = new Audio("./assets/HordeZee.mp3");
music.volume = 0.4;
music.addEventListener("timeupdate", function () {
  if (this.currentTime > this.duration - 0.2) {
    this.currentTime = 0;
  }
});

// Zombie Sounds

const zombieHorde = new Audio("./assets/horde.mp3");
zombieHorde.volume = 0.7;
zombieHorde.addEventListener("timeupdate", function () {
  if (this.currentTime > this.duration - 0.2) {
    this.currentTime = 0;
  }
});

initialise();

async function initialise() {
  app.gameState = GameState.PREINTRO;

  try {
    console.log("Game Loading...");
    await loadAssets();

    app.weather = new Weather({ app });
    player = new Player({ app });
    let zSpawner = new Spawner({
      app,
      create: () => new Zombie({ app, player })
    });

    let gamePreGameScene = createScene("Zombie Apes", "Click to Continue");
    let gameStartScene = createScene("Zombie Apes", "Click to Start Game");
    let gameOverScene = createScene("Zombie Apes", "Game Over!");
    let gameRunningScene = updateScore(0);

    app.ticker.add((delta) => {
      if (player.dead) {
        app.gameState = GameState.GAMEOVER;
      }

      gamePreGameScene.visible = app.gameState === GameState.PREINTRO;
      gameStartScene.visible = app.gameState === GameState.START;
      gameOverScene.visible = app.gameState === GameState.GAMEOVER;
      gameRunningScene.visible = app.gameState === GameState.RUNNING;

      switch (app.gameState) {
        case GameState.PREINTRO:
          player.scale = 4;
          break;
        case GameState.INTRO:
          player.scale -= 0.01;
          if (player.scale <= 1) {
            app.gameState = GameState.START;
          }
          break;
        case GameState.RUNNING:
          player.update(delta);
          zSpawner.spawns.forEach((zombie) => zombie.update(delta));
          bulletHit({
            bullets: player.shooting.bullets,
            zombies: zSpawner.spawns,
            bulletRadius: 8,
            zombieRadius: 16
          });
          break;
        default:
          break;
      }
    });

    console.log("Game Assets Loaded Successfully");
  } catch (err) {
    console.log("[Load Failed] -> " + err.message);
  }
}

function bulletHit({ bullets, zombies, bulletRadius, zombieRadius }) {
  bullets.forEach((bullet) => {
    zombies.forEach((zombie, index) => {
      let dx = zombie.position.x - bullet.position.x;
      let dy = zombie.position.y - bullet.position.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < bulletRadius + zombieRadius) {
        zombies.splice(index, 1);
        zombie.kill();

        // Update Score
        player.score = player.score + 1;
        updateScore(player.score);
      }
    });
  });
}

function updateScore(score) {
  if (scoreSceneContainer) {
    app.stage.removeChild(scoreSceneContainer);
  }

  scoreSceneContainer = new PIXI.Container();

  const scoreText = new PIXI.Text(
    "Score: " + score,
    new PIXI.TextStyle(subTextStyle)
  );
  scoreText.x = 70;
  scoreText.y = 15;
  scoreText.anchor.set(0.5, 0);
  scoreSceneContainer.zIndex = 1;
  scoreSceneContainer.addChild(scoreText);
  app.stage.addChild(scoreSceneContainer);
  return scoreSceneContainer;
}

function createScene(sceneText, sceneSubText) {
  const sceneContainer = new PIXI.Container();

  // Heading
  const text = new PIXI.Text(sceneText, new PIXI.TextStyle(textStyle));
  text.x = app.screen.width / 2;
  text.y = 0;
  text.anchor.set(0.5, 0);

  // Sub Heading
  const subText = new PIXI.Text(sceneSubText, new PIXI.TextStyle(subTextStyle));
  subText.x = app.screen.width / 2;
  subText.y = 50;
  subText.anchor.set(0.5, 0);

  sceneContainer.zIndex = 1;
  sceneContainer.addChild(text);
  sceneContainer.addChild(subText);
  app.stage.addChild(sceneContainer);
  return sceneContainer;
}

async function loadAssets() {
  return new Promise((resolve, reject) => {
    zombies.forEach((z) => PIXI.Loader.shared.add(`assets/${z}.json`));
    PIXI.Loader.shared.add("assets/hero_male.json");
    PIXI.Loader.shared.add("bullet", "assets/bullet.png");
    PIXI.Loader.shared.add("rain", "assets/rain.png");
    PIXI.Loader.shared.onComplete.add(resolve);
    PIXI.Loader.shared.onError.add(reject);
    PIXI.Loader.shared.load();
  });
}

function clickHandler() {
  switch (app.gameState) {
    case GameState.PREINTRO:
      app.gameState = GameState.INTRO;
      music.play();
      app.weather.enableSound();
      break;
    case GameState.START:
      app.gameState = GameState.RUNNING;
      zombieHorde.play();
      break;
    default:
      break;
  }
}

document.addEventListener("click", clickHandler);
