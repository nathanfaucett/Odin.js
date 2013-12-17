define([
		"odin/base/class",
		"odin/core/game_object"
	],
    function(Class, GameObject) {
        "use strict";
		
		
        function Scene(opts) {
			opts || (opts = {});
			
			Class.call(this);
			
			this.game = undefined;
			
			this.gameObjects = [];
			this._gameObjectHash = {};
			this._gameObjectServerHash = {};
			
            this.components = {};
            this._componentTypes = [];
            this._componentHash = {};
            this._componentHashServer = {};

            if (opts.gameObjects) this.addGameObjects.apply(this, opts.gameObjects);
		}
		
		Class.extend(Scene, Class);
		
		
		Scene.prototype.init = function() {
			var types = this._componentTypes,
				gameObjects = this.gameObjects,
				components, i, j;
			
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
			
			for (i = types.length; i--;) {
				components = types[i];
				for (j = components.length; j--;) components[j].update();
			}
			
			for (i = gameObjects.length; i--;) gameObjects[i].emit("update");
		};


        Scene.prototype.clear = function() {
			var gameObjects = this.gameObjects,
                i;
                
            for (i = gameObjects.length; i--;) this.removeGameObject(gameObjects[i]);
            return this;
        };


        Scene.prototype.destroy = function() {
            if (!this.game) {
                console.warn("Scene.destroy: can't destroy Scene if it's not added to a Game");
                return this;
            }

            this.game.removeScene(this);
            this.emit("destroy");
			
			this.clear();

            return this;
        };
		
		
		Scene.prototype.addGameObject = function(gameObject) {
			if (!(gameObject instanceof GameObject)) {
				console.warn("Scene.addGameObject: can't add argument to Scene, it's not an instance of GameObject");
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
				console.warn("Scene.addGameObject: GameObject is already a member of Scene");
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
		
		
		Scene.prototype.removeGameObject = function(gameObject) {
			if (!(gameObject instanceof GameObject)) {
				console.warn("Scene.removeGameObject: can't remove argument from Scene, it's not an instance of GameObject");
				return this;
			}
			var gameObjects = this.gameObjects,
				index = gameObjects.indexOf(gameObject),
				components, component,
				i;
			
			if (index !== -1) {
				gameObjects.splice(index, 1);
				this._gameObjectHash[gameObject._id] = undefined;
				if (gameObject._serverId !== -1) this._gameObjectServerHash[gameObject._serverId] = undefined;
				
				gameObject.scene = undefined;
				
				components = gameObject.components;
				for (i = components.length; i--;) this._removeComponent(components[i]);

                this.emit("removeGameObject", gameObject);
			} else {
				console.warn("Scene.removeGameObject: GameObject is not a member of Scene");
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
			
            this._componentHash[component._id] = component;
            if (component._serverId !== -1) this._componentHashServer[component._serverId] = component;

            types.splice(index, 1);
            types.sort(component.sort);
			
            this.emit("remove" + type, component);
            this.emit("removeComponent", component);
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
			json = Class.prototype.toSYNC.call(this, json);
			var gameObjects = this.gameObjects,
				jsonGameObjects = json.gameObjects || (json.gameObjects = []),
				gameObject,
				i;
			
			for (i = gameObjects.length; i--;) if ((gameObject = gameObjects[i]).sync) jsonGameObjects[i] = gameObject.toSYNC(jsonGameObjects[i]);
			return json;
		};


		Scene.prototype.fromSYNC = function(json, alpha) {
			Class.prototype.fromSYNC.call(this, json);
			var gameObjects = this.gameObjects,
				jsonGameObjects = json.gameObjects,
				gameObject, jsonGameObject,
				i;
			
			for (i = jsonGameObjects.length; i--;) {
				if (!(jsonGameObject = jsonGameObjects[i])) continue;
				
				if ((gameObject = this.findByServerId(jsonGameObject._id))) gameObject.fromSYNC(jsonGameObject, alpha);
			}
			
			return this;
		};


		Scene.prototype.toJSON = function(json) {
			json || (json = {});
			Class.prototype.toJSON.call(this, json);
			var gameObjects = this.gameObjects,
				jsonGameObjects = json.gameObjects || (json.gameObjects = []),
				gameObject,
				i;
			
			for (i = gameObjects.length; i--;) if ((gameObject = gameObjects[i]).json) jsonGameObjects[i] = gameObject.toJSON(jsonGameObjects[i]);
			return json;
		};


		Scene.prototype.fromJSON = function(json) {
			Class.prototype.fromJSON.call(this, json);
			var gameObjects = this.gameObjects,
				jsonGameObjects = json.gameObjects,
				gameObject, jsonGameObject,
				i;
			
			for (i = jsonGameObjects.length; i--;) {
				if (!(jsonGameObject = jsonGameObjects[i])) continue;
				
				if ((gameObject = this.findByServerId(jsonGameObject._id))) {
					gameObject.fromJSON(jsonGameObject);
				} else {
					this.addGameObject(new GameObject().fromJSON(jsonGameObject));
				}
			}
			
			return this;
		};


		return Scene;
    }
);