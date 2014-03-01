define([
        "odin/odin"
    ],
    function(Odin) {


        return new Odin.ParticleSystem({
            emitter: new Odin.ParticleSystem.Emitter2D({
                loop: false,
                texture: Odin.Assets.hash["img_blood"],

                worldSpace: true,
                emissionRate: 0.1,

                minLife: 0.1,
                maxLife: 0.3,

                minEmission: 1,
                maxEmission: 8,

                alphaTween: {
                    times: [0, 0.3, 0.75, 1],
                    values: [0, 0.5, 1, 0]
                },
                colorTween: {
                    times: [0.5, 1],
                    values: [new Odin.Color("red"), new Odin.Color("black")]
                },
                sizeTween: {
                    times: [0, 0.5, 0.75, 1],
                    values: [0, 0.5, 0.5, 1]
                },

                positionType: Odin.Enums.EmitterType.Circle,
                positionSpread: new Odin.Vec2(0.1, 0.1),
                positionRadius: 0.1,

                velocityType: Odin.Enums.EmitterType.Circle,
                speed: 1,
                speedSpread: 2,

                randomAngle: true,
                angularVelocitySpread: Math.PI,

                accelerationSpread: new Odin.Vec2(1, 1)
            })
        });
    }
);
