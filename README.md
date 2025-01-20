# Hypergame markup language


```
  <game w="800" h="600">

    <player x="100" y="100" w="32" h="32" color="blue">
      <!-- You can define methods directly inside the markup if you want-->
      <method name="moveLeft" action="
        this.x -= 0.4 * hgml.G.deltaTime;">
      </method>
      <method name="moveUp" action="
        this.y -= 0.4 * hgml.G.deltaTime;">
      </method>
      <method name="moveRight" action="
        this.x += 0.4 * hgml.G.deltaTime;">
      </method>
      <method name="moveDown" action="
        this.y += 0.4 * hgml.G.deltaTime;">
      </method>
      <method name="withParameters" parameters='["name", "age"]' action="
        console.log(`My name is ${name} and I am ${age} years old.`);">
      </method>
    </player>

    <wall x="0" y="0" w="800" h="32" color="black" solid="true"></wall>
    <wall x="0" y="0" w="32" h="600" color="black" solid="true"></wall>
    <wall x="768" y="0" w="32" h="600" color="black" solid="true"></wall>
    <wall x="0" y="568" w="800" h="32" color="black" solid="true"></wall>
    <wall x="384" y="0" w="32" h="448" color="black" solid="true"></wall>

    <enemy x="300" y="300" w="64" h="64" color="red"></enemy>

    <item x="400" y="400" w="32" h="32" color="yellow">
      <method name="pickRandomPosition" action="
        const maxX = hgml.G.options.w - this.w;
        const minX = this.w;
    
        const maxY = hgml.G.options.h - this.h;
        const minY = this.h;
    
        this.x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
        this.y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;">
      </method>
    </item>

  </game>

```

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