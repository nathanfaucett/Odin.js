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


        Class.prototype.toSYNC = function(json) {
            json || (json = this._SYNC);

            json._id = this._id;

            return json;
        };


        Class.prototype.fromSYNC = function(json) {
            this._SYNC = json;

            return this;
        };


        Class.prototype.toJSON = function(json) {
            json || (json = {});

            json._id = this._id;

            return json;
        };


        Class.prototype.fromJSON = function(json) {

            this._serverId = json._id;

            return this;
        };


        return Class;
    }
);
