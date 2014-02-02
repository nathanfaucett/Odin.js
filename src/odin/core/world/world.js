if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/math/color"
    ],
    function(Class, Color) {
        "use strict";


        function World(opts) {
            opts || (opts = {});

            Class.call(this);

            this.scene = undefined;
            this.sync = false;
        }

        Class.extend(World);


        World.prototype.init = function() {

        };


        World.prototype.update = function() {

        };


        World.prototype.clear = function() {

            return this;
        };


        World.prototype.destroy = function() {
            if (!this.scene) {
                Log.error("World.destroy: can't destroy World if it's not set to a Scene");
                return this;
            }

            this.scene.removeWorld();
            this.emit("destroy");

            this.clear();

            return this;
        };


        return World;
    }
);
