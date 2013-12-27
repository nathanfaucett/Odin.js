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

        function Phys2D() {

            this.Broadphase = require("phys_2d/collision/broadphase");
            this.Nearphase = require("phys_2d/collision/nearphase");

            this.Circle = require("phys_2d/collision/circle");
            this.Convex = require("phys_2d/collision/convex");
            this.Segment = require("phys_2d/collision/segment");
            this.Shape = require("phys_2d/collision/shape");

            this.Particle = require("phys_2d/dynamic/particle");
            this.Rigidbody = require("phys_2d/dynamic/rigid_body");
            this.Space = require("phys_2d/dynamic/space");

            this.Contact = require("phys_2d/solver/contact");
            this.Equation = require("phys_2d/solver/equation");
            this.Friction = require("phys_2d/solver/friction");
            this.Solver = require("phys_2d/solver/solver");
        }

        return new Phys2D;
    }
);
