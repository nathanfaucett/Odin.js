if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/math/vec3",
        "odin/math/color"
    ],
    function(Vec3, Color) {
        "use strict";


        function Particle() {

            this.z = 1;
            this.alpha = 1;

            this.lifeTime = 0;
            this.life = 1;

            this.size = 1;

            this.color = new Color;

            this.position = new Vec3;
            this.velocity = new Vec3;
            this.acceleration = new Vec3;

            this.angle = 0;
            this.angularVelocity = 0;
            this.angularAcceleration = 0;
        }


        Particle.prototype.update = function(dt) {
            var pos = this.position,
                vel = this.velocity,
                acc = this.acceleration;

            pos.x += vel.x * dt;
            pos.y += vel.y * dt;
            pos.z += vel.z * dt;

            vel.x += acc.x * dt;
            vel.y += acc.y * dt;
            vel.z += acc.z * dt;

            this.angle += this.angularVelocity * dt;
            this.angularVelocity += this.angularAcceleration * dt;

            this.lifeTime += dt;
        };


        return Particle;
    }
);
