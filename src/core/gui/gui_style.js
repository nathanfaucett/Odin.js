if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/class",
        "math/rect_offset",
        "math/vec2",
        "core/enums",
        "core/gui/gui_style_state"
    ],
    function(Class, RectOffset, Vec2, Enums, GUIStyleState) {
        "use strict";


        var FontStyle = Enums.FontStyle,
            TextAnchor = Enums.TextAnchor,
            TextClipping = Enums.TextClipping;


        function GUIStyle(opts) {
            opts || (opts = {});

            Class.call(this);

            this.name = opts.name || "GUIStyle-" + this._id;

            this.alignment = opts.alignment || TextAnchor.MiddleLeft;
            this.clipping = opts.alignment || TextClipping.Clip;
            this.contentOffset = opts.contentOffset || new Vec2;

            this.fixedHeight = opts.fixedHeight || 0;
            this.fixedWidth = opts.fixedWidth || 0;

            this.normal = new GUIStyleState(opts.normal);
            this.active = new GUIStyleState(opts.active);
            this.focused = new GUIStyleState(opts.focused);
            this.hover = new GUIStyleState(opts.hover);

            this.font = "";
            this.fontSize = opts.fontSize || 0;
            this.fontStyle = opts.fontStyle || FontStyle.Normal;
            this.lineHeight = opts.lineHeight || 25;

            this.margin = opts.margin || new RectOffset;
            this.padding = opts.padding || new RectOffset;
            this.border = opts.border || new RectOffset;
            this.overflow = opts.overflow || new RectOffset;

            this.stretchHeight = opts.stretchHeight != undefined ? opts.stretchHeight : true;
            this.stretchWidth = opts.stretchWidth != undefined ? opts.stretchWidth : true;
            this.wordWrap = opts.wordWrap != undefined ? opts.wordWrap : true;
        }

        Class.extend(GUIStyle);


        GUIStyle.prototype.height = function() {

        };


        return GUIStyle;
    }
);
