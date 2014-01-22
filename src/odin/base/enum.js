if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        var isArray = Array.isArray,
            SPLITER = /[ ,]+/,
            COUNTER = 1;


        function Enum(enums) {
            enums = isArray(enums) ? enums : enums.split(SPLITER);
            var i = enums.length;

            for (; i--;) this[enums[i]] = COUNTER++;
        }


        Enum.prototype.add = function(enums) {
            enums = isArray(enums) ? enums : enums.split(SPLITER);
            var i = enums.length;

            for (; i--;) this[enums[i]] = COUNTER++;

            return this;
        };


        return Enum;
    }
);
