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
      deltaTime: 0
    };
  }

  getObjectsByType(type) {
    return this.G.objects.filter(obj => obj.type === type);
  }

  getObjectByType(type) {
    for (let i = 0; i < this.G.objects.length; i++) {
      const o = this.G.objects[i];
      if (o.type === type) {
        return o;
      }
    }
    return null;
  }

  static createObject(e, hgmlInstance) {
    const obj = {};
    obj.type = e.tagName;

    // Process attributes as object's values
    for (const attr of e.attributes) {
      const name = attr.name;
      const value = isNaN(attr.value) ? attr.value : parseFloat(attr.value);
  
      obj[name] = value;
    }

    // Process children with the name 'METHOD' as object methods
    // also pass reference to this class instance to the methods
    const children = e.children;
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      const type = c.tagName;
      console.log(type);

      if (type === 'METHOD') {
        let methodName = null;
        let parameters = [];
      
        // Extract method name and parameters
        for (const attr of c.attributes) {
          if (attr.name === 'name') {
            methodName = attr.value;
          } else if (attr.name === 'parameters') {
            // Parse the parameters attribute (assumes a JSON-like array format)
            try {
              parameters = JSON.parse(attr.value); // Parse the JSON string
            } catch (err) {
              console.error(`Invalid JSON in parameters attribute: ${attr.value}`, err);
              parameters = []; // Default to an empty array
            }
          }
        }
      
        if (methodName) {
          const methodLogic = c.getAttribute('action') || `console.log('Method ${methodName} executed')`;
        
          // Dynamically create the method and bind HGML instance
          obj[methodName] = function (...args) {
            const hgml = hgmlInstance; // Reference to HGML instance
        
            // Dynamically create the function with or without parameters
            if (parameters.length > 0) {
              // If parameters exist, pass them dynamically
              const methodFunction = new Function(...parameters, "hgml", methodLogic);
              return methodFunction.apply(this, [...args, hgml]);
            } else {
              // If no parameters, include only the hgml reference
              const methodFunction = new Function("hgml", methodLogic);
              return methodFunction.call(this, hgml);
            }
          };
        }
      }

    }

    return obj;
  }

  init() {
    const gameElements = this.game.children;

    for (const element of gameElements) {
      const obj = HGML.createObject(element, this);
      this.G.objects.push(obj);
    }

    const options = HGML.createObject(this.game, this);

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

  // startGameLoop(updateCallback, renderCallback) {
  //   this.G.running = true;

  //   const loop = (timestamp) => {
  //     if (!this.G.running) return;

  //     const deltaTime = timestamp - this.G.lastFrameTime;
  //     this.G.deltaTime = deltaTime;
  //     this.G.lastFrameTime = timestamp;

  //     const fps = 1000/deltaTime;
  //     //console.log(`FPS: ${fps.toFixed(2)}`);

  //     if (typeof updateCallback === "function") {
  //       for (const obj of this.G.objects) {
  //         updateCallback(obj, deltaTime);
  //       }
  //     }

  //     this.G.ctx.clearRect(0, 0, this.G.instance.width, this.G.instance.height);

  //     if (typeof renderCallback === "function") {
  //       for (const obj of this.G.objects) {
  //         renderCallback(obj, this.G.ctx);
  //       }
  //     }

  //     requestAnimationFrame(loop);
  //   };

  //   this.G.lastFrameTime = performance.now();
  //   requestAnimationFrame(loop); 
  // }

  startGameLoop(updateCallback, renderCallback) {
    this.G.running = true;
  
    const loop = (timestamp) => {
      if (!this.G.running) return;
  
      const deltaTime = timestamp - this.G.lastFrameTime;
      this.G.deltaTime = deltaTime;
      this.G.lastFrameTime = timestamp;
  
      const solidObjects = this.G.objects.filter(obj => obj.solid); // Identify solid objects
  
      for (const movingObj of this.G.objects) {
        // Skip objects that are solid (not moving)
        if (movingObj.solid) continue;
  
        // Update the object via the callback
        if (typeof updateCallback === "function") {
          updateCallback(movingObj, deltaTime);
        }
  
        // Check for collisions with solid objects
        for (const staticObj of solidObjects) {
          if (this.checkCollision(movingObj, staticObj)) {
            this.resolveCollision(movingObj, staticObj); // Resolve overlap
          }
        }
      }
  
      // Clear the canvas
      this.G.ctx.clearRect(0, 0, this.G.instance.width, this.G.instance.height);
  
      // Render each object
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

  resetGame() {
    // Clear the current game state
    this.G.objects = [];
    this.G.running = false;
    this.G.lastFrameTime = 0;
    this.G.deltaTime = 0;
  
    // Reinitialize game objects and options
    const gameElements = this.game.children;
    for (const element of gameElements) {
      const obj = HGML.createObject(element, this);
      this.G.objects.push(obj);
    }
  
    const options = HGML.createObject(this.game, this);
  
    // Reset canvas
    const gameCanvas = this.G.instance;
    gameCanvas.width = options.w || 800;
    gameCanvas.height = options.h || 600;
    this.G.ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  
    // Reset options
    this.G.options = options;
  
    console.log("Game has been reset!");
  }

  checkCollision(movingObj, staticObj) {
    // Define bounding boxes
    const movingBox = {
      left: movingObj.x,
      right: movingObj.x + movingObj.w,
      top: movingObj.y,
      bottom: movingObj.y + movingObj.h,
    };
  
    const staticBox = {
      left: staticObj.x,
      right: staticObj.x + staticObj.w,
      top: staticObj.y,
      bottom: staticObj.y + staticObj.h,
    };
  
    // Check if boxes overlap
    if (
      movingBox.right > staticBox.left &&
      movingBox.left < staticBox.right &&
      movingBox.bottom > staticBox.top &&
      movingBox.top < staticBox.bottom
    ) {
      return true; // Collision detected
    }
  
    return false; // No collision
  }

  resolveCollision(movingObj, staticObj) {
    const overlap = {
      left: movingObj.x + movingObj.w - staticObj.x,
      right: staticObj.x + staticObj.w - movingObj.x,
      top: movingObj.y + movingObj.h - staticObj.y,
      bottom: staticObj.y + staticObj.h - movingObj.y,
    };
  
    // Determine the smallest overlap
    const minOverlap = Math.min(overlap.left, overlap.right, overlap.top, overlap.bottom);
  
    // Adjust position based on the collision side
    if (minOverlap === overlap.left) {
      movingObj.x = staticObj.x - movingObj.w; // Move to the left
    } else if (minOverlap === overlap.right) {
      movingObj.x = staticObj.x + staticObj.w; // Move to the right
    } else if (minOverlap === overlap.top) {
      movingObj.y = staticObj.y - movingObj.h; // Move up
    } else if (minOverlap === overlap.bottom) {
      movingObj.y = staticObj.y + staticObj.h; // Move down
    }
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