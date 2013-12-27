if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/class",
        "math/mathf"
    ],
    function(Class, Mathf) {
        "use strict";


        var clamp = Mathf.clamp;

        /**
         * @class Phys2D.Solver
         * @brief linear equation solver
         * @param Number iterations
         * @param Number tolerance
         */
        function Solver(iterations, tolerance) {

            /**
             * @property Number iterations
             * @brief max number of iterations
             * @memberof Phys2D.Solver
             */
            this.iterations = iterations !== undefined ? iterations : 10;

            /**
             * @property Number tolerance
             * @memberof Phys2D.Solver
             */
            this.tolerance = tolerance !== undefined ? tolerance : 1e-6;
        }

        /**
         * @method solve
         * @memberof Phys2D.Solver
         * @param Number dt
         * @param Array equations
         */
        Solver.prototype.solve = function(dt, equations) {
            var num = equations.length,
                eq, solved,
                iterations = this.iterations,
                tolerance = this.tolerance,
                toleranceSq = tolerance * tolerance,
                deltaLambdaTotal = 0,
                GWlambda = 0,
                lambda = 0,
                deltaLambda = 0,
                bi, bj, vi, vj, vlambdai, vlambdaj,
                i, j;

            for (i = num; i--;) {
                eq = equations[i];

                eq.updateConstants(dt);
                eq.init(dt);
            }

            for (i = iterations; i--;) {
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
        };


        return Solver;
    }
);
