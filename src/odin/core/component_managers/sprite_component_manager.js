if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/math/mathf",
        "odin/core/component_managers/component_manager",
        "odin/core/components/sprite"
    ],
    function(Class, Mathf, ComponentManager, Sprite) {
        "use strict";


        var clamp = Mathf.clamp;


        function SpriteComponentManager() {

            Class.call(this);

            this.order = 0;

            this.scene = undefined;
            this.layers = [];
        }

        ComponentManager.extend(SpriteComponentManager);


        SpriteComponentManager.prototype.forEach = function(fn, ctx) {
            var layers = this.layers,
                components, i, il, j, jl;

            if (ctx) {
                for (i = 0, il = layers.length; i < il; i++) {
                    components = layers[i];
                    if (!components) continue;
                    for (j = 0, jl = components.length; j < jl; j++) fn.call(ctx, components[j], j, components);
                }
            } else {
                for (i = 0, il = layers.length; i < il; i++) {
                    components = layers[i];
                    if (!components) continue;
                    for (j = 0, jl = components.length; j < jl; j++) fn(components[j], j, components);
                }
            }
        };


        SpriteComponentManager.prototype.init = function() {
            var layers = this.layers,
                components, i, il, j, jl;

            for (i = 0, il = layers.length; i < il; i++) {
                components = layers[i];
                if (!components) continue;

                for (j = 0, jl = components.length; j < jl; j++) components[j].init();
            }
        };


        SpriteComponentManager.prototype.start = function() {
            var layers = this.layers,
                components, i, il, j, jl;

            for (i = 0, il = layers.length; i < il; i++) {
                components = layers[i];
                if (!components) continue;

                for (j = 0, jl = components.length; j < jl; j++) components[j].start();
            }
        };


        SpriteComponentManager.prototype.update = function() {

        };


        SpriteComponentManager.prototype.sort = function() {
            var layers = this.layers,
                components, i, il;

            for (i = 0, il = layers.length; i < il; i++) {
                components = layers[i];
                if (!components) continue;

                components.sort(this.sortFunction);
            }
        };


        SpriteComponentManager.prototype.sortFunction = function(a, b) {

            return a.z - b.z;
        };


        SpriteComponentManager.prototype.empty = function() {
            var layers = this.layers,
                components, i, il,
                empty = true;

            for (i = 0, il = layers.length; i < il; i++) {
                components = layers[i];
                if (!components) continue;

                if (components.length !== 0) empty = false
            }

            return empty;
        };


        SpriteComponentManager.prototype.add = function(component) {
            if (!(component instanceof Sprite)) {
                Log.error("SpriteComponentManager.add: can't add argument to SpriteComponentManager, it's not an instance of Sprite");
                return;
            }
            var layers = this.layers,
                componentLayer = (component.layer = clamp(component.layer || 0, 0, 20)),
                components = layers[componentLayer] || (layers[componentLayer] = []),
                index = components.indexOf(component);

            if (index === -1) {
                components.push(component);
            } else {
                Log.error(this._className + ".add: Sprite is already a member of SpriteComponentManager");
            }
        };


        SpriteComponentManager.prototype.remove = function(component) {
            if (!(component instanceof Sprite)) {
                Log.error("SpriteComponentManager.remove: can't remove argument from SpriteComponentManager, it's not an instance of Sprite");
                return;
            }
            var layers = this.layers,
                componentLayer = (component.layer = clamp(component.layer || 0, 0, 20)),
                components = layers[componentLayer] || (layers[componentLayer] = []),
                index = components.indexOf(component);

            if (index !== -1) {
                components.splice(index, 1);
            } else {
                Log.error("SpriteComponentManager.remove: Sprite is not a member of SpriteComponentManager");
            }
        };


        return SpriteComponentManager;
    }
);
