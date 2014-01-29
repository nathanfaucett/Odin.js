if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/base/device",
        "odin/base/time",
        "odin/math/mathf",
        "odin/core/game/config",
        "odin/core/game/base_game",
        "odin/core/game/log",
        "odin/core/rendering/canvas",
        "odin/core/rendering/canvas_renderer_2d",
        "odin/core/rendering/webgl_renderer_2d",
        "odin/core/rendering/webgl_renderer",
        "odin/core/game_object",
        "odin/core/components/component",
        "odin/core/scene",
        "odin/core/input/input",
        "odin/core/input/handler"
    ],
    function(Class, Device, Time, Mathf, Config, BaseGame, Log, Canvas, CanvasRenderer2D, WebGLRenderer2D, WebGLRenderer, GameObject, Component, Scene, Input, Handler) {
        "use strict";


        var now = Time.now;


        function Game(opts) {
            opts || (opts = {});
            Config.fromJSON(opts);

            BaseGame.call(this, opts);

            this._handler = Handler;
            this.input = Input;

            this.scene = undefined;
            this.camera = undefined;

            this.canvas = new Canvas(opts.width, opts.height);

            this.CanvasRenderer2D = undefined;
            this.WebGLRenderer2D = undefined;
            this.WebGLRenderer = undefined;

            this._CanvasRenderer2DOptions = opts.CanvasRenderer2DOptions;
            this._WebGLRenderer2DOptions = opts.WebGLRenderer2DOptions;
            this._WebGLRendererOptions = opts.WebGLRendererOptions;

            this.renderer = undefined;
            this.customRenderer = undefined;
        }

        BaseGame.extend(Game);


        Game.prototype.init = function() {

            this.canvas.init();

            this._loop.resume();
            this.emit("init");

            return this;
        };


        Game.prototype.setScene = function(scene) {
            if (typeof(scene) === "string") {
                scene = this._sceneNameHash[scene];
            } else if (typeof(scene) === "number") {
                scene = this.scenes[scene];
            }

            if (this._sceneNameHash[scene.name] && this._sceneHash[scene._id]) {
                scene = Class.fromJSON(scene);

                scene.game = this;
                scene.init();
                this.scene = scene;

                this.emit("setScene", this.scene);
            } else {
                Log.error("Game.setScene: Scene is not a member of Game");
            }

            return this;
        };


        Game.prototype.setCamera = function(gameObject) {
            if (!(gameObject instanceof GameObject)) {
                Log.error("Game.setCamera: can't set argument to Game's Active Camera, it's not an instance of GameObject");
                return this;
            }
            var scene = this.scene,
                lastCamera = this.camera,
                index;

            if (!scene) {
                Log.error("Game.setCamera: can't set camera without an active scene, use Game.setScene first");
                return this;
            }

            index = scene.gameObjects.indexOf(gameObject);
            if (index === -1) {
                Log.warn("Game.setCamera: GameObject is not a member of the active Scene, adding it...");
                scene.addGameObject(gameObject);
            }

            this.camera = gameObject.camera || gameObject.camera2d;

            if (this.camera) {
                this.camera._active = true;
                if (lastCamera) lastCamera._active = false;

                this.updateRenderer();
                this.emit("setCamera", this.camera);
            } else {
                Log.error("Game.setCamera: GameObject does't have a Camera or a Camera2D Component");
            }

            return this;
        };


        Game.prototype.updateRenderer = function() {
            var camera = this.camera,
                lastRenderer = this.renderer,
                canvas = this.canvas,
                gameObject;

            if (!camera) {
                Log.error("Game: can't set Renderer without a Camera");
                return;
            }
            gameObject = camera.gameObject;

            if (typeof(this.customRenderer) === "function") {
                this.renderer = this.customRenderer;
                Log.log("Game: setting up custom renderer " + this.customRenderer.name);
            } else {
                if (gameObject.camera) {
                    if (Device.webgl) {
                        this.renderer = this.WebGLRenderer || (this.WebGLRenderer = new WebGLRenderer(this._WebGLRendererOptions));
                        Log.log("Game: setting up WebGLRenderer");

                        Log.error("Game: WebGLRenderer not supported yet");
                    }
                } else if (gameObject.camera2d) {
                    if (!Config.forceCanvas && Device.webgl) {
                        this.renderer = this.WebGLRenderer2D || (this.WebGLRenderer2D = new WebGLRenderer2D(this._WebGLRenderer2DOptions));
                        Log.log("Game: setting up WebGLRenderer2D");
                    } else if (Device.canvas) {
                        this.renderer = this.CanvasRenderer2D || (this.CanvasRenderer2D = new CanvasRenderer2D(this._CanvasRenderer2DOptions));
                        Log.log("Game: setting up CanvasRenderer2D");
                    } else {
                        Log.error("Game.updateRenderer: Could not get a renderer for this device");
                    }
                }
            }

            if (lastRenderer === this.renderer) return;
            if (lastRenderer) lastRenderer.clear();

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

        Game.prototype.loop = function() {
            var camera = this.camera,
                scene = this.scene,
                MIN_DELTA = Config.MIN_DELTA,
                MAX_DELTA = Config.MAX_DELTA;

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


        return Game;
    }
);
