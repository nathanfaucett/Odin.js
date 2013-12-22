if (typeof define !== 'function') { var define = require('amdefine')(module) }
define([
        "base/class",
		"core/game/log"
    ],
    function(Class, Log) {
        "use strict";


        function Component(type, sync, json) {

            Class.call(this);
			
            this._type = type || "UnknownComponent";
            this._name = (this._type).toLowerCase();
			
			this.sync = sync != undefined ? !!sync : true;
			this.json = json != undefined ? !!json : true;
			
            this.gameObject = undefined;
        }
        Class.extend(Component, Class);
		
		Component.type = "Component";
		Component._types = {};
		Component.prototype._onExtend = function(child) {
			
			Component._types[child.type] = child;
		}
        

        Component.prototype.init = function() {

        };


        Component.prototype.update = function() {

        };


        Component.prototype.clear = function() {

        };


        Component.prototype.destroy = function() {
            if (!this.gameObject) {
                Log.warn("Component.destroy: can't destroy Component if it's not added to a GameObject");
                return this;
            }

            this.gameObject.removeComponent(this);
            this.emit("destroy");

			this.clear();
			
            return this;
        };


        Component.prototype.sort = function(a, b) {

            return a === b ? -1 : 1;
        };


		Component.prototype.toSYNC = function(json){
			json = Class.prototype.toSYNC.call(this, json);
			
			return json;
		};
		
		
		Component.prototype.fromSYNC = function(json){
			
			return this;
		};
		
		
		Component.prototype.toJSON = function(json){
			json || (json = {});
			Class.prototype.toJSON.call(this, json);
			
			json._type = this._type;
			json._name = this._name;
			
			json.sync = this.sync;
			json.json = this.json;
			
			return json;
		};
		
		
		Component.prototype.fromJSON = function(json){
			Class.prototype.fromJSON.call(this, json);
			
			this._type = json._type;
			this._name = json._name;
			
			this.sync = json.sync;
			this.json = json.json;
			
			return this;
		};


        return Component;
    }
);
