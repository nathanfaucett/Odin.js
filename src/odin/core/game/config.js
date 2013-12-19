if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(
    function() {
        "use strict";


        function Config() {

            this.debug = false;
			
            this.logInfo = false;
            this.logWarn = false;
            this.logError = false;
			
            this.forceCanvas = false;
			
            this.host = "127.0.0.1";
            this.port = 3000;
			
			this.MAX_SERVER_STATES = 10;
			this.SCENE_SYNC_RATE = 0.5;
			
            this.MIN_DELTA = 0.000001;
            this.MAX_DELTA = 1;
        }
		
		
		Config.prototype.fromJSON = function(json){
			
			for (var key in json) if (this[key] != undefined) this[key] = json[key];
			return this;
		};


        return new Config;
    }
);
