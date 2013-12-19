if (typeof define !== 'function') { var define = require('amdefine')(module) }
define([
		"odin/core/game/config"
	],
    function(Config) {
        "use strict";
		

        function Log() {}
		
		
		Log.prototype.debug = Log.prototype.info = Log.prototype.log = function() {
			if (!Config.debug && !Config.logInfo) return;
			
			console.log.apply(console, arguments);
		};
		
		
		Log.prototype.warn = function() {
			if (!Config.debug && !Config.logWarn) return;
			
			console.warn.apply(console, arguments);
		};
		
		
		Log.prototype.error = function() {
			if (!Config.debug && !Config.logError) return;
			
			console.error.apply(console, arguments);
		};
		
		
		Log.prototype.object = function(obj) {
			var str = "", key, value;
			
			for (key in obj) {
				value = obj[key];
				
				if (typeof(value) === "object") {
					str += "\t"+ key +" = "+ this.object(value);
				} else {
					str += "\t"+ key +" = "+ value +"\n";
				}
			}
			
			return str;
		};

			
        return new Log;
    }
);
