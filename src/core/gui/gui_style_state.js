if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "math/color"
    ],
    function(Color) {
        "use strict";


        function GUIStyleState(opts) {
            opts || (opts = {});

            this.background = opts.background != undefined ? opts.background : new Color(1, 1, 1);
            this.text = opts.text != undefined ? opts.text : new Color;
        }


        return GUIStyleState;
    }
);
