if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/math/color"
    ],
    function(Color) {
        "use strict";


        function GUIStyleState(opts) {
            opts || (opts = {});

            this.background = opts.background != undefined ? opts.background : new Color(1, 1, 1);
            this.text = opts.text != undefined ? opts.text : new Color;
        }


        GUIStyleState.prototype.clone = function() {

            return new GUIStyleState().copy(this);
        };


        GUIStyleState.prototype.copy = function(other) {

            this.background.copy(other.background);
            this.text.copy(other.text);

            return this;
        };


        GUIStyleState.prototype.toJSON = function(json) {
            json || (json = {});

            json.background = this.background.toJSON(json.background);
            json.text = this.text.toJSON(json.text);

            return json;
        };


        GUIStyleState.prototype.fromJSON = function(json) {

            this.background.fromJSON(json.background);
            this.text.fromJSON(json.text);

            return this;
        };


        return GUIStyleState;
    }
);
