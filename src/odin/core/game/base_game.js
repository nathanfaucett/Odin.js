if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/core/game/loop",
        "odin/core/scene",
        "odin/core/game/log"
    ],
    function(Class, Loop, Scene, Log) {
        "use strict";


        function BaseGame(opts) {
            opts || (opts = {});

            Class.call(this);

            this._loop = new Loop(this.loop, this);

            this.scenes = [];
            this._sceneHash = {};
            this._sceneServerHash = {};
            this._sceneNameHash = {};
        }

        Class.extend(BaseGame);


        BaseGame.prototype.clear = function() {
            var scenes = this.scenes,
                i;

            for (i = scenes.length; i--;) this.removeScene(scenes[i], true);
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
                if (scene._serverId !== -1) this._sceneServerHash[scene._serverId] = json;

                this.emit("addScene", name);
            } else {
                Log.error("BaseGame.addScene: Scene is already a member of BaseGame");
            }

            return this;
        };


        BaseGame.prototype.add = BaseGame.prototype.addScenes = function() {

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
                if (json._serverId !== -1) this._sceneServerHash[json._serverId] = undefined;

                this.emit("removeScene", name);
            } else {
                Log.error("BaseGame.removeScene: Scene not a member of BaseGame");
            }

            return this;
        };


        BaseGame.prototype.remove = BaseGame.prototype.removeScenes = function() {

            for (var i = arguments.length; i--;) this.removeScene(arguments[i]);
            return this;
        };


        BaseGame.prototype.findByName = function(name) {

            return this._sceneNameHash[name];
        };


        BaseGame.prototype.findById = function(id) {

            return this._sceneHash[id];
        };


        BaseGame.prototype.findByServerId = function(id) {

            return this._sceneServerHash[id];
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
                i;

            for (i = scenes.length; i--;) jsonScenes[i] = scenes[i].toJSON(jsonScenes[i]);

            return json;
        };


        BaseGame.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);
            var jsonScenes = json.scenes,
                scene, jsonScene,
                i;

            for (i = jsonScenes.length; i--;) {
                jsonScene = jsonScenes[i];

                if ((scene = this.findById(jsonScene._id))) {
                    scene.fromJSON(jsonScene);
                } else {
                    this.addScene(new Scene().fromJSON(jsonScene));
                }
            }

            return this;
        };


        return BaseGame;
    }
);
