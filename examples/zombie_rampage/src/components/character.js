define([
        "odin/odin"
    ],
    function(Odin) {


        var Time = Odin.Time,
            Mathf = Odin.Mathf,
            direction = Mathf.direction,
            randInt = Mathf.randInt,
            floor = Math.floor,

            Loop = Odin.Enums.WrapMode.Loop,
            Clamp = Odin.Enums.WrapMode.Clamp;


        function Character(opts) {
            opts || (opts = {});

            Odin.Component.call(this, "Character", opts);

            this.force = new Odin.Vec2;
            this.attacking = false;

            this.dead = false;
            this.deadTime = opts.deadTime != undefined ? opts.deadTime : 2;
            this._deadTime = 0;

            this.hit = false;
            this.hitTime = opts.hitTime != undefined ? opts.hitTime : 0.5;
            this._hitTime = 0;

            this.level = opts.level != undefined ? opts.level : 1;

            this.maxHp = opts.hp != undefined ? opts.hp : 10;
            this.hp = this.maxHp;

            this.atk = opts.atk != undefined ? opts.atk : 3;
            this.def = opts.def != undefined ? opts.def : 2;
            this.spd = opts.spd != undefined ? opts.spd : 1;

            this.exp = opts.exp != undefined ? opts.exp : 0;
            this.nextLevel = opts.nextLevel != undefined ? opts.nextLevel : 100;

            if (this.level > 1) this.setLevel(this.level);
        }

        Odin.Component.extend(Character);


        Character.prototype.copy = function(other) {

            this.level = other.level;

            this.maxHp = other.maxHp;
            this.hp = other.hp;

            this.atk = other.atk;
            this.def = other.def;
            this.spd = other.spd;

            this.exp = other.exp;
            this.nextLevel = other.nextLevel;

            return this;
        };


        Character.prototype.update = function() {
            var animation = this.spriteAnimation,
                force = this.force,
                spd = this.spd,
                dt = Time.delta;

            if (this.dead) {
                if (this.deadTimer(dt)) return;

                animation.play("death", Clamp, 0.5);
                return;
            }

            this.hitTimer(dt);

            if (force.x || force.y) {
                force.x *= 10 * spd;
                force.y *= 10 * spd;
                this.rigidBody2d.applyForce(force);
                if (!this.hit && !this.attacking) animation.play(direction(force.x, force.y), Loop);
            }

            if (!this.hit) animation.rate = 1 / (force.length() * 0.5);
        };


        Character.prototype.attack = function(other) {
            if (this.dead) return;

            if (other.takeDamage(this.atk)) {
                this.exp += floor(other.maxHp * other.level);

                if (this.exp > this.nextLevel) this.setLevel(this.level + 1);
            }
        };


        Character.prototype.takeDamage = function(atk) {
            if (this.dead || this.hit) return false;
            var damage = atk * randInt(1, 6) - this.def * randInt(1, 6);

            if (damage > 0) {
                this.particleSystem.play();

                this.hp -= damage;
                this.hit = true;

                if (this.hp <= 0) {
                    this.dead = true;
                    return true;
                }
            }

            return false;
        };


        Character.prototype.hitTimer = function(dt) {
            if (!this.hit) return;

            this.spriteAnimation.play("hit", Odin.Enums.WrapMode.Clamp, 0.1);

            if ((this._hitTime += dt) > this.hitTime) {
                this.hit = false;
                this._hitTime = 0;
            }
        };


        Character.prototype.deadTimer = function(dt) {

            if ((this._deadTime += dt) > this.deadTime) {
                this.gameObject.destroy();
                return true;
            }

            return false
        };


        Character.prototype.setLevel = function(level) {

            this.level = level;
            this.nextLevel += level * level * 100;

            this.maxHp += level * 2;
            this.hp = this.maxHp;

            this.atk += level % 2 === 0 ? 1 : 0;
            this.def += level % 3 === 0 ? 1 : 0;
            this.spd += level % 10 === 0 ? 1 : 0;
        };


        Character.prototype.toJSON = function(json) {
            json = Odin.Component.prototype.toJSON.call(this, json);

            json.level = this.level;

            json.maxHp = this.maxHp;
            json.hp = this.hp;

            json.atk = this.atk;
            json.def = this.def;
            json.spd = this.spd;

            json.exp = this.exp;
            json.nextLevel = this.nextLevel;

            return json;
        };


        Character.prototype.fromJSON = function(json) {
            Odin.Component.prototype.fromJSON.call(this, json);

            this.level = json.level;

            this.maxHp = json.maxHp;
            this.hp = json.hp;

            this.atk = json.atk;
            this.def = json.def;
            this.spd = json.spd;

            this.exp = json.exp;
            this.nextLevel = json.nextLevel;

            return this;
        };


        return Character;
    }
);
