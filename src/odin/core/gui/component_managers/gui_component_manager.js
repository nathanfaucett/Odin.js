if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/core/gui/components/gui_component"
    ],
    function(Class, GUIComponent) {
        "use strict";


        function GUIComponentManager(order) {

            Class.call(this);

            this.order = order || 0;

            this.gui = undefined;
            this.components = [];
        }

        Class.extend(GUIComponentManager);


        GUIComponentManager.prototype.forEach = function(fn, ctx) {
            var components = this.components,
                i = 0,
                il = components.length;

            if (ctx) {
                for (; i < il; i++) fn.call(ctx, components[i], i, components);
            } else {
                for (; i < il; i++) fn(components[i], i, components);
            }
        };


        GUIComponentManager.prototype.start = function() {
            var components = this.components,
                i = 0,
                il = components.length;

            for (; i < il; i++) components[i].start();
        };


        GUIComponentManager.prototype.init = function() {
            var components = this.components,
                i = 0,
                il = components.length;

            for (; i < il; i++) components[i].init();
        };


        GUIComponentManager.prototype.update = function() {
            var components = this.components,
                i = 0,
                il = components.length;

            for (; i < il; i++) components[i].update();
        };


        GUIComponentManager.prototype.sort = function() {

            this.components.sort(this.sortFunction);
        };


        GUIComponentManager.prototype.sortFunction = function(a, b) {

            return a._id - b._id;
        };


        GUIComponentManager.prototype.empty = function() {

            return this.components.length === 0;
        };


        GUIComponentManager.prototype.add = function(component) {
            if (!(component instanceof GUIComponent)) {
                Log.error(this._className + ".add: can't add argument to " + this._className + ", it's not an instance of GUIComponent");
                return;
            }
            var components = this.components,
                index = components.indexOf(component);

            if (index === -1) {
                components.push(component);
            } else {
                Log.error(this._className + ".add: GUIComponent is already a member of " + this._className);
            }
        };


        GUIComponentManager.prototype.remove = function(component) {
            if (!(component instanceof GUIComponent)) {
                Log.error(this._className + ".remove: can't remove argument from " + this._className + ", it's not an instance of GUIComponent");
                return;
            }
            var components = this.components,
                index = components.indexOf(component);

            if (index !== -1) {
                components.splice(index, 1);
            } else {
                Log.error(this._className + ".remove: GUIComponent is not a member of " + this._className);
            }
        };


        return GUIComponentManager;
    }
);
