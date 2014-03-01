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
        "odin/core/rendering/renderer",
        "odin/core/renderer/renderer_2d",
        "odin/core/game_object",
        "odin/core/components/component",
        "odin/core/scene",
        "odin/core/input/input",
        "odin/core/input/handler"
    ],
    function(Class, Device, Time, Mathf, Config, BaseGame, Log, Canvas, Renderer, Renderer2D, GameObject, Component, Scene, Input, Handler) {
        "use strict";


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
            this.renderer = undefined;

            this._Renderer = undefined;
            this._RendererOptions = opts.renderer;

            this._Renderer2D = undefined;
            this._Renderer2DOptions = opts.renderer2d;
        }

        BaseGame.extend(Game);


        Game.prototype.init = function() {

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

                this.updateRenderer();
                this.emit("setCamera", this.camera);
            } else {
                Log.error("Game.setCamera: GameObject does't have a Camera or a Camera2D Component");
            }

            return this;
        };


        Game.prototype.updateRenderer = function() {
            var lastRenderer = this.renderer,
                camera = this.camera,
                canvas = this.canvas;

            if (camera.camera2d) {
                this._Renderer2D = this._Renderer2D || new Renderer2D(this._Renderer2DOptions);
                this.renderer = this._Renderer2D;
            } else {
                this._Renderer = this._Renderer || new Renderer(this._RendererOptions);
                this.renderer = this._Renderer;
            }

            if (lastRenderer !== this.renderer) {
                if (lastRenderer) lastRenderer.clear();
                canvas.clear();

                canvas.init();
                this.renderer.init(canvas);
                Handler.setElement(canvas.element);
            }
        };


        Game.prototype.loop = function() {
            var camera = this.camera,
                scene = this.scene,
                gui = this.gui,
                renderer = this.renderer;

            Time.update();
            Input.update();

            this.emit("update", Time.sinceStart);

            if (renderer && camera) {
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
        }


        return Game;
    }
);
