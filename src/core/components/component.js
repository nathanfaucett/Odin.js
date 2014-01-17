if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/class",
        "base/util",
        "core/game/log"
    ],
    function(Class, util, Log) {
        "use strict";


        var camelize = util.camelize;


        function Component(type, sync, json) {

            Class.call(this);

            this._type = type || "UnknownComponent";
            this._name = camelize(this._type, true);

            this.sync = sync != undefined ? !! sync : true;
            this.json = json != undefined ? !! json : true;

            this.gameObject = undefined;
        }

        Class.extend(Component);
        Component.type = "Component";


        Component._types = {};
        Component.prototype._onExtend = function(child) {

            Component._types[child.type] = child;
        }


        Component.prototype.init = function() {

        };


        Component.prototype.update = function() {

        };


        Component.prototype.clear = function() {

        };


        Component.prototype.destroy = function() {
            if (!this.gameObject) {
                Log.warn("Component.destroy: can't destroy Component if it's not added to a GameObject");
                return this;
            }

            this.gameObject.removeComponent(this);
            this.emit("destroy");

            this.clear();

            return this;
        };


        Component.prototype.sort = function(a, b) {

            return a === b ? -1 : 1;
        };


        Component.prototype.toSYNC = function(json) {
            json = Class.prototype.toSYNC.call(this, json);

            return json;
        };


        Component.prototype.fromSYNC = function() {

            return this;
        };


        Component.prototype.toJSON = function(json) {
            json = Class.prototype.toJSON.call(this, json);

            json.type = this._type;

            json.sync = this.sync;
            json.json = this.json;

            return json;
        };


        Component.prototype.fromServerJSON = function(json) {
            Class.prototype.fromServerJSON.call(this, json);

            this.sync = json.sync;
            this.json = json.json;

            return this;
        };


        Component.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);

            this.sync = json.sync;
            this.json = json.json;

            return this;
        };


        return Component;
    }
);
