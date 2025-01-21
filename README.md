# Hypergame markup language

## Get started
```html
<!DOCTYPE html>
<head><title>HGML example</title></head>
<body>
  <game w="480" h="320">
    <player x="100" y="240" w="32" h="32" color="blue">
      <method name="moveUp" action="
        this.y -= 0.4 * hgml.G.deltaTime ">
      </method>
    </player>
    <wall x="0" y="0" w="480" h="32" color="black" solid="true"></wall>
    <banana x="200" y="200" w="32" h="32" color="yellow"></banana>
  </game>

  <script type="module">
    import HGML from './hgml.js';
  
    const hgml = new HGML();
    await hgml.init();
    hgml.loop();
  
    hgml.listen('keydown', (event) => {
      if (event.code === 'Space') {
        hgml.get("PLAYER").moveUp();
      }
    })
  
    hgml.update((obj, deltaTime) => {
      if (obj.type === "BANANA") {
        obj.y -= 0.4*deltaTime;
      }
    });
  
    hgml.render((obj, ctx) => {
      ctx.fillStyle = obj.color;
      ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
    });
  </script>
</body>
</html>
```
## Reserved tags and attributes
```html
 <!-- 
  All <game>'s attributes will be placed into hgml.G.globals
    Reserved attributes for <game>: w, h, background
  -->
<game w="640" h="480" background="yellow"> <!-- IMPORTANT! attribute tag names do not support camelCase !!! -->

  <sprite name="pear" src="pear.png"></sprite> <!-- loads sprite -->
  <sound name="explosion" src="explosion.wav"></sound> <!-- loads sound -->

  <!-- You can set the name of game objects however you want
  solid="true" -attribute makes the object unpassable-->
  <!-- Solid objects can only be rendered -->
  <rock solid="true"> </rock>

  <randomobject x="100" y="100">
    <!-- Game object methods must have name and action attributes
      They can also have parameters, which must be in valid JSON formatted array
      Methods have access to hgml instance
    -->
    <method name="greet" parameters='["name"]' action="
      console.log(hgml.getState());
      console.log(name);
      console.log(this.x, this.y); ">
    </method> 
  </randomobject>
</game>
```

## HGML methods

| Method  | Parameters | Definition  |
| ------------- | ------------- | ------------- |
|init()  |-|Initializes new game instance|
|loop()  |-| Starts the game loop|
|reset() |-| Kills the existing game loop and resets game state. Call loop() to start a new one|
|getState()|-| Returns game data object, you can also get it with 'hgml.G' |
|get()|type(string)|Returns game object with 'type', where type is the HTML tag in UPPERCASE|
|getAll()|type(string)|Returns array of game objects with 'type', where type is the HTML tag in UPPERCASE|
|collides()|obj1(object), obj2(object)|Returns true or false depending if two game objects are colliding (rectangular collision)|
|getSound()|name(string)|Returns loaded sound|
|loadSound()|name(string), src(string)|Loads sound into the game dynamically|
|getSprite()|name(string)|Returns loaded sprite|
|loadSprite()|name(string), src(string)|Loads sprite into the game dynamically|
|add()|type(string), object(object)| Adds object into the game dynamically|
|render()|callback(obj(object), ctx(object))| Starts render loop where you can set rendering for individual objects |
|update()|callback(obj(object), deltaTime(float))| Starts update loop where you can set actions for individual objects |
|listen()|type(string), callback(event)| Adds event listener of 'type' to the game|
|removeListeners()|type(string)|Removes listeners of certain type from the game|

# Things to consider
If you are trying to add object to a position where solid object resides,
you must explicitly add `solid="false"` -property to that object. Otherwise it will be automatically placed into position outside of solid object's area.