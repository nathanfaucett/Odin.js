if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function(require) {
        "use strict";


        function Phys2D() {

            this.P2Broadphase = require("odin/phys2d/collision/p2broadphase");
            this.P2Nearphase = require("odin/phys2d/collision/p2nearphase");

            this.P2Circle = require("odin/phys2d/objects/p2circle");
            this.P2Convex = require("odin/phys2d/objects/p2convex");
            this.P2Particle = require("odin/phys2d/objects/p2particle");
            this.P2Rect = require("odin/phys2d/objects/p2rect");
            this.P2Rigidbody = require("odin/phys2d/objects/p2rigidbody");
            this.P2Segment = require("odin/phys2d/objects/p2segment");
            this.P2Shape = require("odin/phys2d/objects/p2shape");

            this.P2Enums = require("odin/phys2d/p2enums");
            this.P2Solver = require("odin/phys2d/p2solver");
            this.P2Space = require("odin/phys2d/p2space");
        }


        return new Phys2D;
    }
);
