if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class"
    ],
    function(Class) {
        "use strict";


        function Component(type) {

            Class.call(this);
			
            this._type = type || this.constructor.name || "UnknownComponent";
            this._name = (this._type).toLowerCase();
			
            this.gameObject = undefined;
        }
        Class.extend(Component, Class);
		
		Component._types = {};
		Component.prototype._type = undefined;
		
		Component.prototype._onExtend = function(child) {
			
			Component._types[child.name] = child;
		}
        

        Component.prototype.init = function() {

        };


        Component.prototype.update = function() {

        };


        Component.prototype.clear = function() {

        };


        Component.prototype.destroy = function() {
            if (!this.gameObject) {
                console.warn("Component.destroy: can't destroy Component if it's not added to a GameObject");
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
			json || (json = this._SYNC);
			Class.prototype.toSYNC.call(this, json);
			
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
			
			return json;
		};
		
		
		Component.prototype.fromJSON = function(json){
			Class.prototype.fromJSON.call(this, json);
			
			this._type = json._type;
			this._name = json._name;
			
			return this;
		};


        return Component;
    }
);
