define([
        "odin/odin"
    ],
    function(Odin) {


        var Time = Odin.Time,
		
			Mathf = Odin.Mathf,
			randFloat = Mathf.randFloat,
			randInt = Mathf.randInt,
			sin = Math.sin,
			cos = Math.cos,
			PI = Math.PI,

            direction = Mathf.direction,
            sqrt = Math.sqrt;


        function Zombie(opts) {
            opts || (opts = {});

            Odin.Component.call(this, "Zombie", !! opts.sync, opts.json);
			
			this.time = 0;
			this.turnTime = randFloat(0.25, 3);
			
			this.speed = 1;
			
			this.x = 0;
			this.y = -1;
			this.vx = 0;
			this.vy = 0;
        }

        Odin.Component.extend(Zombie);


        Zombie.prototype.update = function() {
            var position = this.transform2d.position,
				animation = this.spriteAnimation,
				dt = Time.delta,
				spd = this.speed,
				x = this.x, y = this.y;
			
			this.time += dt;
			
			if (this.time >= this.turnTime) {
				var turn = randInt(-1, 1);
				
				this.x = x = cos(this.x + turn * PI*0.2);
				this.y = y = sin(this.y + turn * PI*0.2);
				
				this.turnTime = randFloat(0.25, 3);
				
				animation.play(direction(x, y));
				animation.rate = 1 / sqrt(spd * 100 * (x * x + y * y));
			}
			
			position.x = dt * spd * x;
			position.y = dt * spd * y;
        };


        return Zombie;
    }
);