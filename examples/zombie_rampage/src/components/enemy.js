define([
        "odin/odin",
        "components/character"
    ],
    function(Odin, Character) {


        Odin.Assets.add(
            new Odin.Texture({
                name: "img_objects",
                src: "content/objects.png",
                magFilter: "NEAREST",
                minFilter: "NEAREST"
            })
        );


        var Time = Odin.Time,

            Mathf = Odin.Mathf,
            randFloat = Mathf.randFloat,
            direction = Mathf.direction,
            randSign = Mathf.randSign,

            Loop = Odin.Enums.WrapMode.Loop,

            abs = Math.abs,
            cos = Math.cos,
            sin = Math.sin,
            atan2 = Math.atan2,
            PI = Math.PI;


        function Enemy(opts) {
            opts || (opts = {});

            Character.call(this, opts);

            this.lineOfSight = opts.lineOfSight != undefined ? opts.lineOfSight : 10;

            this.time = 0;
            this.turnTime = randFloat(0, 1);

            this.player = undefined;
        }

        Character.extend(Enemy);


        Enemy.prototype.copy = function(other) {
            Character.prototype.copy.call(this, other);

            this.lineOfSight = other.lineOfSight;

            return this;
        };


        Enemy.prototype.init = function() {

            this.rigidBody2d.on("collide", this.onCollide, this);
            this.rigidBody2d.on("colliding", this.onColliding, this);

            this.dir = PI * 1.5;
            this.force.set(0, -10);
        };


        Enemy.prototype.clear = function() {
            Character.prototype.clear.call(this);

            this.player = undefined;
        };


        Enemy.prototype.onCollide = function(other) {
            var gameObject = other.gameObject;
            if (!gameObject) return;

            if (gameObject.hasTag("Enemy")) {
                this.dir += randSign() * PI * 0.1;
                return;
            }

            this.dir -= PI * 0.5;
        };


        Enemy.prototype.onColliding = function(other) {
            var gameObject = other.gameObject;
            if (!gameObject) return;

            if (gameObject.hasTag("Player")) {
                this.attack(gameObject.character);
                return;
            }
        };


        Enemy.prototype.update = function() {
            Character.prototype.update.call(this);
            if (this.dead) return;

            var force = this.force,
                position = this.transform2d.position,
                animation = this.spriteAnimation,
                player = this.player || (this.player = this.gameObject.scene.findByTagFirst("Player")),
                dt = Time.delta,
                follow = false,
                x = force.x,
                y = force.y,
                playerPosition;

            if (player && player.character && !player.character.dead) {
                playerPosition = player.transform2d.position;
                if (abs(position.lengthSq() - playerPosition.lengthSq()) <= (this.lineOfSight * this.lineOfSight)) follow = true;
            }

            if (follow) this.dir = atan2(playerPosition.y - position.y, playerPosition.x - position.x);

            this.time += dt;
            if (this.time >= this.turnTime) {
                this.dir += randSign() * PI * 0.1;

                this.turnTime = randFloat(0, 1);
                this.time = 0;
            }

            force.x = cos(this.dir);
            force.y = sin(this.dir);
        };


        Enemy.prototype.toJSON = function(json) {
            json = Character.prototype.toJSON.call(this, json);

            json.lineOfSight = this.lineOfSight;

            return json;
        };


        Enemy.prototype.fromJSON = function(json) {
            Character.prototype.fromJSON.call(this, json);

            this.lineOfSight = json.lineOfSight;

            return this;
        };


        return Enemy;
    }
);
