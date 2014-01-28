if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/util"
    ],
    function(util) {
        "use strict";


        var isArray = util.isArray,
            SPLITER = /[ ,]+/,
            COUNTER = 0;


        function Enum(enums) {
            enums = isArray(enums) ? enums : enums.split(SPLITER);
            var i = enums.length;

            for (; i--;) this[enums[i]] = ++COUNTER;
        }


        Enum.prototype.add = function(enums) {
            enums = isArray(enums) ? enums : enums.split(SPLITER);
            var i = enums.length;

            for (; i--;) this[enums[i]] = ++COUNTER;

            return this;
        };


        Enum.prototype. in = function(num) {
            var key;

            for (key in this) {
                if (this[key] == num) return true;
            }

            return false;
        };


        return Enum;
    }
);
