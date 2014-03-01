if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/math/rect",
        "odin/math/color",
        "odin/core/enums",
        "odin/core/assets/assets",
        "odin/core/components/gui_element"
    ],
    function(Rect, Color, Enums, Assets, GUIElement) {
        "use strict";


        var FontStyle = Enums.FontStyle,
            TextAnchor = Enums.TextAnchor;


        function GUIText(opts) {
            opts || (opts = {});

            GUIElement.call(this, "GUIText", opts);

            this.text = opts.text != undefined ? opts.text : "";

            this.font = opts.font || "Arial";
            this.fontSize = opts.fontSize || 16;
            this.fontStyle = opts.fontStyle || FontStyle.Normal;
            this.lineHeight = opts.lineHeight || 24;
            this.lineSpacing = opts.lineSpacing || 0;

            this.color = opts.color != undefined ? opts.color : new Color(1, 1, 1);
            this.offset = opts.offset != undefined ? opts.offset : new Vec2;

            this.alignment = opts.alignment || TextAnchor.MiddleLeft;
        }

        GUIElement.extend(GUIText);


        GUIText.prototype.copy = function(other) {

            this.text = other.text;

            this.font = other.font;
            this.fontSize = other.fontSize;
            this.fontStyle = other.fontStyle;
            this.lineHeight = other.lineHeight;
            this.lineSpacing = other.lineSpacing;

            this.color.copy(other.color);
            this.offset.copy(other.offset);

            this.alignment = other.alignment;

            return this;
        };


        GUIText.prototype.toJSON = function(json) {
            json = GUIElement.prototype.toJSON.call(this, json);

            json.text = this.text;

            json.font = this.font;
            json.fontSize = this.fontSize;
            json.fontStyle = this.fontStyle;
            json.lineHeight = this.lineHeight;
            json.lineSpacing = this.lineSpacing;

            json.color = this.color.toJSON(json.color);
            json.offset = this.offset.toJSON(json.offset);

            json.alignment = this.alignment;

            return json;
        };


        GUIText.prototype.fromJSON = function(json) {
            GUIElement.prototype.fromJSON.call(this, json);

            this.text = json.text;

            this.font = json.font;
            this.fontSize = json.fontSize;
            this.fontStyle = json.fontStyle;
            this.lineHeight = json.lineHeight;
            this.lineSpacing = json.lineSpacing;

            this.color.fromJSON(json.color);
            this.offset.fromJSON(json.offset);

            this.alignment = this.alignment;

            return this;
        };


        return GUIText;
    }
);
