require({
        baseUrl: "src"
    }, [
        "odin/odin"
    ],
    function(Odin) {

        Odin.globalize();


        function CameraControl(opts) {
            opts || (opts = {});

            Component.call(this, "CameraControl", opts);

            this.speed = 2;
            this.zoomSpeed = 6;
        }

        Component.extend(CameraControl);


        var ZERO = new Vec3;
        CameraControl.prototype.update = function() {
            var transform = this.transform,
                position = transform.position,
                camera = this.camera,
                dt = Time.delta,
                spd = this.speed;

            if (Input.mouseButton(0)) {
                position.x += -dt * spd * Input.axis("mouseX");
                position.z += dt * spd * Input.axis("mouseY");
            }

            transform.lookAt(ZERO);
        };


        Assets.add(
            new Texture({
                name: "img_player",
                src: "../content/images/player.png",
                magFilter: "NEAREST",
                minFilter: "NEAREST"
            }),
            new Mesh({
                name: "mesh_box",
                src: "../content/geometry/box.json"
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
                    position: new Vec3(0, 10, 10)
                }),
                new Camera,
                new CameraControl
            ],
            tag: "Camera"
        });
        mesh = new GameObject({
            components: [
                new Transform,
                new MeshFilter({
                    mesh: Assets.hash["mesh_box"]
                })
            ]
        });

        scene.add(camera, mesh);
        game.addScene(scene);


        start = function() {
            game.setScene("PlayGround");
            game.setCamera(game.scene.findByTagFirst("Camera"));
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
