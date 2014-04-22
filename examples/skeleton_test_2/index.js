require({
        baseUrl: "../../src"
    }, [
        "odin/odin"
    ],
    function(Odin) {

        Odin.globalize();

        Assets.addAssets(
            new ShaderLib.Diffuse,

            new Texture({
                name: "tex_marine_spec",
                src: "../content/images/marine_spec.jpg"
            })
        );

        Assets.addAssets(
            new Mesh({
                name: "mesh_man",
                src: "../content/geometry/man.json"
            }),
            new Material({
                name: "mat_default",

                uniforms: {
                    diffuseMap: Assets.get("tex_marine_spec")
                },

                shader: Assets.get("shader_diffuse")
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
                    position: new Vec3(0, 0, 10)
                }),
                new Camera,
                new OrbitControl
            ],
            tag: "Camera"
        });
        var light = new GameObject({
            name: "camera",
            components: [
                new Transform({
                    position: new Vec3(5, 5, 5)
                }),
                new Light
            ],
            tag: "Camera"
        });
        var man = new GameObject({
            name: "man",
            components: [
                new Transform({
                    position: new Vec3(0, 0, 0)
                }),
                new MeshFilter({
                    mesh: Assets.get("mesh_man"),
                    material: Assets.get("mat_default")
                }),
                new MeshAnimation
            ],
            tags: [
                "Mesh"
            ]
        });

        scene.addGameObjects(camera, light, man);
        game.addScene(scene);

        function start() {
            game.setScene("PlayGround");
            game.setCamera(game.scene.findByTagFirst("Camera"));
            var man = game.scene.findByTagFirst("Mesh");

            man.meshAnimation.play("idle");
        }

        function restart() {
            start();
        }

        AssetLoader.on("load", function() {
            var mesh = Assets.get("mesh_man");
            mesh.calculateTangents();

            game.on("start", start).start();
        }).load();
    }
);
