if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/class",
        "math/mathf",
        "math/vec2",
        "phys_2d/solver/equation"
    ],
    function(Class, Mathf, Vec2, Equation) {
        "use strict";


        var max = Math.max,
            clamp = Mathf.clamp;

        /**
         * @class Phys2D.Contact
         * @brief contact equation
         */
        function Contact() {

            Equation.call(this);

            /**
             * @property Vec2 p
             * @memberof Phys2D.Contact
             */
            this.p = new Vec2;

            /**
             * @property Vec2 n
             * @memberof Phys2D.Contact
             */
            this.n = new Vec2;

            /**
             * @property Number s
             * @memberof Phys2D.Contact
             */
            this.s = 0;

            /**
             * @property Number e
             * @memberof Phys2D.Contact
             */
            this.e = 1;

            /**
             * @property Number u
             * @memberof Phys2D.Contact
             */
            this.u = 0;

            this.ri = new Vec2;
            this.rj = new Vec2;

            this.rixn = 0;
            this.rjxn = 0;
        }

        Class.extend(Contact, Equation);


        Contact.prototype.init = function(dt) {
            var bi = this.bi,
                bj = this.bj,

                p = this.p,
                px = p.x,
                py = p.y,
                n = this.n,
                nx = n.x,
                ny = n.y,

                xi = bi.position,
                xj = bj.position,

                ri = this.ri,
                rix = px - xi.x,
                riy = py - xi.y,

                rj = this.rj,
                rjx = px - xj.x,
                rjy = py - xj.y,

                rixn = rix * ny - riy * nx,
                rjxn = rjx * ny - rjy * nx;

            ri.x = rix;
            ri.y = riy;

            rj.x = rjx;
            rj.y = rjy;

            this.rixn = rixn;
            this.rjxn = rjxn;

            this.lambda = 0;
            this.calculateB(dt);
            this.calculateC();
        };


        Contact.prototype.calculateB = function(dt) {
            var bi = this.bi,
                bj = this.bj,

                n = this.n,
                nx = n.x,
                ny = n.y,

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

                e = 1 + this.e,

                Gq = this.s,

                GWx = vj.x + (-wj * rjy) - vi.x - (-wi * riy),
                GWy = vj.y + (wj * rjx) - vi.y - (wi * rix),
                GW = e * GWx * nx + e * GWy * ny,

                GiMfx = fj.x * invMj + (-tj * invIj * rjy) - fi.x * invMi - (-ti * invIi * riy),
                GiMfy = fj.y * invMj + (tj * invIj * rjx) - fi.y * invMi - (ti * invIi * rix),
                GiMf = GiMfx * nx + GiMfy * ny;

            this.B = -this.a * Gq - this.b * GW - dt * GiMf;
        };


        Contact.prototype.calculateC = function() {
            var bi = this.bi,
                bj = this.bj,

                rixn = this.rixn,
                rjxn = this.rjxn,

                invIi = bi.invInertia || 0,
                invIj = bj.invInertia || 0,

                C = bi.invMass + bj.invMass + this.eps + invIi * rixn * rixn + invIj * rjxn * rjxn;

            this.invC = C === 0 ? 0 : 1 / C;
        };


        Contact.prototype.calculateGWlambda = function() {
            var bi = this.bi,
                bj = this.bj,

                n = this.n,

                vlambdai = bi.vlambda,
                wlambdai = bi.wlambda || 0,
                vlambdaj = bj.vlambda,
                wlambdaj = bj.wlambda || 0,

                ulambdax = vlambdaj.x - vlambdai.x,
                ulambday = vlambdaj.y - vlambdai.y,

                GWlambda = ulambdax * n.x + ulambday * n.y;

            if (wlambdai !== undefined) GWlambda -= wlambdai * this.rixn;
            if (wlambdaj !== undefined) GWlambda += wlambdaj * this.rjxn;

            return GWlambda;
        };


        Contact.prototype.addToLambda = function(deltaLambda) {
            var bi = this.bi,
                bj = this.bj,

                n = this.n,
                nx = n.x,
                ny = n.y,

                invMi = bi.invMass,
                vlambdai = bi.vlambda,
                invMj = bj.invMass,
                vlambdaj = bj.vlambda;

            vlambdai.x -= deltaLambda * invMi * nx;
            vlambdai.y -= deltaLambda * invMi * ny;

            vlambdaj.x += deltaLambda * invMj * nx;
            vlambdaj.y += deltaLambda * invMj * ny;

            if (bi.wlambda !== undefined) bi.wlambda -= deltaLambda * bi.invInertia * this.rixn;
            if (bj.wlambda !== undefined) bj.wlambda += deltaLambda * bj.invInertia * this.rjxn;
        };


        return Contact;
    }
);
