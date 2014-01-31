define([
        "odin/odin",
        "components/character",
        "pistol_bullet",
        "small_bullet",
        "rocket",
        "fire",
    ],
    function(Odin, Character, pistolBullet, smallBullet, rocket, fire) {

        Odin.Assets.add(
            new Odin.Texture({
                name: "img_objects",
                src: "content/objects.png",
                magFilter: "NEAREST",
                minFilter: "NEAREST"
            }),
            new Odin.AudioClip({
                name: "snd_fire",
                src: "content/audio/fire.ogg"
            }),
            new Odin.AudioClip({
                name: "snd_rocket",
                src: "content/audio/rocket.ogg"
            }),
            new Odin.AudioClip({
                name: "snd_short_shot",
                src: "content/audio/short_shot.ogg"
            }),
            new Odin.AudioClip({
                name: "snd_short_mid",
                src: "content/audio/short_mid.ogg"
            }),
            new Odin.AudioClip({
                name: "snd_short_long",
                src: "content/audio/short_long.ogg"
            })
        );


        var snd_short_shot = Odin.Assets.get("snd_short_shot"),
            snd_short_mid = Odin.Assets.get("snd_short_mid"),
            snd_short_long = Odin.Assets.get("snd_short_long"),
            snd_fire = Odin.Assets.get("snd_fire"),
            snd_rocket = Odin.Assets.get("snd_rocket"),

            Time = Odin.Time,
            Input = Odin.Input,

            Mathf = Odin.Mathf,
            randInt = Mathf.randInt,
            randFloat = Mathf.randFloat,
            direction = Mathf.direction,
            sign = Mathf.sign,

            abs = Math.abs,
            floor = Math.floor,
            atan2 = Math.atan2,
            Loop = Odin.Enums.WrapMode.Loop,

            PI = Math.PI,
            HALF_PI = PI * 0.5,
            cos = Math.cos,
            sin = Math.sin,
            sqrt = Math.sqrt,

            pistol = new Weapon("Pistol", 0.5, 2, Infinity),
            shotgun = new Weapon("Shotgun", 1, 1, Infinity),
            uzi = new Weapon("Uzi", 0.1, 1, Infinity),
            flamethrower = new Weapon("Flamethrower", 0.1, 3, Infinity),
            bazooka = new Weapon("Bazooka", 1.5, 100, Infinity),

            weapons = [
                pistol,
                uzi,
                shotgun,
                flamethrower,
                bazooka
            ];


        function Player(opts) {
            opts || (opts = {});

            opts.spd || (opts.spd = 3);
            Character.call(this, opts);

            this.camera = undefined;

            this._weapon = 0;
            this.weapon = 0;

            this.weapons = weapons;
        }

        Character.extend(Player);


        Player.prototype.init = function() {

            Input.on("mousewheel", this.onMouseWheel, this);
        };


        Player.prototype.clear = function() {
            Character.prototype.clear.call(this);

            Input.off("mousewheel", this.onMouseWheel, this);
            this.camera = undefined;
        };


        Player.prototype.onMouseWheel = function() {

            this._weapon += sign(Input.mouseWheel);
            this.weapon = abs(this._weapon) % weapons.length;
            console.log(this.weapon);
        };


        var MOUSE = new Odin.Vec2;
        Player.prototype.update = function() {
            Character.prototype.update.call(this);
            if (this.dead) return;

            var force = this.force,
                position = this.transform2d.position,
                animation = this.spriteAnimation,
                camera = this.camera || (this.camera = this.gameObject.scene.findByTagFirst("Camera")),
                dt = Time.delta,
                x = Input.axis("horizontal"),
                y = Input.axis("vertical");

            force.x = x;
            force.y = y;
            if (force.lengthSq() > 1) force.normalize();

            if (Input.mouseButton(0)) {
                this.attacking = true;

                camera.camera2d.toWorld(Input.mousePosition, MOUSE);
                MOUSE.x -= position.x;
                MOUSE.y -= position.y;

                animation.play(direction(MOUSE.x, MOUSE.y), Loop, 0);
                this.fire(position, MOUSE.x, MOUSE.y, dt);
            } else {
                this.attacking = false;
            }
        };


        Player.prototype.attack = function(other) {
            if (this.dead) return;

            if (other.takeDamage(this.atk + weapons[this.weapon].atk)) {
                var exp = floor(randInt(other.maxHp * other.level * 0.5, other.maxHp * other.level));

                this.exp += exp;
                console.log("GAINED " + exp + " exp");

                if (this.exp > this.nextLevel) {
                    this.setLevel(this.level + 1);
                    console.log("LEVEL UP");
                }
            }
        };


        var FIRE = new Odin.Vec2;
        Player.prototype.fire = function(position, dx, dy, dt) {
            if (!weapons[this.weapon].fire(dt)) return;
            var audioSource = this.audioSource,
                scene = this.gameObject.scene,
                invLen = 1 / sqrt(dx * dx + dy * dy),
                x = dx * invLen,
                y = dy * invLen,
                transform2d, instance;

            switch (this.weapon) {
                case 4: //rocket launcher
                    audioSource.clip = snd_rocket;
                    audioSource.play();

                    scene.addGameObject(createBullet(rocket, this, position, atan2(y, x), 5));
                    break;

                case 3: //flamethrower
                    if (!audioSource.playing) {
                        audioSource.clip = snd_fire;
                        audioSource.play();
                    }

                    scene.addGameObject(createBullet(fire, this, position, atan2(y, x), 5, false, randFloat(0.5, 1)));
                    break;

                case 2: //shotgun
                    audioSource.clip = snd_short_long;
                    audioSource.play();

                    scene.addGameObjects(
                        createBullet(smallBullet, this, position, atan2(y, x) - (PI * 0.05), 15, false, randFloat(0.25, 0.75)),
                        createBullet(smallBullet, this, position, atan2(y, x) - (PI * 0.025), 15, false, randFloat(0.25, 0.75)),
                        createBullet(smallBullet, this, position, atan2(y, x), 15, false, randFloat(0.25, 0.75)),
                        createBullet(smallBullet, this, position, atan2(y, x) + (PI * 0.025), 15, false, randFloat(0.25, 0.75)),
                        createBullet(smallBullet, this, position, atan2(y, x) + (PI * 0.05), 15, false, randFloat(0.25, 0.75))
                    );
                    break;

                case 1: //uzi
                    audioSource.clip = snd_short_shot;
                    audioSource.play();

                    scene.addGameObject(createBullet(smallBullet, this, position, atan2(y, x), 20, true));
                    break;

                case 0: //pistal
                    audioSource.clip = snd_short_mid;
                    audioSource.play();

                    scene.addGameObject(createBullet(pistolBullet, this, position, atan2(y, x), 10, true));
                    break;
            }
        };


        function createBullet(type, owner, position, angle, spd, destoryOnFlesh, life) {
            var instance = type.create(),
                transform2d = instance.transform2d,
                bullet = instance.bullet,
                x = cos(angle),
                y = sin(angle);

            life || (life = Infinity);

            transform2d.position.copy(position).add(FIRE.set(x, y).smul(0.5));
            transform2d.rotation = angle - HALF_PI;
            instance.rigidBody2d.body.velocity.set(x, y).smul(spd);
            bullet.owner = owner;
            bullet.destoryOnFlesh = destoryOnFlesh;
            bullet.life = life;

            return instance;
        }


        function Weapon(name, freq, atk, ammo) {
            this.name = name;
            this.freq = freq;
            this.atk = atk;
            this.ammo = ammo;
            this._time = 0;
        }

        Weapon.prototype.fire = function(dt) {
            if (this.ammo <= 0) return false;

            this._time += dt;
            if (this._time >= this.freq) {
                this.ammo--;
                this._time = 0;
                return true;
            }

            return false;
        };


        return Player;
    }
);
