define([
        "odin/odin",
        "components/character",
        "pistol_bullet",
    ],
    function(Odin, Character, pistolBullet) {


        Odin.Assets.add(
            new Odin.Texture({
                name: "img_objects",
                src: "content/objects.png",
                magFilter: "NEAREST",
                minFilter: "NEAREST"
            })
        );


        var Time = Odin.Time,
            Input = Odin.Input,

            Mathf = Odin.Mathf,
            randInt = Mathf.randInt,
            direction = Mathf.direction,
            sign = Mathf.sign,

            abs = Math.abs,
            floor = Math.floor,
            atan2 = Math.atan2,
            Loop = Odin.Enums.WrapMode.Loop,

            PI = Math.PI,
            sqrt = Math.sqrt,

            pistol = new Weapon("Pistol", 0.5, 2, Infinity),
            shotgun = new Weapon("Shotgun", 1.2, 2, Infinity),
            uzi = new Weapon("Uzi", 0.15, 1, Infinity),
            flamethrower = new Weapon("Flamethrower", 0.1, 3, Infinity),
            bazooka = new Weapon("Bazooka", 1.5, 100, Infinity),

            weapons = [
                pistol,
                shotgun,
                uzi,
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
        }

        Character.extend(Player);


        Player.prototype.init = function() {

            Input.on("mousewheel", this.onMouseWheel, this);
        };


        Player.prototype.clear = function() {

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
            var scene = this.gameObject.scene,
                invLen = 1 / sqrt(dx * dx + dy * dy),
                x = dx * invLen,
                y = dy * invLen,
                transform2d, instance;

            switch (this.weapon) {
                case 4: //rocket launcher
                    instance = pistolBullet.clone();
                    transform2d = instance.transform2d;

                    transform2d.position.copy(position);
                    transform2d.rotation = atan2(-x, y);
                    instance.rigidBody2d.body.velocity.set(x, y).smul(10);
                    instance.bullet.owner = this;

                    scene.addGameObject(instance);
                    break;

                case 3: //flamethrower
                    instance = pistolBullet.clone();
                    transform2d = instance.transform2d;

                    transform2d.position.copy(position);
                    transform2d.rotation = atan2(-x, y);
                    instance.rigidBody2d.body.velocity.set(x, y).smul(10);
                    instance.bullet.owner = this;

                    scene.addGameObject(instance);
                    break;

                case 2: //uzi
                    instance = pistolBullet.clone();
                    transform2d = instance.transform2d;

                    transform2d.position.copy(position);
                    transform2d.rotation = atan2(-x, y);
                    instance.rigidBody2d.body.velocity.set(x, y).smul(10);
                    instance.bullet.owner = this;

                    scene.addGameObject(instance);
                    break;

                case 1: //shotgun
                    instance = pistolBullet.clone();
                    transform2d = instance.transform2d;

                    transform2d.position.copy(position);
                    transform2d.rotation = atan2(-x, y);
                    instance.rigidBody2d.body.velocity.set(x, y).smul(10);
                    instance.bullet.owner = this;

                    scene.addGameObject(instance);
                    break;

                case 0: //pistal
                    instance = pistolBullet.clone();
                    transform2d = instance.transform2d;

                    transform2d.position.copy(position);
                    transform2d.rotation = atan2(-x, y);
                    instance.rigidBody2d.body.velocity.set(x, y).smul(10);
                    instance.bullet.owner = this;

                    scene.addGameObject(instance);
                    break;
            }
        };


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
