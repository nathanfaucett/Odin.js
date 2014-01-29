define([
        "odin/odin"
    ],
    function(Odin) {


        function Bullet(opts) {
            opts || (opts = {});

            Odin.Component.call(this, "Bullet", opts);

            this.owner = undefined;
        }

        Odin.Component.extend(Bullet);


        Bullet.prototype.init = function() {

            this.rigidBody2d.on("colliding", this.onCollide, this.gameObject);
        };


        Bullet.prototype.clear = function() {

            this.rigidBody2d.off("colliding", this.onCollide, this.gameObject);
            this.owner = undefined;
        };


        Bullet.prototype.onCollide = function(other) {
            var gameObject = other.gameObject;
            if (!gameObject || gameObject.hasTag("Player")) return;

            if (gameObject.hasTag("Enemy")) this.bullet.owner.attack(gameObject.character);
            this.destroy();
        };


        return Bullet;
    }
);
