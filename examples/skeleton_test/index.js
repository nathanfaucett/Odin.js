require({
        baseUrl: "../../src"
    }, [
        "odin/odin"
    ],
    function(Odin) {

        Odin.globalize();

        Assets.addAssets(
            new ShaderLib.Unlit,
            new ShaderLib.Diffuse,
            new ShaderLib.NormalSpecular,

            new Texture({
                name: "tex_marine_dif",
                src: "../content/images/marine_dif_spec.png"
            }),
            new Texture({
                name: "tex_marine_nor",
                src: "../content/images/marine_nor.jpg"
            }),
            new Texture({
                name: "tex_marine_spec",
                src: "../content/images/marine_spec.jpg"
            })
        );

        function ReflectiveControl(opts) {

            Component.call(this, "ReflectiveControl", opts);

            this.gameCamera = undefined;
        }
        Component.extend(ReflectiveControl);

        ReflectiveControl.prototype.update = function() {
            var camera = this.gameCamera || (this.gameCamera = this.gameObject.scene.game.camera),
                transform, cameraTransform;

            if (!camera) return;

            transform = this.transform,
            cameraTransform = camera.transform

            transform.position.inverseVec(cameraTransform.position);
            transform.lookAt(cameraTransform);
        };

        renderTarget = new RenderTarget({
            generateMipmap: false,
            width: 512,
            height: 512
        });
        Assets.addAssets(
            new Mesh({
                name: "mesh_finger",
                src: "../content/geometry/finger.json"
            }),
            Mesh.Sphere({
                name: "mesh_sphere"
            }),
            Mesh.Plane({
                name: "mesh_plane",
                width: 10,
                height: 10,
                widthSegments: 2,
                heightSegments: 2
            }),
            Mesh.Sphere({
                name: "mesh_smallSphere",
                radius: 0.1
            }),
            new Material({
                name: "mat_diffuse",

                //wireframe: true,

                uniforms: {
                    diffuseMap: Assets.get("tex_marine_spec"),
                    normalMap: Assets.get("tex_marine_nor"),
                    specularMap: Assets.get("tex_marine_spec"),
                    normalScale: 1,
                    shininess: 30
                },

                shader: Assets.get("shader_normal_specular")
            }),
            new Material({
                name: "mat_default",

                uniforms: {
                    diffuseMap: Assets.get("tex_marine_spec")
                },

                shader: Assets.get("shader_unlit")
            }),
            new Material({
                name: "mat_tv",

                wireframe: false,

                uniforms: {
                    diffuseMap: renderTarget
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

        camera = new GameObject({
            name: "camera",
            components: [
                new Transform({
                    position: new Vec3(0, 0, 10)
                }),
                new Camera,
                new OrbitControl
            ],
            tag: "Camera"
        });
        camera2 = new GameObject({
            name: "camera2",
            components: [
                new Transform({
                    position: new Vec3(0, 0, -19),
                    rotation: new Quat().rotate(Math.PI, 0, Math.PI * -0.5)
                }),
                new Camera({
                    width: 512,
                    height: 512,
                    autoResize: false
                }),
                new ReflectiveControl
            ],
            tag: "Camera2"
        });
        finger = new GameObject({
            name: "finger",
            components: [
                new Transform({
                    position: new Vec3(0, 0, 0)
                }),
                new MeshFilter({
                    mesh: Assets.get("mesh_finger"),
                    material: Assets.get("mat_diffuse")
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
        sphere2 = new GameObject({
            name: "sphere2",
            components: [
                new Transform({
                    position: new Vec3(0, 0, 8)
                }),
                new MeshFilter({
                    mesh: Assets.get("mesh_sphere"),
                    material: Assets.get("mat_default")
                })
            ],
            tags: [
                "Sphere2"
            ]
        });
        plane = new GameObject({
            components: [
                new Transform({
                    position: new Vec3(0, 0, 0)
                }),
                new MeshFilter({
                    mesh: Assets.get("mesh_plane"),
                    material: Assets.get("mat_tv")
                })
            ],
            tags: [
                "Plane"
            ]
        });
        plane2 = new GameObject({
            components: [
                new Transform({
                    position: new Vec3(0, 0, 0)
                }),
                new MeshFilter({
                    mesh: Assets.get("mesh_plane"),
                    material: Assets.get("mat_default")
                })
            ],
            tags: [
                "Plane"
            ]
        });
        light = new GameObject({
            components: [
                new Transform({
                    position: new Vec3(5, 5, 5)
                }),
                new Light
            ],
            tags: [
                "Light"
            ]
        });

        scene.addGameObjects(camera, camera2, sphere, sphere2, plane, finger, light);
        game.addScene(scene);

        game.on("lateUpdate", function() {
            camera2 = this.scene.find("camera2");
            camera2.camera.update(true);

            var position = this.scene.find("sphere2").transform.position;

            position.x = Math.sin(Time.time) * 3;
            position.y = Math.cos(Time.time) * 3;

            this.renderer.render(camera2.camera, this.scene, null, renderTarget);
        });

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
