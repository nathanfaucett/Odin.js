if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        function GUIContent(opts) {
            opts || (opts = {});

            this.text = opts.text;
            this.image = opts.image;
        }


        return GUIContent;
    }
);
