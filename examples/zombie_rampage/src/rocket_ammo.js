define([
        "odin/odin",
        "components/item"
    ],
    function(Odin, Item) {


        return new Odin.Prefab(
            new Odin.GameObject({
                components: [
                    new Item({
                        type: 4
                    }),
                    new Odin.Transform2D,
                    new Odin.Sprite({
                        material: Odin.Assets.get("mat_objects"),
                        x: 33,
                        y: 0,
                        w: 11,
                        h: 11,
                        width: 0.6875,
                        height: 0.6875,
                        layer: 1
                    }),
                    new Odin.RigidBody2D({
                        motionState: Odin.Phys2D.P2Enums.MotionState.Dynamic,
                        shapes: [
                            new Odin.Phys2D.P2Rect({
                                filterGroup: 2,
                                filterMask: 1,

                                isTrigger: true,
                                extents: new Odin.Vec2(0.34375, 0.34375)
                            })
                        ]
                    })
                ],
                tag: "Ammo"
            })
        );
    }
);
