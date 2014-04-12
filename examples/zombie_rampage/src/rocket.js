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
                        x: 7,
                        y: 0,
                        w: 5,
                        h: 11,
                        width: 0.3125,
                        height: 0.6875,
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
                                extents: new Odin.Vec2(0.15625, 0.34375)
                            })
                        ]
                    }),
                    new Odin.ParticleSystem({
                        playing: true,
                        emitter: new Odin.ParticleSystem.Emitter2D({
                            loop: true,
                            material: Odin.Assets.hash["mat_smoke"],

                            worldSpace: true,
                            emissionRate: 0.1,

                            minLife: 1,
                            maxLife: 2,

                            minEmission: 1,
                            maxEmission: 4,

                            color: new Odin.Color("white"),

                            alphaTween: {
                                times: [0, 0.3, 0.75, 1],
                                values: [0, 0.25, 0.5, 0]
                            },
                            sizeTween: {
                                times: [0, 1],
                                values: [0.5, 1]
                            },

                            positionType: Odin.Enums.EmitterType.Circle,
                            positionSpread: new Odin.Vec2(0, 0),
                            positionRadius: 0.01,

                            velocityType: Odin.Enums.EmitterType.Circle,
                            speed: 0,
                            speedSpread: 0.1,

                            randomAngle: true,
                            angularVelocitySpread: Math.PI,

                            accelerationSpread: new Odin.Vec2(0.01, 0.01)
                        })
                    })
                ],
                tag: "Bullet"
            })
        );
    }
);
