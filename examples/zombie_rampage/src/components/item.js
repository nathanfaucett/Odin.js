define([
        "odin/odin"
    ],
    function(Odin) {


        var Time = Odin.Time;


        function Item(opts) {
            opts || (opts = {});

            Odin.Component.call(this, "Item", opts);

            this._life = 0;
            this.life = 24;
            this.type = opts.type != undefined ? opts.type : 1;
            this.value = opts.value != undefined ? opts.value : 0;
        }

        Odin.Component.extend(Item);


        Item.prototype.start = function() {

            this._life = 0;
            this.rigidBody2d.on("collide", this.onCollide, this);
        };


        Item.prototype.clear = function() {
            Odin.Component.prototype.clear.call(this);

            this.owner = undefined;
        };


        Item.prototype.onCollide = function(other) {
            var gameObject = other.gameObject;
            if (gameObject && gameObject.hasTag("Player")) {
                gameObject.character.weapons[this.type].ammo += this.value;
                this.gameObject.remove();
            }
        };


        Item.prototype.update = function() {

            this._life += Time.delta;
            if (this._life > this.life) this.gameObject.remove();
        };


        Item.prototype.toJSON = function(json) {
            json = Odin.Component.prototype.toJSON.call(this, json);

            json.type = this.type;
            json.value = this.value;

            return json;
        };


        Item.prototype.fromJSON = function(json) {
            Odin.Component.prototype.fromJSON.call(this, json);

            this.type = json.type;
            this.value = json.value;

            return this;
        };

        return Item;
    }
);
