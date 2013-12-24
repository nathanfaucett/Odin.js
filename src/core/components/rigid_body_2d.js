if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define([
        "base/class",
        "core/components/component",
		"phys_2d/dynamic/rigid_body"
    ],
    function(Class, Component, RigidBody) {
        "use strict";
		
		
        function RigidBody2D(opts) {
            opts || (opts = {});

            Component.call(this, "RigidBody2D", opts.sync, opts.json);
			
			this.body = new RigidBody(opts);
        }

        RigidBody2D.type = "RigidBody2D";
        Class.extend(RigidBody2D, Component);


        RigidBody2D.prototype.copy = function(other) {

            return this;
        };


        RigidBody2D.prototype.init = function() {
			
        };


        RigidBody2D.prototype.update = function() {
            
        };


        RigidBody2D.prototype.sort = function(a, b) {

            return a === b ? 1 : -1;
        };


        RigidBody2D.prototype.toSYNC = function(json) {
            json = Component.prototype.toSYNC.call(this, json);

            return json;
        };


        RigidBody2D.prototype.fromSYNC = function(json) {

            return this;
        };


        RigidBody2D.prototype.toJSON = function(json) {
            json || (json = {});
            Component.prototype.toJSON.call(this, json);
			
			json.body = this.body.toJSON(json.body);
			
            return json;
        };


        RigidBody2D.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);
			
			this.body.fromJSON(json.body);
			
            return this;
        };


        return RigidBody2D;
    }
);