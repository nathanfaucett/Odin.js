define([
        "odin/odin"
    ],
    function(Odin) {


        var Time = Odin.Time;


        function Bullet(opts) {
            opts || (opts = {});

            Odin.Component.call(this, "Bullet", opts);

            this._life = 0;
            this.life = Infinity;
            this.owner = undefined;
            this.destoryOnFlesh = true;
        }

        Odin.Component.extend(Bullet);


        Bullet.prototype.init = function() {

            this.rigidBody2d.on("colliding", this.onColliding, this.gameObject);
        };


        Bullet.prototype.clear = function() {
            Odin.Component.prototype.clear.call(this);

            this.owner = undefined;
        };


        Bullet.prototype.onColliding = function(other) {
            var gameObject = other.gameObject;
            if (!gameObject || gameObject.hasTag("Player") || gameObject.hasTag("Bullet")) return;

            if (gameObject.hasTag("Enemy")) this.bullet.owner.attack(gameObject.character);
            if (gameObject.hasTag("Wall")) this.destroy();

            if (this.bullet && this.bullet.destoryOnFlesh) this.destroy();
        };


        Bullet.prototype.update = function() {

            this._life += Time.delta;
            if (this._life > this.life) this.gameObject.destroy();
        };


        return Bullet;
    }
);
