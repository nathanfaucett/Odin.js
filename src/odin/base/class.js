if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/event_emitter"
    ],
    function(EventEmitter) {
        "use strict";


        var CLASS_ID = 0;

        /**
         * @class Odin.Class
         * @extends Odin.EventEmitter
         */
        function Class() {

            EventEmitter.call(this);

            this._id = ++CLASS_ID;
            this._jsonId = -1;
            this._name = "";
        }

        EventEmitter.extend(Class);


        /**
         * returns new copy of this
         * @memberof Odin.Class
         * @return Class
         */
        Class.prototype.clone = function() {

            return new this.constructor().copy(this);
        };

        /**
         * copies other of same class
         * @memberof Odin.Class
         * @param {Odin.Class} other
         * @return this
         */
        Class.prototype.copy = function() {

            return this;
        };

        /**
         * clears data for GC
         * @memberof Odin.Class
         * @return this
         */
        Class.prototype.clear = function() {

            return this;
        };

        /**
         * converts this to a JSON object
         * @memberof Odin.Class
         * @return json
         */
        Class.prototype.toJSON = function(json) {
            json || (json = {});

            json._id = this._id;
            json._jsonId = this._id;
            json._className = this._className;

            return json;
        };

        /**
         * sets this from JSON object
         * @memberof Odin.Class
         * @return this
         */
        Class.prototype.fromJSON = function(json) {

            this._jsonId = json._jsonId;

            return this;
        };

        /**
         * returns class name
         * @memberof Odin.Class
         * @return string
         */
        Class.prototype.toString = function() {

            return this._name;
        };

        /**
         * @memberof Odin.Class
         * @param {constructor} child
         * @param {constructor} parent
         * @return child
         */
        Class.extend = function(child, parent) {
            if (!parent) parent = this;

            child.prototype = Object.create(parent.prototype);
            child.prototype.constructor = child;

            child.extend = parent.extend;
            child.prototype._className = child._className = child.name;

            (this._children || (this._children = {}))[child.name] = child;
            child._parent = this;

            Class._classes[child.name] = child;

            if (parent.onExtend) {
                if (!child.onExtend) child.onExtend = parent.onExtend;
                parent.onExtend(child);
            }

            return child;
        };

        /**
         * creates new Odin.Class from json object
         * @memberof Odin.Class
         * @param {object} json
         * @return Odin.Class
         */
        Class.fromJSON = function(json) {

            return new Class._classes[json._className]().fromJSON(json);
        };

        /**
         * creates new Odin.Class from string type
         * @memberof Odin.Class
         * @param {string} type
         * @return Odin.Class
         */
        Class.create = function(type) {

            return new Class._classes[type];
        };


        Class._classes = {};


        return Class;
    }
);
