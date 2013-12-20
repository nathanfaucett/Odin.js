if (typeof define !== 'function') { var define = require('amdefine')(module) }
define([
        "odin/base/class",
        "odin/base/device",
        "odin/base/time",
        "odin/core/game/config",
        "odin/core/game/game",
        "odin/core/game/log",
        "odin/core/rendering/canvas",
        "odin/core/rendering/canvas_renderer_2d",
        "odin/core/rendering/webgl_renderer_2d",
        "odin/core/game_object",
        "odin/core/components/component",
        "odin/core/scene",
        "odin/core/input/input",
        "odin/core/input/handler",
		"odin/core/assets/assets",
		"odin/core/assets/asset_loader"
    ],
    function(Class, Device, Time, Config, Game, Log, Canvas, CanvasRenderer2D, WebGLRenderer2D, GameObject, Component, Scene, Input, Handler, Assets, AssetLoader) {
        "use strict";


        var now = Time.now,
            stamp = Time.stamp;


        function ClientGame(opts) {
            opts || (opts = {});
            Config.fromJSON(opts);

            Game.call(this, opts);

            this.io = undefined;
			this._sessionid = undefined;

            this._handler = Handler;
            this.input = Input;

            this.scene = undefined;
            this.camera = undefined;
			
            this.canvas = new Canvas(opts.width, opts.height);

			this.CanvasRenderer2D = undefined;
			this.WebGLRenderer2D = undefined;

			this._optsCanvasRenderer2D = opts.CanvasRenderer2D;
			this._optsWebGLRenderer2D = opts.WebGLRenderer2D;

            this.renderer = undefined;
        }
		
        Class.extend(ClientGame, Game);


        ClientGame.prototype.init = function() {
            this.canvas.init();
			
            this._loop.init();
            this.emit("init");
			
            return this;
        };


        ClientGame.prototype.connect = function(handler) {
            var self = this,
                socket;

            this.io = socket = io.connect();

            socket.on("connect", function() {
				if (!self._sessionid) self._sessionid = this.socket.sessionid;
				if (self._sessionid !== this.socket.sessionid) location.reload();
				
                socket.emit("client_device", Device);
            });

            socket.on("server_ready", function(game, assets) {
				
				Assets.fromJSON(assets);
				
				AssetLoader.load(function() {
					self.fromJSON(game);
					
					socket.emit("client_ready");
	
					self.emit("connect", socket);
					if (handler) handler.call(self, socket);
				});
            });

            socket.on("server_sync_input", function() {
				
                socket.emit("client_sync_input", Input.toSYNC());
            });
			
            socket.on("server_sync_scene", function(jsonScene) {
				var scene = self.scene;
				if (!scene) return;
				
				scene.fromSYNC(jsonScene);
            });

            socket.on("server_setScene", function(scene_id) {
                var scene = self.findByServerId(scene_id);

                self.setScene(scene);
            });

            socket.on("server_setCamera", function(camera_id) {
                if (!self.scene) {
                    Log.warn("Socket:server_setCamera: can't set camera without an active scene, use ServerGame.setScene first");
                    return;
                }
                var camera = self.scene.findByServerId(camera_id),
                    canvas = self.canvas;

                if (!camera) {
                    Log.warn("Socket:server_setCamera: can't find camera in active scene");
                    return;
                }
                self.setCamera(camera);

                canvas.on("resize", function() {

                    socket.emit("client_resize", this.pixelWidth, this.pixelHeight);
                });
                socket.emit("client_resize", canvas.pixelWidth, canvas.pixelHeight);
            });

            socket.on("server_addScene", function(scene) {

                self.addScene(new Scene().fromJSON(scene));
            });

            socket.on("server_addGameObject", function(scene_id, gameObject) {
                var scene = self.findByServerId(scene_id);
                if (!scene) return;

                scene.addGameObject(new GameObject().fromJSON(gameObject));
            });

            socket.on("server_addComponent", function(scene_id, gameObject_id, component) {
                var scene = self.findByServerId(scene_id);
                if (!scene) return;

                var gameObject = scene.findByServerId(gameObject_id);
                if (!gameObject) return;

                gameObject.addComponent(new Component._types[component._type].fromJSON(component));
            });


            socket.on("server_removeScene", function(scene_id) {

                self.removeScene(self.findByServerId(scene_id));
            });

            socket.on("server_removeGameObject", function(scene_id, gameObject_id) {
                var scene = self.findByServerId(scene_id);
                if (!scene) return;

                scene.removeGameObject(scene.findByServerId(gameObject_id));
            });

            socket.on("server_removeComponent", function(scene_id, gameObject_id, component_type) {
                var scene = self.findByServerId(scene_id);
                if (!scene) return;

                var gameObject = scene.findByServerId(gameObject_id);
                if (!gameObject) return;
				
                gameObject.removeComponent(gameObject.getComponent(component_type));
            });

            return this;
        };


        ClientGame.prototype.disconnect = function() {
            var socket = this.io;
			
			socket.disconnect();
			socket.removeAllListeners();
			this._sessionid = undefined;
			
			return this;
        };


        ClientGame.prototype.setScene = function(scene) {
            if (!(scene instanceof Scene)) {
                Log.warn("ClientGame.setScene: can't add passed argument, it is not instance of Scene");
                return this;
            }
            var scenes = this.scenes,
                index = scenes.indexOf(scene);

            if (index !== -1) {
                this.scene = scene;
				this.emit("setScene", scene);
            } else {
                Log.warn("ClientGame.setScene: Scene is not a member of Game");
            }

            return this;
        };


        ClientGame.prototype.setCamera = function(gameObject) {
            if (!(gameObject instanceof GameObject)) {
                Log.warn("Scene.addGameObject: can't add argument to Scene, it's not an instance of GameObject");
                return this;
            }
            var scene = this.scene,
                lastCamera = this.camera,
                index;

            if (!scene) {
                Log.warn("ClientGame.setCamera: can't set camera without an active scene, use ClientGame.setScene first");
                return this;
            }

            index = scene.gameObjects.indexOf(gameObject);
            if (index === -1) {
                Log.warn("ClientGame.setCamera: GameObject is not a member of the active Scene, adding it...");
                scene.addGameObject(gameObject);
            }

            this.camera = gameObject.camera || gameObject.camera2d;

            if (this.camera) {
                this.camera._active = true;
                if (lastCamera) lastCamera._active = false;

                this.updateRenderer();
				this.emit("setCamera", this.camera);
            } else {
                Log.warn("ClientGame.setCamera: GameObject does't have a Camera or a Camera2D Component");
            }

            return this;
        };


        ClientGame.prototype.updateRenderer = function() {
            var camera = this.camera,
                lastRenderer = this.renderer,
				canvas = this.canvas,
                gameObject;
			
            if (!camera) return;
            gameObject = camera.gameObject;
			
			if (Config.renderer && this[Config.renderer]) {
				this.renderer = this[Config.renderer];
				Log.log("Game: setting up "+ Config.renderer);
			} else {
				if (gameObject.camera) {
					Log.warn("Game.updateRenderer: no renderer for camera component yet");
				} else if (gameObject.camera2d) {
					if (!Config.forceCanvas && Device.webgl) {
						this.renderer = this.WebGLRenderer2D || (this.WebGLRenderer2D = new WebGLRenderer2D(this._optsWebGLRenderer2D));
						Log.log("Game: setting up WebGLRenderer2D");
					} else if (Device.canvas) {
						this.renderer = this.CanvasRenderer2D || (this.CanvasRenderer2D = new CanvasRenderer2D(this._optsCanvasRenderer2D));
						Log.log("Game: setting up CanvasRenderer2D");
					} else {
						Log.error("Game.updateRenderer: Could not get a renderer for this device");
					}
				}
			}

            if (lastRenderer === this.renderer) return;
            if (lastRenderer) lastRenderer.destroy();
			
			this.renderer.init(canvas);
            Handler.setElement(canvas.element);
        };


        var frameCount = 0,
            last = -1 / 60,
            time = 0,
            delta = 1 / 60,
            fpsFrame = 0,
            fpsLast = 0,
            fpsTime = 0;

        ClientGame.prototype.loop = function(ms) {
            var camera = this.camera,
                scene = this.scene,
                gameObjects,
				MIN_DELTA = Config.MIN_DELTA,
				MAX_DELTA = Config.MAX_DELTA,
                i;

            Time.frameCount = frameCount++;

            last = time;
            time = now();
            Time.sinceStart = time;

            fpsTime = time;
            fpsFrame++;

            if (fpsLast + 1 < fpsTime) {
                Time.fps = fpsFrame / (fpsTime - fpsLast);

                fpsLast = fpsTime;
                fpsFrame = 0;
            }

            delta = (time - last) * Time.scale;
            Time.delta = delta < MIN_DELTA ? MIN_DELTA : delta > MAX_DELTA ? MAX_DELTA : delta;

            Time.time = time * Time.scale;

            Input.update();

            if (scene) {
                scene.update();
                if (camera) this.renderer.render(scene, camera);
            }

            this.emit("update", time);
        }


        return ClientGame;
    }
);
