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
            }),
            new Odin.SpriteSheet({
                name: "ss_fire",
                src: "content/fire.json"
            })
        );


        return new Odin.Prefab(
			new Odin.GameObject({
				components: [
					new Bullet,
					new Odin.Transform2D,
					new Odin.Sprite({
						texture: Odin.Assets.get("img_objects"),
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
