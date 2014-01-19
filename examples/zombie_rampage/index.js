require({
        baseUrl: "src"
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
        Odin.globalize();


        var Assets = Odin.Assets,
            randFloat = Odin.Mathf.randFloat;


        Assets.add(
            new Odin.Texture({
                name: "img_hospital",
                src: "content/hospital.png"
            }),
            new Odin.Texture({
                name: "img_player",
                src: "content/player.png"
            }),
            new Odin.Texture({
                name: "img_zombie",
                src: "content/zombie.png"
            }),
            new Odin.Texture({
                name: "img_zombie_red",
                src: "content/zombie_red.png"
            }),
            new Odin.SpriteSheet({
                name: "ss_small",
                src: "content/32x32.json"
            })
        );


        game = new Odin.Game({
            debug: true
        });

        var scene = new Odin.Scene({
            name: "PlayGround",
            world: new CollisionWorld
        });

        var camera = new Odin.GameObject({
            components: [
                new Odin.Transform2D,
                new Odin.Camera2D({
                    orthographicSize: 6
                }),
                new CameraControl
            ],
            tag: "Camera"
        });
        var player = new Odin.GameObject({
            components: [
                new Player,
                new Odin.Transform2D,
                new Odin.Sprite({
                    texture: Assets.hash["img_player"],
                    x: 0,
                    y: 0,
                    w: 64,
                    h: 64
                }),
                new Odin.SpriteAnimation({
                    sheet: Assets.hash["ss_small"],
                    rate: 0
                }),
                new CollisionObject
            ],
            tag: "Player"
        });
        var zombie = new Odin.GameObject({
            components: [
                new Zombie,
                new Odin.Transform2D,
                new Odin.Sprite({
                    texture: Assets.hash["img_zombie"],
                    x: 0,
                    y: 0,
                    w: 64,
                    h: 64
                }),
                new Odin.SpriteAnimation({
                    sheet: Assets.hash["ss_small"],
                    rate: 0.2
                }),
                new CollisionObject
            ],
            tags: ["Zombie", "Enemy"]
        });
        var zombie_red = new Odin.GameObject({
            components: [
                new Zombie,
                new Odin.Transform2D,
                new Odin.Sprite({
                    texture: Assets.hash["img_zombie_red"],
                    x: 0,
                    y: 0,
                    w: 64,
                    h: 64
                }),
                new Odin.SpriteAnimation({
                    sheet: Assets.hash["ss_small"],
                    rate: 0.2
                }),
                new CollisionObject
            ],
            tags: ["ZombieRed", "Enemy"]
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
            ]
        });
        var wall_bottom = new Odin.GameObject({
            components: [
                new Odin.Transform2D,
                new CollisionObject({
                    offset: new Odin.Vec2(0, -10),
                    size: new Odin.Vec2(32, 8),
                    mass: 0
                })
            ]
        });
        var wall_left = new Odin.GameObject({
            components: [
                new Odin.Transform2D,
                new CollisionObject({
                    offset: new Odin.Vec2(-19, 0),
                    size: new Odin.Vec2(8, 32),
                    mass: 0
                })
            ]
        });
        var wall_right = new Odin.GameObject({
            components: [
                new Odin.Transform2D,
                new CollisionObject({
                    offset: new Odin.Vec2(19, 0),
                    size: new Odin.Vec2(8, 32),
                    mass: 0
                })
            ]
        });

        scene.add(camera, player, wall_top, wall_bottom, wall_left, wall_right, background);
        for (var i = 100; i--;) {
            var instance = zombie.clone();

            instance.transform2d.position.set(randFloat(-10, 10), randFloat(-10, 10));

            scene.add(instance);
        }
        for (var i = 100; i--;) {
            var instance = zombie_red.clone();

            instance.transform2d.position.set(randFloat(-10, 10), randFloat(-10, 10));

            scene.add(instance);
        }

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
