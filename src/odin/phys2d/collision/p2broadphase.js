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


        function P2Broadphase(opts) {

        }


        P2Broadphase.prototype.collisions = function(bodies, pairsi, pairsj) {
            var length = bodies.length,
                bi, bj, shapesi, shapesj, shapesNumi, shapesNumj, si, sj,
                i = length,
                j, k, l;

            pairsi.length = pairsj.length = 0;

            while (i--) {
                j = 0;
                while (j !== i) {
                    bi = bodies[i];
                    bj = bodies[j];
                    j++;

                    if (!(!(bi.motionState !== MotionState.Dynamic && bj.motionState !== MotionState.Dynamic) || !(bi.sleepState === SleepState.Sleeping && bj.sleepState === SleepState.Sleeping) || !(bi.aabb && bj.aabb && !bi.aabb.intersects(bj.aabb)))) {
                        continue;
                    }

                    shapesi = bi.shapes;
                    shapesj = bj.shapes;
                    shapesNumi = shapesi.length;
                    shapesNumj = shapesj.length;

                    k = shapesNumi;
                    while (k--) {
                        l = shapesNumj;
                        while (l--) {
                            si = shapesi[k];
                            sj = shapesj[l];

                            if (!si && !sj) continue;
                            if (!si) {
                                pairsi.push(bi);
                                pairsj.push(sj);
                                continue;
                            }
                            if (!sj) {
                                pairsi.push(si);
                                pairsj.push(bj);
                                continue;
                            }
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


        return P2Broadphase;
    }
);
