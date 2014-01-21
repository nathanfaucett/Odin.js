define([
        "odin/odin"
    ],
    function(Odin) {


        var Time = Odin.Time;


        function Bullet(opts) {
            opts || (opts = {});

            Odin.Component.call(this, "Bullet", opts);

            this.owner = undefined;
            this.damage = 1;

            this.x = 0;
            this.y = 0;

            this.spd = 16;
        }

        Odin.Component.extend(Bullet);


        Bullet.prototype.init = function() {

            this.gameObject.on("collision", function(other) {
                if (!other || other.hasTag("Player")) return;

                if (other.hasTag("Enemy")) this.bullet.owner.attack(other.character);
                this.destroy();
            });
        };


        Bullet.prototype.update = function() {
            var position = this.transform2d.position,
                dt = Time.delta,
                spd = this.spd;

            position.x += this.x * spd * dt;
            position.y += this.y * spd * dt;
        };


        return Bullet;
    }
);
