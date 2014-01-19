if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/core/game_object",
        "odin/core/world",
        "odin/core/game/log"
    ],
    function(Class, GameObject, World, Log) {
        "use strict";


        var defineProperty = Object.defineProperty;


        function Scene(opts) {
            opts || (opts = {});

            Class.call(this);

            this.game = undefined;

            this._name = opts.name != undefined ? opts.name : "Scene_" + this._id;

            this.world = undefined;

            this.gameObjects = [];
            this._gameObjectHash = {};
            this._gameObjectServerHash = {};

            this.components = {};
            this._componentTypes = [];
            this._componentHash = {};
            this._componentHashServer = {};

            this.setWorld(opts.world instanceof World ? opts.world : new World(opts.world));
            if (opts.gameObjects) this.addGameObjects.apply(this, opts.gameObjects);
        }

        Class.extend(Scene);


        defineProperty(Scene.prototype, "name", {
            get: function() {
                return this._name;
            },
            set: function(value) {
                var game = this.game,
                    sceneNameHash;

                if (game) {
                    sceneNameHash = game._sceneNameHash;

                    if (sceneNameHash[value]) {
                        Log.warn("Scene.set name: can't change name to " + value + " Game already have an Scene with same name");
                        return;
                    }

                    delete sceneNameHash[this.name];
                    sceneNameHash[value] = this;
                }

                this._name = value;
            }
        });


        Scene.prototype.copy = function(other) {
            var otherGameObjects = other.gameObjects,
                i;

            this.clear();
            this.name = other.name + "." + this._id;

            for (i = otherGameObjects.length; i--;) this.addGameObject(otherGameObjects[i].clone());

            return this;
        };


        Scene.prototype.init = function() {
            var types = this._componentTypes,
                gameObjects = this.gameObjects,
                components, i, j;

            this.world && this.world.init();

            for (i = types.length; i--;) {
                components = types[i];
                for (j = components.length; j--;) components[j].init();
            }

            for (i = gameObjects.length; i--;) gameObjects[i].emit("init");
        };


        Scene.prototype.update = function() {
            var types = this._componentTypes,
                gameObjects = this.gameObjects,
                components, i, j;

            this.world && this.world.update();

            for (i = types.length; i--;) {
                components = types[i];
                for (j = components.length; j--;) components[j].update();
            }

            for (i = gameObjects.length; i--;) gameObjects[i].emit("update");
        };


        Scene.prototype.clear = function() {
            var gameObjects = this.gameObjects,
                i;

            this.world = undefined;

            for (i = gameObjects.length; i--;) this.removeGameObject(gameObjects[i], true);
            return this;
        };


        Scene.prototype.destroy = function() {
            if (!this.game) {
                Log.error("Scene.destroy: can't destroy Scene if it's not added to a Game");
                return this;
            }

            this.game.removeScene(this);
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
                components,
                i;

            if (index === -1) {
                if (gameObject.scene) gameObject.scene.removeGameObject(gameObject);

                gameObjects.push(gameObject);
                this._gameObjectHash[gameObject._id] = gameObject;
                if (gameObject._serverId !== -1) this._gameObjectServerHash[gameObject._serverId] = gameObject;

                gameObject.scene = this;

                components = gameObject.components;
                for (i = components.length; i--;) this._addComponent(components[i]);

                if (this.game) gameObject.emit("init");

                this.emit("addGameObject", gameObject);
            } else {
                Log.error("Scene.addGameObject: GameObject is already a member of Scene");
            }

            return this;
        };


        Scene.prototype.add = Scene.prototype.addGameObjects = function() {

            for (var i = arguments.length; i--;) this.addGameObject(arguments[i]);
            return this;
        };


        Scene.prototype._addComponent = function(component) {
            if (!component) return;
            var type = component._type,
                components = this.components,
                isNew = !components[type],
                types = (components[type] = components[type] || []);

            this._componentHash[component._id] = component;
            if (component._serverId !== -1) this._componentHashServer[component._serverId] = component;

            types.push(component);
            types.sort(component.sort);

            if (isNew) this._componentTypes.push(types);

            if (this.game) component.init();
            this.emit("add" + type, component);
            this.emit("addComponent", component);
        };


        Scene.prototype.removeGameObject = function(gameObject, clear) {
            if (!(gameObject instanceof GameObject)) {
                Log.error("Scene.removeGameObject: can't remove argument from Scene, it's not an instance of GameObject");
                return this;
            }
            var gameObjects = this.gameObjects,
                index = gameObjects.indexOf(gameObject),
                components,
                i;

            if (index !== -1) {
                gameObjects.splice(index, 1);
                this._gameObjectHash[gameObject._id] = undefined;
                if (gameObject._serverId !== -1) this._gameObjectServerHash[gameObject._serverId] = undefined;

                gameObject.scene = undefined;

                components = gameObject.components;
                for (i = components.length; i--;) this._removeComponent(components[i]);

                this.emit("removeGameObject", gameObject);
                if (clear) gameObject.clear();
            } else {
                Log.error("Scene.removeGameObject: GameObject is not a member of Scene");
            }

            return this;
        };


        Scene.prototype.remove = Scene.prototype.removeGameObjects = function() {

            for (var i = arguments.length; i--;) this.removeGameObject(arguments[i]);
            return this;
        };


        Scene.prototype._removeComponent = function(component) {
            if (!component) return;
            var type = component._type,
                components = this.components,
                types = components[type],
                index = types.indexOf(component);

            this._componentHash[component._id] = undefined;
            if (component._serverId !== -1) this._componentHashServer[component._serverId] = undefined;

            types.splice(index, 1);
            types.sort(component.sort);

            this.emit("remove" + type, component);
            this.emit("removeComponent", component);

            component.clear();
        };


        Scene.prototype.findByTag = function(tag, out) {
            out || (out = []);
            var gameObjects = this.gameObjects,
                gameObject, i = gameObjects.length;

            for (; i--;) {
                if ((gameObject = gameObjects[i]).hasTag(tag)) out.push(gameObject);
            }

            return out;
        };


        Scene.prototype.findByTagFirst = function(tag) {
            var gameObjects = this.gameObjects,
                gameObject, i = gameObjects.length;

            for (; i--;) {
                if ((gameObject = gameObjects[i]).hasTag(tag)) return gameObject;
            }

            return out;
        };


        Scene.prototype.findById = function(id) {

            return this._gameObjectHash[id];
        };


        Scene.prototype.findByServerId = function(id) {

            return this._gameObjectServerHash[id];
        };


        Scene.prototype.findComponentById = function(id) {

            return this._componentHash[id];
        };


        Scene.prototype.findComponentByServerId = function(id) {

            return this._componentHashServer[id];
        };


        Scene.prototype.toSYNC = function(json) {
            if (!this._needsSync) return this._SYNC;
            json = Class.prototype.toSYNC.call(this, json);
            var gameObjects = this.gameObjects,
                jsonGameObjects = json.gameObjects || (json.gameObjects = []),
                gameObject,
                i;

            if (this.world.sync) json.world = this.world.toSYNC(json.world);

            for (i = gameObjects.length; i--;) {
                if ((gameObject = gameObjects[i]).sync) jsonGameObjects[i] = gameObject.toSYNC(jsonGameObjects[i]);
            }
            this._needsSync = false;

            return json;
        };


        Scene.prototype.fromSYNC = function(json) {
            Class.prototype.fromSYNC.call(this, json);
            var jsonGameObjects = json.gameObjects,
                gameObject, jsonGameObject,
                i;

            if (json.world) this.world.fromSYNC(json.world);

            for (i = jsonGameObjects.length; i--;) {
                if (!(jsonGameObject = jsonGameObjects[i])) continue;
                if ((gameObject = this.findByServerId(jsonGameObject._id))) gameObject.fromSYNC(jsonGameObject);
            }

            return this;
        };


        Scene.prototype.toJSON = function(json) {
            json = Class.prototype.toJSON.call(this, json);
            var gameObjects = this.gameObjects,
                jsonGameObjects = json.gameObjects || (json.gameObjects = []),
                gameObject,
                i;

            json.name = this.name;
            json.world = this.world.toJSON(json.world);

            for (i = gameObjects.length; i--;) {
                if ((gameObject = gameObjects[i]).json) jsonGameObjects[i] = gameObject.toJSON(jsonGameObjects[i]);
            }

            return json;
        };


        Scene.prototype.fromServerJSON = function(json) {
            Class.prototype.fromServerJSON.call(this, json);
            var jsonGameObjects = json.gameObjects,
                gameObject, jsonGameObject,
                i;

            this.name = json.name;
            this.world = Class.fromJSON(json.world);

            for (i = jsonGameObjects.length; i--;) {
                if (!(jsonGameObject = jsonGameObjects[i])) continue;

                if ((gameObject = this.findByServerId(jsonGameObject._id))) {
                    gameObject.fromServerJSON(jsonGameObject);
                } else {
                    this.addGameObject(Class.fromServerJSON(jsonGameObject));
                }
            }

            return this;
        };


        Scene.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);
            var jsonGameObjects = json.gameObjects,
                gameObject, jsonGameObject,
                i;

            this.name = json.name;
            this.world = Class.fromJSON(json.world);

            for (i = jsonGameObjects.length; i--;) {
                if (!(jsonGameObject = jsonGameObjects[i])) continue;

                if ((gameObject = this.findById(jsonGameObject._id))) {
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
