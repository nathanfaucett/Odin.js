if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/math/vec2",
        "odin/core/game/log"
    ],
    function(Vec2, Log) {
        "use strict";


        function Touch() {

            this.id = -1;

            this.radiusX = 0;
            this.radiusY = 0;
            this.rotationAngle = 0;
            this.force = 0;

            this.delta = new Vec2;
            this.position = new Vec2;

            this._last = new Vec2;
            this._first = false;

            this._SYNC = {};
        };


        Touch.prototype.clear = function() {

            this.id = -1;

            this.position.set(0, 0);
            this.delta.set(0, 0);
            this._last.set(0, 0);

            this.radiusX = 0;
            this.radiusY = 0;
            this.rotationAngle = 0;
            this.force = 0;

            this._first = false;

            return this;
        };


        Touch.prototype.fromEvent = function(e) {
            var position = this.position,
                delta = this.delta,
                last = this._last,
                first = this._first,
                element = e.target || e.srcElement,
                offsetX = element.offsetLeft,
                offsetY = element.offsetTop,
                x = (e.pageX || e.clientX) - offsetX,
                y = (e.pageY || e.clientY) - offsetY;

            last.x = first ? position.x : x;
            last.y = first ? position.y : y;

            position.x = x;
            position.y = y;

            delta.x = position.x - last.x;
            delta.y = position.y - last.y;

            this.radiusX = (e.radiusX || e.webkitRadiusX || e.mozRadiusX || e.oRadiusX || e.msRadiusX || 1);
            this.radiusY = (e.radiusY || e.webkitRadiusY || e.mozRadiusY || e.oRadiusY || e.msRadiusY || 1);
            this.rotationAngle = (e.rotationAngle || e.webkitRotationAngle || e.mozRotationAngle || e.oRotationAngle || e.msRotationAngle || 0);
            this.force = (e.force || e.webkitForce || e.mozForce || e.oForce || e.msForce || 1);

            this._first = true;

            return this;
        };


        Touch.prototype.toSYNC = function(json) {
            json || (json = this._SYNC);

            json.id = this.id;

            json.delta = this.delta.toJSON(json.delta);
            json.position = this.position.toJSON(json.position);

            json._last = this._last.toJSON(json._last);
            json._first = this._first;

            return json;
        };


        Touch.prototype.fromSYNC = function(json) {

            this.id = json.id;

            this.delta.fromJSON(json.delta);
            this.position.fromJSON(json.position);

            this._last.fromJSON(json._last);
            this._first = json._first;

            return this;
        };


        Touch.prototype.toJSON = function(json) {
            json || (json = {});

            json.id = this.id;

            json.delta = this.delta.toJSON(json.delta);
            json.position = this.position.toJSON(json.position);

            json._last = this._last.toJSON(json._last);
            json._first = this._first;

            return json;
        };


        Touch.prototype.fromJSON = function(json) {
            this.id = json.id;

            this.delta.fromJSON(json.delta);
            this.position.fromJSON(json.position);

            this._last.fromJSON(json._last);
            this._first = json._first;

            return this;
        };


        return Touch;
    }
);
