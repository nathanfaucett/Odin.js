var requirejs = require("requirejs");


requirejs({
        baseUrl: "src"
    }, [
        "odin_server"
    ],
    function(Odin) {
        Odin.globalize();

        function Player(opts) {
            opts || (opts = {});

            Component.call(this, "Player", opts.sync, opts.json);

            this.client = opts.client;
        }

        Player.type = "Player";
        Component.extend(Player);


        Player.prototype.update = function() {
            var position = this.transform2d.position,
                dt = Time.delta,
                x = 0,
                y = 0;

            if (this.isServer) {
                var client = this.client,
                    input = client.input;

                if (client.device.mobile) {
                    x = dt * input.axis("touchX");
                    y = dt * -input.axis("touchY");
                } else {
                    x = 2 * dt * input.axis("horizontal");
                    y = 2 * dt * input.axis("vertical");
                }
            } else {
                if (Device.mobile) {
                    x = dt * Input.axis("touchX");
                    y = dt * -Input.axis("touchY");
                } else {
                    x = 2 * dt * Input.axis("horizontal");
                    y = 2 * dt * Input.axis("vertical");
                }
            }

            position.x += x;
            position.y += y;
        };


        var game = new ServerGame({
            debug: true,
            host: "192.168.1.235",
            port: 3000
        });

        var scene = new Scene;

        Assets.add(
            new Texture({
                name: "img_player",
                src: "./content/images/player.png"
            }),
            new Texture({
                name: "img_water",
                src: "./content/images/sprites/water.png"
            }),
            new Texture({
                name: "img_pixel_blood",
                src: "./content/images/sprites/pixel_blood.png"
            }),
            new SpriteSheet({
                name: "ss_player",
                src: "./content/spritesheets/player.json"
            }),
            new AudioClip({
                name: "sound",
                src: "./content/audio/boom.ogg"
            })
        );

        game.addScene(scene);

        game.on("connection", function(client) {
            var player = new GameObject({
                components: [
                    new Player({
                        client: client
                    }),
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
                        playOnInit: false,
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
                                color: new Color("red"),

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

                                positionType: Enums.Circle,
                                positionSpread: new Vec2(0.25, 0.25),
                                positionRadius: 0.1,

                                velocityType: Enums.Circle,
                                speed: 1,
                                speedSpread: 2,

                                randomAngle: true,
                                angularVelocitySpread: Math.PI,

                                accelerationSpread: new Vec2(1, 1)
                            })
                        ]
                    })
                ]
            }),
                camera = new GameObject({
                    components: [
                        new Transform2D({
                            sync: false
                        }),
                        new Camera2D
                    ]
                });

            scene.add(player, camera);

            client.setScene(scene);
            client.setCamera(camera);

            client.socket.emit("player", player._id);

            client.on("disconnect", function() {

                scene.remove(player, camera);
            });
        });

        game.init();
    }
);
