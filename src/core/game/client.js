if (typeof define !== 'function') { var define = require('amdefine')(module) }
define([
        "base/class",
		"core/input/input",
		"core/scene",
		"core/game/log"
    ],
    function(Class, Input, Scene, Log) {
        "use strict";


        function Client(opts) {
            opts || (opts = {});

            Class.call(this);
			
			this.id = opts.id;
			this.socket = opts.socket;
			this.device = opts.device;
			this.input = new Input.constructor;
			this.game = opts.game;
			
			this.scene = undefined;
			this.camera = undefined;
			
			this.userData = {};
			this._inputNeedsUpdate = true;
        }
        Class.extend(Client, Class);

		
		Client.prototype.setScene = function(scene) {
			if (!(scene instanceof Scene)) {
                Log.warn("Client.setScene: can't add passed argument, it is not instance of Scene");
                return this;
            }
            var scenes = this.game.scenes,
                index = scenes.indexOf(scene);

            if (index !== -1) {
				scene.game = this.game;
				this.scene = scene;
				this.socket.emit("server_setScene", scene._id);
				this.emit("setScene", scene);
			} else {
				Log.warn("Client.setScene: Scene is not a member of Game");
			}

            return this;
        };
		
		
		Client.prototype.setCamera = function(gameObject) {
            var scene = this.scene,
                lastCamera = this.camera,
                index;

            if (!scene) {
                Log.warn("Client.setCamera: can't set camera without an active scene, use Client.setScene first");
                return this;
            }

            index = scene.gameObjects.indexOf(gameObject);
            if (index === -1) {
                Log.warn("Client.setCamera: GameObject is not a member of the active Scene, adding it...");
                scene.addGameObject(gameObject);
            }

            this.camera = gameObject.camera || gameObject.camera2d;

            if (this.camera) {
                this.camera._active = true;
                if (lastCamera) lastCamera._active = false;
				
				this.socket.emit("server_setCamera", gameObject._id);
				this.emit("setCamera", this.camera);
            } else {
				Log.warn("Client.setCamera: GameObject does't have a Camera or a Camera2D Component");
			}

            return this;
        };
		

        return Client;
    }
);
