if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/class",
        "core/gui/gui_style_state"
    ],
    function(Class, GUIStyleState) {
        "use strict";


        function GUIStyle(opts) {
            opts || (opts = {});

            Class.call(this);

            this.active = new GUIStyleState(opts.active);
            this.alignment = "middle left";
            this.clipping = "clip";
        }

        Class.extend(GUIStyle);


        return GUIStyle;
    }
);
