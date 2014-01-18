require({
        baseUrl: "../../src"
    }, [
        "odin"
    ],
    function(Odin) {

        Odin.globalize();


        function Player(opts) {
            opts || (opts = {});

            Component.call(this, "Player", opts.sync, opts.json);

            this.speed = 5;
        }

        Component.extend(Player);
        window.Player = Player;

        Player.prototype.update = function() {
            var position = this.transform2d.position,
                spd = this.speed,
                dt = Time.delta,
                x = Input.axis("horizontal"),
                y = Input.axis("vertical");

            position.x += spd * dt * x;
            position.y += spd * dt * y;
        };


        function CameraControl(opts) {
            opts || (opts = {});

            Component.call(this, "CameraControl", opts.sync, opts.json);
        }

        Component.extend(CameraControl);
        window.CameraControl = CameraControl;

        CameraControl.prototype.update = function() {
            var position = this.transform2d.position,
                camera2d = this.camera2d,
                dt = Time.delta,
                x = 0,
                y = 0;


            if (Input.mouseButton(0)) {
                x = -dt * Input.axis("mouseX");
                y = dt * Input.axis("mouseY");
            }
            camera2d.setOrthographicSize(camera2d.orthographicSize + -dt * Input.axis("mouseWheel"));

            position.x += x;
            position.y += y;
        };


        Assets.add(
            new Texture({
                name: "img_player",
                src: "../content/images/player.png"
            }),
            new Texture({
                name: "img_water",
                src: "../content/images/sprites/water.png"
            }),
            new Texture({
                name: "img_pixel_blood",
                src: "../content/images/sprites/pixel_blood.png"
            }),
            new SpriteSheet({
                name: "ss_player",
                src: "../content/spritesheets/player.json"
            }),
            new AudioClip({
                name: "sound",
                src: "../content/audio/boom.ogg"
            })
        );


        game = new ClientGame({
            debug: true
        });

        scene = new Scene();

        camera = new GameObject({
            components: [
                new Transform2D,
                new Camera2D,
                new CameraControl
            ],
            tag: "Camera"
        });
        player = new GameObject({
            components: [
                new Player,
                new Transform2D,
                new Sprite2D({
                    texture: Assets.hash["img_player"],
                    x: 0,
                    y: 0,
                    w: 64,
                    h: 64
                }),
                new AudioSource({
                    clip: Assets.hash["sound"],
                    playOnInit: true,
                    loop: true,
                    dopplerLevel: 1,
                    volume: 0.25
                }),
                new ParticleSystem({
                    emitters: [
                        new ParticleSystem.Emitter2D({
                            loop: true,

                            texture: Assets.hash["img_pixel_blood"],

                            worldSpace: true,
                            emissionRate: 0.2,

                            minLife: 0.1,
                            maxLife: 0.2,

                            minEmission: 1,
                            maxEmission: 8,

                            duration: 0,

                            alphaTween: {
                                times: [0, 0.3, 0.75, 1],
                                values: [0, 1, 1, 0]
                            },
                            colorTween: {
                                times: [0.1, 1],
                                values: [new Color("black"), new Color("red")]
                            },
                            sizeTween: {
                                times: [0, 0.3, 0.75, 1],
                                values: [0.2, 0.5, 0.5, 1]
                            },

                            positionType: Enums.EmitterType.Circle,
                            positionSpread: new Vec2(0.25, 0.25),
                            positionRadius: 0.1,

                            velocityType: Enums.EmitterType.Circle,
                            speed: 1,
                            speedSpread: 2,

                            randomAngle: true,
                            angularVelocitySpread: Math.PI,

                            accelerationSpread: new Vec2(1, 1)
                        })
                    ]
                })
            ]
        });

        scene.add(player, camera);
        jsonScene = scene.toJSON();


        function start() {
            var s = Class.fromJSON(jsonScene),
                c = s.findByTagFrist("Camera");

            game.addScene(s);
            game.setScene(s);
            game.setCamera(c);
        }

        function restart() {
            game.clear();
            start();
        }


        game.on("init", function() {

            start();
        });


        Input.on("keydown", function(key) {

            if (key === "space") restart();
        })


        AssetLoader.load(function() {

            game.init();
        });
    }
);
