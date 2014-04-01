define([
        "odin/odin"
    ],
    function(Odin) {


        var Time = Odin.Time;


        function Bullet(opts) {
            opts || (opts = {});

            Odin.Component.call(this, "Bullet", opts);

            this._life = 0;
            this.life = opts.life != undefined ? opts.life : Infinity;
            this.owner = undefined;
            this.destoryOnFlesh = opts.destoryOnFlesh != undefined ? !! opts.destoryOnFlesh : true;
        }

        Odin.Component.extend(Bullet);


        Bullet.prototype.start = function() {

            this.rigidBody2d.on("collide", this.onCollide, this.gameObject);
        };


        Bullet.prototype.clear = function() {
            Odin.Component.prototype.clear.call(this);

            this.owner = undefined;
        };


        Bullet.prototype.onCollide = function(other) {
            var gameObject = other.gameObject;
            if (!gameObject || gameObject.hasTag("Player") || gameObject.hasTag("Bullet")) return;

            if (gameObject.hasTag("Enemy")) this.bullet.owner.attack(gameObject.character);
            if (gameObject.hasTag("Wall")) {
                this.remove();
                return;
            }

            if (this.bullet && this.bullet.destoryOnFlesh) this.remove();
        };


        Bullet.prototype.update = function() {

            this._life += Time.delta;
            if (this._life > this.life) this.gameObject.remove();
        };


        return Bullet;
    }
);
