if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/time",
        "odin/math/color",
        "odin/core/world/world",
        "odin/phys2d/phys2d"
    ],
    function(Time, Color, World, Phys2D) {
        "use strict";


        function World2D(opts) {
            opts || (opts = {});

            World.call(this, opts);

            this.space = new Phys2D.P2Space(opts.space);
        }

        World.extend(World2D);


        World2D.prototype.init = function() {
            var space = this.space,
                scene = this.scene,
                RigidBodies = scene.components.RigidBody2D,
                i = RigidBodies.length;

            for (; i--;) space.addBody(RigidBodies[i].body);

            scene.on("addRigidBody2D", function(component) {

                space.addBody(component.body);
            });
            scene.on("removeRigidBody2D", function(component) {

                space.removeBody(component.body);
            });
        };


        var accumulator = 0;
        World2D.prototype.update = function() {
            var fixedDelta = Time.fixedDelta;

            accumulator += Time.delta;

            if (fixedDelta <= accumulator) {
                this.space.step(fixedDelta);
                accumulator = 0;
            }
        };


        World2D.prototype.clear = function() {
            World.prototype.clear.call(this);

            return this;
        };


        World2D.prototype.toSYNC = function(json) {
            json = World.prototype.toSYNC.call(this, json);

            return json;
        };


        World2D.prototype.fromSYNC = function(json) {
            World.prototype.fromSYNC.call(this, json);

            return this;
        };


        World2D.prototype.toJSON = function(json) {
            json = World.prototype.toJSON.call(this, json);

            json.space = this.space.toJSON(json.space);

            return json;
        };


        World2D.prototype.fromServerJSON = function(json) {
            World.prototype.fromServerJSON.call(this, json);

            this.space.fromJSON(json.space);

            return this;
        };


        World2D.prototype.fromJSON = function(json) {
            World.prototype.fromJSON.call(this, json);

            this.space.fromJSON(json.space);

            return this;
        };


        return World2D;
    }
);
