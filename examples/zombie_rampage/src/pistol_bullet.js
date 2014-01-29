define([
        "odin/odin",
        "components/bullet"
    ],
    function(Odin, Bullet) {


        Odin.Assets.add(
            new Odin.Texture({
                name: "img_objects",
                src: "content/objects.png",
                magFilter: "NEAREST",
                minFilter: "NEAREST"
            })
        );


        return new Odin.GameObject({
            components: [
                new Bullet,
                new Odin.Transform2D,
                new Odin.Sprite({
                    texture: Odin.Assets.get("img_objects"),
                    x: 0,
                    y: 0,
                    w: 6,
                    h: 16,
                    width: 0.4,
                    height: 1,
                }),
                new Odin.RigidBody2D({
                    motionState: Odin.Phys2D.P2Enums.MotionState.Dynamic,
                    angularDamping: 1,
                    shapes: [
                        new Odin.Phys2D.P2Rect({
                            isTrigger: true,
                            extents: new Odin.Vec2(0.5, 0.5)
                        })
                    ]
                })
            ],
            tag: "Bullet"
        });
    }
);
