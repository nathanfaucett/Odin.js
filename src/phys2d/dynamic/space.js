if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/class",
        "base/object_pool",
        "math/vec2",
        "phys2d/dynamic/particle",
        "phys2d/collision/broadphase",
        "phys2d/collision/nearphase",
        "phys2d/solver/solver",
        "phys2d/solver/friction"
    ],
    function(Class, ObjectPool, Vec2, Particle, Broadphase, Nearphase, Solver, Friction) {
        "use strict";


        if (!Date.now) {
            Date.now = function now() {

                return new Date().getTime();
            };
        }

        var DYNAMIC = Particle.DYNAMIC,
            START_MS = Date.now(),
            now = function() {
                var w = typeof window !== "undefined" ? window : {},
                    performance = typeof w.performance !== "undefined" ? w.performance : {};

                performance.now = (
                    performance.now ||
                    performance.webkitNow ||
                    performance.mozNow ||
                    performance.msNow ||
                    performance.oNow ||
                    function() {
                        return Date.now() - START_MS;
                    }
                );

                return function() {

                    return performance.now();
                }
            }(),
            frictionPool = new ObjectPool(Friction);


        function createFriction(c, frictions) {
            var bi = c.bi,
                bj = c.bj,
                fc = frictionPool.create(),
                u = c.u,
                slipForce = u * c.lambda,
                cp = c.p,
                cn = c.n,
                fcp, fct;

            fc.minForce = -slipForce;
            fc.maxForce = slipForce;

            fc.bi = bi;
            fc.bj = bj;

            fcp = fc.p;
            fcp.x = cp.x;
            fcp.y = cp.y;

            fct = fc.t;
            fct.x = cn.y;
            fct.y = -cn.x;

            fc.minForce = -slipForce;
            fc.maxForce = slipForce;

            frictions.push(fc);
        }


        /**
         * @class Phys2D.Space
         * @extends Class
         * @brief body holder
         */
        function Space() {

            Class.call(this);

            /**
             * @property Vec2 gravity
             * @memberof Phys2D.Space
             */
            this.gravity = new Vec2(0, -9.801);

            /**
             * @property Number time
             * @memberof Phys2D.Space
             */
            this.time = 0;

            /**
             * @property Object stats
             * @memberof Phys2D.Space
             */
            this.stats = {
                step: 0,
                solve: 0,
                integrate: 0,
                nearphase: 0,
                broadphase: 0
            };

            /**
             * @property Phys2D.Broadphase broadphase
             * @memberof Phys2D.Space
             */
            this.broadphase = new Broadphase;

            /**
             * @property Phys2D.Nearphase nearphase
             * @memberof Phys2D.Space
             */
            this.nearphase = new Nearphase;

            /**
             * @property Phys2D.Solver solver
             * @memberof Phys2D.Space
             */
            this.solver = new Solver;

            /**
             * @property Array bodies
             * @memberof Phys2D.Space
             */
            this.bodies = [];
            this._bodyHash = {};

            this._pairsi = [];
            this._pairsj = [];

            this._contacts = [];
            this._frictions = [];
        }

        Class.extend(Space, Class);

        /**
         * @method findBodyByPoint
         * @memberof Phys2D.Space
         * @param Vec2 point
         */
        Space.prototype.findBodyByPoint = function(p) {
            var bodies = this.bodies,
                body, shapes, shape,
                bodyOut = undefined,
                i, j;

            for (i = bodies.length; i--;) {
                body = bodies[i];
                if (!body) continue;

                shapes = body.shapes;

                for (j = shapes.length; j--;) {
                    shape = shapes[j];
                    if (!shape) continue;

                    if (shape.pointQuery(p)) {
                        bodyOut = body;
                        break;
                    }
                }
            }

            return bodyOut;
        };

        /**
         * @method getBodyById
         * @memberof Phys2D.Space
         * @param Number id
         */
        Space.prototype.getBodyById = function(id) {

            return this._bodyHash[id];
        };

        /**
         * @method addBody
         * @memberof Phys2D.Space
         * @param Phys2D.Body body
         * @return this
         */
        Space.prototype.addBody = function(body) {
            if (!body) {
                console.log("Phys2D.Space.addBody: passed argumenet is not a valid body");
                return this;
            }
            var bodies = this.bodies,
                index = bodies.indexOf(body);

            if (index < 0) {
                if (body.space) body.space.removeBody(body);

                body.space = this;

                bodies.push(body);
                this._bodyHash[body._id] = body;

                body.init();
            } else {
                console.log("Phys2D.Space.addBody: body is already a member of this");
            }

            return this;
        };

        /**
         * @method removeBody
         * @memberof Phys2D.Space
         * @param Phys2D.Body body
         */
        Space.prototype.removeBody = function(body) {
            var bodies = this.bodies,
                index = bodies.indexOf(body);

            if (index > -1) {
                body.space = undefined;

                bodies.splice(index, 1);
                delete this._bodyHash[body._id];
            } else {
                console.log("Phys2D.Space.removeBody: body is not a member of this");
            }
        };

        /**
         * @method step
         * @memberof Phys2D.Space
         * @param Number dt
         */
        Space.prototype.step = function(dt) {
            var stepStart = now(),
                stats = this.stats,
                start,
                g = this.gravity,
                gx = g.x,
                gy = g.y,
                bodies = this.bodies,
                numBodies = bodies.length,
                pairsi = this._pairsi,
                pairsj = this._pairsj,
                contacts = this._contacts,
                solver = this.solver,
                frictions = this._frictions,
                body, force, mass, time, c,
                i;

            time = this.time += dt;

            start = now();
            for (i = numBodies; i--;) {
                body = bodies[i];
                if (body.motionState > DYNAMIC) continue;

                force = body.force;
                mass = body.mass;
                force.x += gx * mass;
                force.y += gy * mass;
            }
            stats.integrate = now() - start;

            start = now();
            this.broadphase.collisions(bodies, pairsi, pairsj);
            stats.broadphase = now() - start;

            start = now();
            this.nearphase.collisions(pairsi, pairsj, contacts);
            stats.nearphase = now() - start;

            start = now();
            solver.solve(dt, contacts);

            frictionPool.clear();
            frictions.length = 0;

            for (i = contacts.length; i--;) {
                c = contacts[i];

                if (c.u > 0) createFriction(c, frictions);
            }

            solver.solve(dt, frictions);
            stats.solve = now() - start;

            start = now();
            for (i = numBodies; i--;) bodies[i].update(dt);
            stats.integrate += now() - start;

            stats.step = now() - stepStart;
        };


        return Space;
    }
);
