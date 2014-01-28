require({
        baseUrl: "../../src"
    }, [
        "odin/odin"
    ],
    function(Odin) {
        Odin.globalize();


        var random = Math.random,
            PI = Math.PI,
            TWO_PI = PI * 2;


        function CameraControl(opts) {
            opts || (opts = {});

            Component.call(this, "CameraControl", opts);

            this.speed = 1;
            this.zoomSpeed = 6;
        }

        Component.extend(CameraControl);


        CameraControl.prototype.update = function() {
            var transform = this.transform2d,
                position = this.transform2d.position,
                camera2d = this.camera2d,
                dt = Time.delta,
                spd = this.speed;

            if (Input.mouseButton(0)) {
                position.x += -dt * spd * Input.axis("mouseX");
                position.y += dt * spd * Input.axis("mouseY");
            }
            if (Input.mouseButton(1)) {
                var instance = random() < 0.5 ? box.clone() : circle.clone();

                camera2d.toWorld(Input.mousePosition, instance.transform2d.position);
                instance.transform2d.rotation = TWO_PI * random();

                this.gameObject.scene.addGameObject(instance);
            }
            camera2d.setOrthographicSize(camera2d.orthographicSize + -dt * this.zoomSpeed * Input.axis("mouseWheel"));
        };


        Assets.add(
            new Texture({
                name: "img_player",
                src: "../content/images/player.png",
                magFilter: "NEAREST",
                minFilter: "NEAREST"
            }),
            new Texture({
                name: "img_hospital",
                src: "../content/images/hospital.png",
                magFilter: "NEAREST",
                minFilter: "NEAREST"
            })
        );

        game = new Game({
            debug: true,
            forceCanvas: false,
            canvasRenderer2DOptions: {
                imageSmoothingEnabled: false
            }
        });

        var scene = new Scene({
            name: "PlayGround",
            world: new World2D({
                space: {
                    useGravity: true,
                    gravity: new Vec2(0, -9.801)
                }
            })
        });

        var camera = new GameObject({
            components: [
                new Transform2D({
                    position: new Vec2(0, 8)
                }),
                new Camera2D({
                    orthographicSize: 9
                }),
                new CameraControl
            ],
            tag: "Camera"
        });
        var circle = new GameObject({
            components: [
                new Transform2D,
                new Sprite({
                    texture: Assets.hash["img_player"],
                    x: 0,
                    y: 0,
                    w: 64,
                    h: 64,
                    width: 0.5,
                    height: 0.5
                }),
                new RigidBody2D({
                    motionState: Phys2D.P2Enums.MotionState.Dynamic,
                    shape: new Phys2D.P2Circle({
                        radius: 0.25
                    })
                })
            ]
        });
        var box = new GameObject({
            components: [
                new Transform2D,
                new Sprite({
                    texture: Assets.hash["img_player"],
                    x: 0,
                    y: 0,
                    w: 64,
                    h: 64,
                    width: 0.5,
                    height: 0.5
                }),
                new RigidBody2D({
                    motionState: Phys2D.P2Enums.MotionState.Dynamic,
                    shape: new Phys2D.P2Rect({
                        extents: new Vec2(0.25, 0.25)
                    })
                })
            ]
        });
        var top = new GameObject({
            components: [
                new Transform2D({
                    position: new Vec2(0, 32)
                }),
                new Sprite({
                    texture: Assets.hash["img_hospital"],
                    x: 0,
                    y: 0,
                    w: 64,
                    h: 64,
                    width: 32,
                }),
                new RigidBody2D({
                    motionState: Phys2D.P2Enums.MotionState.Static,
                    shape: new Phys2D.P2Rect({
                        extents: new Vec2(16, 0.5)
                    })
                })
            ]
        });
        var bottom = new GameObject({
            components: [
                new Transform2D,
                new Sprite({
                    texture: Assets.hash["img_hospital"],
                    x: 0,
                    y: 0,
                    w: 64,
                    h: 64,
                    width: 32
                }),
                new RigidBody2D({
                    motionState: Phys2D.P2Enums.MotionState.Static,
                    shape: new Phys2D.P2Rect({
                        extents: new Vec2(16, 0.5)
                    })
                })
            ]
        });
        var left = new GameObject({
            components: [
                new Transform2D({
                    position: new Vec2(-16, 16)
                }),
                new Sprite({
                    texture: Assets.hash["img_hospital"],
                    x: 0,
                    y: 0,
                    w: 64,
                    h: 64,
                    height: 32,
                }),
                new RigidBody2D({
                    motionState: Phys2D.P2Enums.MotionState.Static,
                    shape: new Phys2D.P2Rect({
                        extents: new Vec2(0.5, 16)
                    })
                })
            ]
        });
        var right = new GameObject({
            components: [
                new Transform2D({
                    position: new Vec2(16, 16)
                }),
                new Sprite({
                    texture: Assets.hash["img_hospital"],
                    x: 0,
                    y: 0,
                    w: 64,
                    h: 64,
                    height: 32,
                }),
                new RigidBody2D({
                    motionState: Phys2D.P2Enums.MotionState.Static,
                    shape: new Phys2D.P2Rect({
                        extents: new Vec2(0.5, 16)
                    })
                })
            ]
        });

        scene.add(camera, left, right, top, bottom);
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


        AssetLoader.load(function() {

            game.init();
        });
    }
);
