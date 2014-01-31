define([
        "odin/odin",
        "components/camera_control",
        "components/level"
    ],
    function(Odin, CameraControl, Level) {

        Odin.Assets.addAsset(
            new Odin.Texture({
                src: "content/hospital.png",
                name: "img_hospital",
                minFilter: "NEAREST",
                magFilter: "NEAREST"
            })
        );

        var sceneLevel = new Odin.Scene({
            name: "Level",
            world: new Odin.World2D({
                background: new Odin.Color("black"),
                space: {
                    useGravity: false
                }
            })
        });
        var camera = new Odin.GameObject({
            components: [
                new Odin.Transform2D,
                new Odin.Camera2D({
                    orthographicSize: 8,
                    minOrthographicSize: 2,
                    maxOrthographicSize: 8
                }),
                new CameraControl
            ],
            tag: "Camera"
        });
        var background = new Odin.GameObject({
            components: [
                new Odin.Transform2D,
                new Odin.Sprite({
                    texture: Odin.Assets.get("img_hospital"),
                    x: 0,
                    y: 0,
                    w: 480,
                    h: 320,
                    width: 30,
                    height: 20
                }),
                new Level
            ],
            tag: "Level"
        });
        var wall_top = new Odin.GameObject({
            components: [
                new Odin.Transform2D({
                    position: new Odin.Vec2(0, 12)
                }),
                new Odin.RigidBody2D({
                    mass: 0,
                    shape: new Odin.Phys2D.P2Rect({
                        filterGroup: 1,
                        filterMask: 1 | 4,
                        extents: new Odin.Vec2(16, 4)
                    })
                })
            ],
            tags: ["Wall", "Top"]
        });
        var wall_bottom = new Odin.GameObject({
            components: [
                new Odin.Transform2D({
                    position: new Odin.Vec2(0, -10)
                }),
                new Odin.RigidBody2D({
                    mass: 0,
                    shape: new Odin.Phys2D.P2Rect({
                        filterGroup: 1,
                        filterMask: 1 | 4,
                        extents: new Odin.Vec2(16, 4)
                    })
                })
            ],
            tags: ["Wall", "Bottom"]
        });
        var wall_left = new Odin.GameObject({
            components: [
                new Odin.Transform2D({
                    position: new Odin.Vec2(-18, 0)
                }),
                new Odin.RigidBody2D({
                    mass: 0,
                    shape: new Odin.Phys2D.P2Rect({
                        filterGroup: 1,
                        filterMask: 1 | 4,
                        extents: new Odin.Vec2(4, 16)
                    })
                })
            ],
            tags: ["Wall", "Left"]
        });
        var wall_right = new Odin.GameObject({
            components: [
                new Odin.Transform2D({
                    position: new Odin.Vec2(18, 0)
                }),
                new Odin.RigidBody2D({
                    mass: 0,
                    shape: new Odin.Phys2D.P2Rect({
                        filterGroup: 1,
                        filterMask: 1 | 4,
                        extents: new Odin.Vec2(4, 16)
                    })
                })
            ],
            tags: ["Wall", "Right"]
        });

        sceneLevel.addGameObjects(camera, wall_top, wall_bottom, wall_left, wall_right, background);

        return sceneLevel;
    }
);
