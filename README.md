Odin
=======

Node.js Canvas/WebGL Javascript Game Framework

[Examples](http://nathanfaucett.github.io/Odin.js) - [Documentation](http://nathanfaucett.github.io/Odin.js/doc)


## How to install with npm
```
// install the odin.js package
// npm package is not updated as much as the github repository
// right now it is better to download from github
$ npm install odin -g
```


### Game
a instance of ClientGame or ServerGame is the base of your app
```
// on the client
var MyGame = new ClientGame({ /*options*/ }); // options effect Config.js

// if running with server, you need to call the client's connect method
MyGame.connect(/* optional callback */);
// or attach a listener to the on connect event
MyGame.on("connect", function(socket) {});


// on the server
var MyGame = new ServerGame({ /*options*/ });

// to renderer a game we need an active scene and a camera component that is within the scene
var camera = new GameObject({
    components: [
        new Transform2D,
        new Camera2D
    ]
});
var scene = new Scene;

//add camera to scene
scene.addGameObject(camera);

// then set Game's scene and camera
// set scene first, because Game.setCamera needs an active scene
MyGame.setScene(scene);
MyGame.setCamera(camera);

// to start the game call it's init function
MyGame.init();
```

### Scenes
Scenes hold and manage GameObjects and their Components
```
var scene = new Scene({ /*options*/ });

//Scenes must be added to game and set as the active scene to be able to render
game.addScene(scene);

//other options are
game.addScenes(scene1, scene2, scene3...);

//same as above
game.add(scene1, scene2, scene3...);

//then set game's active scene with Game.setScene
game.setScene(scene);
```


### GameObjects
GameObjects are containers that hold Components
```
var player = new GameObject({
    components: [
        // every GameObject needs a Transform
        new Transform2D({
            position: new Vec2(0, 5),
            rotation: Math.PI*0.5,
			
			// every component can be synced with the client and the server
			// by default transforms, are the only ones synced
			// only affects if created on the server
			sync: true,
			
			// every component can has a boolean weather or not to send to the client with the client and the server
			// by default all components will be sent to the client
			// only affects if created on the server
			json: true
        })
    ],
    tags: [
        "player"
    ]
});

//add to scene
scene.addGameObject(player);

//other options are
scene.addGameObjects(gameObject1, gameObject2, gameObject3...);

//same as above
scene.add(gameObject1, gameObject2, gameObject3...);
```