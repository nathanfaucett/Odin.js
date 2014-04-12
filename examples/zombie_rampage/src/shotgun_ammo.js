define([
        "odin/odin",
        "components/item"
    ],
    function(Odin, Item) {


        return new Odin.Prefab(
            new Odin.GameObject({
                components: [
                    new Item({
                        type: 2
                    }),
                    new Odin.Transform2D,
                    new Odin.Sprite({
                        material: Odin.Assets.get("mat_objects"),
                        x: 12,
                        y: 0,
                        w: 11,
                        h: 12,
                        width: 0.6875,
                        height: 0.75,
                        layer: 1
                    }),
                    new Odin.RigidBody2D({
                        motionState: Odin.Phys2D.P2Enums.MotionState.Dynamic,
                        shapes: [
                            new Odin.Phys2D.P2Rect({
                                filterGroup: 2,
                                filterMask: 1,

                                isTrigger: true,
                                extents: new Odin.Vec2(0.34375, 0.375)
                            })
                        ]
                    })
                ],
                tag: "Ammo"
            })
        );
    }
);
