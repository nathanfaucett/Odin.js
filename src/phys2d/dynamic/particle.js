if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/class",
        "math/vec2"
    ],
    function(Class, Vec2) {
        "use strict";


        var OBJECT = {},
            DYNAMIC, STATIC, KINEMATIC,
            AWAKE, SLEEPING,
            PARTICLE;

        /**
         * @class Phys2D.Particle
         * @extends Class
         * @brief base class for bodies
         * @param Object options
         */
        function Particle(opts) {
            opts || (opts = {});

            Class.call(this);

            this._index = -1;
            this._type = PARTICLE;

            /**
             * @property Phys2D.Space space
             * @memberof Phys2D.Particle
             */
            this.space = undefined;

            /**
             * @property Vec2 position
             * @memberof Phys2D.Particle
             */
            this.position = opts.position !== undefined ? opts.position : new Vec2;

            /**
             * @property Vec2 velocity
             * @memberof Phys2D.Particle
             */
            this.velocity = opts.velocity !== undefined ? opts.velocity : new Vec2;

            /**
             * @property Vec2 force
             * @memberof Phys2D.Particle
             */
            this.force = new Vec2;

            /**
             * @property Number linearDamping
             * @memberof Phys2D.Particle
             */
            this.linearDamping = opts.linearDamping !== undefined ? opts.linearDamping : 0;

            /**
             * @property Number motionState
             * @memberof Phys2D.Particle
             */
            this.motionState = opts.motionState !== undefined ? opts.motionState : DYNAMIC;

            /**
             * @property Boolean allowSleep
             * @memberof Phys2D.Particle
             */
            this.allowSleep = opts.allowSleep !== undefined ? opts.allowSleep : true;

            /**
             * @property Number sleepState
             * @memberof Phys2D.Particle
             */
            this.sleepState = AWAKE;

            /**
             * @property Number mass
             * @memberof Phys2D.Particle
             */
            this.mass = opts.mass !== undefined ? opts.mass : 0;
            this.invMass = this.mass > 0 ? 1 / this.mass : 0;

            this.vlambda = new Vec2;
        }

        Class.extend(Particle, Class);


        Particle.prototype.copy = function(other) {

            this.motionState = other.motionState;
            this.linearDamping = other.linearDamping;
            this.angularDamping = other.angularDamping;

            this.position.copy(other.position);
            this.velocity.copy(other.velocity);
            this.force.copy(other.force);

            return this;
        };

        /**
         * @method init
         * @memberof Phys2D.Particle
         */
        Particle.prototype.init = function() {

        };

        /**
         * @method update
         * @memberof Phys2D.Particle
         * @param Number dt
         */
        Particle.prototype.update = function(dt) {
            if (this.motionState === STATIC) return;

            var force = this.force,
                invM = this.invMass,
                pos = this.position,
                vel = this.velocity,
                linearDamping = pow(1 - this.linearDamping, dt);

            vel.x += force.x * invM * dt;
            vel.y += force.y * invM * dt;
            force.x = force.y = 0;

            vel.x *= linearDamping;
            vel.y *= linearDamping;

            if (this.sleepState < SLEEPING) {

                pos.x += vel.x * dt;
                pos.y += vel.y * dt;
            }
        };

        /**
         * @method setMotionState
         * @memberof Phys2D.Particle
         * @param Number motionState
         */
        Particle.prototype.setMotionState = function(motionState) {
            if (this.motionState === motionState) return;

            this.motionState = motionState;

            this.velocity.set(0, 0);
            this.force.set(0, 0);

            this.wake();
        };

        /**
         * @method setMass
         * @memberof Phys2D.Particle
         * @param Number mass
         */
        Particle.prototype.setMass = function(mass) {

            this.mass = mass;
            this.invMass = mass > 0 ? 1 / mass : 0;
        };

        /**
         * @method isAwake
         * @memberof Phys2D.Particle
         */
        Particle.prototype.isAwake = function() {

            return this.sleepState === AWAKE;
        };

        /**
         * @method isSleeping
         * @memberof Phys2D.Particle
         */
        Particle.prototype.isSleeping = function() {

            return this.sleepState === SLEEPING;
        };

        /**
         * @method isDynamic
         * @memberof Phys2D.Particle
         */
        Particle.prototype.isDynamic = function() {

            return this.motionState === DYNAMIC;
        };

        /**
         * @method isStatic
         * @memberof Phys2D.Particle
         */
        Particle.prototype.isStatic = function() {

            return this.motionState === STATIC;
        };

        /**
         * @method isKinematic
         * @memberof Phys2D.Particle
         */
        Particle.prototype.isKinematic = function() {

            return this.motionState === KINEMATIC;
        };

        /**
         * @method wake
         * @memberof Phys2D.Particle
         */
        Particle.prototype.wake = function() {

            if (this.sleepState > AWAKE) this.emit("wake");
            this.sleepState = AWAKE;
        };

        /**
         * @method sleep
         * @memberof Phys2D.Particle
         */
        Particle.prototype.sleep = function() {

            if (this.sleepState < SLEEPING) this.emit("sleep");
            this.sleepState = SLEEPING;
        };


        Particle.prototype.toJSON = function(json) {
            json || (json = {});
            Class.prototype.toJSON.call(this, json);
			
			json._type = this._type;
			
			json.position = this.position.toJSON(json.position);
            json.velocity = this.velocity.toJSON(json.velocity);

            json.force = this.force.toJSON(json.force);
            json.linearDamping = this.linearDamping;
            json.motionState = this.motionState;

            json.allowSleep = this.allowSleep;
            json.sleepState = this.sleepState;
			
            json.mass = this.mass;
            json.invMass = this.invMass;

            json.vlambda = this.vlambda.toJSON(json.vlambda);
			
            return json;
        };


        Particle.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);
			
            this.position.fromJSON(json.position);
            this.velocity.fromJSON(json.velocity);

            this.force.fromJSON(json.force);
            this.linearDamping = json.linearDamping;
            this.motionState = json.motionState;

            this.allowSleep = json.allowSleep;
            this.sleepState = json.sleepState;
			
            this.mass = json.mass;
            this.invMass = json.invMass;

            this.vlambda.fromJSON(json.vlambda);
			
            return this;
        };


        Particle.DYNAMIC = DYNAMIC = 1;
        Particle.STATIC = STATIC = 2;
        Particle.KINEMATIC = KINEMATIC = 3;

        Particle.AWAKE = AWAKE = 4,
        Particle.SLEEPING = SLEEPING = 5;

        Particle.PARTICLE = PARTICLE = 6;
        Particle.RIGIDBODY = 7;


        return Particle;
    }
);
