require({
        baseUrl: "src"
    }, [
        "odin"
    ],
    function(Odin) {
        var sessionid;

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
                y = 0;

            if (this.id === sessionid) {
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

        game = new ClientGame({
            debug: true,
            forceCanvas: false,
            FAKE_LAG: 0.1
        });

        game.on("init", function() {

            game.connect(function(socket) {
                sessionid = socket.socket.sessionid;

                socket.on("player", function(player_id) {
                    var player = window.player = game.scene.findByServerId(player_id),
                        camera = game.camera.gameObject;

                    camera.on("update", function() {
                        var transform2d = this.transform2d,
                            camera2d = this.camera2d,
                            dt = Time.delta,
                            x = 0,
                            y = 0;

                        if (Device.mobile) {
                            x = player.transform2d.position.x;
                            y = player.transform2d.position.y;
                            x -= transform2d.position.x;
                            y -= transform2d.position.y;

                            x *= dt;
                            y *= dt;
                        } else {
                            if (Input.mouseButton(0)) {
                                x = -dt * Input.axis("mouseX");
                                y = dt * Input.axis("mouseY");
                            }
                            camera2d.setOrthographicSize(camera2d.orthographicSize + -dt * Input.axis("mouseWheel"));
                        }

                        transform2d.position.x += x;
                        transform2d.position.y += y;
                    });
                });
            });
        });

        game.init();
    }
);
