if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/device",
        "odin/base/util",
        "odin/core/game/config"
    ],
    function(Device, util, Config) {
        "use strict";


        var each = util.each;


        function Log() {}


        if (Device.mobile) {
            var slice = Array.prototype.slice;

            Log.prototype.debug = Log.prototype.info = Log.prototype.log = function() {
                if (!Config.debug) return;
                alert(slice.call(arguments, 0));
            };

            Log.prototype.warn = function() {
                if (!(Config.debug || Config.warn)) return;
                alert(slice.call(arguments, 0));
            };

            Log.prototype.error = function() {
                if (!(Config.debug || Config.error)) return;
                alert(slice.call(arguments, 0));
            };
        } else {
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
        }


        var CACHE = {};
        Log.prototype.once = function() {
            if (!(Config.debug || Config.error) || CACHE[cacheKey(arguments)]) return;

            CACHE[cacheKey(arguments)] = true;
            this.error.apply(this, arguments);
        };



        function cacheKey(args) {
            var key = "",
                i;

            for (i = args.length; i--;) key += args[i];

            return key;
        };


        Log.prototype.object = function(obj, values, tabs) {
            if (!Config.debug) return "";
            var str = "";

            tabs || (tabs = "");
            values || (values = []);

            each(obj, function(value, i) {
                if (~values.indexOf(value)) return;

                var type = typeof(value),
                    tmp;

                if (type === "object") {
                    tmp = tabs;
                    values.push(value);
                    tabs += "\t";
                    str += tabs + i + " = " + this.object(value, values, tabs) + "\n";
                    tabs = tmp;
                } else if (type !== "function") {
                    str += tabs + i + " = " + value + "\n";
                } else {
                    values.push(value);
                    str += tabs + value + "\n";
                }
            }, this);

            return str;
        };


        return new Log;
    }
);
