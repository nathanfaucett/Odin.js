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
			new ShaderLib.VertexLit,
            new Texture({
                name: "img_marine_dif",
                src: "../content/images/marine_dif.jpg"
            }),
            new Texture({
                name: "img_marine_dif",
                src: "../content/images/marine_dif.jpg"
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
                load: false,
                name: "mat_default",

                wireframe: false,
                wireframeLineWidth: 1,

                uniforms: {
                    diffuseColor: new Color("white"),
                    diffuseMap: Assets.get("img_marine_dif"),
                    envMap: Assets.get("cm_sky")
                },

                shader: Assets.get("shader_vertex_lit")
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
        pointLight = new GameObject({
            components: [
                new Transform,
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
                    type: Enums.LightType.Point,
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

        scene.addGameObjects(camera, pointLight, directionalLight, spotLight, hemiLight);
        game.addScene(scene);

        function addObject(s) {
            var num = random(),
                instance;

            if (num > 0.3333 && num < 0.6666) {
                instance = cube.clone();
            } else if (num >= 0.6666) {
                instance = sphere.clone();
            } else {
                instance = plane.clone();
            }

            instance.transform.position.set(randFloat(-1, 1), randFloat(-1, 1), randFloat(-1, 1)).normalize().smul(randFloat(0, 25));
            instance.transform.rotation.rotate(randFloat(-PI, PI), randFloat(-PI, PI), randFloat(-PI, PI));

            s.addGameObject(instance);
        }

        start = function() {
            game.setScene("PlayGround");
            game.setCamera(game.scene.findByTagFirst("Camera"));

            var currentScene = game.scene,
                pLight = currentScene.findByTagFirst("PointLight"),
                sLight = currentScene.findByTagFirst("SpotLight"),
                i;
            for (i = 500; i--;) addObject(currentScene);
			
			game.on("update", function() {
				var time = Time.time;
				
				pLight.transform.position.set(
					cos(time) * 15,
					sin(time) * 15,
					0
				);
				sLight.transform.position.set(
					cos(time) * 15,
					sin(time) * 15,
					sin(time) * 15
				);
			});
        }

        restart = function() {
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
