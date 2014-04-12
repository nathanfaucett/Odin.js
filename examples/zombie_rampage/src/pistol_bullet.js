define([
        "odin/odin",
        "components/bullet"
    ],
    function(Odin, Bullet) {


        return new Odin.Prefab(
            new Odin.GameObject({
                components: [
                    new Bullet,
                    new Odin.Transform2D,
                    new Odin.Sprite({
                        material: Odin.Assets.get("mat_objects"),
                        x: 0,
                        y: 0,
                        w: 6,
                        h: 16,
                        width: 0.375,
                        height: 1,
                        layer: 1
                    }),
                    new Odin.RigidBody2D({
                        motionState: Odin.Phys2D.P2Enums.MotionState.Dynamic,
                        angularDamping: 1,
                        shapes: [
                            new Odin.Phys2D.P2Rect({
                                filterGroup: 4,
                                filterMask: 8 | 1,

                                isTrigger: true,
                                extents: new Odin.Vec2(0.1875, 0.5)
                            })
                        ]
                    })
                ],
                tag: "Bullet"
            })
        );
    }
);
