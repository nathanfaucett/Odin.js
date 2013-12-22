if (typeof define !== 'function') { var define = require('amdefine')(module) }
define([
		"base/event_emitter"
	],
    function(EventEmitter) {
        "use strict";
		
		
        var CLASS_ID = 0;


		function Class() {
			
			EventEmitter.call(this);
			
			this._id = ++CLASS_ID;
			this._serverId = -1;
			
			this._SYNC = {};
		}
		
		EventEmitter.extend(Class, EventEmitter);
		
		
		Class.prototype.clone = function() {
		
			return new this.constructor().copy(this);
		};
		
		
		Class.prototype.copy = function(other) {
		
			return this;
		};
		
		
		Class.prototype.toSYNC = function(json) {
			json || (json = this._SYNC);
			
			json._id = this._id;
			
			return json;
		};
		
		
		Class.prototype.fromSYNC = function(json) {
			
			return this;
		};
		
		
		Class.prototype.toJSON = function(json) {
			json || (json = {});
			
			json._id = this._id;
			
			return json;
		};
		
		
		Class.prototype.fromJSON = function(json) {
			
			this._serverId = json._id;
			
			return this;
		};


        return Class;
    }
);