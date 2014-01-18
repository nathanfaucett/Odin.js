if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/event_emitter"
    ],
    function(EventEmitter) {
        "use strict";


        var CLASS_ID = 0,
            IS_SERVER = !(typeof(window) !== "undefined" && window.document),
            IS_CLIENT = !IS_SERVER,

            defineProperty = Object.defineProperty;


        function Class() {

            EventEmitter.call(this);

            this._id = ++CLASS_ID;
            this._serverId = -1;

            this._SYNC = {};
            this._SAVE = {};
        }

        EventEmitter.extend(Class);


        defineProperty(Class.prototype, "isServer", {
            get: function() {
                return IS_SERVER;
            }
        });


        defineProperty(Class.prototype, "isClient", {
            get: function() {
                return IS_CLIENT;
            }
        });


        Class.prototype.clone = function() {

            return new this.constructor().copy(this);
        };


        Class.prototype.copy = function() {

            return this;
        };


        Class.prototype.clear = function() {

            return this;
        };


        Class.prototype.toSYNC = function(json) {
            json || (json = this._SYNC);

            json._id = this._id;
            json.__type__ = this.__type__;

            return json;
        };


        Class.prototype.fromSYNC = function(json) {
            this._SYNC = json;

            return this;
        };


        Class.prototype.save = function() {

            this.toJSON(this._SAVE);
            return this;
        };


        Class.prototype.restore = function() {

            this.fromJSON(this._SAVE);
            return this;
        };


        Class.prototype.toJSON = function(json) {
            json || (json = {});

            json._id = this._id;
            json.__type__ = this.__type__;

            return json;
        };


        Class.prototype.fromServerJSON = function(json) {

            this._serverId = json._id;

            return this;
        };


        Class.prototype.fromJSON = function() {

            return this;
        };


        Class.extend = function(child, parent) {
            if (!parent) parent = this;

            child.prototype = Object.create(parent.prototype);
            child.prototype.constructor = child;

            child.extend = parent.extend;
            child.prototype.__type__ = child.__type__ = child.name;

            Class.__types__[child.name] = child;

            if (parent.onExtend) {
                if (!child.onExtend) child.onExtend = parent.onExtend;
                parent.onExtend(child);
            }

            return child;
        };


        Class.fromJSON = function(json) {

            return new Class.__types__[json.__type__]().fromJSON(json);
        };


        Class.fromServerJSON = function(json) {

            return new Class.__types__[json.__type__]().fromServerJSON(json);
        };


        Class.create = function(type) {

            return new Class.__types__[type];
        };


        Class.__types__ = {};


        return Class;
    }
);
