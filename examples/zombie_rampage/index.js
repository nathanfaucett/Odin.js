require({
        baseUrl: "src"
    }, [
        "odin/odin",
        "player",
        "zombie",
        "camera_control"
    ],
    function(Odin, Player, Zombie, CameraControl) {
		

        var Assets = Odin.Assets;


        Assets.add(
            new Odin.Texture({
                name: "img_player",
                src: "content/player.png"
            }),
            new Odin.Texture({
                name: "img_zombie",
                src: "content/zombie.png"
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
            name: "PlayGround"
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
                    sheet: Assets.hash["ss_small"]
                })
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
                    sheet: Assets.hash["ss_small"]
                })
            ],
            tags: ["Zombie", "Enemy"]
        });

        scene.add(camera, player, zombie);
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
        });


        Odin.AssetLoader.load(function() {

            game.init();
        });
    }
);
