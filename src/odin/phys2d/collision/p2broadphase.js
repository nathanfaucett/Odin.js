if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/phys2d/p2enums"
    ],
    function(Class, P2Enums) {
        "use strict";


        var MotionState = P2Enums.MotionState,
            SleepState = P2Enums.SleepState;


        function P2Broadphase() {

            Class.call(this);
        }

        Class.extend(P2Broadphase);


        P2Broadphase.prototype.collisions = function(bodies, pairsi, pairsj) {
            var num = bodies.length,
                bi, bj, shapesi, shapesj, shapesNumi, shapesNumj, si, sj,
                i, j, k, l;

            pairsi.length = pairsj.length = 0;

            for (i = 0; i < num; i++) {
                for (j = 0; j !== i; j++) {
                    bi = bodies[i];
                    bj = bodies[j];

                    if (!bodiesNeedsBroadphase(bi, bj)) continue;

                    shapesi = bi.shapes;
                    shapesj = bj.shapes;
                    shapesNumi = shapesi.length;
                    shapesNumj = shapesj.length;

                    for (k = shapesNumi; k--;) {
                        for (l = shapesNumj; l--;) {
                            si = shapesi[k];
                            sj = shapesj[l];

                            if (!shapesNeedsBroadphase(bi, bj, si, sj, pairsi, pairsj)) continue;

                            if (si.aabb.intersects(sj.aabb)) {
                                pairsi.push(si);
                                pairsj.push(sj);
                            }
                        }
                    }
                }
            }
        };


        function bodiesNeedsBroadphase(bi, bj) {

            if (bi.motionState !== MotionState.Dynamic && bj.motionState !== MotionState.Dynamic) return false;
            if (bi.aabb && bj.aabb && !bi.aabb.intersects(bj.aabb)) return false;

            return true;
        }


        function shapesNeedsBroadphase(bi, bj, si, sj, pairsi, pairsj) {

            if (!si && !sj) return false;
            if (!si) {
                pairsi.push(bi);
                pairsj.push(sj);
                return false;
            }
            if (!sj) {
                pairsi.push(si);
                pairsj.push(bj);
                return false;
            }
            if (si.filterGroup & sj.filterMask === 0 || sj.filterGroup & si.filterMask === 0) return false;

            return true;
        }


        return P2Broadphase;
    }
);
