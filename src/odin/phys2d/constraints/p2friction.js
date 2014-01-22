if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/math/mathf",
        "odin/math/vec2",
        "odin/phys2d/constraints/p2equation"

    ],
    function(Class, Mathf, Vec2, P2Equation) {
        "use strict";


        /**
         * @class P2Friction
         * @extends P2Equation
         * @brief 2d contact equation
         */
        function P2Friction() {

            P2Equation.call(this);

            /**
             * @property Vec2 p
             * @memberof P2Friction
             */
            this.p = new Vec2;

            /**
             * @property Vec2 t
             * @memberof P2Friction
             */
            this.t = new Vec2;

            this.ri = new Vec2;
            this.rj = new Vec2;

            this.rixt = 0;
            this.rjxt = 0;
        }

        Class.extend(P2Friction, P2Equation);


        P2Friction.prototype.init = function(h) {
            var bi = this.bi,
                bj = this.bj,

                p = this.p,
                px = p.x,
                py = p.y,
                t = this.t,
                tx = t.x,
                ty = t.y,

                xi = bi.position,
                xj = bj.position,

                ri = this.ri,
                rix = px - xi.x,
                riy = py - xi.y,

                rj = this.rj,
                rjx = px - xj.x,
                rjy = py - xj.y,

                rixt = rix * ty - riy * tx,
                rjxt = rjx * ty - rjy * tx;

            ri.x = rix;
            ri.y = riy;

            rj.x = rjx;
            rj.y = rjy;

            this.rixt = rixt;
            this.rjxt = rjxt;

            this.lambda = 0;
            this.calculateB(h);
            this.calculateC();
        };


        P2Friction.prototype.calculateB = function(h) {
            var bi = this.bi,
                bj = this.bj,

                t = this.t,
                tx = t.x,
                ty = t.y,

                vi = bi.velocity,
                wi = bi.angularVelocity || 0,
                fi = bi.force,
                ti = bi.torque || 0,
                invMi = bi.invMass,
                invIi = bi.invInertia || 0,

                vj = bj.velocity,
                wj = bj.angularVelocity || 0,
                fj = bj.force,
                tj = bj.torque || 0,
                invMj = bj.invMass,
                invIj = bj.invInertia || 0,

                ri = this.ri,
                rix = ri.x,
                riy = ri.y,
                rj = this.rj,
                rjx = rj.x,
                rjy = rj.y,

                Gq = 0,

                GWx = vj.x + (-wj * rjy) - vi.x - (-wi * riy),
                GWy = vj.y + (wj * rjx) - vi.y - (wi * rix),
                GW = GWx * tx + GWy * ty,

                GiMfx = fj.x * invMj + (-tj * invIj * rjy) - fi.x * invMi - (-ti * invIi * riy),
                GiMfy = fj.y * invMj + (tj * invIj * rjx) - fi.y * invMi - (ti * invIi * rix),
                GiMf = GiMfx * tx + GiMfy * ty;

            this.B = -this.a * Gq - this.b * GW - h * GiMf;
        };


        P2Friction.prototype.calculateC = function() {
            var bi = this.bi,
                bj = this.bj,

                rixt = this.rixt,
                rjxt = this.rjxt,

                invIi = bi.invInertia || 0,
                invIj = bj.invInertia || 0,

                C = bi.invMass + bj.invMass + this.eps + invIi * rixt * rixt + invIj * rjxt * rjxt;

            this.invC = C === 0 ? 0 : 1 / C;
        };


        P2Friction.prototype.calculateGWlambda = function() {
            var bi = this.bi,
                bj = this.bj,

                t = this.t,

                vlambdai = bi.vlambda,
                wlambdai = bi.wlambda || 0,
                vlambdaj = bj.vlambda,
                wlambdaj = bj.wlambda || 0,

                ulambdax = vlambdaj.x - vlambdai.x,
                ulambday = vlambdaj.y - vlambdai.y,

                GWlambda = ulambdax * t.x + ulambday * t.y;

            if (wlambdai !== undefined) GWlambda -= wlambdai * this.rixt;
            if (wlambdaj !== undefined) GWlambda += wlambdaj * this.rjxt;

            return GWlambda;
        };


        P2Friction.prototype.addToLambda = function(deltaLambda) {
            var bi = this.bi,
                bj = this.bj,

                t = this.t,
                tx = t.x,
                ty = t.y,

                invMi = bi.invMass,
                vlambdai = bi.vlambda,
                invMj = bj.invMass,
                vlambdaj = bj.vlambda;

            vlambdai.x -= deltaLambda * invMi * tx;
            vlambdai.y -= deltaLambda * invMi * ty;

            vlambdaj.x += deltaLambda * invMj * tx;
            vlambdaj.y += deltaLambda * invMj * ty;

            if (bi.wlambda !== undefined) bi.wlambda -= deltaLambda * bi.invInertia * this.rixt;
            if (bj.wlambda !== undefined) bj.wlambda += deltaLambda * bj.invInertia * this.rjxt;
        };


        return P2Friction;
    }
);
