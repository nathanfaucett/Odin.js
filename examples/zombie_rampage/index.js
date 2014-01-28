require({
        baseUrl: "src",
		paths: {
			"odin/odin": "../../../src/odin/odin"
		}
    }, [
        "odin/odin",
        "level",
        "player",
        "zombie",
        "collision_world",
        "collision_object",
        "camera_control"
    ],
    function(Odin, Level, Player, Zombie, CollisionWorld, CollisionObject, CameraControl) {
        window.Odin = Odin;

        var Assets = Odin.Assets,
            randFloat = Odin.Mathf.randFloat;


        Assets.add(
            new Odin.Texture({
                name: "img_hospital",
                src: "content/hospital.png",
                magFilter: "NEAREST",
                minFilter: "NEAREST"
            })
        );


        game = new Odin.Game({
            debug: true,
            forceCanvas: false,
            canvasRenderer2DOptions: {
                imageSmoothingEnabled: false
            }
        });

        var scene = new Odin.Scene({
            name: "PlayGround",
            world: new CollisionWorld({
                background: new Odin.Color("black")
            })
        });

        var camera = new Odin.GameObject({
            components: [
                new Odin.Transform2D,
                new Odin.Camera2D({
                    orthographicSize: 8,
                    minOrthographicSize: 2,
                    maxOrthographicSize: 8
                }),
                new CameraControl
            ],
            tag: "Camera"
        });
        var background = new Odin.GameObject({
            components: [
                new Odin.Transform2D,
                new Odin.Sprite({
                    texture: Assets.hash["img_hospital"],
                    x: 0,
                    y: 0,
                    w: 960,
                    h: 640,
                    width: 32,
                    height: 20
                }),
                new Level
            ],
            tag: "Level"
        });
        var wall_top = new Odin.GameObject({
            components: [
                new Odin.Transform2D,
                new CollisionObject({
                    offset: new Odin.Vec2(0, 12),
                    size: new Odin.Vec2(32, 8),
                    mass: 0
                })
            ],
            tags: ["Wall", "Top"]
        });
        var wall_bottom = new Odin.GameObject({
            components: [
                new Odin.Transform2D,
                new CollisionObject({
                    offset: new Odin.Vec2(0, -10),
                    size: new Odin.Vec2(32, 8),
                    mass: 0
                })
            ],
            tags: ["Wall", "Bottom"]
        });
        var wall_left = new Odin.GameObject({
            components: [
                new Odin.Transform2D,
                new CollisionObject({
                    offset: new Odin.Vec2(-19, 0),
                    size: new Odin.Vec2(8, 32),
                    mass: 0
                })
            ],
            tags: ["Wall", "Left"]
        });
        var wall_right = new Odin.GameObject({
            components: [
                new Odin.Transform2D,
                new CollisionObject({
                    offset: new Odin.Vec2(19, 0),
                    size: new Odin.Vec2(8, 32),
                    mass: 0
                })
            ],
            tags: ["Wall", "Right"]
        });

        scene.add(camera, wall_top, wall_bottom, wall_left, wall_right, background);
        game.addScene(scene);


        function start() {
            game.setScene("PlayGround");
            game.setCamera(game.scene.findByTagFirst("Camera"));
        }

        function restart() {
            start();
        }


        game.on("init", function() {
            start();
            var level = this.scene.findByTagFirst("Level").sprite;

            this.on("update", function() {
                var sprites = this.scene.components.Sprite;

                sprites.sort(function(a, b) {

                    return a.transform2d.position.y - b.transform2d.position.y;
                });

                sprites.splice(sprites.indexOf(level), 1);
                sprites.push(level);
            });
        });


        Odin.AssetLoader.load(function() {

            game.init();
        });
    }
);
