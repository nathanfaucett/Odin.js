require({
        baseUrl: "../../src"
    }, [
        "odin/odin"
    ],
    function(Odin) {

        Odin.globalize();

        var random = Math.random,
            PI = Math.PI,
            HALF_PI = PI * 0.5,
            TWO_PI = PI * 2;

        function CameraControl(opts) {
            opts || (opts = {});

            Component.call(this, "CameraControl", opts);

            this.speed = 1;
            this.zoomSpeed = 6;
        }
        Component.extend(CameraControl);

        var mouseWorld = new Vec2;
        CameraControl.prototype.update = function() {
            var transform = this.transform2d,
                position = this.transform2d.position,
                camera2d = this.camera2d,
                dt = Time.delta,
                spd = this.speed,
                mouseWheel = Input.axis("mouseWheel");

            if (Input.mouseButton(0)) {
                position.x += -dt * spd * Input.axis("mouseX");
                position.y += dt * spd * Input.axis("mouseY");
            }
            if (Input.mouseButton(1)) {
                camera2d.toWorld(Input.mousePosition, mouseWorld);
                console.log(this.gameObject.scene.world.space.findBodyByPoint(mouseWorld));
            }
            if (mouseWheel) camera2d.setOrthographicSize(camera2d.orthographicSize + -dt * this.zoomSpeed * mouseWheel);
        };

        function Control(opts) {
            opts || (opts = {});

            Component.call(this, "Control", opts);

            this.speed = 32;
        }
        Component.extend(Control);

        var VEC2 = new Vec2;
        Control.prototype.update = function() {
            var body = this.rigidBody2d.body,
                dt = Time.delta,
                spd = this.speed,
                x = Input.axis("horizontal"),
                y = Input.axis("vertical");

            if (Input.key("z")) {
                body.applyAngularVelocity(HALF_PI * spd * dt);
            }
            if (Input.key("x")) {
                body.applyAngularVelocity(-HALF_PI * spd * dt);
            }
            body.applyVelocity(VEC2.set(
                x * spd * dt,
                y * spd * dt
            ));
        };


        Assets.addAssets(
            new ShaderLib.Unlit,
            new Texture({
                name: "img_player",
                flipY: true,
                filter: Enums.FilterMode.None,
                src: "../content/images/player.png"
            }),
            new Texture({
                name: "img_hospital",
                flipY: true,
                filter: Enums.FilterMode.None,
                src: "../content/images/hospital.png"
            })
        );

        Assets.addAssets(
            new Material({
                name: "mat_player",
                uniforms: {
                    diffuseMap: Assets.get("img_player")
                },
                shader: Assets.get("shader_unlit")
            }),
            new Material({
                name: "mat_hospital",
                uniforms: {
                    diffuseMap: Assets.get("img_hospital")
                },
                shader: Assets.get("shader_unlit")
            })
        );

        game = new Game({
            debug: true,
            forceCanvas: false,
            width: 960,
            height: 640
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
                    position: new Vec2(0.0, 3.0)
                }),
                new Camera2D({
                    orthographicSize: 4
                }),
                new CameraControl
            ],
            tag: "Camera"
        });
        var circle = new GameObject({
            components: [
                new Transform2D({
                    position: new Vec2(0.0, 5.0)
                }),
                new Sprite({
                    material: Assets.get("mat_player"),
                    x: 0,
                    y: 0,
                    w: 64,
                    h: 64,
                    width: 1.0,
                    height: 1.0
                }),
                new RigidBody2D({
                    allowSleep: false,
                    motionState: Phys2D.P2Enums.MotionState.Dynamic,
                    shape: new Phys2D.P2Circle({
                        radius: 0.5
                    })
                })
            ]
        });
        var segment = new GameObject({
            components: [
                new Transform2D({
                    position: new Vec2(0.0, -0.5)
                }),
                new Sprite({
                    material: Assets.get("mat_player"),
                    x: 0,
                    y: 0,
                    w: 64,
                    h: 64,
                    width: 1.0,
                    height: 3.0
                }),
                new Control,
                new RigidBody2D({
                    motionState: Phys2D.P2Enums.MotionState.Kinematic,
                    linearDamping: 0.9,
                    shape: new Phys2D.P2Segment({
                        radius: 0.5,
                        a: new Vec2(0.0, -1.0),
                        b: new Vec2(0.0, 1.0)
                    })
                })
            ]
        });
        var segment2 = new GameObject({
            components: [
                new Transform2D({
                    position: new Vec2(0.0, 15.0)
                }),
                new Sprite({
                    material: Assets.get("mat_player"),
                    x: 0,
                    y: 0,
                    w: 64,
                    h: 64,
                    width: 1.0,
                    height: 3.0
                }),
                new Control,
                new RigidBody2D({
                    motionState: Phys2D.P2Enums.MotionState.Dynamic,
                    //linearDamping: 0.999999,
                    shape: new Phys2D.P2Segment({
                        radius: 0.5,
                        a: new Vec2(0.0, -1.0),
                        b: new Vec2(0.0, 1.0)
                    })
                })
            ]
        });
        var bottom = new GameObject({
            components: [
                new Transform2D({
                    position: new Vec2(0.0, -0.5)
                }),
                new Sprite({
                    material: Assets.get("mat_hospital"),
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

        scene.addGameObjects(camera, segment2, bottom);


        function TEST(opts) {

            GUIComponent.call(this, "TEST", opts);

            this.i = 0;
        }

        GUIComponent.extend(TEST);


        GUIComponent.prototype.update = function() {
            var guiContent = this.guiContent;

            guiContent.setText("FPS: " + Mathf.truncate(Time.fps, 2));
        };


        gui = new Odin.GUI({
            name: "Level"
        });
        guiObject = new Odin.GUIObject({
            position: new Odin.Rect(0, 0, 0.25, 0.25),
            components: [
                new Odin.GUIContent({
                    text: "My Name is Nathan",
                    style: {
                        normal: {
                            text: new Odin.Color()
                        },
                        hover: {
                            text: new Odin.Color("red")
                        },
                        active: {
                            text: new Odin.Color("blue")
                        },
                        wordWrap: true
                    }
                }),
                new TEST
            ]
        });
        gui.addGUIObject(guiObject);

        game.addGUI(gui);
        game.addScene(scene);


        function start() {
            game.setGUI("Level");
            game.setScene("PlayGround");
            game.setCamera(game.scene.findByTagFirst("Camera"));
        }

        function restart() {
            start();
        }


        game.on("start", function() {
            start();
        });


        AssetLoader.on("load", function() {

            game.start();
        }).load();
    }
);
