if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class"
    ],
    function(Class) {
        "use strict";

        /**
         * @class P2Equation
         * @extends Class
         * @brief 2d contact equation
         */
        function P2Equation() {

            Class.call(this);

            /**
             * @property P2Body sj
             * @memberof P2Equation
             */
            this.bi = undefined;

            /**
             * @property P2Body bj
             * @memberof P2Equation
             */
            this.bj = undefined;

            /**
             * @property Number minForce
             * @memberof P2Equation
             */
            this.minForce = -1e6;

            /**
             * @property Number maxForce
             * @memberof P2Equation
             */
            this.maxForce = 1e6;

            /**
             * @property Number relaxation
             * @brief number of timesteps it takesto stabilize the constraint
             * @memberof P2Equation
             */
            this.relaxation = 5;

            /**
             * @property Number stiffness
             * @brief spring constant
             * @memberof P2Equation
             */
            this.stiffness = 1e7;

            this.a = 0;
            this.b = 0;
            this.eps = 0;

            this.lambda = 0;
            this.B = 0;
            this.invC = 0;
        }

        Class.extend(P2Equation, Class);


        P2Equation.prototype.updateConstants = function(h) {
            var k = this.stiffness,
                d = this.relaxation;

            this.a = 4 / (h * (1 + 4 * d));
            this.b = (4 * d) / (1 + 4 * d);
            this.eps = 4 / (h * h * k * (1 + 4 * d))
        };


        return P2Equation;
    }
);
