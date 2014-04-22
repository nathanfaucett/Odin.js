if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/core/components/component"
    ],
    function(Class, Component) {
        "use strict";


        function ComponentManager(order) {

            Class.call(this);

            this.order = order || 0;

            this.scene = undefined;
            this.components = [];
        }

        Class.extend(ComponentManager);


        ComponentManager.prototype.forEach = function(fn, ctx) {
            var components = this.components,
                i = 0,
                il = components.length;

            if (ctx) {
                for (; i < il; i++) fn.call(ctx, components[i], i, components);
            } else {
                for (; i < il; i++) fn(components[i], i, components);
            }
        };


        ComponentManager.prototype.start = function() {
            var components = this.components,
                i, il;

            for (i = 0, il = components.length; i < il; i++) components[i].start();
            for (i = 0, il = components.length; i < il; i++) components[i].emit("start");
        };


        ComponentManager.prototype.init = function() {
            var components = this.components,
                i, il;

            for (i = 0, il = components.length; i < il; i++) components[i].init();
            for (i = 0, il = components.length; i < il; i++) components[i].emit("init");
        };


        ComponentManager.prototype.update = function() {
            var components = this.components,
                i = 0,
                il = components.length,
                component;

            for (; i < il; i++)
                if ((component = components[i])) component.update();
        };


        ComponentManager.prototype.sort = function() {

            this.components.sort(this.sortFunction);
        };


        ComponentManager.prototype.sortFunction = function(a, b) {

            return a._id - b._id;
        };


        ComponentManager.prototype.empty = function() {

            return this.components.length === 0;
        };


        ComponentManager.prototype.add = function(component) {
            if (!(component instanceof Component)) {
                Log.error(this._className + ".add: can't add argument to " + this._className + ", it's not an instance of Component");
                return;
            }
            var components = this.components,
                index = components.indexOf(component);

            if (index === -1) {
                components.push(component);
            } else {
                Log.error(this._className + ".add: Component is already a member of " + this._className);
            }
        };


        ComponentManager.prototype.remove = function(component) {
            if (!(component instanceof Component)) {
                Log.error(this._className + ".remove: can't remove argument from " + this._className + ", it's not an instance of Component");
                return;
            }
            var components = this.components,
                index = components.indexOf(component);

            if (index !== -1) {
                components.splice(index, 1);
            } else {
                Log.error(this._className + ".remove: Component is not a member of " + this._className);
            }
        };


        return ComponentManager;
    }
);
