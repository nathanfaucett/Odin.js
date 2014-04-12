if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/base/util",
        "odin/core/game/log"
    ],
    function(Class, util, Log) {
        "use strict";


        var camelize = util.camelize;


        function GUIComponent(type, opts) {
            opts || (opts = {});
            if (!type) Log.error("GUIComponent defined without a type, use GUIComponent.call(this, \"GUIComponentName\", { sync: Boolean, json: Boolean })");


            Class.call(this);

            this._type = type || "UnknownGUIComponent";
            this._name = camelize(this._type, true);

            this.sync = opts.sync != undefined ? !! opts.sync : false;
            this.json = opts.json != undefined ? !! opts.json : true;

            this.guiObject = undefined;
        }

        Class.extend(GUIComponent);


        GUIComponent.prototype.init = function() {

        };


        GUIComponent.prototype.start = function() {

        };


        GUIComponent.prototype.update = function() {

        };


        GUIComponent.prototype.clear = function() {

            this.off();
        };


        GUIComponent.prototype.destroy = function() {
            if (!this.guiObject) {
                Log.error("GUIComponent.destroy: can't destroy GUIComponent if it's not added to a GameObject");
                return this;
            }

            this.guiObject.removeGUIComponent(this, true);
            this.emit("destroy");

            this.clear();

            return this;
        };


        GUIComponent.prototype.remove = function() {
            if (!this.guiObject) {
                Log.error("GUIComponent.destroy: can't destroy GUIComponent if it's not added to a GameObject");
                return this;
            }

            this.guiObject.removeGUIComponent(this, true);
            return this;
        };


        GUIComponent.prototype.toJSON = function(json) {
            json = Class.prototype.toJSON.call(this, json);

            json._type = this._type;
            json.sync = this.sync;
            json.json = this.json;

            return json;
        };


        GUIComponent.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);

            this.sync = json.sync;
            this.json = json.json;

            return this;
        };


        return GUIComponent;
    }
);
