require({
        baseUrl: "../../src"
    }, [
        "odin/odin"
    ],
    function(Odin) {

        Odin.globalize();

        Assets.addAssets(
            new ShaderLib.Unlit,

            new Texture({
                name: "tex_marine_spec",
                src: "../content/images/marine_spec.jpg"
            })
        );
        Assets.addAssets(
            new Mesh({
                name: "mesh_finger",
                src: "../content/geometry/finger.json"
            }),
            Mesh.Sphere({
                name: "mesh_sphere"
            }),
            Mesh.Sphere({
                name: "mesh_smallSphere",
                radius: 0.1
            }),
            new Material({
                name: "mat_wireframe",

                wireframe: true,

                uniforms: {
                    diffuseMap: Assets.get("tex_marine_spec")
                },

                shader: Assets.get("shader_unlit")
            }),
            new Material({
                name: "mat_default",

                uniforms: {
                    diffuseMap: Assets.get("tex_marine_spec")
                },

                shader: Assets.get("shader_unlit")
            })
        );

        game = new Game({
            debug: true
        });

        var scene = new Scene({
            name: "PlayGround"
        });

        var camera = new GameObject({
            name: "camera",
            components: [
                new Transform({
                    position: new Vec3(10, 10, 10)
                }),
                new Camera,
                new OrbitControl
            ],
            tag: "Camera"
        });
        finger = new GameObject({
            name: "finger",
            components: [
                new Transform({
                    position: new Vec3(0, 0, 0)
                }),
                new MeshFilter({
                    mesh: Assets.get("mesh_finger"),
                    material: Assets.get("mat_wireframe")
                }),
                new MeshAnimation
            ],
            tags: [
                "Mesh"
            ]
        });
        sphere = new GameObject({
            components: [
                new Transform({
                    position: new Vec3(0, 0, 0)
                }),
                new MeshFilter({
                    mesh: Assets.get("mesh_sphere"),
                    material: Assets.get("mat_default")
                })
            ],
            tags: [
                "Sphere"
            ]
        });

        scene.addGameObjects(camera, sphere, finger);
        game.addScene(scene);

        gui = new Odin.GUI({
            name: "PlayGround"
        });
        guiObject = new Odin.GUIObject({
            position: new Rect(0, 0, 64, 64),
            components: [
                new Odin.GUIContent({
                    text: "Hey Stop That",
                    style: {
                        wordWrap: true,
                        stretchWidth: false,

                        padding: new RectOffset(8, 8, 8, 8),

                        normal: {
                            text: new Odin.Color()
                        },
                        hover: {
                            text: new Odin.Color("red")
                        },
                        active: {
                            text: new Odin.Color("blue")
                        }
                    }
                })
            ]
        });

        gui.addGUIObject(guiObject);
        game.addGUI(gui);

        function start() {
            game.setScene("PlayGround");
            game.setGUI("PlayGround");
            game.setCamera(game.scene.findByTagFirst("Camera"));

            var finger = game.scene.findByTagFirst("Mesh"),
                sphere = game.scene.findByTagFirst("Sphere"),
                camera = game.scene.findByTagFirst("Camera");

            finger.meshAnimation.play("attack");
            finger.find("finger03").transform.addChild(sphere.transform);
            sphere.transform.position.y = 1;

            finger.find("root").addComponent(new MeshFilter({
                mesh: Assets.get("mesh_smallSphere"),
                material: Assets.get("mat_default")
            }));
            finger.find("finger01").addComponent(new MeshFilter({
                mesh: Assets.get("mesh_smallSphere"),
                material: Assets.get("mat_default")
            }));
            finger.find("finger02").addComponent(new MeshFilter({
                mesh: Assets.get("mesh_smallSphere"),
                material: Assets.get("mat_default")
            }));
            finger.find("finger03").addComponent(new MeshFilter({
                mesh: Assets.get("mesh_smallSphere"),
                material: Assets.get("mat_default")
            }));
        }

        function restart() {
            start();
        }

        AssetLoader.on("load", function() {
            var mesh = Assets.get("mesh_finger");
            mesh.calculateTangents();

            game.on("start", start).start();
        }).load();
    }
);
