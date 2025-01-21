# Hypergame markup language

```
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

# HGML's public class methods

| Method  | Parameters | Definition  |
| ------------- | ------------- | ------------- |
|init()  |-|Initializes new game instance|
|startGameLoop()  |-| Starts the game loop|
|resetGame() |-| Kills the existing game loop and resets game state. Call startGameLoop() to start a new one|
|getState()|-| Returns game data object, you can also get it with 'hgml.G' |
|getObjectByType()|type(string)|Returns game object with 'type', where type is the HTML tag in UPPERCASE|
|getAllObjectsByType()|type(string)|Returns array of game objects with 'type', where type is the HTML tag in UPPERCASE|
|checkCollision()|obj1(object), obj2(object)|Returns true or false depending if two game objects are colliding (rectangular collision)|

# Game objects...
Must have:
-x,y,w,h

Should have:
color

Can have:
image
method(s) --> as child

# Built-in methods
checkCollision(obj1, obj2) --> check if objects are colliding

getState() --> returns information about HGML instance


# Things to consider
If you are trying to add object to a position where solid object resides,
you must explicitly add `solid="false"` -property to that object. Otherwise it will be automatically placed into position outside of solid object's area.