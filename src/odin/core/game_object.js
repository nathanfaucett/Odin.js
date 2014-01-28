if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/core/components/component",
        "odin/core/game/log"
    ],
    function(Class, Component, Log) {
        "use strict";


        /**
         * @class GameObject
         * @extends Class
         * @brief base class for entities in scenes
         * @param Object options
         */

        function GameObject(opts) {
            opts || (opts = {});

            Class.call(this);

            this.scene = undefined;

            this.tags = [];

            this.components = [];
            this._componentHash = {};
            this._componentJSONHash = {};

            if (opts.tag) this.addTag(opts.tag);
            if (opts.tags) this.addTags.apply(this, opts.tags);

            if (opts.components) this.addComponents.apply(this, opts.components);
        }

        Class.extend(GameObject);


        GameObject.prototype.copy = function(other) {
            var components = other.components,
                tags = other.tags,
                i;

            this.clear();

            for (i = components.length; i--;) this.addComponent(components[i].clone());
            for (i = tags.length; i--;) this.addTag(tags[i]);

            if (other.scene) other.scene.addGameObject(this);

            return this;
        };


        GameObject.prototype.clear = function() {
            var components = this.components,
                tags = this.tags,
                i;

            for (i = tags.length; i--;) this.removeTag(tags[i]);
            for (i = components.length; i--;) this.removeComponent(components[i], true);

            return this;
        };


        GameObject.prototype.destroy = function() {
            if (!this.scene) {
                Log.error("GameObject.destroy: can't destroy GameObject if it's not added to a Scene");
                return this;
            }

            this.scene.removeGameObject(this);
            this.emit("destroy");

            this.clear();

            return this;
        };


        GameObject.prototype.addTag = function(tag) {
            var tags = this.tags;

            if (tags.indexOf(tag) === -1) tags.push(tag);

            return this;
        };


        GameObject.prototype.addTags = function() {

            for (var i = arguments.length; i--;) this.addTag(arguments[i]);
            return this;
        };


        GameObject.prototype.removeTag = function(tag) {
            var tags = this.tags,
                index = tags.indexOf(tag);

            if (index !== -1) tags.splice(index, 1);

            return this;
        };


        GameObject.prototype.removeTags = function() {

            for (var i = arguments.length; i--;) this.removeTag(arguments[i]);
            return this;
        };


        GameObject.prototype.hasTag = function(tag) {

            return this.tags.indexOf(tag) !== -1;
        };


        GameObject.prototype.addComponent = function(component, others) {
            if (typeof(component) === "string") component = new Component._types[component];
            if (!(component instanceof Component)) {
                Log.error("GameObject.addComponent: can't add passed argument, it is not an instance of Component");
                return this;
            }
            var name = component._name,
                components = this.components,
                comp, i, j;


            if (!this[name]) {
                if (component.gameObject) component = component.clone();

                components.push(component);
                this._componentHash[component._id] = component;
                if (component._jsonId !== -1) this._componentJSONHash[component._jsonId] = component._jsonId;

                component.gameObject = this;
                this[name] = component;

                if (!others) {
                    for (i = components.length; i--;) {
                        comp = components[i];
                        if (!comp) continue;

                        for (j = components.length; j--;) {
                            name = components[j]._name;
                            comp[name] = components[j];
                        }
                    }
                }

                this.emit("add" + component._type, component);
                this.emit("addComponent", component);

                if (this.scene) this.scene._addComponent(component);
            } else {
                Log.error("GameObject.addComponent: GameObject already has a(n) " + component._type + " Component");
            }

            return this;
        };


        GameObject.prototype.add = GameObject.prototype.addComponents = function() {
            var length = arguments.length,
                components = this.components,
                component, name,
                i, j;

            for (i = length; i--;) this.addComponent(arguments[i], true);

            for (i = components.length; i--;) {
                component = components[i];
                if (!component) continue;

                for (j = components.length; j--;) {
                    name = components[j]._name;
                    component[name] = components[j];
                }
            }

            return this;
        };


        GameObject.prototype.removeComponent = function(component, clear, others) {
            if (typeof(component) === "string") component = this.getComponent(component);
            if (!(component instanceof Component)) {
                Log.error("GameObject.removeComponent: can't remove passed argument, it is not an instance of Component");
                return this;
            }
            var name = component._name,
                components = this.components,
                comp, i, j;

            if (this[name]) {

                if (!others) {
                    for (i = components.length; i--;) {
                        comp = components[i];
                        if (!comp) continue;

                        for (j = components.length; j--;) {
                            if (name === components[j]._name) comp[name] = undefined;
                        }
                    }
                }

                components.splice(components.indexOf(component), 1);
                this._componentHash[component._id] = undefined;
                if (component._jsonId !== -1) this._componentJSONHash[component._jsonId] = undefined;

                component.gameObject = undefined;
                this[name] = undefined;

                this.emit("remove" + component._type, component);
                this.emit("removeComponent", component);

                if (clear) component.clear();
                if (this.scene) this.scene._removeComponent(component);
            } else {
                Log.error("GameObject.removeComponent: GameObject does not have a(n) " + type + " Component");
            }

            return this;
        };


        GameObject.prototype.remove = GameObject.prototype.removeComponents = function() {
            var length = arguments.length,
                components = this.components,
                toRemove = arguments,
                component, name,
                i, j;

            for (i = length; i--;) this.removeComponent(arguments[i], null, true);

            for (i = components.length; i--;) {
                component = components[i];
                if (!component) continue;

                name = component._name;
                for (j = toRemove.length; j--;) {

                    if (name === toRemove[i]._name) component[name] = undefined;
                }
            }

            return this;
        };


        GameObject.prototype.getComponent = function(type) {

            return this._componentHash[type] || this[type] || this[type.toLowerCase()];
        };


        GameObject.prototype.hasComponent = function(type) {
            var components = this.components,
                i;

            for (i = components.length; i--;) {
                if (components[i]._type === type) return true;
            }

            return false;
        };


        GameObject.prototype.findComponentById = function(id) {

            return this._componentHash[id];
        };


        GameObject.prototype.findComponentByJSONId = function(id) {

            return this._componentJSONHash[id];
        };


        GameObject.prototype.toJSON = function(json) {
            json = Class.prototype.toJSON.call(this, json);
            var components = this.components,
                jsonComponents = json.components || (json.components = []),
                tags = this.tags,
                jsonTags = json.tags || (json.tags = []),
                component,
                i = components.length;

            for (; i--;) {
                if ((component = components[i]).json) jsonComponents[i] = component.toJSON(jsonComponents[i]);
            }
            for (i = tags.length; i--;) jsonTags[i] = tags[i];

            return json;
        };


        GameObject.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);
            var jsonComponents = json.components || (json.components = []),
                component, jsonComponent, tag,
                tags = this.tags,
                jsonTags = json.tags || (json.tags = []),
                i = jsonComponents.length;

            for (; i--;) {
                if (!(jsonComponent = jsonComponents[i])) continue;

                if ((component = this.findComponentById(jsonComponent._id))) {
                    component.fromJSON(jsonComponent);
                } else {
                    this.addComponent(Class.fromJSON(jsonComponent));
                }
            }

            for (i = jsonTags.length; i--;) {
                if (tags.indexOf((tag = jsonTags[i])) === -1) tags.push(tag);
            }

            return this;
        };


        return GameObject;
    }
);
