if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        var defineProperty = Object.defineProperty;


        function Rect(x, y, width, height) {

            this._x = x || 0;
            this._y = y || 0;
            this._width = width || 0;
            this._height = height || 0;

            this._xMin = this._x;
            this._xMax = this._x + this._width;
            this._yMin = this._y;
            this._yMax = this._y + this._height;
        }


        defineProperty(Rect.prototype, "x", {
            get: function() {
                return this._x;
            },
            set: function(value) {
                this._x = value;
                this._xMin = value;
                this._xMax = value + this._width;
            }
        });
        defineProperty(Rect.prototype, "y", {
            get: function() {
                return this._y;
            },
            set: function(value) {
                this._y = value;
                this._yMin = value;
                this._yMax = value + this._height;
            }
        });
        defineProperty(Rect.prototype, "width", {
            get: function() {
                return this._width;
            },
            set: function(value) {
                this._width = value;
                this._xMax = this._xMin + value;
            }
        });
        defineProperty(Rect.prototype, "height", {
            get: function() {
                return this._height;
            },
            set: function(value) {
                this._height = value;
                this._yMax = this._yMin + value;
            }
        });
        defineProperty(Rect.prototype, "xMin", {
            get: function() {
                return this._xMin;
            },
            set: function(value) {
                this._xMin = value;
                this._x = value;
                this._width = this._xMax - this._xMin;
                this._xMax = value + this._width;
            }
        });
        defineProperty(Rect.prototype, "xMax", {
            get: function() {
                return this._xMax;
            },
            set: function(value) {
                this._xMax = value;
                this._width = value - this._xMin;
            }
        });
        defineProperty(Rect.prototype, "yMin", {
            get: function() {
                return this._yMin;
            },
            set: function(value) {
                this._yMin = value;
                this._y = value;
                this._height = this._yMax - this._yMin;
                this._yMax = value + this._height;
            }
        });
        defineProperty(Rect.prototype, "yMax", {
            get: function() {
                return this._yMax;
            },
            set: function(value) {
                this._yMax = value;
                this._height = value - this._yMin;
            }
        });


        Rect.prototype.clone = function() {

            return new Rect(this.x, this.y, this.width, this.height);
        };


        Rect.prototype.copy = function(other) {

            this.x = other.x;
            this.y = other.y;
            this.width = other.width;
            this.height = other.height;

            return this;
        };


        Rect.prototype.set = function(x, y, width, height) {

            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;

            return this;
        };


        Rect.prototype.toJSON = function(json) {
            json || (json = {});

            json.x = this._x;
            json.y = this._y;
            json.width = this._width;
            json.height = this._height;

            return json;
        };


        Rect.prototype.fromJSON = function(json) {

            this.x = json.x;
            this.y = json.y;
            this.width = json.width;
            this.height = json.height;

            return this;
        };


        Rect.prototype.toString = function() {

            return "Rect( " + this._x + ", " + this._y + ", " + this._width + ", " + this._height + " )";
        };


        return Rect;
    }
);
