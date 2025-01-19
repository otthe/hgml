export default class HGML {
  constructor() {
    this.game = document.querySelector('game');
    if (!this.game) throw new Error("No game window found!");
    
    this.G = {
      objects: [],
      options: null,
      ctx: null,
      instance: null,
      running: false,
      lastFrameTime: 0,
    };
  }

  get(tag) {
    return this.game.querySelector(tag)
  }

  getAll(tag) {
    return this.game.querySelectorAll(tag)
  }

  getObjectsByType(type) {
    return this.G.objects.filter(obj => obj.type === type);
  }

  addFunction(type) {
    const objects = this.getObjectsByType(type);
  }

  static createObject(e) {
    const obj = {};
    obj.type = e.tagName;

    for (const attr of e.attributes) {
      const name = attr.name;
      const value = isNaN(attr.value) ? attr.value : parseFloat(attr.value);
  
      obj[name] = value;
    }

    return obj;
  }

  init() {
    const gameElements = this.game.children;

    for (const element of gameElements) {
      const obj = HGML.createObject(element);
      this.G.objects.push(obj);
    }

    const options = HGML.createObject(this.game);

    const gameCanvas = document.createElement("canvas");
    gameCanvas.setAttribute("id", "hgml");
    gameCanvas.width = options.w || 800;
    gameCanvas.height = options.h || 600; 
    gameCanvas.style.backgroundColor = '#7cb7d9'

    const ctx = gameCanvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    this.G.instance = gameCanvas;
    this.G.options = options;
    this.G.ctx = ctx;
    this.G.id = gameCanvas.id;

    document.body.appendChild(gameCanvas);

    return this;
  }

  getState() {
    return this.G;
  }

  startGameLoop(updateCallback, renderCallback) {
    this.G.running = true;

    const loop = (timestamp) => {
      if (!this.G.running) return;

      const deltaTime = timestamp - this.G.lastFrameTime;
      this.G.lastFrameTime = timestamp;

      const fps = 1000/deltaTime;
      //console.log(`FPS: ${fps.toFixed(2)}`);

      if (typeof updateCallback === "function") {
        for (const obj of this.G.objects) {
          updateCallback(obj, deltaTime);
        }
      }

      this.G.ctx.clearRect(0, 0, this.G.instance.width, this.G.instance.height);

      if (typeof renderCallback === "function") {
        for (const obj of this.G.objects) {
          renderCallback(obj, this.G.ctx);
        }
      }

      requestAnimationFrame(loop);
    };

    this.G.lastFrameTime = performance.now();
    requestAnimationFrame(loop); 
  }

  stopGameLoop() {
    this.G.running = false;
  }
}


// const game = document.querySelector('game');

// const G = {
//   objects: [],
//   options: null,
//   ctx: null,
//   instance: null
// }

// function get(game, tag) {
//   return game.querySelector(tag);
// }

// function getAll(game, tag) {
//   return game.querySelectorAll(tag);
// }

// function createObject(e) {
//   const obj = {};

//   for (const attr of e.attributes) {
//     const name = attr.name;
//     const value = isNaN(attr.value) ? attr.value : parseFloat(attr.value);

//     obj[name] = value;
//   }

//   return obj;
// }

// function initGame(game, G) {
//   const gameElements = game.children;
//   for (let i = 0; i < gameElements.length; i++) {
//     const e = gameElements[i];
//     console.log(e);
//     const obj = createObject(e);
//     G.objects.push(obj);
//   }

//   const options = createObject(game);

//   const gameCanvas = document.createElement('canvas');
//   gameCanvas.setAttribute('id', 'hgml');
//   gameCanvas.width = options.w;
//   gameCanvas.height = options.h;

//   const ctx = gameCanvas.getContext('2d');
//   ctx.imageSmoothingEnabled = false;
  
//   G.instance = gameCanvas;
//   G.options = options;
//   G.ctx = ctx;
//   G.id = gameCanvas.id;

//   return G;
// }

// console.log(get(game, 'player'));
// console.log(getAll(game, 'wall'));

// initGame(game, G);
// console.log(G.objects);
// console.log(G);

// document.body.appendChild(G.instance);