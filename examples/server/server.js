var requirejs = require("requirejs");

requirejs({
        baseUrl: "./src",
        nodeRequire: require
    }, [
        "odin_server"
    ],
    function(Odin) {

        Odin.globalize();

        var game = new ServerGame({
            debug: true,
            host: "192.168.1.232",
            port: 3000
        });

        var scene = new Scene;
		
        Assets.add(
            new Texture({
                name: "img_player",
                src: "./content/images/player.png"
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

            client.on("update", function() {
                var input = this.input,
                    transform2d = player.transform2d,
                    dt = Time.delta,
                    x, y;

                if (this.device.mobile) {
                    x = dt * input.axis("touchX");
                    y = dt * -input.axis("touchY");
                } else {
                    x = 2 * dt * input.axis("horizontal");
                    y = 2 * dt * input.axis("vertical");
                }

                transform2d.position.x += x;
                transform2d.position.y += y;
            });

            client.on("disconnect", function() {

                scene.remove(player, camera);
            });
        });

        game.init();
    }
);
