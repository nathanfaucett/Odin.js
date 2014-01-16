if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        var util = {},

            SPILTER = /[ \_\-\.]+|(?=[A-Z][^A-Z])/g,
            UNDERSCORE = /([a-z])([A-Z])/g;


        function camelize(word, lowFirstLetter) {
            var parts = word.split(SPILTER),
                string = "",
                part, i, il;

            for (i = 0, il = parts.length; i < il; i++) {
                part = parts[i];
                string += part[0].toUpperCase() + part.slice(1).toLowerCase();
            }

            return lowFirstLetter ? string[0].toLowerCase() + string.slice(1) : string;
        };
        util.camelize = camelize;


        function underscore(word) {

            return word.replace(SPILTER, "").replace(UNDERSCORE, "$1_$2").toLowerCase();
        };
        util.underscore = underscore;


        return util;
    }
);
