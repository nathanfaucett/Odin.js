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
                        x: 96,
                        y: 16,
                        w: 32,
                        h: 32,
                        width: 1,
                        height: 1,
                    }),
                    new Odin.SpriteAnimation({
                        sheet: Odin.Assets.get("ss_fire"),
                        rate: 0.1,
                        mode: Odin.Enums.WrapMode.Clamp
                    }),
                    new Odin.RigidBody2D({
                        motionState: Odin.Phys2D.P2Enums.MotionState.Dynamic,
                        angularDamping: 1,
                        shapes: [
                            new Odin.Phys2D.P2Rect({
                                filterGroup: 4,
                                filterMask: 8 | 1,

                                isTrigger: true,
                                extents: new Odin.Vec2(0.5, 0.5)
                            })
                        ]
                    })
                ],
                tag: "Bullet"
            })
        );
    }
);
