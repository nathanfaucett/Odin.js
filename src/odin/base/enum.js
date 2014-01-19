if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        var isArray = Array.isArray,
            SPLITER = /[ ,]+/;


        function Enum(enums) {
            enums = isArray(enums) ? enums : enums.split(SPLITER);
            var i = enums.length;

            this.__length__ = i;
            for (; i--;) this[enums[i]] = i + 1;
        }


        Enum.prototype.add = function(enums) {
            enums = isArray(enums) ? enums : enums.split(SPLITER);
            var i = enums.length,
                len = this.__length__;

            this.__length__ += i;
            for (; i--;) this[enums[i]] = len + i + 1;

            return this;
        };


        return Enum;
    }
);
