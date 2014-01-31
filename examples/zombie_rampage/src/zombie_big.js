define([
        "odin/odin",
        "components/enemy",
        "blood"
    ],
    function(Odin, Enemy, blood) {


        Odin.Assets.add(
            new Odin.Texture({
                name: "img_zombie_big",
                src: "content/zombie_big.png",
                magFilter: "NEAREST",
                minFilter: "NEAREST"
            }),
            new Odin.SpriteSheet({
                name: "ss_mid",
                src: "content/32x32.json"
            })
        );


        return new Odin.Prefab(
            new Odin.GameObject({
                components: [
                    new Enemy({
                        lineOfSight: 16,
                        spd: 1,
                        def: 6,
                        atk: 10,
                        hp: 32,

                        drop: 4
                    }),
                    blood.clone(),
                    new Odin.Transform2D,
                    new Odin.Sprite({
                        texture: Odin.Assets.get("img_zombie_big"),
                        x: 0,
                        y: 0,
                        w: 32,
                        h: 32,
                        width: 2,
                        height: 2
                    }),
                    new Odin.SpriteAnimation({
                        sheet: Odin.Assets.get("ss_mid"),
                        rate: 0
                    }),
                    new Odin.AudioSource({}),
                    new Odin.RigidBody2D({
                        motionState: Odin.Phys2D.P2Enums.MotionState.Dynamic,
                        linearDamping: 0.999,
                        angularDamping: 1,
                        mass: 0.5,
                        shapes: [
                            new Odin.Phys2D.P2Rect({
                                filterGroup: 1,
                                filterMask: 1,

                                position: new Odin.Vec2(0, -0.5),
                                extents: new Odin.Vec2(1, 0.5)
                            }),
                            new Odin.Phys2D.P2Rect({
                                filterGroup: 8,
                                filterMask: 4,

                                isTrigger: true,
                                extents: new Odin.Vec2(1, 1)
                            })
                        ]
                    })
                ],
                tag: "Enemy"
            })
        );
    }
);
