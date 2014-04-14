if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/core/game_object",
        "odin/core/component_managers/component_manager",
        "odin/core/world/world",
        "odin/core/game/log"
    ],
    function(Class, GameObject, ComponentManager, World, Log) {
        "use strict";


        /**
         * Scenes manage GameObjects and their Components
         * @class Odin.Scene
         * @extends Odin.Class
         * @param Object options
         */
        function Scene(opts) {
            opts || (opts = {});

            Class.call(this);

            this.game = undefined;

            this.name = opts.name != undefined ? opts.name : "Scene_" + this._id;

            this.world = undefined;

            this.gameObjects = [];
            this._gameObjectHash = {};
            this._gameObjectJSONHash = {};

            this.componentManagers = {};
            this._componentManagerTypes = [];
            this._componentHash = {};
            this._componentJSONHash = {};

            this.setWorld(opts.world instanceof World ? opts.world : new World(opts.world));
            if (opts.gameObjects) this.addGameObjects.apply(this, opts.gameObjects);
        }

        Class.extend(Scene);


        Scene.prototype.copy = function(other) {
            var otherGameObjects = other.gameObjects,
                i = otherGameObjects.length;

            this.clear();
            this.name = other.name + "." + this._id;

            while (i--) this.addGameObject(otherGameObjects[i].clone());

            return this;
        };


        Scene.prototype.init = function() {
            var gameObjects = this.gameObjects,
                i, il;

            this.world && this.world.init();

            for (i = 0, il = gameObjects.length; i < il; i++) gameObjects[i].emit("init");
        };


        Scene.prototype.start = function() {
            var componentManagerTypes = this._componentManagerTypes,
                gameObjects = this.gameObjects,
                i, il;

            this.world && this.world.start();

            for (i = 0, il = componentManagerTypes.length; i < il; i++) componentManagerTypes[i].start();
            for (i = 0, il = gameObjects.length; i < il; i++) gameObjects[i].emit("start");
        };


        Scene.prototype.update = function() {
            var componentManagerTypes = this._componentManagerTypes,
                componentManagerType, i, il;

            this.world && this.world.update();

            for (i = 0, il = componentManagerTypes.length; i < il; i++) {
                if ((componentManagerType = componentManagerTypes[i])) componentManagerType.update();
            }
        };


        Scene.prototype.clear = function() {
            var gameObjects = this.gameObjects,
                i = gameObjects.length;

            this.removeWorld();
            while (i--) this.removeGameObject(gameObjects[i], true);

            this.off();

            return this;
        };


        Scene.prototype.destroy = function() {

            this.emit("destroy");
            this.clear();

            return this;
        };


        Scene.prototype.setWorld = function(world) {
            if (this.world) this.removeWorld();

            world.scene = this;
            this.world = world;

            if (this.game) world.init();

            return this;
        };


        Scene.prototype.removeWorld = function() {
            if (!this.world) return this;
            var world = this.world;

            world.scene = undefined;
            this.world = undefined;

            return this;
        };


        Scene.prototype.addGameObject = function(gameObject) {
            if (!(gameObject instanceof GameObject)) {
                Log.error("Scene.addGameObject: can't add argument to Scene, it's not an instance of GameObject");
                return this;
            }
            var gameObjects = this.gameObjects,
                index = gameObjects.indexOf(gameObject),
                components, transform, children, child,
                i;

            if (index === -1) {
                if (gameObject.scene) gameObject.scene.removeGameObject(gameObject);

                gameObjects.push(gameObject);
                this._gameObjectHash[gameObject._id] = gameObject;
                if (gameObject._jsonId !== -1) this._gameObjectJSONHash[gameObject._jsonId] = gameObject;

                gameObject.scene = this;

                components = gameObject.components;
                i = components.length;
                while (i--) this._addComponent(components[i]);

                if ((transform = gameObject.transform || gameObject.transform2d)) {
                    i = (children = transform.children).length;

                    while (i--) {
                        if ((child = children[i].gameObject) && !this.hasGameObject(child)) {
                            this.addGameObject(child);
                        }
                    }
                }

                if (this.game) gameObject.emit("init");
                this.emit("addGameObject", gameObject);
            } else {
                Log.error("Scene.addGameObject: GameObject is already a member of Scene");
            }

            return this;
        };


        Scene.prototype.addGameObjects = function() {
            var i = 0,
                il = arguments.length;

            for (; i < il; i++) this.addGameObject(arguments[i]);
            return this;
        };


        Scene.prototype._addComponent = function(component) {
            if (!component) return;
            var type = component._type,
                componentManagers = this.componentManagers,
                componentManager = componentManagers[type],
                componentManagerTypes = this._componentManagerTypes,
                isNew = !componentManager;

            if (isNew) {
                componentManager = componentManagers[type] = new(Class._classes[type + "ComponentManager"] || ComponentManager);
                componentManagerTypes.push(componentManager);
                componentManagerTypes.sort(sortComponentManagerTypes);
                componentManager.scene = this;
            }

            componentManager.add(component);
            componentManager.sort();

            this._componentHash[component._id] = component;
            if (component._jsonId !== -1) this._componentJSONHash[component._jsonId] = component;

            this.emit("add" + type, component);
            this.emit("addComponent", component);

            if (this.game) {
                component.start();
                component.emit("start");
            }
        };


        function sortComponentManagerTypes(a, b) {

            return a.order - b.order;
        }


        Scene.prototype.removeGameObject = function(gameObject, clear) {
            if (!(gameObject instanceof GameObject)) {
                Log.error("Scene.removeGameObject: can't remove argument from Scene, it's not an instance of GameObject");
                return this;
            }
            var gameObjects = this.gameObjects,
                index = gameObjects.indexOf(gameObject),
                components, transform, children, child,
                i;

            if (index !== -1) {

                gameObjects.splice(index, 1);
                this._gameObjectHash[gameObject._id] = undefined;
                if (gameObject._jsonId !== -1) this._gameObjectJSONHash[gameObject._jsonId] = undefined;

                gameObject.scene = undefined;

                components = gameObject.components;
                i = components.length;
                while (i--) this._removeComponent(components[i], clear);

                if ((transform = gameObject.transform || gameObject.transform2d)) {
                    i = (children = transform.children).length;

                    while (i--) {
                        if ((child = children[i].gameObject) && this.hasGameObject(child)) {
                            this.removeGameObject(child);
                        }
                    }
                }

                this.emit("removeGameObject", gameObject);
                gameObject.emit("remove", gameObject);
                if (clear) gameObject.clear();
            } else {
                Log.error("Scene.removeGameObject: GameObject is not a member of Scene");
            }

            return this;
        };


        Scene.prototype.removeGameObjects = function() {
            var i = 0,
                il = arguments.length;

            for (; i < il; i++) this.removeGameObject(arguments[i]);
            return this;
        };


        Scene.prototype._removeComponent = function(component, clear) {
            if (!component) return;
            var type = component._type,
                componentManagers = this.componentManagers,
                componentManager = componentManagers[type],
                componentManagerTypes = this._componentManagerTypes;

            componentManager.remove(component);
            this._componentHash[component._id] = undefined;
            if (component._jsonId !== -1) this._componentJSONHash[component._jsonId] = undefined;

            if (componentManager.empty()) {
                componentManagers[type] = undefined;
                componentManagerTypes.splice(componentManagerTypes.indexOf(componentManager), 1);
                componentManager.scene = undefined;
            }

            this.emit("remove" + type, component);
            this.emit("removeComponent", component);

            if (clear) component.clear();
        };


        Scene.prototype.hasGameObject = function(gameObject) {

            return !!~this.gameObjects.indexOf(gameObject);
        };


        Scene.prototype.findByTag = function(tag, out) {
            out || (out = []);
            var gameObjects = this.gameObjects,
                gameObject, i = gameObjects.length;

            while (i--) {
                if ((gameObject = gameObjects[i]).hasTag(tag)) out.push(gameObject);
            }

            return out;
        };


        Scene.prototype.findByTagFirst = function(tag) {
            var gameObjects = this.gameObjects,
                gameObject, i = gameObjects.length;

            while (i--) {
                if ((gameObject = gameObjects[i]).hasTag(tag)) return gameObject;
            }

            return undefined;
        };


        Scene.prototype.findById = function(id) {

            return this._gameObjectHash[id];
        };


        Scene.prototype.findByJSONId = function(id) {

            return this._gameObjectJSONHash[id];
        };


        Scene.prototype.findComponentById = function(id) {

            return this._componentHash[id];
        };


        Scene.prototype.findComponentByJSONId = function(id) {

            return this._componentJSONHash[id];
        };


        Scene.prototype.find = function(name) {
            var gameObjects = this.gameObjects,
                child, i = gameObjects.length;

            while (i--) {
                child = gameObjects[i];

                if (child.name === name) return child;
                if ((child = child.find(name))) return child;
            }

            return undefined;
        };


        Scene.prototype.toJSON = function(json) {
            json = Class.prototype.toJSON.call(this, json);
            var gameObjects = this.gameObjects,
                jsonGameObjects = json.gameObjects || (json.gameObjects = []),
                gameObject,
                i = gameObjects.length;

            json.name = this.name;
            json.world = this.world.toJSON(json.world);

            while (i--) {
                if ((gameObject = gameObjects[i])) jsonGameObjects[i] = gameObject.toJSON(jsonGameObjects[i]);
            }

            return json;
        };


        Scene.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);
            var jsonGameObjects = json.gameObjects,
                gameObject, jsonGameObject,
                i = jsonGameObjects.length;

            this.name = json.name;

            if (this.world._className === json.world._className) {
                this.world.fromJSON(json.world);
            } else {
                this.setWorld(Class.fromJSON(json.world));
            }

            while (i--) {
                if (!(jsonGameObject = jsonGameObjects[i])) continue;

                if ((gameObject = this._gameObjectJSONHash[jsonGameObject._id])) {
                    gameObject.fromJSON(jsonGameObject);
                } else {
                    this.addGameObject(Class.fromJSON(jsonGameObject));
                }
            }

            return this;
        };


        return Scene;
    }
);
