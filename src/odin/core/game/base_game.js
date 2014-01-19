if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/core/game/loop",
        "odin/core/scene",
        "odin/core/gui/gui",
        "odin/core/game/log"
    ],
    function(Class, Loop, Scene, GUI, Log) {
        "use strict";


        function Game(opts) {
            opts || (opts = {});

            Class.call(this);

            this._loop = new Loop(this.loop, this);

            this.scenes = [];
            this._sceneHash = {};
            this._sceneServerHash = {};
            this._sceneNameHash = {};
        }

        Class.extend(Game);


        Game.prototype.clear = function() {
            var scenes = this.scenes,
                i;

            for (i = scenes.length; i--;) this.removeScene(scenes[i], true);
            return this;
        };


        Game.prototype.destroy = function() {

            this.emit("destroy");
            this.clear();

            return this;
        };


        Game.prototype.addScene = function(scene) {
            if (!(scene instanceof Scene)) {
                Log.error("Game.addScene: can't add argument to Game, it's not an instance of Scene");
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
                Log.error("Game.addScene: Scene is already a member of Game");
            }

            return this;
        };


        Game.prototype.add = Game.prototype.addScenes = function() {

            for (var i = arguments.length; i--;) this.addScene(arguments[i]);
            return this;
        };


        Game.prototype.removeScene = function(scene) {
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
                Log.error("Game.removeScene: Scene not a member of Game");
            }

            return this;
        };


        Game.prototype.remove = Game.prototype.removeScenes = function() {

            for (var i = arguments.length; i--;) this.removeScene(arguments[i]);
            return this;
        };


        Game.prototype.findByName = function(name) {

            return this._sceneNameHash[name];
        };


        Game.prototype.findById = function(id) {

            return this._sceneHash[id];
        };


        Game.prototype.findByServerId = function(id) {

            return this._sceneServerHash[id];
        };


        Game.prototype.pause = function() {

            this._loop.pause();
            return this;
        };


        Game.prototype.resume = function() {

            this._loop.resume();
            return this;
        };


        Game.prototype.loop = function(ms) {

            this.emit("update", ms);
        };


        Game.prototype.toSYNC = function(json) {
            json = Class.prototype.fromSYNC.call(this, json);
            var scenes = this.scenes,
                jsonScenes = json.jsonScenes || (json.jsonScenes = []),
                i;

            for (i = scenes.length; i--;) jsonScenes[i] = scenes[i].toSYNC(jsonScenes[i]);

            return json;
        };


        Game.prototype.fromSYNC = function(json) {
            Class.prototype.fromSYNC.call(this, json);
            var jsonScenes = json.scenes,
                scene, jsonScene,
                i;

            for (i = jsonScenes.length; i--;) {
                jsonScene = jsonScenes[i];

                if ((scene = this.findByServerId(jsonScene._serverId))) scene.fromSYNC(jsonScene);
            }

            return this;
        };


        Game.prototype.toJSON = function(json) {
            json = Class.prototype.toJSON.call(this, json);
            var scenes = this.scenes,
                jsonScenes = json.scenes || (json.scenes = []),
                i;

            for (i = scenes.length; i--;) jsonScenes[i] = scenes[i].toJSON(jsonScenes[i]);

            return json;
        };


        Game.prototype.fromServerJSON = function(json) {
            Class.prototype.fromServerJSON.call(this, json);
            var jsonScenes = json.scenes,
                scene, jsonScene,
                i;

            for (i = jsonScenes.length; i--;) {
                jsonScene = jsonScenes[i];

                if ((scene = this.findByServerId(jsonScene._id))) {
                    scene.fromServerJSON(jsonScene);
                } else {
                    this.addScene(new Scene().fromServerJSON(jsonScene));
                }
            }

            return this;
        };


        Game.prototype.fromJSON = function(json) {
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


        return Game;
    }
);
