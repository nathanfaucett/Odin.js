if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/gui/gui_style",
        "odin/core/gui/components/gui_component"
    ],
    function(GUIStyle, GUIComponent) {
        "use strict";


        function GUIContent(opts) {
            opts || (opts = {});

            GUIComponent.call(this, "GUIContent", opts);

            this.text = opts.text;
            this.texture = opts.texture;

            this.style = opts.style instanceof GUIStyle ? opts.style : new GUIStyle(opts.style);

            this.alpha = opts.alpha != undefined ? opts.alpha : 1;
            this.z = opts.z != undefined ? opts.z : 0;

            this._needsUpdate = true;
        }

        GUIComponent.extend(GUIContent);


        GUIContent.prototype.copy = function(other) {

            this.text = other.text;
            this.texture = other.texture;

            this.style.copy(other.style);

            this.alpha = other.alpha;
            this.z = other.z;

            return this;
        };


        GUIContent.prototype.clear = function() {
            GUIComponent.prototype.clear.call(this);

            return this;
        };


        GUIContent.prototype.sort = function(a, b) {

            return b.z - a.z;
        };


        GUIContent.prototype.toJSON = function(json) {
            json = GUIComponent.prototype.toJSON.call(this, json);

            json.text = this.text;
            json.texture = this.texture ? this.texture.name : undefined;

            json.style = this.style.toJSON(json.style);

            json.alpha = this.alpha;
            json.z = this.z;

            return json;
        };


        GUIContent.prototype.fromJSON = function(json) {
            GUIComponent.prototype.fromJSON.call(this, json);

            this.text = json.text;
            this.texture = json.texture ? Assets.get(json.texture) : undefined;

            this.style.fromJSON(json.style);

            this.alpha = json.alpha;
            this.z = json.z;

            return this;
        };


        return GUIContent;
    }
);
