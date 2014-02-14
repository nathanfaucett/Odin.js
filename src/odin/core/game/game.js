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
        "odin/core/renderer/canvas",
        "odin/core/renderer/renderer",
        "odin/core/game_object",
        "odin/core/components/component",
        "odin/core/scene",
        "odin/core/input/input",
        "odin/core/input/handler"
    ],
    function(Class, Device, Time, Mathf, Config, BaseGame, Log, Canvas, Renderer, GameObject, Component, Scene, Input, Handler) {
        "use strict";


        var now = Time.now;


        function Game(opts) {
            opts || (opts = {});
            Config.fromJSON(opts);

            BaseGame.call(this, opts);

            this._handler = Handler;
            this.input = Input;

            this.gui = undefined;

            this.scene = undefined;
            this.camera = undefined;

            this.canvas = new Canvas(opts.canvas);
            this.renderer = new Renderer(opts.renderer);
        }

        BaseGame.extend(Game);


        Game.prototype.init = function() {
            var canvas = this.canvas;

            canvas.init();
            this.renderer.init(canvas);
            Handler.setElement(canvas.element);

            this._loop.resume();
            this.emit("init");

            return this;
        };


        Game.prototype.setGUI = function(gui) {
            if (typeof(gui) === "string") {
                gui = this._guiNameHash[gui];
            } else if (typeof(gui) === "number") {
                gui = this.guis[gui];
            }

            if (this._guiNameHash[gui.name] && this._guiHash[gui._id]) {
                if (this.gui) this.gui.destroy();

                gui = Class.fromJSON(gui);
                this.gui = gui;

                gui.game = this;
                gui.init();

                this.emit("setGUI", this.gui);
            } else {
                Log.error("Game.setGUI: GUI is not a member of Game");
            }

            return this;
        };


        Game.prototype.setScene = function(scene) {
            if (typeof(scene) === "string") {
                scene = this._sceneNameHash[scene];
            } else if (typeof(scene) === "number") {
                scene = this.scenes[scene];
            }

            if (this._sceneNameHash[scene.name] && this._sceneHash[scene._id]) {
                if (this.scene) this.scene.destroy();

                scene = Class.fromJSON(scene);
                this.scene = scene;

                scene.game = this;
                scene.init();

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

                this.emit("setCamera", this.camera);
            } else {
                Log.error("Game.setCamera: GameObject does't have a Camera or a Camera2D Component");
            }

            return this;
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
                gui = this.gui,
                renderer = this.renderer,
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

            if (camera) {
                renderer.preRender(scene, gui, camera);

                if (scene) {
                    scene.emit("update");
                    scene.update();

                    renderer.render(scene, camera);
                }
                if (gui) {
                    gui.aspect = camera.aspect;
                    gui.width = camera.width;
                    gui.height = camera.height;
                    gui.invWidth = camera.invWidth;
                    gui.invHeight = camera.invHeight;

                    gui.emit("update");
                    gui.update();

                    renderer.renderGUI(gui, camera);
                }
            }

            this.emit("update", time);
        }


        return Game;
    }
);
