if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/class",
        "core/gui/gui_layout"
    ],
    function(Class, GUILayout) {
        "use strict";


        function GUI(opts) {
            opts || (opts = {});

            Class.call(this);

            this.game = undefined;

            this.layouts = [];
            this._layoutHash = {};
            this._layoutServerHash = {};
        }

        Class.extend(GUI);


        GUI.prototype.addLayout = function(layout) {
            if (!(layout instanceof GUILayout)) {
                Log.warn("Scene.addLayout: can't add argument to Scene, it's not an instance of GUILayout");
                return this;
            }
            var layouts = this.layouts,
                index = layouts.indexOf(layout);

            if (index === -1) {
                if (layout.gui) layout.gui.removeLayout(layout);

                layouts.push(layout);
                this._layoutHash[layout._id] = layout;
                if (layout._serverId !== -1) this._layoutServerHash[layout._serverId] = layout;

                layout.gui = this;

                this.emit("addLayout", layout);
            } else {
                Log.warn("Scene.addLayout: GUILayout is already a member of Scene");
            }

            return this;
        };


        return GUI;
    }
);
