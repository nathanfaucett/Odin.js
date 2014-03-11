if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/math/vec2",
        "odin/math/vec3",
        "odin/core/components/component",
        "odin/phys2d/phys2d"
    ],
    function(Class, Vec2, Vec3, Component, Phys2D) {
        "use strict";


        function RigidBody2D(opts) {
            opts || (opts = {});

            Component.call(this, "RigidBody2D", opts);

            this.body = new Phys2D.P2Rigidbody(opts);
        }

        Class.extend(RigidBody2D, Component);


        RigidBody2D.prototype.copy = function(other) {

            this.body.off("collide", onCollide, this);
            this.body.off("colliding", onColliding, this);
            this.body = other.body.clone();
            this.body.on("collide", onCollide, this);
            this.body.on("colliding", onColliding, this);

            return this;
        };


        RigidBody2D.prototype.clear = function() {
            Component.prototype.clear.call(this);

            this.body.off("collide", onCollide, this);
            this.body.off("colliding", onColliding, this);
            this.body.userData = undefined;
        };


        RigidBody2D.prototype.start = function() {
            var body = this.body,
                gameObject = this.gameObject,
                transform = gameObject.transform,
                transform2d = gameObject.transform2d;

            if (transform) {
                body.position.copy(transform.position);
                body.rotation = transform.rotation.rotationZ();
            } else {
                body.position.copy(transform2d.position);
                body.rotation = transform2d.rotation;
            }

            body.init();
            body.userData = this;
            body.on("collide", onCollide, this);
            body.on("colliding", onColliding, this);
        };


        var zAxis = new Vec3(0.0, 0.0, 1.0);
        RigidBody2D.prototype.update = function() {
            var body = this.body,
                gameObject = this.gameObject,
                transform = gameObject.transform,
                transform2d = gameObject.transform2d;

            if (transform) {
                transform.position.copy(body.position);
                transform.rotation.fromAxisAngle(zAxis, body.rotation);
            } else {
                transform2d.position.copy(body.position);
                transform2d.rotation = body.rotation;
            }
        };


        RigidBody2D.prototype.applyForce = function(force, worldPoint) {

            this.body.applyForce(force, worldPoint);
        };


        RigidBody2D.prototype.applyTorque = function(torque) {

            this.body.applyTorque(torque);
        };


        RigidBody2D.prototype.applyImpulse = function(impulse, worldPoint) {

            this.body.applyImpulse(impulse, worldPoint);
        };


        RigidBody2D.prototype.applyVelocity = function(velocity) {

            this.body.applyVelocity(velocity);
        };


        RigidBody2D.prototype.applyAngularVelocity = function(angularVelocity) {

            this.body.applyAngularVelocity(angularVelocity);
        };


        RigidBody2D.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.body = this.body.toJSON(json.body);

            return json;
        };


        RigidBody2D.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.body.fromJSON(json.body);

            return this;
        };


        function onCollide(body, si, sj) {
            if (!body.userData) return;

            this.emit("collide", body.userData, body, si, sj);
        };


        function onColliding(body, si, sj) {
            if (!body.userData) return;

            this.emit("colliding", body.userData, body, si, sj);
        };


        return RigidBody2D;
    }
);
