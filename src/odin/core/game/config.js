if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        var hasOwnProperty = Object.prototype.hasOwnProperty;


        function Config() {

            this.debug = false;

            this.host = "127.0.0.1";
            this.port = 3000;

            this.FAKE_LAG = 0;
            this.SCENE_SYNC_RATE = 0.5;

            this.MAX_SCENE_STATES = 5;

            this.MIN_DELTA = 0.000001;
            this.MAX_DELTA = 1;
        }


        Config.prototype.fromJSON = function(json) {

            for (var key in json) {
                if (this[key] != undefined) this[key] = json[key];
            }

            return this;
        };


        Config.prototype.toJSON = function(json) {
            json || (json = {});

            for (var key in this) {
                if (this[key] != undefined && hasOwnProperty.call(this, key)) json[key] = this[key];
            }

            return json;
        };


        return new Config;
    }
);
