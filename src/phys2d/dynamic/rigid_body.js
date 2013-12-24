if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/class",
        "math/vec2",
        "math/aabb2",
        "math/mat32",
        "phys2d/dynamic/particle",
        "phys2d/collision/shape",
        "phys2d/collision/circle",
        "phys2d/collision/segment",
        "phys2d/collision/convex"
    ],
    function(Class, Vec2, AABB2, Mat32, Particle, Shape, Circle, Segment, Convex) {
        "use strict";


        var OBJECT = {},
            RIGIDBODY = Particle.RIGIDBODY,
            DYNAMIC = Particle.DYNAMIC,
            STATIC = Particle.STATIC,
            AWAKE = Particle.AWAKE,
            SLEEPING = Particle.SLEEPING,
            pow = Math.pow,
			
			TYPES = {};
		
		TYPES[Shape.CIRCLE] = Circle;
		TYPES[Shape.SEGMENT] = Segment;
		TYPES[Shape.CONVEX] = Convex;
		
        /**
         * @class Phys2D.Rigidbody
         * @extends Phys2D.Particle
         * @brief rigid body class
         * @param Object options
         */
        function Rigidbody(opts) {
            opts || (opts = {});

            Particle.call(this, opts);

            this._type = RIGIDBODY;

            /**
             * @property Mat32 matrix
             * @memberof Phys2D.Rigidbody
             */
            this.matrix = new Mat32;

            /**
             * @property Number rotation
             * @memberof Phys2D.Rigidbody
             */
            this.rotation = opts.rotation !== undefined ? opts.rotation : 0;

            /**
             * @property Number angularVelocity
             * @memberof Phys2D.Rigidbody
             */
            this.angularVelocity = opts.angularVelocity !== undefined ? opts.angularVelocity : 0;

            /**
             * @property Number torque
             * @memberof Phys2D.Rigidbody
             */
            this.torque = 0;

            /**
             * @property Number angularDamping
             * @memberof Phys2D.Rigidbody
             */
            this.angularDamping = opts.angularDamping !== undefined ? opts.angularDamping : 0;

            /**
             * @property Number inertia
             * @memberof Phys2D.Rigidbody
             */
            this.inertia = 0;
            this.invInertia = 0;

            /**
             * @property Array shapes
             * @memberof Phys2D.Rigidbody
             */
            this.shapes = [];
            this._shapeHash = {};

            /**
             * @property AABB2 aabb
             * @memberof Phys2D.Rigidbody
             */
            this.aabb = new AABB2;

            this.wlambda = 0;
			
            if (opts.shapes) {
                var shapes = opts.shapes,
                    i;

                for (i = shapes.length; i--;) this.addShape(shapes[i]);
            }
        }

        Class.extend(Rigidbody, Particle);


        Rigidbody.prototype.copy = function(other) {
            var shapes = other.shapes,
                i;

            this.motionState = other.motionState;
            this.linearDamping = other.linearDamping;
            this.angularDamping = other.angularDamping;

            this.position.copy(other.position);
            this.velocity.copy(other.velocity);
            this.force.copy(other.force);

            this.rotation = other.rotation;
            this.angularVelocity = other.angularVelocity;
            this.torque = other.torque;

            for (i = shapes.length; i--;) this.addShape(shapes[i].clone());

            if (other.space) other.space.addBody(this);

            return this;
        };

        /**
         * @method init
         * @memberof Phys2D.Rigidbody
         */
        Rigidbody.prototype.init = function() {
            var shapes = this.shapes,
                shape,
                aabb = this.aabb,
                matrix = this.matrix,
                i;

            matrix.setRotation(this.rotation);
            matrix.setPosition(this.position);

            for (i = shapes.length; i--;) {
                shape = shapes[i]

                shape.update(matrix);
                aabb.union(shape.aabb);
            }

            this.resetMassData();
        };

        /**
         * @method update
         * @memberof Phys2D.Rigidbody
         * @param Number dt
         */
        Rigidbody.prototype.update = function(dt) {
            if (this.motionState === STATIC) return;

            var shapes = this.shapes,
                shape,
                force = this.force,
                invM = this.invMass,
                pos = this.position,
                vel = this.velocity,
                linearDamping = pow(1 - this.linearDamping, dt),
                matrix = this.matrix,
                aabb = this.aabb,
                i;

            vel.x += force.x * invM * dt;
            vel.y += force.y * invM * dt;
            this.angularVelocity += this.torque * this.invInertia * dt;

            force.x = force.y = this.torque = 0;

            vel.x *= linearDamping;
            vel.y *= linearDamping;

            this.angularVelocity *= pow(1 - this.angularDamping, dt);

            if (this.sleepState < SLEEPING) {

                pos.x += vel.x * dt;
                pos.y += vel.y * dt;

                this.rotation += this.angularVelocity * dt;

                matrix.setRotation(this.rotation);
                matrix.setPosition(pos);

                for (i = shapes.length; i--;) {
                    shape = shapes[i];
                    shape.update(matrix);
                    aabb.union(shape.aabb);
                }
            }
        };

        /**
         * @method applyForce
         * @memberof Phys2D.Rigidbody
         * @param Vec2 force
         * @param Vec2 worldPoint
         */
        Rigidbody.prototype.applyForce = function(force, worldPoint) {
            if (this.motionState === STATIC) return;
            var pos = this.position,
                f = this.force,
                fx = force.x,
                fy = force.y,
                px, py;

            worldPoint = worldPoint || pos;

            if (this.sleepState > AWAKE) this.wake();

            px = worldPoint.x - pos.x;
            py = worldPoint.y - pos.y;

            f.x += fx;
            f.y += fy;

            this.torque += px * fy - py * fx;
        };

        /**
         * @method applyTorque
         * @memberof Phys2D.Rigidbody
         * @param Number torque
         */
        Rigidbody.prototype.applyTorque = function(torque) {
            if (this.motionState === STATIC) return;
            if (this.sleepState > AWAKE) this.wake();

            this.torque += torque;
        };

        /**
         * @method applyImpulse
         * @memberof Phys2D.Rigidbody
         * @param Vec2 impulse
         * @param Vec2 worldPoint
         */
        Rigidbody.prototype.applyImpulse = function(impulse, worldPoint) {
            if (this.motionState === STATIC) return;
            var pos = this.position,
                invMass = this.invMass,
                vel = this.velocity,
                ix = impulse.x,
                iy = impulse.y,
                px, py;

            worldPoint = worldPoint || pos;

            if (this.sleepState > AWAKE) this.wake();

            px = worldPoint.x - pos.x;
            py = worldPoint.y - pos.y;

            vel.x += ix * invMass;
            vel.y += iy * invMass;

            this.angularVelocity += (px * iy - py * ix) * this.invInertia;
        };

        /**
         * @method resetMassData
         * @memberof Phys2D.Rigidbody
         */
        Rigidbody.prototype.resetMassData = function() {
            var centroid = new Vec2;

            return function() {
                if (this.motionState > DYNAMIC) return;
                var shapes = this.shapes,
                    shape,
                    totalMass = 0,
                    totalInertia = 0,
                    mass = 0,
                    invMass = 0,
                    tcx = 0,
                    tcy = 0,
                    cx = 0,
                    cy = 0,
                    i;

                for (i = shapes.length; i--;) {
                    shape = shapes[i];

                    shape.centroid(centroid);

                    mass = shape.area() * shape.density;

                    tcx += centroid.x * mass;
                    tcy += centroid.y * mass;

                    totalMass += mass;
                    totalInertia += shape.inertia(mass);
                }
                invMass = totalMass > 0 ? 1 / totalMass : 0;
                cx = tcx * invMass;
                cy = tcy * invMass;

                this.setMass(totalMass);
                this.setInertia(totalInertia - totalMass * (cx * cx + cy * cy));
            };
        }();

        /**
         * @method setMotionState
         * @memberof Phys2D.Rigidbody
         * @param Number motionState
         */
        Rigidbody.prototype.setMotionState = function(motionState) {
            if (this.motionState === motionState) return;

            this.motionState = motionState;

            this.velocity.set(0, 0);
            this.force.set(0, 0);
            this.angularVelocity = this.torque = 0;

            this.wake();
        };

        /**
         * @method setInertia
         * @memberof Phys2D.Rigidbody
         * @param Number inertia
         */
        Rigidbody.prototype.setInertia = function(inertia) {

            this.inertia = inertia;
            this.invInertia = inertia > 0 ? 1 / inertia : 0;
        };

        /**
         * @method addShape
         * @memberof Phys2D.Rigidbody
         * @param Phys2D.Shape shape
         */
        Rigidbody.prototype.addShape = function(shape) {
            var shapes = this.shapes,
                index = shapes.indexOf(shape);

            if (index < 0) {
                shape.body = this;

                shapes.push(shape);
                this._shapeHash[shape._id] = shape;

                if (this.space) {
                    shape.update(this.matrix);
                    this.resetMassData();
                }
            }
        };

        /**
         * @method removeShape
         * @memberof Phys2D.Rigidbody
         * @param Phys2D.Shape shape
         */
        Rigidbody.prototype.removeShape = function(shape) {
            var shapes = this.shapes,
                index = shapes.indexOf(shape);

            if (index > -1) {
                shape.body = undefined;

                shapes.splice(index, 1);
                delete this._shapeHash[shape._id];

                if (this.space) this.resetMassData();
            }
        };


        Rigidbody.prototype.toJSON = function(json) {
            json || (json = {});
            Particle.prototype.toJSON.call(this, json);
			var shapes = this.shapes,
				jsonShapes = json.shapes || (json.shapes = []),
				i;
			
			json.matrix = this.matrix.toJSON(json.matrix);
			
            json.rotation = this.rotation;
            json.angularVelocity = this.angularVelocity;

            json.torque = this.torque;
            json.angularDamping = this.angularDamping;

            json.inertia = this.inertia;
            json.invInertia = this.invInertia;
			
            json.aabb = this.aabb.toJSON(json.aabb);
            json.wlambda = this.wlambda;
			
			for (i = shapes.length; i--;) jsonShapes[i] = shapes[i].toJSON(jsonShapes[i]);
			
            return json;
        };


        Rigidbody.prototype.fromJSON = function(json) {
            Particle.prototype.fromJSON.call(this, json);
			var shapes = this.shapes,
				jsonShapes = json.shapes || (json.shapes = []),
				type,
				i;
			
			this.matrix.fromJSON(json.matrix);
			
            this.rotation = json.rotation;
            this.angularVelocity = json.angularVelocity;

            this.torque = json.torque;
            this.angularDamping = json.angularDamping;

            this.inertia = json.inertia;
            this.invInertia = json.invInertia;
			
            this.aabb.fromJSON(json.aabb);
            this.wlambda = json.wlambda;
			
			for (i = jsonShapes.length; i--;) {
				type = TYPES[jsonShapes[i]._type];
				
				if (type) shapes[i] = new type().fromJSON(jsonShapes[i]);
			}
			
            return this;
        };


        return Rigidbody;
    }
);
