if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/math/rect_offset",
        "odin/math/vec2",
        "odin/core/enums",
        "odin/core/gui/gui_style_state"
    ],
    function(Class, RectOffset, Vec2, Enums, GUIStyleState) {
        "use strict";


        var GUI_STYLE_ID = 0,

            FontStyle = Enums.FontStyle,
            TextAnchor = Enums.TextAnchor,
            TextClipping = Enums.TextClipping;


        function GUIStyle(opts) {
            opts || (opts = {});

            this._id = ++GUI_STYLE_ID;
            this.name = opts.name || "GUIStyle_" + this._id;

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


        GUIStyle.prototype.clone = function() {

            return new GUIStyle().copy(this);
        };


        GUIStyle.prototype.copy = function(other) {

            this.name = other.name;

            this.alignment = other.alignment;
            this.clipping = other.alignment;
            this.contentOffset.copy(other.contentOffset);

            this.fixedHeight = other.fixedHeight || 0;
            this.fixedWidth = other.fixedWidth || 0;

            this.normal.copy(other.normal);
            this.active.copy(other.active);
            this.focused.copy(other.focused);
            this.hover.copy(other.hover);

            this.font = other.font;
            this.fontSize = other.fontSize;
            this.fontStyle = other.fontStyle;
            this.lineHeight = other.lineHeight;

            this.margin.copy(other.margin);
            this.padding.copy(other.padding);
            this.border.copy(other.border);
            this.overflow.copy(other.overflow);

            this.stretchHeight = other.stretchHeight;
            this.stretchWidth = other.stretchWidth;
            this.wordWrap = other.wordWrap;

            return this;
        };


        GUIStyle.prototype.toJSON = function(json) {
            json || (json = {});

            json.name = this.name;

            json.alignment = this.alignment;
            json.clipping = this.alignment;
            json.contentOffset = this.contentOffset.toJSON(json.contentOffset);

            json.fixedHeight = this.fixedHeight || 0;
            json.fixedWidth = this.fixedWidth || 0;

            json.normal = this.normal.toJSON(json.normal);
            json.active = this.active.toJSON(json.active);
            json.focused = this.focused.toJSON(json.focused);
            json.hover = this.hover.toJSON(json.hover);

            json.font = json.font;
            json.fontSize = json.fontSize;
            json.fontStyle = json.fontStyle;
            json.lineHeight = json.lineHeight;

            json.margin = this.margin.toJSON(json.margin);
            json.padding = this.padding.toJSON(json.padding);
            json.border = this.border.toJSON(json.border);
            json.overflow = this.overflow.toJSON(json.overflow);

            json.stretchHeight = this.stretchHeight;
            json.stretchWidth = this.stretchWidth;
            json.wordWrap = this.wordWrap;

            return json;
        };


        GUIStyle.prototype.fromJSON = function(json) {

            this.name = json.name;

            this.alignment = json.alignment;
            this.clipping = json.alignment;
            this.contentOffset.fromJSON(json.contentOffset);

            this.fixedHeight = json.fixedHeight || 0;
            this.fixedWidth = json.fixedWidth || 0;

            this.normal.fromJSON(json.normal);
            this.active.fromJSON(json.active);
            this.focused.fromJSON(json.focused);
            this.hover.fromJSON(json.hover);

            this.font = json.font;
            this.fontSize = json.fontSize;
            this.fontStyle = json.fontStyle;
            this.lineHeight = json.lineHeight;

            this.margin.fromJSON(json.margin);
            this.padding.fromJSON(json.padding);
            this.border.fromJSON(json.border);
            this.overflow.fromJSON(json.overflow);

            this.stretchHeight = json.stretchHeight;
            this.stretchWidth = json.stretchWidth;
            this.wordWrap = json.wordWrap;

            return this;
        };


        return GUIStyle;
    }
);
