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

        function Rotator(opts) {

            Component.call(this, opts);
        }
        Component.extend(Rotator);

        Rotator.prototype.update = function() {
            var dt = Time.delta,
                time = Time.time;

            this.transform.position.set(sin(time), cos(time), 0);
            this.transform.rotation.rotate(dt, dt, dt);
        };

        Assets.addAssets(
            new ShaderLib.Unlit,
            new ShaderLib.ParticleUnlit,

            new Texture({
                name: "tex_marine_dif",
                src: "../content/images/marine_dif.jpg"
            }),
            new Texture({
                name: "tex_sprite",
                src: "../content/images/sprite.png"
            })
        );
        Assets.addAssets(
            Mesh.Cube({
                name: "mesh_cube"
            }),
            new Material({
                name: "mat_default",

                uniforms: {
                    diffuseMap: Assets.get("tex_marine_dif")
                },

                shader: Assets.get("shader_unlit")
            }),
            new Material({
                name: "mat_particle",

                uniforms: {
                    diffuseMap: Assets.get("tex_sprite")
                },

                shader: Assets.get("shader_particle_unlit")
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
                    position: new Vec3(3, 3, 1)
                }),
                new Camera({
                    background: new Color("grey")
                }),
                new OrbitControl
            ],
            tag: "Camera"
        });
        particles = new GameObject({
            components: [
                new Transform({
                    position: new Vec3(0, 0, 0)
                }),
                new ParticleSystem({
                    emitters: [
                        new ParticleSystem.Emitter({
                            material: Assets.get("mat_particle"),
                            loop: true,

                            positionType: Enums.EmitterType.Box,
                            velocityType: Enums.EmitterType.Box,
                            emissionRate: 0.25,

                            minEmission: 16,
                            maxEmission: 32,

                            positionSpread: new Vec3(0.5, 0.5, 0),

                            angularVelocity: 0,
                            angularVelocitySpread: Mathf.PI,

                            velocity: new Vec3(0, 0, 8),
                            velocitySpread: new Vec3(2, 2, 1),
                            acceleration: new Vec3(0, 0, -9.801),

                            alphaTween: new ParticleSystem.Tween({
                                times: [0, 0.25, 1],
                                values: [0, 1, 0]
                            }),
                            sizeTween: new ParticleSystem.Tween({
                                times: [0, 0.25, 1],
                                values: [0.25, 0.5, 1.0]
                            }),

                            worldSpace: true
                        })
                    ]
                })
            ],
            tag: "particles"
        });
        mesh = new GameObject({
            components: [
                new Transform,
                new MeshFilter({
                    mesh: Assets.get("mesh_cube"),
                    material: Assets.get("mat_default")
                }),
                new Rotator()
            ]
        });
        mesh.transform.addChild(particles.transform);

        scene.addGameObjects(camera, mesh, particles);
        game.addScene(scene);

        function start() {
            game.setScene("PlayGround");
            game.setCamera(game.scene.findByTagFirst("Camera"));
        }

        function restart() {
            start();
        }

        AssetLoader.on("load", function() {

            game.on("init", start).init();
        }).load();
    }
);
