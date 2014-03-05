if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/core/game/loop",
        "odin/core/scene",
        //"odin/core/gui/gui",
        "odin/core/game/log"
    ],
    function(Class, Loop, Scene, Log) {
        "use strict";


        function BaseGame(opts) {
            opts || (opts = {});

            Class.call(this);

            this._loop = new Loop(this.loop, this);

            this.guis = [];
            this._guiHash = {};
            this._guiJSONHash = {};
            this._guiNameHash = {};

            this.scenes = [];
            this._sceneHash = {};
            this._sceneJSONHash = {};
            this._sceneNameHash = {};
        }

        Class.extend(BaseGame);


        BaseGame.prototype.init = function() {

            this._loop.resume();
            this.emit("init");

            return this;
        };


        BaseGame.prototype.clear = function() {
            var scenes = this.scenes,
                i = scenes.length;

            while (i--) this.removeScene(scenes[i], true);
            return this;
        };


        BaseGame.prototype.destroy = function() {

            this.emit("destroy");
            this.clear();

            return this;
        };


        BaseGame.prototype.addScene = function(scene) {
            if (!(scene instanceof Scene)) {
                Log.error("BaseGame.addScene: can't add argument to BaseGame, it's not an instance of Scene");
                return this;
            }
            var sceneHash = this._sceneHash,
                sceneNameHash = this._sceneNameHash,
                name = scene.name,
                id = scene._id,
                json;

            if (!sceneNameHash[name] && !sceneHash[id]) {
                json = scene.toJSON();

                sceneNameHash[name] = json;
                sceneHash[id] = json;
                this.scenes.push(json);
                if (scene._jsonId !== -1) this._sceneJSONHash[scene._jsonId] = json;

                this.emit("addScene", name);
            } else {
                Log.error("BaseGame.addScene: Scene is already a member of BaseGame");
            }

            return this;
        };


        BaseGame.prototype.addScenes = function() {

            for (var i = arguments.length; i--;) this.addScene(arguments[i]);
            return this;
        };


        BaseGame.prototype.removeScene = function(scene) {
            if (typeof(scene) === "string") {
                scene = this._sceneNameHash[scene];
            } else if (typeof(scene) === "number") {
                scene = this._sceneHash[scene];
            }
            var scenes = this.scenes,
                sceneHash = this._sceneHash,
                sceneNameHash = this._sceneNameHash,
                name = scene.name,
                id = scene._id,
                json;

            if (sceneNameHash[name] && sceneHash[id]) {
                json = sceneNameHash[name];

                sceneNameHash[name] = undefined;
                sceneHash[id] = undefined;
                scenes.splice(scenes.indexOf(json), 1);
                if (json._jsonId !== -1) this._sceneJSONHash[json._jsonId] = undefined;

                this.emit("removeScene", name);
            } else {
                Log.error("BaseGame.removeScene: Scene not a member of BaseGame");
            }

            return this;
        };


        BaseGame.prototype.removeScenes = function() {
			var i = arguments.length;

            while (i--) this.removeScene(arguments[i]);
            return this;
        };


        BaseGame.prototype.addGUI = function(gui) {
            if (!(gui instanceof GUI)) {
                Log.error("BaseGame.addGUI: can't add argument to BaseGame, it's not an instance of GUI");
                return this;
            }
            var guiHash = this._guiHash,
                guiNameHash = this._guiNameHash,
                name = gui.name,
                id = gui._id,
                json;

            if (!guiNameHash[name] && !guiHash[id]) {
                json = gui.toJSON();

                guiNameHash[name] = json;
                guiHash[id] = json;
                this.guis.push(json);
                if (gui._jsonId !== -1) this._guiJSONHash[gui._jsonId] = json;

                this.emit("addGUI", name);
            } else {
                Log.error("BaseGame.addGUI: GUI is already a member of BaseGame");
            }

            return this;
        };


        BaseGame.prototype.addGUIs = function() {
			var i = arguments.length;
			
            while (i--) this.addGUI(arguments[i]);
            return this;
        };


        BaseGame.prototype.removeGUI = function(gui) {
            if (typeof(gui) === "string") {
                gui = this._guiNameHash[gui];
            } else if (typeof(gui) === "number") {
                gui = this._guiHash[gui];
            }
            var guis = this.guis,
                guiHash = this._guiHash,
                guiNameHash = this._guiNameHash,
                name = gui.name,
                id = gui._id,
                json;

            if (guiNameHash[name] && guiHash[id]) {
                json = guiNameHash[name];

                guiNameHash[name] = undefined;
                guiHash[id] = undefined;
                guis.splice(guis.indexOf(json), 1);
                if (json._jsonId !== -1) this._guiJSONHash[json._jsonId] = undefined;

                this.emit("removeGUI", name);
            } else {
                Log.error("BaseGame.removeGUI: GUI not a member of BaseGame");
            }

            return this;
        };


        BaseGame.prototype.removeGUIs = function() {
			var i = arguments.length;

            while (i--) this.removeGUI(arguments[i]);
            return this;
        };


        BaseGame.prototype.findSceneByName = function(name) {

            return this._sceneNameHash[name];
        };


        BaseGame.prototype.findSceneById = function(id) {

            return this._sceneHash[id];
        };


        BaseGame.prototype.findSceneByJSONId = function(id) {

            return this._sceneJSONHash[id];
        };


        BaseGame.prototype.pause = function() {

            this._loop.pause();
            return this;
        };


        BaseGame.prototype.resume = function() {

            this._loop.resume();
            return this;
        };


        BaseGame.prototype.loop = function(ms) {

            this.emit("update", ms);
        };


        BaseGame.prototype.toJSON = function(json) {
            json = Class.prototype.toJSON.call(this, json);
            var scenes = this.scenes,
                jsonScenes = json.scenes || (json.scenes = []),
                i = scenes.length;

            while (i--) jsonScenes[i] = scenes[i];

            return json;
        };


        BaseGame.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);
            var jsonScenes = json.scenes,
				scenes = this.scenes,
                scene, jsonScene,
				i = jsonScenes.length,
				index;

            while (i--) {
                jsonScene = jsonScenes[i];

                if ((scene = this.findSceneByJSONId(jsonScene._id))) {
					this.removeScene(scene).addScene(jsonScene);
                } else {
                    this.addScene(jsonScene);
                }
            }

            return this;
        };


        return BaseGame;
    }
);
