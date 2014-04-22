if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/event_emitter"
    ],
    function(EventEmitter) {
        "use strict";

        /**
         * @class P2Constraint
         * @extends Class
         * @brief 2d contact equation
         */
        function P2Constraint(bi, bj) {

            EventEmitter.call(this);

            /**
             * @property P2Body bj
             * @memberof P2Constraint
             */
            this.bi = bi;

            /**
             * @property P2Body bj
             * @memberof P2Constraint
             */
            this.bj = bj;

            /**
             * @property Array equations
             * @memberof P2Constraint
             */
            this.equations = [];
        }

        EventEmitter.extend(P2Constraint);


        P2Constraint.prototype.update = function() {

        };


        return P2Constraint;
    }
);
