if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/math/vec2",
        "odin/math/mat32",
        "odin/math/aabb2"
    ],
    function(Class, Vec2, Mat32, AABB2) {
        "use strict";


        function P2Shape(opts) {
            opts || (opts = {});

            Class.call(this);

            this.type = -1;

            this.body = undefined;

            this.density = opts.density != undefined ? opts.density : 1;

            this.localPosition = opts.position != undefined ? opts.position : new Vec2;
            this.localRotation = opts.rotation != undefined ? opts.rotation : 0;

            this.position = new Vec2;
            this.rotation = 0;

            this.matrix = new Mat32;
            this.matrixWorld = new Mat32;

            this.friction = opts.friction != undefined ? opts.friction : 0.5;
            this.elasticity = opts.elasticity != undefined ? opts.elasticity : 0.25;

            this.isTrigger = opts.isTrigger != undefined ? !! opts.isTrigger : false;

            this.filterMask = opts.filterMask != undefined ? opts.filterMask : 1;
            this.filterGroup = opts.filterGroup != undefined ? opts.filterGroup : 1;

            this.aabb = new AABB2;
        }

        Class.extend(P2Shape);


        P2Shape.prototype.copy = function(other) {

            this.density = other.density;

            this.localPosition.copy(other.localPosition);
            this.localRotation = other.localRotation;

            this.friction = other.friction;
            this.elasticity = other.elasticity;

            this.isTrigger = other.isTrigger;

            this.filterMask = other.filterMask;
            this.filterGroup = other.filterGroup;

            return this;
        };


        P2Shape.prototype.toJSON = function(json) {
            json = Class.prototype.toJSON.call(this, json);

            json.density = this.density;

            json.localPosition = this.localPosition.toJSON(json.localPosition);
            json.localRotation = this.localRotation;

            json.friction = this.friction;
            json.elasticity = this.elasticity;

            json.isTrigger = this.isTrigger;

            json.filterMask = this.filterMask;
            json.filterGroup = this.filterGroup;

            return json;
        };


        P2Shape.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);

            this.density = json.density;

            this.localPosition.fromJSON(json.localPosition);
            this.localRotation = json.localRotation;

            this.friction = json.friction;
            this.elasticity = json.elasticity;

            this.isTrigger = json.isTrigger;

            this.filterMask = json.filterMask;
            this.filterGroup = json.filterGroup;

            return this;
        };


        return P2Shape;
    }
);
