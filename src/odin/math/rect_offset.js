if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        var defineProperty = Object.defineProperty;


        function RectOffset(left, right, top, bottom) {

            this.left = left || 0.0;
            this.right = right || 0.0;
            this.top = top || 0.0;
            this.bottom = bottom || 0.0;
        }


        defineProperty(RectOffset.prototype, "horizontal", {
            get: function() {

                return this.left + this.right;
            }
        });


        defineProperty(RectOffset.prototype, "vertical", {
            get: function() {

                return this.top + this.bottom;
            }
        });


        RectOffset.prototype.clone = function() {

            return new RectOffset(this.left, this.right, this.top, this.bottom);
        };


        RectOffset.prototype.copy = function(other) {

            this.left = other.left;
            this.right = other.right;
            this.top = other.top;
            this.bottom = other.bottom;

            return this;
        };


        RectOffset.prototype.set = function(left, right, top, bottom) {

            this.left = left;
            this.right = right;
            this.top = top;
            this.bottom = bottom;

            return this;
        };


        RectOffset.prototype.add = function(rect) {

            rect.xMin -= this.left;
            rect.xMax += this.right;
            rect.yMin -= this.top;
            rect.yMax += this.bottom;

            return rect;
        };


        RectOffset.prototype.sub = function(rect) {

            rect.xMin += this.left;
            rect.xMax -= this.right;
            rect.yMin += this.top;
            rect.yMax -= this.bottom;

            return rect;
        };


        RectOffset.prototype.toJSON = function(json) {
            json || (json = {});

            json.left = this.left;
            json.right = this.right;
            json.top = this.top;
            json.bottom = this.bottom;

            return json;
        };


        RectOffset.prototype.fromJSON = function(json) {

            this.left = json.left;
            this.right = json.right;
            this.top = json.top;
            this.bottom = json.bottom;

            return this;
        };


        RectOffset.prototype.toString = function() {

            return "RectOffset( " + this.left + ", " + this.right + ", " + this.top + ", " + this.bottom + " )";
        };


        return RectOffset;
    }
);
