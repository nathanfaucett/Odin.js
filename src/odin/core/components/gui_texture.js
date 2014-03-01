if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/math/rect",
        "odin/math/color",
        "odin/core/assets/assets",
        "odin/core/components/gui_element"
    ],
    function(Rect, Color, Assets, GUIElement) {
        "use strict";


        function GUITexture(opts) {
            opts || (opts = {});

            GUIElement.call(this, "GUITexture", opts);

            this.texture = opts.texture;
            this.color = opts.color != undefined ? opts.color : new Color(1, 1, 1);
            this.position = opts.position != undefined ? opts.position : new Rect;

            this.x = opts.x || 0;
            this.y = opts.y || 0;
            this.w = opts.w || 1;
            this.h = opts.h || 1;

            this.alpha = opts.alpha != undefined ? opts.alpha : 1;
        }

        GUIElement.extend(GUITexture);


        GUITexture.prototype.copy = function(other) {

            this.texture = other.texture;
            this.color.copy(other.color);
            this.position.copy(other.position);

            this.x = other.x;
            this.y = other.y;
            this.w = other.w;
            this.h = other.h;

            this.alpha = other.alpha;

            return this;
        };


        GUITexture.prototype.clear = function() {
            GUIElement.prototype.clear.call(this);

            this.texture = undefined;

            return this;
        };


        GUITexture.prototype.toJSON = function(json) {
            json = GUIElement.prototype.toJSON.call(this, json);

            json.texture = this.texture ? this.texture.name : undefined;
            json.color = this.color.toJSON(json.color);
            json.position = this.position.toJSON(json.position);

            json.x = this.x;
            json.y = this.y;
            json.w = this.w;
            json.h = this.h;

            json.alpha = this.alpha;

            return json;
        };


        GUITexture.prototype.fromJSON = function(json) {
            GUIElement.prototype.fromJSON.call(this, json);

            this.texture = json.texture ? Assets.get(json.texture) : undefined;
            this.color.fromJSON(json.color);
            this.position.fromJSON(json.position);

            this.x = json.x;
            this.y = json.y;
            this.w = json.w;
            this.h = json.h;

            this.alpha = json.alpha;

            return this;
        };


        return GUITexture;
    }
);
