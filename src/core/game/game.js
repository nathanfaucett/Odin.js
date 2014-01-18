if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/class",
        "core/game/loop",
        "core/scene",
        "core/gui/gui",
        "core/game/log"
    ],
    function(Class, Loop, Scene, GUI, Log) {
        "use strict";


        function Game(opts) {
            opts || (opts = {});

            Class.call(this);

            this._loop = new Loop(this.loop, this);

            this.scenes = [];
            this._scenesJSON = [];
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
                Log.warn("Game.addScene: can't add argument to Game, it's not an instance of Scene");
                return this;
            }
            var scenes = this.scenes,
                index = scenes.indexOf(scene);

            if (index === -1) {
                if (scene.game) scene.game.removeScene(scene);

                scenes.push(scene);
                this._scenesJSON.push(scene.toJSON());
                this._sceneNameHash[scene.name] = scene;
                this._sceneHash[scene._id] = scene;
                if (scene._serverId !== -1) this._sceneServerHash[scene._serverId] = scene;

                scene.game = this;
                scene.save();
                scene.init();

                this.emit("addScene", scene);
            } else {
                Log.warn("Game.addScene: Scene is already a member of Game");
            }

            return this;
        };


        Game.prototype.add = Game.prototype.addScenes = function() {

            for (var i = arguments.length; i--;) this.addScene(arguments[i]);
            return this;
        };


        Game.prototype.removeScene = function(scene, clear) {
            if (!(scene instanceof Scene)) {
                Log.warn("Game.removeScene: can't remove argument from Game, it's not an instance of Scene");
                return this;
            }
            var scenes = this.scenes,
                index = scenes.indexOf(scene);

            if (index !== -1) {

                scenes.splice(index, 1);
                this._scenesJSON.splice(index, 1);
                this._sceneNameHash[scene.name] = undefined;
                this._sceneHash[scene._id] = undefined;
                if (scene._serverId !== -1) this._sceneServerHash[scene._serverId] = undefined;

                scene.game = undefined;

                this.emit("removeScene", scene);
                if (clear) scene.clear();
            } else {
                Log.warn("Game.removeScene: Scene not a member of Game");
            }

            return this;
        };


        Game.prototype.remove = Game.prototype.removeScenes = function() {

            for (var i = arguments.length; i--;) this.removeScene(arguments[i]);
            return this;
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
            json || (json = this._SYNC);
            var scenes = this.scenes,
                jsonScenes = json.jsonScenes || (json.jsonScenes = []),
                i;

            for (i = scenes.length; i--;) jsonScenes[i] = scenes[i].toSYNC(jsonScenes[i]);

            return json;
        };


        Game.prototype.fromSYNC = function(json) {
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
            json || (json = {});
            Class.prototype.toJSON.call(this, json);
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
