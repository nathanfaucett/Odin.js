if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/event_emitter"
    ],
    function(EventEmitter) {
        "use strict";


        var CLASS_ID = 0;


        function Class() {

            EventEmitter.call(this);

            this._id = ++CLASS_ID;
            this._jsonId = -1;
            this._name = "";
        }

        EventEmitter.extend(Class);


        Class.prototype.clone = function() {

            return new this.constructor().copy(this);
        };


        Class.prototype.copy = function() {

            return this;
        };


        Class.prototype.clear = function() {

            return this;
        };


        Class.prototype.toJSON = function(json) {
            json || (json = {});

            json._id = this._id;
            json._jsonId = this._id;
            json._className = this._className;

            return json;
        };


        Class.prototype.fromJSON = function(json) {

            this._jsonId = json._jsonId;

            return this;
        };


        Class.prototype.toString = function() {

            return this._name;
        };


        Class.extend = function(child, parent) {
            if (!parent) parent = this;

            child.prototype = Object.create(parent.prototype);
            child.prototype.constructor = child;

            child.extend = parent.extend;
            child.prototype._className = child._className = child.name;

            Class._classes[child.name] = child;

            if (parent.onExtend) {
                if (!child.onExtend) child.onExtend = parent.onExtend;
                parent.onExtend(child);
            }

            return child;
        };


        Class.fromJSON = function(json) {

            return new Class._classes[json._className]().fromJSON(json);
        };


        Class.fromServerJSON = function(json) {

            return new Class._classes[json._className]().fromServerJSON(json);
        };


        Class.create = function(type) {

            return new Class._classes[type];
        };


        Class._classes = {};


        return Class;
    }
);
