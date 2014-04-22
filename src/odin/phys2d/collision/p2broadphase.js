if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/phys2d/p2enums"
    ],
    function(P2Enums) {
        "use strict";


        var MotionState = P2Enums.MotionState,
            SleepState = P2Enums.SleepState;


        function P2Broadphase() {}


        P2Broadphase.prototype.collisions = function(bodies, pairsi, pairsj) {
            var length = bodies.length,
                bi, bj, shapesi, shapesj, length, si, sj,
                i = length,
                j, k, l;

            pairsi.length = pairsj.length = 0;

            while (i--) {
                j = 0;
                while (j !== i) {
                    bi = bodies[i];
                    bj = bodies[j];
                    j++;

                    if ((bi.motionState !== MotionState.Dynamic && bj.motionState !== MotionState.Dynamic) || (bi.sleepState === SleepState.Sleeping && bj.sleepState === SleepState.Sleeping)) {
                        continue;
                    }

                    shapesi = bi.shapes;
                    shapesj = bj.shapes;

                    if (!bi.aabb.intersects(bj.aabb)) continue;

                    k = shapesi.length;
                    length = shapesj.length;
                    while (k--) {
                        l = length;
                        while (l--) {
                            si = shapesi[k];
                            sj = shapesj[l];
                            if ((si.filterGroup & sj.filterMask) === 0 || (sj.filterGroup & si.filterMask) === 0) continue;

                            if (si.aabb.intersects(sj.aabb)) {
                                pairsi.push(si);
                                pairsj.push(sj);
                            }
                        }
                    }
                }
            }
        };


        P2Broadphase.prototype.toJSON = function(json) {
            json || (json = {});

            return json;
        };


        P2Broadphase.prototype.fromJSON = function() {

            return this;
        };


        return P2Broadphase;
    }
);
