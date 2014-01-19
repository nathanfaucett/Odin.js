require({
        baseUrl: "src"
    }, [
        "odin/odin",
        "player",
        "camera_control"
    ],
    function(Odin, Player, CameraControl) {


        var Assets = Odin.Assets;


        Assets.add(
            new Odin.Texture({
                name: "img_player",
                src: "../content/images/player.png"
            }),
            new Odin.Texture({
                name: "img_water",
                src: "../content/images/sprites/water.png"
            }),
            new Odin.Texture({
                name: "img_pixel_blood",
                src: "../content/images/sprites/pixel_blood.png"
            }),
            new Odin.SpriteSheet({
                name: "ss_player",
                src: "../content/spritesheets/player.json"
            }),
            new Odin.AudioClip({
                name: "sound",
                src: "../content/audio/boom.ogg"
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
                    sheet: Assets.hash["ss_player"],
                    rate: 0.1
                }),
                new Odin.AudioSource({
                    clip: Assets.hash["sound"],
                    playOnInit: false,
                    loop: true,
                    dopplerLevel: 1,
                    volume: 0.25
                }),
                new Odin.ParticleSystem({
                    emitters: [
                        new Odin.ParticleSystem.Emitter2D({
                            loop: true,

                            texture: Assets.hash["img_pixel_blood"],

                            worldSpace: true,
                            emissionRate: 0.3,

                            minLife: 0.1,
                            maxLife: 0.3,

                            minEmission: 1,
                            maxEmission: 8,

                            duration: 0,

                            alphaTween: {
                                times: [0, 0.3, 0.75, 1],
                                values: [0, 0.5, 1, 0]
                            },
                            colorTween: {
                                times: [0.5, 1],
                                values: [new Odin.Color("red"), new Odin.Color("black")]
                            },
                            sizeTween: {
                                times: [0, 0.5, 0.75, 1],
                                values: [0, 0.5, 0.5, 1]
                            },

                            positionType: Odin.Enums.EmitterType.Circle,
                            positionSpread: new Odin.Vec2(0.1, 0.1),
                            positionRadius: 0.1,

                            velocityType: Odin.Enums.EmitterType.Circle,
                            speed: 1,
                            speedSpread: 2,

                            randomAngle: true,
                            angularVelocitySpread: Math.PI,

                            accelerationSpread: new Odin.Vec2(1, 1)
                        })
                    ]
                })
            ],
            tag: "Player"
        });

        scene.add(player, camera);
        game.addScene(scene);


        function start() {
            game.setScene("PlayGround");
            var camera = game.scene.findByTagFirst("Camera")
            game.setCamera(camera);
        }

        function restart() {
            start();
        }


        game.on("init", function() {

            start();
        });


        Odin.Input.on("keydown", function(key) {

            if (key === "space") restart();
        })


        Odin.AssetLoader.load(function() {

            game.init();
        });
    }
);
