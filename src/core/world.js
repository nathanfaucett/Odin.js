if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/class",
        "math/color"
    ],
    function(Class, Color) {
        "use strict";



        function World(opts) {
            opts || (opts = {});

            Class.call(this);

            this.scene = undefined;
            this.sync = false;

            this.background = opts.color != undefined ? opts.color : new Color(0.5, 0.5, 0.5);
        }

        Class.extend(World);


        World.prototype.init = function() {

        };


        World.prototype.update = function() {

        };


        World.prototype.clear = function() {

            this.background.set(0.5, 0.5, 0.5);
            return this;
        };


        World.prototype.destroy = function() {
            if (!this.scene) {
                Log.warn("World.destroy: can't destroy World if it's not set to a Scene");
                return this;
            }

            this.scene.removeWorld();
            this.emit("destroy");

            this.clear();

            return this;
        };


        World.prototype.toSYNC = function(json) {
            json = Class.prototype.toSYNC.call(this, json);

            json.background = this.background.toJSON(json.background);

            return json;
        };


        World.prototype.fromSYNC = function(json) {
            Class.prototype.fromSYNC.call(this, json);

            this.background.fromJSON(json.background);

            return this;
        };


        World.prototype.toJSON = function(json) {
            json = Class.prototype.toJSON.call(this, json);

            json.background = this.background.toJSON(json.background);

            return json;
        };


        World.prototype.fromServerJSON = function(json) {
            Class.prototype.fromServerJSON.call(this, json);

            this.background.fromJSON(json.background);

            return this;
        };


        World.prototype.fromJSON = function(json) {

            this.background.fromJSON(json.background);

            return this;
        };


        return World;
    }
);
