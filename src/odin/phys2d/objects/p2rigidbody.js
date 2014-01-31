if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/math/aabb2",
        "odin/math/vec2",
        "odin/math/mat32",
        "odin/core/game/log",
        "odin/phys2d/p2enums",
        "odin/phys2d/objects/p2particle"
    ],
    function(Class, AABB2, Vec2, Mat32, Log, P2Enums, P2Particle) {
        "use strict";


        var TWO_PI = Math.PI * 2,
            pow = Math.pow,

            BodyType = P2Enums.BodyType,
            MotionState = P2Enums.MotionState,
            SleepState = P2Enums.SleepState;


        function P2Rigidbody(opts) {
            opts || (opts = {});

            P2Particle.call(this, opts);

            this.type = BodyType.RigidBody;

            this.rotation = opts.rotation != undefined ? opts.rotation : 0;
            this.angularVelocity = opts.angularVelocity != undefined ? opts.angularVelocity : 0;
            this.torque = 0;

            this.angularDamping = opts.angularDamping != undefined ? opts.angularDamping : TWO_PI * 0.01;

            this.matrix = new Mat32();

            this.inertia = 0;
            this.invInertia = 0;

            this.shapes = [];
            this._shapeHash = {};

            this.aabb = new AABB2;

            this.sleepAngularVelocityLimit = opts.sleepAngularVelocityLimit !== undefined ? !! opts.sleepAngularVelocityLimit : TWO_PI * 0.01;

            this.wlambda = 0;

            if (opts.shape) this.addShape(opts.shape);
            if (opts.shapes) this.addShapes.apply(this, opts.shapes);
        }

        P2Particle.extend(P2Rigidbody);


        P2Rigidbody.prototype.copy = function(other) {
            P2Particle.prototype.copy.call(this, other);
            var shapes = other.shapes,
                i;

            this.rotation = other.rotation;
            this.angularVelocity = other.angularVelocity;
            this.torque = other.torque;

            this.angularDamping = other.angularDamping;

            for (i = shapes.length; i--;) this.addShape(shapes[i].clone());

            return this;
        };


        P2Rigidbody.prototype.init = function() {
            var shapes = this.shapes,
                matrix = this.matrix,
                aabb = this.aabb,
                shape,
                i;

            matrix.setRotation(this.rotation);
            matrix.setPosition(this.position);

            aabb.clear();

            for (i = shapes.length; i--;) {
                shape = shapes[i];
                shape.update(matrix);
                aabb.union(shape.aabb);
            }

            this.resetMassData();
        };


        P2Rigidbody.prototype.update = function(dt) {
            if (this.motionState === MotionState.Static) return;
            var shapes = this.shapes,
                force = this.force,
                invMass = this.invMass,
                pos = this.position,
                vel = this.velocity,
                linearDamping = pow(1 - this.linearDamping, dt),
                matrix = this.matrix,
                aabb = this.aabb,
                shape,
                i;

            vel.x += force.x * invMass * dt;
            vel.y += force.y * invMass * dt;
            this.angularVelocity += this.torque * this.invInertia * dt;

            force.x = force.y = this.torque = 0;

            vel.x *= linearDamping;
            vel.y *= linearDamping;

            this.angularVelocity *= pow(1 - this.angularDamping, dt);

            if (this.sleepState !== SleepState.Sleeping) {

                pos.x += vel.x * dt;
                pos.y += vel.y * dt;

                this.rotation += this.angularVelocity * dt;

                matrix.setRotation(this.rotation);
                matrix.setPosition(pos);

                aabb.clear();

                for (i = shapes.length; i--;) {
                    shape = shapes[i];
                    shape.update(matrix);
                    aabb.union(shape.aabb);
                }
            }
        };


        P2Rigidbody.prototype.applyForce = function(force, worldPoint) {
            if (this.motionState === MotionState.Static) return;
            if (this.sleepState === SleepState.Sleeping) this.wake();
            var pos = this.position,
                f = this.force,
                fx = force.x,
                fy = force.y,
                px, py;

            worldPoint = worldPoint || pos;


            px = worldPoint.x - pos.x;
            py = worldPoint.y - pos.y;

            f.x += fx;
            f.y += fy;

            this.torque += px * fy - py * fx;
        };


        P2Rigidbody.prototype.applyTorque = function(torque) {
            if (this.motionState === MotionState.Static) return;
            if (this.sleepState === SleepState.Sleeping) this.wake();

            this.torque += torque;
        };


        P2Rigidbody.prototype.applyImpulse = function(impulse, worldPoint) {
            if (this.motionState === MotionState.Static) return;
            if (this.sleepState === SleepState.Sleeping) this.wake();
            var pos = this.position,
                invMass = this.invMass,
                velocity = this.velocity,
                ix = impulse.x,
                iy = impulse.y,
                px, py;

            worldPoint = worldPoint || pos;

            px = worldPoint.x - pos.x;
            py = worldPoint.y - pos.y;

            velocity.x += ix * invMass;
            velocity.y += iy * invMass;

            this.angularVelocity += (px * iy - py * ix) * this.invInertia;
        };


        P2Rigidbody.prototype.applyVelocity = function(velocity) {
            if (this.motionState === MotionState.Static) return;
            if (this.sleepState === SleepState.Sleeping) this.wake();
            var vel = this.velocity;

            vel.x += velocity.x;
            vel.y += velocity.y;
        };


        P2Rigidbody.prototype.applyAngularVelocity = function(angularVelocity) {
            if (this.motionState === MotionState.Static) return;
            if (this.sleepState === SleepState.Sleeping) this.wake();

            this.angularVelocity += angularVelocity;
        };


        var totalCentroid = new Vec2,
            centroid = new Vec2;
        P2Rigidbody.prototype.resetMassData = function() {
            var shapes = this.shapes,
                shape,
                totalMass = 0,
                totalInertia = 0,
                mass, inertia,
                i;

            if (this.motionState !== MotionState.Dynamic) return;

            totalCentroid.x = totalCentroid.y = 0;

            for (i = shapes.length; i--;) {
                shape = shapes[i];

                shape.centroid(centroid);
                mass = shape.area() * shape.density;
                inertia = shape.inertia(mass);

                totalCentroid.add(centroid.smul(mass));
                totalMass += mass;
                totalInertia += inertia;
            }

            centroid.copy(totalCentroid.sdiv(totalMass));

            this.setMass(totalMass);
            this.setInertia(totalInertia - totalMass * centroid.lengthSq());
        };


        P2Rigidbody.prototype.setMotionState = function(motionState) {
            if (this.motionState === motionState) return;

            this.motionState = motionState;

            this.velocity.set(0, 0);
            this.force.set(0, 0);
            this.angularVelocity = this.torque = 0;

            this.wake();
        };


        P2Rigidbody.prototype.setInertia = function(inertia) {

            this.inertia = inertia;
            this.invInertia = inertia > 0 ? 1 / inertia : 0;
        };


        P2Rigidbody.prototype.addShape = function(shape) {
            var shapes = this.shapes,
                index = shapes.indexOf(shape);

            if (index === -1) {
                shape.body = this;

                shapes.push(shape);
                this._shapeHash[shape._id] = shape;

                if (this.space) {
                    shape.update(this.matrix);
                    this.resetMassData();
                }
            } else {
                Log.error("P2Rigidbody.addShape: Shape already attached to Body");
            }

            return this;
        };


        P2Rigidbody.prototype.addShapes = function() {

            for (var i = arguments.length; i--;) this.addShape(arguments[i]);
            return this;
        };


        P2Rigidbody.prototype.removeShape = function(shape) {
            var shapes = this.shapes,
                index = shapes.indexOf(shape);

            if (index !== -1) {
                shape.body = undefined;

                shapes.splice(index, 1);
                this._shapeHash[shape._id] = undefined;

                if (this.space) this.resetMassData();
            } else {
                Log.error("P2Rigidbody.removeShape: Shape not attached to Body");
            }

            return this;
        };


        P2Rigidbody.prototype.removeShapes = function() {

            for (var i = arguments.length; i--;) this.removeShape(arguments[i]);
            return this;
        };


        P2Rigidbody.prototype.forEachShape = function(fn, ctx) {
            var shapes = this.shapes,
                i;

            if (ctx) {
                for (i = shapes.length; i--;)
                    if (fn.call(ctx, shapes[i], i, shapes) === false) break;
            } else {
                for (i = shapes.length; i--;)
                    if (fn(shapes[i], i, shapes) === false) break;
            }

            return this;
        };


        P2Rigidbody.prototype.sleepTick = function(time) {

            if (this.allowSleep) {
                var sleepState = this.sleepState,
                    velSq = this.velocity.lengthSq(),
                    sleepVelocityLimit = this.sleepVelocityLimit * this.sleepVelocityLimit,
                    aVel = this.angularVelocity,
                    sleepAngularVelocityLimit = this.sleepAngularVelocityLimit;

                if (sleepState === SleepState.Awake && (velSq < sleepVelocityLimit && aVel < sleepAngularVelocityLimit)) {
                    this.sleepState = SleepState.Sleepy;
                    this._sleepTime = time;
                } else if (sleepState === SleepState.Sleepy && (velSq > sleepVelocityLimit || aVel > sleepAngularVelocityLimit)) {
                    this.wake();
                } else if (sleepState === SleepState.Sleepy && (time - this._lastSleepyTime) > this.sleepTimeLimit) {
                    this.sleep();
                }
            }
        };


        P2Rigidbody.prototype.toJSON = function(json) {
            json = P2Particle.prototype.toJSON.call(this, json);
            var shapes = this.shapes,
                jsonShapes = json.shapes || (json.shapes = []),
                i;

            json.rotation = this.rotation;
            json.angularVelocity = this.angularVelocity;
            json.torque = this.torque;

            json.angularDamping = this.angularDamping;

            for (i = shapes.length; i--;) jsonShapes[i] = shapes[i].toJSON(jsonShapes[i]);

            return json;
        };


        P2Rigidbody.prototype.fromJSON = function(json) {
            P2Particle.prototype.fromJSON.call(this, json);
            var jsonShapes = json.shapes || (json.shapes = []),
                i;

            this.rotation = json.rotation;
            this.angularVelocity = json.angularVelocity;
            this.torque = json.torque;

            this.angularDamping = json.angularDamping;

            for (i = jsonShapes.length; i--;) this.addShape(Class.fromJSON(jsonShapes[i]));

            return this;
        };


        return P2Rigidbody;
    }
);
