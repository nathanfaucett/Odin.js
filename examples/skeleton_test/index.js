require({
        baseUrl: "../../src"
    }, [
        "odin/odin"
    ],
    function(Odin) {

        Odin.globalize();

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
            new Material({
                name: "mat_default",

                wireframe: false,
                wireframeLineWidth: 1,

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
            components: [
                new Transform({
                    position: new Vec3(10, 10, 10)
                }),
                new Camera(),
                new OrbitControl
            ],
            tag: "Camera"
        });
        finger = new GameObject({
            components: [
                new Transform({
                    position: new Vec3(0, 0, 0)
                }),
                new MeshFilter({
                    mesh: Assets.get("mesh_finger"),
                    material: Assets.get("mat_default")
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
                }),
                new MeshAnimation
            ],
            tags: [
                "Sphere"
            ]
        });

        scene.addGameObjects(camera, sphere, finger);
        game.addScene(scene);

        function start() {
            game.setScene("PlayGround");
            game.setCamera(game.scene.findByTagFirst("Camera"));

            var finger = game.scene.findByTagFirst("Mesh"),
                sphere = game.scene.findByTagFirst("Sphere");

            finger.meshAnimation.play("idle");

            sphere.transform.position.y = 1;
            sphere.transform.parent = finger.meshFilter.bones[3];
        }

        function restart() {
            start();
        }

        AssetLoader.on("load", function() {
            var mesh = Assets.get("mesh_finger");

            game.on("start", start).start();
        }).load();
    }
);
