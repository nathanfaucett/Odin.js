if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/device",
        "odin/math/vec2",
        "odin/core/input/input",
        "odin/core/gui/gui_style",
        "odin/core/gui/components/gui_component"
    ],
    function(Device, Vec2, Input, GUIStyle, GUIComponent) {
        "use strict";


        function GUIContent(opts) {
            opts || (opts = {});

            GUIComponent.call(this, "GUIContent", opts);

            this.text = opts.text;
            this.texture = opts.texture;

            this.style = opts.style instanceof GUIStyle ? opts.style : new GUIStyle(opts.style);

            this._down = false;
            this._needsUpdate = true;
        }

        GUIComponent.extend(GUIContent);


        GUIContent.prototype.copy = function(other) {

            this.text = other.text;
            this.texture = other.texture;

            this.style.copy(other.style);

            return this;
        };


        GUIContent.prototype.clear = function() {
            GUIComponent.prototype.clear.call(this);

            return this;
        };


        var ACTIVE = "active",
            HOVER = "hover",
            NORMAL = "normal",
            VEC = new Vec2;
        GUIContent.prototype.update = function() {

        };


        GUIContent.prototype.setText = function(text) {

            this.text = text.toString();
            this._needsUpdate = true;

            return this;
        };


        GUIContent.prototype.sort = function(a, b) {

            return b.style.z - a.style.z;
        };


        GUIContent.prototype.toJSON = function(json) {
            json = GUIComponent.prototype.toJSON.call(this, json);

            json.text = this.text;
            json.texture = this.texture ? this.texture.name : undefined;

            json.style = this.style.toJSON(json.style);

            return json;
        };


        GUIContent.prototype.fromJSON = function(json) {
            GUIComponent.prototype.fromJSON.call(this, json);

            this.text = json.text;
            this.texture = json.texture ? Assets.get(json.texture) : undefined;

            this.style.fromJSON(json.style);

            return this;
        };


        return GUIContent;
    }
);
