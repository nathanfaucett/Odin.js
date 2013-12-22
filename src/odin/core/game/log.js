if (typeof define !== 'function') { var define = require('amdefine')(module) }
define([
		"odin/core/game/config"
	],
    function(Config) {
        "use strict";
		
		
		var has = Object.prototype.hasOwnProperty;
		

        function Log() {}
		
		
		Log.prototype.debug = Log.prototype.info = Log.prototype.log = function() {
			if (!Config.debug) return;
			
			console.log.apply(console, arguments);
		};
		
		
		Log.prototype.warn = function() {
			if (!Config.debug) return;
			
			console.warn.apply(console, arguments);
		};
		
		
		Log.prototype.error = function() {
			if (!Config.debug) return;
			
			console.error.apply(console, arguments);
		};


		Log.prototype.object = function(obj) {
			if (!Config.debug) return "";
			var str = "", key, value, type,
				values = arguments[1] || (arguments[1] = []);
			
			for (key in obj) {
				if (!has.call(obj, key)) continue;
				
				value = obj[key];
				if (~values.indexOf(value)) continue;
				
				type = typeof(value);
				
				if (type === "object") {
					values.push(value);
					str += "\t"+ key +" = "+ this.object(value, values);
				} else if (type !== "function") {
					str += "\t"+ key +" = "+ value +"\n";
				} else {
					values.push(value);
				}
			}
			
			return str;
		};


        return new Log;
    }
);
