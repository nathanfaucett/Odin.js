Odin.js
=======

Node.js Canvas/WebGL Javascript Game Framework

[Examples](http://lonewolfgames.github.io/Odin.js/) - [Documentation](http://lonewolfgames.github.io/Odin.js/doc/)


## How to install with npm
```
// install the odin.js package
// npm package is not updated as much as the github repository
// right now it is better to download from github
$ sudo npm install odin -g
```


### Game
a Game Class is the base for everything in your app, also check documentation for ClientGame and ServerGame
```
var MyGame = new Game({ /*options*/ }); // options effect Config.js

// to renderer a game we need an active scene and a camera component that is within the scene
var camera = new GameObject({
    components: [
        new Transform2D,
        new Camera2D
    ]
});
var scene = new Scene;

//add camera to scene
scene.addGameObject( camera );

// then set Game's scene and camera
// set scene first, because Game.setCamera needs an active scene
MyGame.setScene( scene );
MyGame.setCamera( camera );
```

### Scenes
Scenes hold and manage GameObjects and their Components
```
var scene = new Scene({ /*options*/ });

//Scenes must be added to game and set as the active scene to be able to render
game.addScene( scene );

//other options are
game.addScenes( scene1, scene2, scene3... );

//same as above
game.add( scene1, scene2, scene3... );

//then set game's active scene with Game.setScene
game.setScene( scene );
```


### GameObjects
GameObjects are containers that hold Components
```
var player = new GameObject({
    components: [
        // every GameObject needs a Transform
        new Transform2D({
            position: new Vec2( 0, 5 ),
            rotation: Math.PI*0.5
        })
    ],
    tags: [
        "player"
    ]
});

//add to scene
scene.addGameObject( player );

//other options are
scene.addGameObjects( gameObject1, gameObject2, gameObject3... );

//same as above
scene.add( gameObject1, gameObject2, gameObject3... );
```