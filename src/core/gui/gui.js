if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/class"
    ],
    function(Class) {
        "use strict";


        function GUI(opts) {
            opts || (opts = {});

            Class.call(this);
        }

        Class.extend(GUI);


        return new GUI;
    }
);
