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

            this.id = opts.id;
            this.client = opts.client;
        }

        Player.type = "Player";
        Component.extend(Player);

        Player.prototype.update = function() {
            var position = this.transform2d.position,
                dt = Time.delta,
                x = 0,
                y = 0,
                client = this.client,
                input = client.input;

            if (client.device.mobile) {
                x = dt * input.axis("touchX");
                y = dt * -input.axis("touchY");
            } else {
                x = 2 * dt * input.axis("horizontal");
                y = 2 * dt * input.axis("vertical");
            }

            position.x += x;
            position.y += y;
        };
        Player.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.id = this.id;

            return json;
        };
        Player.prototype.fromServerJSON = function(json) {
            Component.prototype.fromServerJSON.call(this, json);

            this.id = json.id;

            return this;
        };


        var game = new ServerGame({
            debug: true,
            host: "192.168.1.235",
            port: 3000,
            FAKE_LAG: 0.1
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
                        id: client.id,
                        client: client
                    }),
                    new Transform2D,
                    new Sprite({
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
									values: [new Color("red"), new Color("black")]
								},
								sizeTween: {
									times: [0, 0.5, 0.75, 1],
									values: [0, 0.5, 0.5, 1]
								},
	
								positionType: Enums.EmitterType.Circle,
								positionSpread: new Vec2(0.1, 0.1),
								positionRadius: 0.1,
	
								velocityType: Enums.EmitterType.Circle,
								speed: 1,
								speedSpread: 2,
	
								randomAngle: true,
								angularVelocitySpread: Math.PI,
	
								accelerationSpread: new Odin.Vec2(1, 1)
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

            client.setScene(scene.name);
            client.setCamera(camera);

            client.socket.emit("player", player._id);

            client.on("disconnect", function() {

                scene.remove(player, camera);
            });
        });

        game.init();
    }
);
