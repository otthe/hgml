export default class HGML {
  constructor() {
    this.game = document.querySelector('game');
    if (!this.game) throw new Error("No game window found!");
    
    this.G = {
      objects: [],
      globals: null,
      ctx: null,
      instance: null,
      running: false,
      lastFrameTime: 0,
      loopId: null,
      deltaTime: 0,
      listeners: [],
      sprites: {},
      sounds: {}
    };

    this._updateCallback = null;
    this._renderCallback = null;
  }

  /**
   * Listen for events and store references for cleanup.
   * @param {string} type - Event type (e.g., "keydown").
   * @param {Function} handler - Event handler function.
   * @param {Object} [options] - Optional event listener options.
   */
  listen(type, handler, options= {}) {
    if (typeof handler !== 'function') {
      throw new Error("Handler must be a function!");
    }

    const boundHandler = handler.bind(this);
    window.addEventListener(type, boundHandler, options);

    this.G.listeners.push({type, handler: boundHandler, options });
  }

  removeListeners(type = null) {
    this.G.listeners = this.G.listeners.filter(({ type: listenerType, handler, options }) => {
      if (!type || type === listenerType) {
        window.removeEventListener(listenerType, handler, options);
        return false; // Remove from the array
      }
      return true; // Keep in the array
    });
  }


  setUpdate(callback) {
    if (typeof callback === 'function') {
      this._updateCallback = callback;
    } else {
      throw new Error("Update callback must be a function");
    }
  }

  setRender(callback) {
    if (typeof callback === 'function') {
      this._renderCallback = callback;
    } else {
      throw new Error("Render callback must be a function");
    }
  }

  getAllObjectsByType(type) {
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

  addObject(type, object) {
    if (typeof type !== 'string') {
      throw new Error("type must be a string, preferably UPPERCASE");
    } 
    if (typeof object !== 'object') {
      throw new Error("object is not valid object");
    }

    object.type = type;
    this.G.objects.push(object);
  }

   /**
  * Loads a sprite and stores it in the G.sprites object.
  * @param {string} name - The name of the sprite.
  * @param {string} src - The source URL of the sprite image.
  */
   loadSprite(name, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;

      img.onload = () => {
        this.G.sprites[name] = img;
        resolve(img);
      };

      img.onerror = (err) => {
        console.error(`Failed to load sprite: ${src}`);
        reject(err);
      };
    });
  }

  /**
   * Retrieves a sprite by name.
   * @param {string} name - The name of the sprite.
   * @returns {HTMLImageElement|null} - The sprite image, or null if not found.
   */
  getSprite(name) {
    return this.G.sprites[name] || null;
  }

  /**
  * Loads a sound and stores it in the G.sounds object.
  * @param {string} name - The name of the sound.
  * @param {string} src - The source URL of the sound file.
  */
  loadSound(name, src) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.src = src;

      audio.onloadeddata = () => {
        this.G.sounds[name] = audio;
        resolve(audio);
      };

      audio.onerror = (err) => {
        console.error(`Failed to load sound: ${src}`);
        reject(err);
      };
    });
  }

  /**
  * Retrieves a sound by name.
  * @param {string} name - The name of the sound.
  * @returns {HTMLAudioElement|null} - The sound element, or null if not found.
  */
  getSound(name) {
    return this.G.sounds[name] || null;
  }

  getState() {
    return this.G;
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

  async init() {
    await this._loadSpritesFromDOM();
    await this._loadSoundsFromDOM();

    const gameElements = this.game.children;

    for (const element of gameElements) {
      if (element.tagName === 'SPRITE') continue;
      if (element.tagName === 'SOUND') continue;

      const obj = HGML._createObject(element, this);
      this.G.objects.push(obj);
    }

    const globals = HGML._createObject(this.game, this);

    const gameCanvas = document.createElement("canvas");
    gameCanvas.setAttribute("id", "hgml");
    gameCanvas.width = globals.w || 800;
    gameCanvas.height = globals.h || 600; 
    gameCanvas.style.backgroundColor = '#7cb7d9'

    const ctx = gameCanvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    this.G.instance = gameCanvas;
    this.G.globals = globals;
    this.G.ctx = ctx;
    this.G.id = gameCanvas.id;

    document.body.appendChild(gameCanvas);

    return this;
  }

  startGameLoop() {
    if (this.G.running) {
      console.warn("A game loop is already running!");
      return;
    }

    this.G.running = true;
    const currentLoopId = Symbol("loop"); // Unique ID for this loop
    this.G.currentLoopId = currentLoopId;

    const MAX_DELTA_TIME = 1000 / 60;

    const loop = (timestamp) => {
      if (!this.G.running || this.G.currentLoopId !== currentLoopId) {
        return; // Abort if stopped or a new loop has started
      }

      if (this.G.lastFrameTime === null) {
        this.G.lastFrameTime = timestamp;
      }

      let deltaTime = timestamp - this.G.lastFrameTime;
      this.G.lastFrameTime = timestamp;

      deltaTime = Math.min(deltaTime, MAX_DELTA_TIME);
      this.G.deltaTime = deltaTime;

      // Your game loop logic
      const solidObjects = this.G.objects.filter(obj => obj.solid);
      for (const obj of this.G.objects) {
        if (!obj.solid) {
          this._update(obj, deltaTime);
          for (const staticObj of solidObjects) {
            if (this.checkCollision(obj, staticObj)) {
              this._resolveCollision(obj, staticObj);
            }
          }
        }
      }

      this.G.ctx.clearRect(0, 0, this.G.instance.width, this.G.instance.height);
      for (const obj of this.G.objects) {
        this._render(obj, this.G.ctx);
      }

      this.G.loopId = requestAnimationFrame(loop); // Schedule next frame
    };

    this.G.lastFrameTime = null;
    this.G.loopId = requestAnimationFrame(loop); // Start the loop
  }

  resetGame() {
    this._stopGameLoop();

    // Clear the current game state
    this.G.objects = [];
    this.G.running = false;
    this.G.lastFrameTime = 0;
    this.G.deltaTime = 0;
  
    // Reinitialize game objects and options
    const gameElements = this.game.children;
    for (const element of gameElements) {
      const obj = HGML._createObject(element, this);
      this.G.objects.push(obj);
    }
  
    const globals = HGML._createObject(this.game, this);
  
    // Reset canvas
    const gameCanvas = this.G.instance;
    gameCanvas.width = globals.w || 800;
    gameCanvas.height = globals.h || 600;
    this.G.ctx.imageSmoothingEnabled = false;
    this.G.ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  
    // Reset options
    this.G.globals = globals;
  
    console.log("Game has been reset!");
  }

  _update(obj, deltaTime) {
    if (this._updateCallback) {
      this._updateCallback(obj, deltaTime);
    }
  }

  _render(obj, ctx) {
    if (this._renderCallback) {
      this._renderCallback(obj, ctx);
    }
  }

  static _createObject(e, hgmlInstance) {
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

  async _loadSpritesFromDOM() {
    const spriteElements = this.game.querySelectorAll('sprite');
  
    const promises = Array.from(spriteElements).map((sprite) => {
      const name = sprite.getAttribute('name');
      const src = sprite.getAttribute('src');
  
      if (!name || !src) {
        console.error('Sprite element is missing a name or src attribute:', sprite);
        return Promise.resolve();
      }
  
      return this.loadSprite(name, src);
    });
  
    return Promise.all(promises);
  }

  /**
  * Loads all sounds defined in the DOM and stores them in the G.sounds object.
  */
  async _loadSoundsFromDOM() {
    const soundElements = this.game.querySelectorAll('sound');

    const promises = Array.from(soundElements).map((sound) => {
      const name = sound.getAttribute('name');
      const src = sound.getAttribute('src');

      if (!name || !src) {
        console.error('Sound element is missing a name or src attribute:', sound);
        return Promise.resolve();
      }

      return this.loadSound(name, src);
    });

    return Promise.all(promises);
  }

  _stopGameLoop() {
    if (this.G.running) {
      console.log("Stopping the game loop...");
      this.G.running = false;

      if (this.G.loopId) {
        cancelAnimationFrame(this.G.loopId);
        this.G.loopId = null;
      }

      // Ensure lastFrameTime is reset
      this.G.lastFrameTime = null;
    }
  }

  _resolveCollision(movingObj, staticObj) {
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