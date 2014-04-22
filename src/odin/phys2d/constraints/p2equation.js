if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/event_emitter"
    ],
    function(EventEmitter) {
        "use strict";

        /**
         * @class P2Equation
         * @extends Class
         * @brief 2d contact equation
         */
        function P2Equation() {

            EventEmitter.call(this);

            /**
             * @property P2Body bj
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
            this.minForce = -Number.MAX_VALUE;

            /**
             * @property Number maxForce
             * @memberof P2Equation
             */
            this.maxForce = Number.MAX_VALUE;

            /**
             * @property Number relaxation
             * @brief number of timesteps it takesto stabilize the constraint
             * @memberof P2Equation
             */
            this.relaxation = 4;

            /**
             * @property Number stiffness
             * @brief spring constant
             * @memberof P2Equation
             */
            this.stiffness = 1e6;

            this.a = 0;
            this.b = 0;
            this.epsilon = 0;

            this.lambda = 0;
            this.B = 0;
            this.invC = 0;
        }

        EventEmitter.extend(P2Equation);


        P2Equation.prototype.updateConstants = function(h) {
            var k = this.stiffness,
                d = this.relaxation;

            this.a = 4.0 / (h * (1.0 + 4.0 * d));
            this.b = (4.0 * d) / (1.0 + 4.0 * d);
            this.epsilon = 4.0 / (h * h * k * (1.0 + 4.0 * d));
        };


        return P2Equation;
    }
);
