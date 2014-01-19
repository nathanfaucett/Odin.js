if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/core/gui/gui_layout"
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


        GUI.prototype.copy = function(other) {
            var layouts = other.layouts,
                i;

            this.clear();

            for (i = layouts.length; i--;) this.addLayout(layouts[i]);

            return this;
        };


        GUI.prototype.clear = function() {
            var layouts = this.layouts,
                i;

            for (i = layouts.length; i--;) this.removeLayout(layouts[i]);

            return this;
        };


        GUI.prototype.addLayout = function(layout) {
            if (!(layout instanceof GUILayout)) {
                Log.error("GUI.addLayout: can't add argument to GUI, it's not an instance of GUILayout");
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
                Log.error("GUI.addLayout: GUILayout is already a member of GUI");
            }

            return this;
        };


        GUI.prototype.add = function() {

            for (var i = arguments.length; i--;) this.addLayout(arguments[i]);
            return this;
        };


        GUI.prototype.removeLayout = function(layout, clear) {
            if (!(layout instanceof GUILayout)) {
                Log.error("GUI.removeLayout: can't remove argument from GUI, it's not an instance of GUILayout");
                return this;
            }
            var layouts = this.layouts,
                index = layouts.indexOf(layout);

            if (index !== -1) {
                if (layout.gui) layout.gui.removeLayout(layout);

                layouts.push(layout);
                this._layoutHash[layout._id] = layout;
                if (layout._serverId !== -1) this._layoutServerHash[layout._serverId] = layout;

                layout.gui = this;
                if (clear) layout.clear();

                this.emit("removeLayout", layout);
            } else {
                Log.error("GUI.removeLayout: GUILayout is already a member of GUI");
            }

            return this;
        };


        GUI.prototype.remove = function() {

            for (var i = arguments.length; i--;) this.removeLayout(arguments[i]);
            return this;
        };


        return GUI;
    }
);
