if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/event_emitter",
        "math/color"
    ],
    function(EventEmitter, Color) {
        "use strict";



        function World(opts) {
            opts || (opts = {});

            EventEmitter.call(this);

            this.scene = undefined;

            this.background = opts.color != undefined ? opts.color : new Color(0.5, 0.5, 0.5);
        }

        EventEmitter.extend(World);


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


        return World;
    }
);
