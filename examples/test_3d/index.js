require({
        baseUrl: "../../src"
    }, [
        "odin/odin"
    ],
    function(Odin) {

        Odin.globalize();

        var random = Math.random,
            randFloat = Mathf.randFloat,
            PI = Math.PI,
            sin = Math.sin,
            cos = Math.cos;

        Assets.addAssets(
            new ShaderLib.Unlit,
            new ShaderLib.VertexLit,
            new ShaderLib.Diffuse,
            new ShaderLib.Specular,
            new ShaderLib.NormalDiffuse,
            new ShaderLib.NormalSpecular,
            new ShaderLib.ParallaxDiffuse,

            new ShaderLib.ParticleUnlit,

            new ShaderLib.ReflectiveVertexLit,
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
            }),
            new TextureCube({
                name: "cm_sky",
                src: [
                    "../content/images/skybox_left.jpg",
                    "../content/images/skybox_right.jpg",
                    "../content/images/skybox_front.jpg",
                    "../content/images/skybox_back.jpg",
                    "../content/images/skybox_up.jpg",
                    "../content/images/skybox_down.jpg",
                ]
            })
        );
        Assets.addAssets(
            new Mesh({
                name: "mesh_odin",
                src: "../content/geometry/marine.json"
            }),
            Mesh.Cube({
                name: "mesh_cube"
            }),
            Mesh.Plane({
                name: "mesh_plane"
            }),
            Mesh.Sphere({
                name: "mesh_sphere",
            }),
            new Material({
                name: "mat_default",

                wireframe: false,
                wireframeLineWidth: 1,

                uniforms: {
                    diffuseMap: Assets.get("tex_marine_dif"),
                    normalMap: Assets.get("tex_marine_nor"),
                    specularMap: Assets.get("tex_marine_spec"),
                    normalScale: 1,
                    shininess: 30
                },

                shader: Assets.get("shader_normal_specular")
            }),
            new Material({
                name: "mat_env",

                wireframe: false,
                wireframeLineWidth: 1,

                uniforms: {
                    diffuseMap: Assets.get("tex_marine_dif"),
                    envMap: Assets.get("cm_sky"),
                    reflectivity: 0.5,
                    combine: 3
                },

                shader: Assets.get("shader_reflective_vertex_lit")
            })
        );

        game = new Game({
            debug: true
        });

        var scene = new Scene({
            name: "PlayGround",
            world: {
                ambient: new Color()
            }
        });

        var camera = new GameObject({
            components: [
                new Transform({
                    position: new Vec3(10, 10, 10)
                }),
                new Camera({
                    background: new Color()
                }),
                new OrbitControl
            ],
            tag: "Camera"
        });
        sphere = new GameObject({
            components: [
                new Transform({
                    position: new Vec3(1, 0, 0)
                }),
                new MeshFilter({
                    mesh: Assets.get("mesh_sphere"),
                    material: Assets.get("mat_default")
                })
            ],
            tag: "Mesh"
        });
        odin = new GameObject({
            components: [
                new Transform({
                    position: new Vec3(-1, 0, 0)
                }),
                new MeshFilter({
                    mesh: Assets.get("mesh_odin"),
                    material: Assets.get("mat_default")
                })
            ],
            tag: "Mesh"
        });
        cube = new GameObject({
            components: [
                new Transform({
                    position: new Vec3(-1, 0, 0)
                }),
                new MeshFilter({
                    mesh: Assets.get("mesh_cube"),
                    material: Assets.get("mat_default")
                })
            ],
            tag: "Mesh"
        });
        plane = new GameObject({
            components: [
                new Transform({
                    position: new Vec3(0, 0, 0)
                }),
                new MeshFilter({
                    mesh: Assets.get("mesh_plane"),
                    material: Assets.get("mat_default")
                })
            ],
            tag: "Mesh"
        });
        sprite = new GameObject({
            components: [
                new Transform({
                    position: new Vec3(0, 0, 5)
                }),
                new Sprite({
                    material: Assets.get("mat_default"),
                    x: 0,
                    y: 0,
                    w: 1024,
                    h: 1024
                })
            ],
            tag: "Mesh"
        });
        pointLight = new GameObject({
            components: [
                new Transform({
                    position: new Vec3(0, 0, 25)
                }),
                new MeshFilter({
                    mesh: Assets.get("mesh_sphere"),
                    material: Assets.get("mat_default")
                }),
                new Light({
                    type: Enums.LightType.Point,
                    color: new Color(1, 1, 1),
                    distance: 16,
                    energy: 5
                })
            ],
            tags: [
                "Light",
                "PointLight"
            ]
        });
        directionalLight = new GameObject({
            components: [
                new Transform({
                    position: new Vec3(10, 5, 25)
                }),
                new MeshFilter({
                    mesh: Assets.get("mesh_sphere"),
                    material: Assets.get("mat_default")
                }),
                new Light({
                    type: Enums.LightType.Directional,
                    color: new Color(1, 1, 0),
                    energy: 0.1
                })
            ],
            tags: [
                "Light",
                "DirectionalLight"
            ]
        });
        spotLight = new GameObject({
            components: [
                new Transform({
                    position: new Vec3(-25, -25, -25)
                }),
                new MeshFilter({
                    mesh: Assets.get("mesh_sphere"),
                    material: Assets.get("mat_default")
                }),
                new Light({
                    type: Enums.LightType.Spot,
                    color: new Color(0, 0, 1),
                    energy: 1,
                    angle: Math.PI,
                    distance: 0
                })
            ],
            tags: [
                "Light",
                "SpotLight"
            ]
        });
        hemiLight = new GameObject({
            components: [
                new Transform({
                    position: new Vec3(0, 0, 25)
                }),
                new MeshFilter({
                    mesh: Assets.get("mesh_sphere"),
                    material: Assets.get("mat_default")
                }),
                new Light({
                    type: Enums.LightType.Hemi,
                    color: new Color(1, 1, 1),
                    energy: 1
                })
            ],
            tags: [
                "Light",
                "HemiLight"
            ]
        });

        scene.addGameObjects(camera, sprite, pointLight, directionalLight, spotLight, hemiLight);
        game.addScene(scene);

        function addObject(s) {
            var num = random(),
                instance;

            if (num < 0.25) {
                instance = cube.clone();
            } else if (num > 0.25 && num < 0.5) {
                instance = sphere.clone();
            } else if (num > 0.5 && num < 0.75) {
                instance = odin.clone();
            } else {
                instance = plane.clone();
            }

            instance.transform.position.set(randFloat(-1, 1), randFloat(-1, 1), randFloat(-1, 1)).normalize().smul(randFloat(0, 25));
            instance.transform.rotation.rotate(randFloat(-PI, PI), randFloat(-PI, PI), randFloat(-PI, PI));

            s.addGameObject(instance);
        }

        function start() {
            game.setScene("PlayGround");
            game.setCamera(game.scene.findByTagFirst("Camera"));

            var currentScene = game.scene,
                pLight = currentScene.findByTagFirst("PointLight"),
                sLight = currentScene.findByTagFirst("SpotLight"),
                i;
            for (i = 100; i--;) addObject(currentScene);

            game.on("update", function() {
                var time = Time.time,
                    cosTime = cos(time),
                    sinTime = sin(time);

                pLight.transform.position.set(
                    cosTime * 15,
                    sinTime * 15,
                    0
                );
                sLight.transform.position.set(
                    cosTime * 15,
                    sinTime * 15,
                    sinTime * 15
                );
            });
        }

        function restart() {
            start();
        }

        AssetLoader.on("load", function() {
            Assets.get("mesh_odin").calculateTangents();
            Assets.get("mesh_sphere").calculateTangents();
            Assets.get("mesh_plane").calculateTangents();
            Assets.get("mesh_cube").calculateTangents();

            game.on("init", start).init();
        }).load();
    }
);
