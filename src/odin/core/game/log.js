if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/util",
        "odin/core/game/config"
    ],
    function(util, Config) {
        "use strict";


        var each = util.each;


        function Log() {}


        Log.prototype.debug = Log.prototype.info = Log.prototype.log = function() {
            if (!Config.debug) return;

            console.log.apply(console, arguments);
        };


        Log.prototype.warn = function() {
            if (!(Config.debug || Config.warn)) return;

            console.warn.apply(console, arguments);
        };


        Log.prototype.error = function() {
            if (!(Config.debug || Config.error)) return;

            console.error.apply(console, arguments);
        };


        var CACHE = {};
        Log.prototype.once = function() {
            if (!(Config.debug || Config.error) || CACHE[cacheKey(arguments)]) return;

            CACHE[cacheKey(arguments)] = true;
            console.error.apply(console, arguments);
        };


        function cacheKey(args) {
            var key = "",
                i;

            for (i = args.length; i--;) key += args[i];

            return key;
        };


        Log.prototype.object = function(obj, values) {
            if (!Config.debug) return "";
            var str = "";

            values || (values = []);

            each(obj, function(value, i) {
                if (~values.indexOf(value)) return;

                var type = typeof(value);

                if (type === "object") {
                    values.push(value);
                    str += "\t" + i + " = " + this.object(value, values);
                } else if (type !== "function") {
                    str += "\t" + i + " = " + value + "\n";
                } else {
                    values.push(value);
                }
            }, this);

            return str;
        };


        return new Log;
    }
);
