if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/base/time",
        "odin/base/object_pool",
        "odin/math/vec2",
        "odin/phys2d/p2enums",
        "odin/phys2d/p2solver",
        "odin/phys2d/collision/p2broadphase",
        "odin/phys2d/collision/p2nearphase",
        "odin/phys2d/constraints/p2friction",
        "odin/core/game/log"
    ],
    function(Class, Time, ObjectPool, Vec2, P2Enums, P2Solver, P2Broadphase, P2Nearphase, P2Friction, Log) {
        "use strict";


        var now = Time.now,
            pow = Math.pow,
            MotionState = P2Enums.MotionState,

            FRICTION_POOL = new ObjectPool(P2Friction);


        function P2Space(opts) {
            opts || (opts = {});

            Class.call(this, opts);

            this.useGravity = opts.useGravity != undefined ? !! opts.useGravity : true;
            this.gravity = opts.gravity != undefined ? opts.gravity : new Vec2(0, -9.801);

            this.time = 0;

            this.broadphase = new P2Broadphase;
            this.nearphase = new P2Nearphase;

            this.solver = new P2Solver;

            this.bodies = [];
            this._bodyHash = {};

            this._pairsi = [];
            this._pairsj = [];

            this.contacts = [];
            this.frictions = [];

            this._collisionMatrix = [];
            this._collisionMatrixPrevious = [];

            this.stats = {
                step: 0,
                solve: 0,
                integrate: 0,
                nearphase: 0,
                broadphase: 0
            };
        }

        Class.extend(P2Space);


        P2Space.FRICTION_POOL = FRICTION_POOL;


        P2Space.prototype.collisionMatrixGet = function(i, j, current) {
            var tmp = j;

            if (j > i) {
                j = i;
                i = tmp;
            }
            i = (i * (i + 1) >> 1) + j - 1;

            return (current === undefined || current) ? this._collisionMatrix[i] : this._collisionMatrixPrevious[i];
        };


        P2Space.prototype.collisionMatrixSet = function(i, j, value, current) {
            var tmp = j;

            if (j > i) {
                j = i;
                i = tmp;
            }

            i = (i * (i + 1) >> 1) + j - 1;

            if (current === undefined || current) {
                this._collisionMatrix[i] = value;
            } else {
                this._collisionMatrixPrevious[i] = value;
            }
        };


        P2Space.prototype.collisionMatrixTick = function() {
            var collisionMatrix = this._collisionMatrixPrevious,
                i;

            this._collisionMatrixPrevious = this._collisionMatrix;
            this._collisionMatrix = collisionMatrix;

            for (i = collisionMatrix.length; i--;) collisionMatrix[i] = 0;
        };


        P2Space.prototype.addBody = function(body) {
            var bodies = this.bodies,
                index = bodies.indexOf(body);

            if (index === -1) {
                bodies.push(body);
                this._bodyHash[body._id] = body;

                body.space = this;
                body._index = bodies.length - 1;

                body.init();
            } else {
                Log.error("P2Space.addBody: Body already member of P2Space");
            }

            return this;
        };


        P2Space.prototype.add = function() {

            for (var i = arguments.length; i--;) this.addBody(arguments[i]);
            return this;
        };


        P2Space.prototype.removeBody = function(body) {
            var bodies = this.bodies,
                index = bodies.indexOf(body);

            if (index !== -1) {
                body.space = undefined;
                body._index = -1;

                bodies.splice(index, 1);
                this._bodyHash[body._id] = undefined;
            } else {
                Log.error("P2Space.addBody: Body not member of P2Space");
            }

            return this;
        };


        P2Space.prototype.remove = function() {

            for (var i = arguments.length; i--;) this.removeBody(arguments[i]);
            return this;
        };


        P2Space.prototype.findBodyByPoint = function(p) {
            var bodies = this.bodies,
                body, shapes, shape,
                i, j;

            for (i = bodies.length; i--;) {
                body = bodies[i];
                if (!body) continue;

                shapes = body.shapes;
                for (j = shapes.length; j--;) {
                    shape = shapes[j];
                    if (!shape) continue;

                    if (shape.pointQuery(p)) return body;
                }
            }

            return undefined;
        };


        P2Space.prototype.findBodyById = function(id) {

            return this._bodyHash[id];
        };


        P2Space.prototype.step = function(dt) {
            var stepStart = now(),
                stats = this.stats,
                g = this.gravity,
                gx = g.x,
                gy = g.y,
                bodies = this.bodies,
                numBodies = bodies.length,
                pairsi = this._pairsi,
                pairsj = this._pairsj,
                contacts = this.contacts,
                frictions = this.frictions,
                time, start, body, force, mass,
                bi, bj, c, cp, cn, u, slipForce, fc, fcp, fct,
                i;

            time = this.time += dt;

            if (this.useGravity) {
                for (i = numBodies; i--;) {
                    body = bodies[i];

                    if (body.motionState === MotionState.Dynamic) {
                        force = body.force;
                        mass = body.mass;

                        force.x += gx * mass;
                        force.y += gy * mass;
                    }
                }
            }

            this.collisionMatrixTick();

            start = now();
            this.broadphase.collisions(bodies, pairsi, pairsj);
            stats.broadphase = now() - start;

            start = now();
            this.nearphase.collisions(pairsi, pairsj, contacts);
            stats.nearphase = now() - start;

            start = now();
            this.solver.solve(dt, contacts);

            FRICTION_POOL.clear();
            frictions.length = 0;

            for (i = contacts.length; i--;) {
                c = contacts[i];

                if (c.u > 0) {
                    bi = c.bi;
                    bj = c.bj;
                    fc = FRICTION_POOL.create();
                    u = c.u;

                    slipForce = u * c.lambda;
                    fc.minForce = -slipForce;
                    fc.maxForce = slipForce;

                    fc.bi = bi;
                    fc.bj = bj;

                    cp = c.p;
                    fcp = fc.p;

                    fcp.x = cp.x;
                    fcp.y = cp.y;

                    cn = c.n;
                    fct = fc.t;

                    fct.x = -cn.y;
                    fct.y = cn.x;

                    frictions.push(fc);
                }
            }

            this.solver.solve(dt, frictions);
            stats.solve = now() - start;

            start = now();
            for (i = numBodies; i--;) {
                body = bodies[i];

                body.update(dt);
                //body.sleepTick(time);
            }
            stats.integrate = now() - start;

            stats.step = now() - stepStart;
        };


        P2Space.prototype.toJSON = function(json) {
            json = Class.prototype.toJSON.call(this, json);

            json.useGravity = this.useGravity;
            json.gravity = this.gravity.toJSON(json.gravity);

            return json;
        };


        P2Space.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);

            this.useGravity = json.useGravity;
            this.gravity.fromJSON(json.gravity);

            return this;
        };


        return P2Space;
    }
);
