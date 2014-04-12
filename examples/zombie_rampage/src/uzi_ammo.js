define([
        "odin/odin",
        "components/item"
    ],
    function(Odin, Item) {


        return new Odin.Prefab(
            new Odin.GameObject({
                components: [
                    new Item({
                        type: 1
                    }),
                    new Odin.Transform2D,
                    new Odin.Sprite({
                        material: Odin.Assets.get("mat_objects"),
                        x: 24,
                        y: 0,
                        w: 9,
                        h: 13,
                        width: 0.5625,
                        height: 0.8125,
                        layer: 1
                    }),
                    new Odin.RigidBody2D({
                        motionState: Odin.Phys2D.P2Enums.MotionState.Dynamic,
                        shapes: [
                            new Odin.Phys2D.P2Rect({
                                filterGroup: 2,
                                filterMask: 1,

                                isTrigger: true,
                                extents: new Odin.Vec2(0.28125, 0.40625)
                            })
                        ]
                    })
                ],
                tag: "Ammo"
            })
        );
    }
);
