define([
        "odin/odin",
        "components/enemy",
        "blood"
    ],
    function(Odin, Enemy, blood) {


        return new Odin.Prefab(
            new Odin.GameObject({
                components: [
                    new Enemy({
                        lineOfSight: 16,
                        spd: 1,
                        def: 3,
                        atk: 1,
                        hp: 24
                    }),
                    blood.clone(),
                    new Odin.Transform2D,
                    new Odin.Sprite({
                        material: Odin.Assets.get("mat_zombie"),
                        x: 0,
                        y: 0,
                        w: 16,
                        h: 16,
                        layer: 1
                    }),
                    new Odin.SpriteAnimation({
                        sheet: Odin.Assets.get("ss_small"),
                        rate: 0
                    }),
                    new Odin.AudioSource({
                        dopplerLevel: 0
                    }),
                    new Odin.RigidBody2D({
                        motionState: Odin.Phys2D.P2Enums.MotionState.Dynamic,
                        linearDamping: 0.999,
                        angularDamping: 1,
                        shapes: [
                            new Odin.Phys2D.P2Rect({
                                filterGroup: 1,
                                filterMask: 1,

                                position: new Odin.Vec2(0, -0.25),
                                extents: new Odin.Vec2(0.5, 0.25)
                            }),
                            new Odin.Phys2D.P2Rect({
                                filterGroup: 8,
                                filterMask: 4,

                                isTrigger: true,
                                extents: new Odin.Vec2(0.5, 0.5)
                            })
                        ]
                    })
                ],
                tag: "Enemy"
            })
        );
    }
);
