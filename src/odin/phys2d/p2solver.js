if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/math/mathf"
    ],
    function(Class, Mathf) {
        "use strict";


        var clamp = Mathf.clamp;

        /**
         * @class P2Solver
         * @extends Class
         * @brief World Solver
         * @param Object opts sets Class properties from passed Object
         */
        function P2Solver(opts) {
            opts || (opts = {});

            Class.call(this);

            /**
             * @property Number iterations
             * @brief max number of iterations
             * @memberof P2Solver
             */
            this.iterations = typeof opts.iterations === "number" ? opts.iterations : 10;

            /**
             * @property Number tolerance
             * @memberof P2Solver
             */
            this.tolerance = typeof opts.tolerance === "number" ? opts.tolerance : 1e-4;
        }

        Class.extend(P2Solver, Class);

        /**
         * @method solve
         * @memberof P2Solver
         * @brief solves all equations
         * @param Number h
         * @param Array equations
         */
        P2Solver.prototype.solve = function(h, equations) {
            var num = equations.length,
                eq, bi, bj,
                vlambdai, vlambdaj, vi, vj,
                iterations = this.iterations,
                iter = 0,
                toleranceSq = this.tolerance * this.tolerance,
                GWlambda, lambda, deltaLambda, deltaLambdaTotal,
                i, j;

            if (num > -1) {

                for (i = num; i--;) {
                    eq = equations[i];

                    eq.updateConstants(h);
                    eq.init(h);
                }

                for (i = iterations; i--;) {

                    iter++;
                    deltaLambdaTotal = 0;

                    for (j = num; j--;) {
                        eq = equations[j];

                        GWlambda = eq.calculateGWlambda();
                        lambda = eq.lambda;
                        deltaLambda = eq.invC * (eq.B - GWlambda - eq.eps * lambda);

                        eq.lambda = clamp(lambda + deltaLambda, eq.minForce, eq.maxForce);
                        deltaLambda = eq.lambda - lambda;

                        eq.addToLambda(deltaLambda);
                        deltaLambdaTotal += deltaLambda;
                    }

                    if (deltaLambdaTotal * deltaLambdaTotal < toleranceSq) break;
                }

                for (i = num; i--;) {
                    eq = equations[i];

                    bi = eq.bi;
                    vi = bi.velocity;
                    vlambdai = bi.vlambda;
                    bj = eq.bj;
                    vj = bj.velocity;
                    vlambdaj = bj.vlambda;

                    vi.x += vlambdai.x;
                    vi.y += vlambdai.y;

                    vj.x += vlambdaj.x;
                    vj.y += vlambdaj.y;

                    vlambdai.x = vlambdai.y = vlambdaj.x = vlambdaj.y = 0;

                    if (bi.wlambda !== undefined) {
                        bi.angularVelocity += bi.wlambda;
                        bi.wlambda = 0;
                    }
                    if (bj.wlambda !== undefined) {
                        bj.angularVelocity += bj.wlambda;
                        bj.wlambda = 0;
                    }
                }
            }

            return iter;
        };


        return P2Solver;
    }
);
