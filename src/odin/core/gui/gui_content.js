if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/assets"
    ],
    function(Assets) {
        "use strict";


        function GUIContent(opts) {
            opts || (opts = {});

            this.text = opts.text;
            this.texture = opts.texture;
        }


        GUIContent.prototype.clone = function() {

            return new GUIContent().copy(this);
        };


        GUIContent.prototype.copy = function(other) {

            this.text = other.text;
            this.texture = other.texture;

            return this;
        };


        GUIContent.prototype.toJSON = function(json) {
            json || (json = {});

            json.text = this.text;
            json.texture = this.texture ? this.texture.name : undefined;

            return json;
        };


        GUIContent.prototype.fromJSON = function(json) {

            this.text = json.text;
            this.texture = json.texture ? Assets.hash[json.texture.name] : undefined;

            return this;
        };


        return GUIContent;
    }
);
