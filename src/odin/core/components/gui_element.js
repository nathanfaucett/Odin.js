if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/components/component"
    ],
    function(Component) {
        "use strict";


        function GUIElement(type, opts) {
            opts || (opts = {});

            Component.call(this, type || "GUIElement", opts);
        }

        Component.extend(GUIElement);


        return GUIElement;
    }
);
