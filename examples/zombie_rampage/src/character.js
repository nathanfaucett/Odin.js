define([
        "odin/odin"
    ],
    function(Odin) {


        var Mathf = Odin.Mathf,
            randInt = Mathf.randInt;


        function Character(opts) {
            opts || (opts = {});

            Odin.Component.call(this, "Character", opts);

            this.dead = false;

            this.hit = false;
            this.hitTime = 0.25;
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


        Character.prototype.attack = function(other) {
            if (other.dead || other.hit) return;
            var damage = this.atk * randInt(1, 6) - other.def * randInt(1, 6);

            if (damage > 0) {
                other.hp -= damage;
                other.hit = true;
            }

            if (other.hp <= 0) other.dead = true;
        };


        Character.prototype.hitTimer = function(dt) {
            if (!this.hit) return;

            this.spriteAnimation.play("hit", Odin.Enums.WrapMode.Loop, 0.2);

            if ((this._hitTime += dt) > this.hitTime) {
                this.hit = false;
                this._hitTime = 0;
            }
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


        return Character;
    }
);
