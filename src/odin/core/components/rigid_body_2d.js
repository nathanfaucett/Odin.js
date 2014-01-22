if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/math/vec2",
        "odin/core/components/component",
        "odin/phys2d/phys2d"
    ],
    function(Class, Vec2, Component, Phys2D) {
        "use strict";


        function RigidBody2D(opts) {
            opts || (opts = {});

            Component.call(this, "RigidBody2D", opts);

            this.body = new Phys2D.P2Rigidbody(opts);
        }

        Class.extend(RigidBody2D, Component);


        RigidBody2D.prototype.copy = function(other) {

            this.body.off("collide", onCollision, this);
            this.body = other.body.clone();
            this.body.on("collide", onCollision, this);

            return this;
        };


        RigidBody2D.prototype.init = function() {
            var body = this.body,
                shapes = body.shapes,
                matrix = body.matrix,
                gameObject = this.gameObject,
                transform = gameObject.transform2d,
                aabb = body.aabb,
                shape,
                i;

            body.position.copy(transform.position);
            body.rotation = transform.rotation;

            matrix.setPosition(body.position);
            matrix.setRotation(body.rotation);

            aabb.clear();

            for (i = shapes.length; i--;) {
                shape = shapes[i];
                shape.update(matrix);
                aabb.union(shape.aabb);
            }

            body.on("collide", onCollision, this);
        };


        RigidBody2D.prototype.update = function() {
            var body = this.body,
                gameObject = this.gameObject,
                transform = gameObject.transform2d;

            transform.position.copy(body.position);
            transform.rotation = body.rotation;
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
            this.body.on("collide", onCollision, this);

            return this;
        };


        function onCollision(body, si, sj) {

            this.emit("collide", body, si, sj);
        };


        return RigidBody2D;
    }
);
