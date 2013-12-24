if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define(
    function(require) {
        "use strict";

        /**
         * @library Phys2D.js
         * @version 0.0.1
         * @brief Javascript 2D Physics Engine
         */

        /**
         * @class Phys2D
         * @brief namespace
         */
        var Phys2D = {};

        Phys2D.Broadphase = require("phys2d/collision/broadphase");
        Phys2D.Nearphase = require("phys2d/collision/nearphase");

        Phys2D.Circle = require("phys2d/collision/circle");
        Phys2D.Convex = require("phys2d/collision/convex");
        Phys2D.Segment = require("phys2d/collision/segment");
        Phys2D.Shape = require("phys2d/collision/shape");

        Phys2D.Particle = require("phys2d/dynamic/particle");
        Phys2D.Rigidbody = require("phys2d/dynamic/rigid_body");
        Phys2D.Space = require("phys2d/dynamic/space");

        Phys2D.Contact = require("phys2d/solver/contact");
        Phys2D.Equation = require("phys2d/solver/equation");
        Phys2D.Friction = require("phys2d/solver/friction");
        Phys2D.Solver = require("phys2d/solver/solver");

        return Phys2D;
    }
);
