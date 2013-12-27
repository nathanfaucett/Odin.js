if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        /**
         * @class Phys2D.Equation
         * @brief linear equation
         */
        function Equation() {

            /**
             * @property Phys2D.Body bi
             * @memberof Phys2D.Equation
             */
            this.bi = undefined;

            /**
             * @property Phys2D.Body bj
             * @memberof Phys2D.Equation
             */
            this.bj = undefined;

            /**
             * @property Number minForce
             * @memberof Phys2D.Equation
             */
            this.minForce = -1e6;

            /**
             * @property Number maxForce
             * @memberof Phys2D.Equation
             */
            this.maxForce = 1e6;

            /**
             * @property Number relaxation
             * @brief number of timesteps it takesto stabilize the constraint
             * @memberof Phys2D.Equation
             */
            this.relaxation = 5;

            /**
             * @property Number stiffness
             * @brief spring constant
             * @memberof Phys2D.Equation
             */
            this.stiffness = 1e7;

            this.a = 0;
            this.b = 0;
            this.eps = 0;

            this.lambda = 0;
            this.B = 0;
            this.invC = 0;
        }


        Equation.prototype.updateConstants = function(dt) {
            var k = this.stiffness,
                d = this.relaxation;

            this.a = 4 / (dt * (1 + 4 * d));
            this.b = (4 * d) / (1 + 4 * d);
            this.eps = 4 / (dt * dt * k * (1 + 4 * d))
        };


        return Equation;
    }
);
