if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/math/vec2",
        "odin/phys2d/p2enums"
    ],
    function(Class, Vec2, P2Enums) {
        "use strict";


        var pow = Math.pow,

            BodyType = P2Enums.BodyType,
            MotionState = P2Enums.MotionState,
            SleepState = P2Enums.SleepState;


        function P2Particle(opts) {
            opts || (opts = {});

            Class.call(this);

            this.type = BodyType.Particle;
            this._index = -1;

            this.space = undefined;

            this.position = opts.position != undefined ? opts.position : new Vec2;
            this.velocity = opts.velocity != undefined ? opts.velocity : new Vec2;
            this.force = new Vec2;

            this.linearDamping = opts.linearDamping != undefined ? opts.linearDamping : 0.01;

            this.mass = 0;
            this.invMass = 0;

            this.motionState = opts.motionState != undefined ? opts.motionState : MotionState.Static;

            this.allowSleep = opts.allowSleep !== undefined ? !! opts.allowSleep : true;
            this.sleepState = SleepState.Awake;

            this.sleepVelocityLimit = opts.sleepVelocityLimit !== undefined ? !! opts.sleepVelocityLimit : 0.01;
            this.sleepTimeLimit = opts.sleepTimeLimit !== undefined ? !! opts.sleepTimeLimit : 1;

            this._sleepTime = 0;
            this._lastSleepyTime = 0;

            this.vlambda = new Vec2;
        }

        Class.extend(P2Particle, Class);


        P2Particle.prototype.copy = function(other) {

            this.motionState = other.motionState;

            this.position.copy(other.position);
            this.velocity.copy(other.velocity);
            this.force.copy(other.force);

            this.linearDamping = other.linearDamping;

            this.mass = other.mass;
            this.invMass = other.invMass;

            this.allowSleep = other.allowSleep;
            this.sleepState = other.sleepState;

            return this;
        };


        P2Particle.prototype.init = function() {

        };


        P2Particle.prototype.update = function(dt) {
            if (this.motionState === MotionState.Static) return;
            var force = this.force,
                invMass = this.invMass,
                pos = this.position,
                vel = this.velocity,
                linearDamping = pow(1 - this.linearDamping, dt);

            vel.x += force.x * invMass * dt;
            vel.y += force.y * invMass * dt;
            force.x = force.y = 0;

            vel.x *= linearDamping;
            vel.y *= linearDamping;

            if (this.sleepState !== SleepState.Sleeping) {
                pos.x += vel.x * dt;
                pos.y += vel.y * dt;
            }
        };


        P2Particle.prototype.setMotionState = function(motionState) {
            if (this.motionState === motionState) return;

            this.motionState = motionState;

            this.velocity.set(0, 0);
            this.force.set(0, 0);

            this.wake();
        };


        P2Particle.prototype.setMass = function(mass) {

            this.mass = mass;
            this.invMass = mass > 0 ? 1 / mass : 0;
        };


        P2Particle.prototype.isAwake = function() {

            return this.sleepState === SleepState.Awake;
        };


        P2Particle.prototype.isSleepy = function() {

            return this.sleepState === SleepState.Sleepy;
        };


        P2Particle.prototype.isSleeping = function() {

            return this.sleepState === SleepState.Sleeping;
        };


        P2Particle.prototype.isStatic = function() {

            return this.motionState === MotionState.Static;
        };


        P2Particle.prototype.isDynamic = function() {

            return this.motionState === MotionState.Dynamic;
        };


        P2Particle.prototype.isKinematic = function() {

            return this.motionState === MotionState.Kinematic;
        };


        P2Particle.prototype.wake = function() {

            if (this.sleepState === SleepState.Sleeping) this.emit("wake");
            this.sleepState = SleepState.Awake;
        };


        P2Particle.prototype.sleep = function() {

            if (this.sleepState !== SleepState.Sleeping) this.emit("sleep");
            this.sleepState = SleepState.Sleeping;
        };


        P2Particle.prototype.sleepTick = function(time) {

            if (this.allowSleep) {
                var sleepState = this.sleepState,
                    velSq = this.velocity.lengthSq(),
                    sleepVelocityLimit = this.sleepVelocityLimit * this.sleepVelocityLimit;

                if (sleepState === SleepState.Awake && velSq < sleepVelocityLimit) {
                    this.sleepState = SleepState.Sleepy;
                    this._sleepTime = time;
                } else if (sleepState === SleepState.Sleepy && velSq > sleepVelocityLimit) {
                    this.wake();
                } else if (sleepState === SleepState.Sleepy && (time - this._lastSleepyTime) > this.sleepTimeLimit) {
                    this.sleep();
                }
            }
        };


        P2Particle.prototype.toJSON = function(json) {
            json = Class.prototype.toJSON.call(this, json);

            json.motionState = this.motionState;

            json.position = this.position.toJSON(json.position);
            json.velocity = this.velocity.toJSON(json.velocity);
            json.force = this.force.toJSON(json.force);

            json.linearDamping = this.linearDamping;

            json.mass = this.mass;
            json.invMass = this.invMass;

            json.allowSleep = this.allowSleep;
            json.sleepState = this.sleepState;

            return json;
        };


        P2Particle.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);

            this.motionState = json.motionState;

            this.position.fromJSON(json.position);
            this.velocity.fromJSON(json.velocity);
            this.force.fromJSON(json.force);

            this.linearDamping = json.linearDamping;

            this.mass = json.mass;
            this.invMass = json.invMass;

            this.allowSleep = json.allowSleep;
            this.sleepState = json.sleepState;

            return this;
        };


        return P2Particle;
    }
);
