define([
        "odin/odin",
        "collision_object",
        "bullet",
        "character"
    ],
    function(Odin, CollisionObject, Bullet, Character) {


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

            sqrt = Math.sqrt,
            PI = Math.PI,

            bullet = new Odin.GameObject({
                components: [
                    new Odin.Transform2D,
                    new Odin.Sprite({
                        texture: Odin.Assets.hash["img_objects"],
                        x: 0,
                        y: 0,
                        w: 12,
                        h: 32,
                        width: 0.375,
                        height: 1
                    }),
                    new Bullet,
                    new CollisionObject({
                        size: new Odin.Vec2(0.5, 0.5)
                    })
                ],
                tag: "Bullet"
            }),

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
            this.shooting = false;

            this.weapon = 0;
        }

        Character.extend(Player);


        Player.prototype.init = function() {

            Input.on("mousewheel", this.onMouseWheel, this);
        };


        Player.prototype.clear = function() {

            Input.off("mousewheel", this.onMouseWheel, this);
        };


        var COUNT = 0;
        Player.prototype.onMouseWheel = function() {

            COUNT += sign(Input.mouseWheel);
            this.weapon = abs(COUNT) % weapons.length;
            console.log(this.weapon);
        };


        var VEC = new Odin.Vec2,
            MOUSE = new Odin.Vec2;
        Player.prototype.update = function() {
            var position = this.transform2d.position,
                animation = this.spriteAnimation,
                camera = this.camera || (this.camera = this.gameObject.scene.findByTagFirst("Camera")),
                spd = this.spd,
                dt = Time.delta,
                x = Input.axis("horizontal"),
                y = Input.axis("vertical"),
                amount;

            if (this.dead) {
                if (this.deadTimer(dt)) return;

                animation.play("death", Odin.Enums.WrapMode.Clamp, 0.2);
                this.collisionObject.mass = 0;
                return;
            }

            VEC.x = x;
            VEC.y = y;
            if (VEC.lengthSq() > 1) VEC.normalize();

            if (x || y) {
                position.x += spd * dt * VEC.x;
                position.y += spd * dt * VEC.y;

                if (!this.hit && !this.shooting) animation.play(direction(x, y), Loop);
            }

            if (!this.hit) animation.rate = 1 / sqrt(spd * 100 * VEC.lengthSq());

            if (Input.mouseButton(0)) {
                this.shooting = true;

                camera.camera2d.toWorld(Input.mousePosition, MOUSE);
                MOUSE.x -= position.x;
                MOUSE.y -= position.y;

                animation.play(direction(MOUSE.x, MOUSE.y), Loop);
                this.fire(position, MOUSE.x, MOUSE.y, dt);

                amount = VEC.lengthSq();
            } else {
                this.shooting = false;
            }

            this.hitTimer(dt);
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
                weapon = this.weapon;

            var instance = bullet.clone(),
                instanceBullet = instance.bullet,
                transform2d = instance.transform2d,
                sprite = instance.sprite,
                invLen = 1 / sqrt(dx * dx + dy * dy);

            dx *= invLen;
            dy *= invLen;

            transform2d.position.copy(position).add(FIRE.set(dx, dy).smul(0.25));
            transform2d.rotation = atan2(-dx, dy);
            instanceBullet.x = dx;
            instanceBullet.y = dy;
            instanceBullet.owner = this;

            switch (weapon) {
                case 4: //rocket launcher
                    scene.addGameObject(instance);
                    break;

                case 3: //flamethrower
                    scene.addGameObject(instance);
                    break;

                case 2: //uzi
                    sprite.x = 12;
                    sprite.w = 2;
                    sprite.h = 26,
                    sprite.width = 0.075;
                    sprite.height = 0.8;
                    scene.addGameObject(instance);
                    break;

                case 1: //shotgun
                    var b0 = instance,
                        b1 = instance.clone(),
                        b2 = instance.clone(),
                        b3 = instance.clone(),
                        b4 = instance.clone();

                    b1.transform2d.rotation -= PI * 1 / 32;
                    b2.transform2d.rotation -= PI * 1 / 16;
                    b3.transform2d.rotation += PI * 1 / 16;
                    b4.transform2d.rotation += PI * 1 / 32;

                    scene.add(b0, b1, b2, b3, b4);

                    break;

                case 0: //pistal
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
