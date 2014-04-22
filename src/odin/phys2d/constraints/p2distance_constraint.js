if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/phys2d/constraints/p2constraint",
        "odin/phys2d/constraints/p2contact"
    ],
    function(P2Constraint, P2Contact) {
        "use strict";


        var sqrt = Math.sqrt;


        /**
         * @class P2DistanceConstraint
         * @extends P2Constraint
         * @brief 2d contact equation
         */
        function P2DistanceConstraint(bi, bj, distance, maxForce) {

            P2Constraint.call(this, bi, bj);

            this.distance = distance || (distance = 1);
            maxForce || (maxForce = 1e6);

            var distanceEquation = this._distanceEquation = new P2Contact();
            distanceEquation.bi = bi;
            distanceEquation.bj = bj;
            distanceEquation.minForce = -maxForce;
            distanceEquation.maxForce = maxForce;
            console.log(distanceEquation);

            this.equations.push(distanceEquation);
        }

        P2Constraint.extend(P2DistanceConstraint);


        P2DistanceConstraint.prototype.update = function() {
            var distanceEquation = this._distanceEquation,
                distance = this.distance,
                bi = this.bi,
                bj = this.bj,
                n = distanceEquation.n,
                ri = distanceEquation.ri,
                rj = distanceEquation.rj,
                xi = bi.position,
                xj = bj.position,
                nx = xj.x - xi.x,
                ny = xj.y - xi.y,
                len = nx * nx + ny * ny,
                invLen = len === 0 ? 0 : 1 / (len = sqrt(len))

                nx *= invLen;
            ny *= invLen;
            n.x = nx;
            n.y = ny;

            ri.x = nx * distance * 0.5;
            ri.y = ny * distance * 0.5;

            rj.x = nx * distance * -0.5;
            rj.y = ny * distance * -0.5;
        };


        return P2DistanceConstraint;
    }
);
