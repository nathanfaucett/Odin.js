define([
        "odin/odin",
        "character"
    ],
    function(Odin, Character) {


        var Time = Odin.Time,
            Input = Odin.Input,

            direction = Odin.Mathf.direction,
            sqrt = Math.sqrt;


        function Player(opts) {
            opts || (opts = {});

            opts.spd || (opts.spd = 10);
            Character.call(this, opts);
        }

        Character.extend(Player);


        Player.prototype.init = function() {

            this.gameObject.on("collision", function(other) {
                if (!other.hasTag("Enemy")) return;
                other.character.attack(this);
            }, this);
        };


        var VEC = new Odin.Vec2;
        Player.prototype.update = function() {
            var position = this.transform2d.position,
                animation = this.spriteAnimation,
                spd = this.spd,
                dt = Time.delta,
                x = Input.axis("horizontal"),
                y = Input.axis("vertical"),
                invLen;

            if (this.dead) {
                animation.play("death", Odin.Enums.WrapMode.Clamp, 0.2);
                this.collisionObject.mass = 0;
                return;
            }

            this.hitTimer(dt);

            VEC.x = x;
            VEC.y = y;
            if (VEC.lengthSq() > 1) VEC.normalize();

            if (x || y) {
                position.x += spd * dt * VEC.x;
                position.y += spd * dt * VEC.y;

                if (!this.hit) animation.play(direction(x, y));
            }

            if (!this.hit) animation.rate = 1 / sqrt(spd * 100 * (VEC.lengthSq()));
        };


        return Player;
    }
);
