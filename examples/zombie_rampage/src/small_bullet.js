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
						texture: Odin.Assets.get("img_objects"),
						x: 6,
						y: 0,
						w: 1,
						h: 16,
						width: 0.1,
						height: 1,
					}),
					new Odin.RigidBody2D({
						motionState: Odin.Phys2D.P2Enums.MotionState.Dynamic,
						angularDamping: 1,
						shapes: [
							new Odin.Phys2D.P2Rect({
								isTrigger: true,
								extents: new Odin.Vec2(0.25, 0.25)
							})
						]
					})
				],
				tag: "Bullet"
			})
		);
    }
);
