define([
        "odin/odin"
    ],
    function(Odin) {


        var Time = Odin.Time,
            Input = Odin.Input,

            direction = Odin.Mathf.direction,
            sqrt = Math.sqrt;


        function Player(opts) {
            opts || (opts = {});

            Odin.Component.call(this, "Player", !! opts.sync, opts.json);
			
			this.speed = 3;
        }

        Odin.Component.extend(Player);


        var VEC = new Odin.Vec2;
        Player.prototype.update = function() {
            var position = this.transform2d.position,
                animation = this.spriteAnimation,
                spd = this.speed,
                dt = Time.delta,
                x = Input.axis("horizontal"),
                y = Input.axis("vertical"),
                invLen;

            VEC.x = x;
            VEC.y = y;
            if (VEC.lengthSq() > 1) VEC.normalize();

            if (x || y) {
                position.x += spd * dt * VEC.x;
                position.y += spd * dt * VEC.y;

                animation.play(direction(x, y));
            }

            animation.rate = 1 / sqrt(spd * 100 * (VEC.lengthSq()));
        };


        return Player;
    }
);
