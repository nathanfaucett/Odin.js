define([
        "odin/odin",
        "components/character",
        "shotgun_ammo",
        "uzi_ammo",
        "flamethrower_ammo",
        "rocket_ammo"
    ],
    function(Odin, Character, shotgunAmmo, uziAmmo, flamethrowerAmmo, rocketAmmo) {


        var Time = Odin.Time,

            Mathf = Odin.Mathf,
            randFloat = Mathf.randFloat,
            direction = Mathf.direction,
            randSign = Mathf.randSign,
            randInt = Mathf.randInt,
            randChoice = Mathf.randChoice,

            Loop = Odin.Enums.WrapMode.Loop,

            abs = Math.abs,
            cos = Math.cos,
            sin = Math.sin,
            atan2 = Math.atan2,
            PI = Math.PI,
            random = Math.random,

            moans = [
                Odin.Assets.get("snd_zombie_moan1"),
                Odin.Assets.get("snd_zombie_moan2"),
                Odin.Assets.get("snd_zombie_moan3"),
                Odin.Assets.get("snd_zombie_moan4")
            ];


        function Enemy(opts) {
            opts || (opts = {});

            Character.call(this, opts);

            this.drop = opts.drop != undefined ? opts.drop : 1;
            this.lineOfSight = opts.lineOfSight != undefined ? opts.lineOfSight : 10;

            this.time = 0;
            this.turnTime = randFloat(0, 1);

            this.player = undefined;
        }

        Character.extend(Enemy);


        Enemy.prototype.copy = function(other) {
            Character.prototype.copy.call(this, other);

            this.drop = other.drop;
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
                if (player.character && !player.character.dead) {
                    playerPosition = player.transform2d.position;
                    if (abs(position.lengthSq() - playerPosition.lengthSq()) <= (this.lineOfSight * this.lineOfSight)) follow = true;
                } else {
                    this.player = this.gameObject.scene.findByTagFirst("Player");
                }
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


        Enemy.prototype.takeDamage = function(atk) {

            if (Character.prototype.takeDamage.call(this, atk)) {
                var num, item;

                if (random() < 0.75) {
                    if (this.drop === 4) {
                        item = rocketAmmo.create();
                        item.item.value = 1;
                    } else {
                        num = random();

                        if (num <= 0.6) {
                            item = uziAmmo.create();
                            item.item.value = randInt(5, 25);
                        } else if (num > 0.6 && num < 0.9) {
                            item = shotgunAmmo.create();
                            item.item.value = randInt(1, 5);
                        } else {
                            item = flamethrowerAmmo.create();
                            item.item.value = randInt(10, 20);
                        }
                    }
                }

                if (item) {
                    item.transform2d.position.copy(this.transform2d.position);
                    this.gameObject.scene.addGameObject(item);
                }

                return true;
            }

            if (random() < 0.25) {
                if (!this.audioSource.playing) {
                    this.audioSource.clip = randChoice(moans);
                    this.audioSource.play();
                }
            }

            return false;
        };


        Enemy.prototype.toJSON = function(json) {
            json = Character.prototype.toJSON.call(this, json);

            json.drop = this.drop;
            json.lineOfSight = this.lineOfSight;

            return json;
        };


        Enemy.prototype.fromJSON = function(json) {
            Character.prototype.fromJSON.call(this, json);

            this.drop = json.drop;
            this.lineOfSight = json.lineOfSight;

            this.dir = PI * 1.5;
            this.force.set(0, -10);

            return this;
        };


        return Enemy;
    }
);
