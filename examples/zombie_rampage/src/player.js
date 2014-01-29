define([
        "odin/odin",
        "components/player",
        "blood"
    ],
    function(Odin, Player, blood) {


        Odin.Assets.add(
            new Odin.Texture({
                name: "img_player",
                src: "content/player.png",
                magFilter: "NEAREST",
                minFilter: "NEAREST"
            }),
            new Odin.SpriteSheet({
                name: "ss_small",
                src: "content/16x16.json"
            })
        );


        return new Odin.GameObject({
            components: [
                new Player,
                blood.clone(),
                new Odin.Transform2D,
                new Odin.Sprite({
                    texture: Odin.Assets.get("img_player"),
                    x: 0,
                    y: 0,
                    w: 16,
                    h: 16
                }),
                new Odin.SpriteAnimation({
                    sheet: Odin.Assets.get("ss_small"),
                    rate: 0
                }),
                new Odin.RigidBody2D({
                    motionState: Odin.Phys2D.P2Enums.MotionState.Dynamic,
                    linearDamping: 0.999,
                    angularDamping: 1,
                    shapes: [
                        new Odin.Phys2D.P2Rect({
                            position: new Odin.Vec2(0, -0.25),
                            extents: new Odin.Vec2(0.5, 0.25)
                        }),
                        new Odin.Phys2D.P2Rect({
                            isTrigger: true,
                            extents: new Odin.Vec2(0.5, 0.5)
                        })
                    ]
                })
            ],
            tag: "Player"
        });
    }
);
