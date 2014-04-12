if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/device",
        "odin/base/socket.io",
        "odin/base/time",
        "odin/math/mathf",
        "odin/core/game/config",
        "odin/core/game/game",
        "odin/core/game/log",
        "odin/core/renderer/canvas",
        "odin/core/game_object",
        "odin/core/components/component",
        "odin/core/scene",
        "odin/core/input/input",
        "odin/core/input/handler",
        "odin/core/assets/assets",
        "odin/core/assets/asset_loader"
    ],
    function(Device, io, Time, Mathf, Config, Game, Log, GameObject, Component, Scene, Assets, AssetLoader) {
        "use strict";


        var stamp = Time.stamp;


        function ClientGame(opts) {
            opts || (opts = {});
            Config.fromJSON(opts);

            Game.call(this, opts);

            this.io = undefined;
            this._sessionid = undefined;

            this._inputStamp = 0;
            this._deltaState = Config.SCENE_SYNC_RATE + Config.FAKE_LAG;
            this._lag = Config.FAKE_LAG;
        }

        Game.extend(ClientGame);


        ClientGame.prototype.connect = function(handler) {
            var _this = this,
                socket = this.io = io.connect(Config.host + ":" + Config.port);


            socket.on("connect", function() {
                if (!_this._sessionid) _this._sessionid = this.socket.sessionid;
                if (_this._sessionid !== this.socket.sessionid) location.reload();

                socket.emit("client_device", Device);
            });

            socket.on("server_ready", function(game, assets) {
                Assets.fromServerJSON(assets);

                AssetLoader.load(function() {
                    _this.fromServerJSON(game);

                    socket.emit("client_ready");

                    _this.emit("connect", socket);
                    if (handler) handler.call(_this, socket);
                });
            });

            socket.on("server_sync_input", function(timeStamp) {

                _this._inputStamp = timeStamp - (Config.FAKE_LAG * 2);
                socket.emit("client_sync_input", Input.toSYNC(), stamp());
            });

            var lastState = 0;
            socket.on("server_sync_scene", function(jsonScene, serverTimeStamp) {
                var scene = _this.scene,
                    timeStamp, lag;

                if (!scene) return;

                timeStamp = stamp();
                lag = timeStamp - serverTimeStamp + Config.FAKE_LAG;

                _this._lag = lag;
                _this._deltaState = timeStamp - (lastState || (timeStamp - Config.SCENE_SYNC_RATE - lag));
                lastState = timeStamp - lag;

                _this.emit("serverSyncScene", jsonScene);
                if (Config.SYNC_SERVER_SCENE) scene.fromSYNC(jsonScene);
            });

            socket.on("server_setScene", function(scene_id) {
                var scene = _this.findByJSONId(scene_id);

                _this.setScene(scene);
            });


            var canvasOnResize;
            socket.on("server_setCamera", function(camera_id) {
                if (!_this.scene) {
                    Log.error("Socket:server_setCamera: can't set camera without an active scene, use ServerGame.setScene first");
                    return;
                }
                var camera = _this.scene.findByJSONId(camera_id),
                    canvas = _this.canvas;

                if (!camera) {
                    Log.error("Socket:server_setCamera: can't find camera in active scene");
                    return;
                }

                _this.setCamera(camera);

                if (canvasOnResize) canvas.off("resize", canvasOnResize);
                canvas.on("resize", (canvasOnResize = function() {

                    socket.emit("client_resize", this.pixelWidth, this.pixelHeight);
                }));
                socket.emit("client_resize", canvas.pixelWidth, canvas.pixelHeight);
            });

            socket.on("server_addScene", function(scene) {

                _this.addScene(new Scene().fromServerJSON(scene));
            });

            socket.on("server_addGameObject", function(scene_id, gameObject) {
                var scene = _this.findByJSONId(scene_id);
                if (!scene) return;

                scene.addGameObject(new GameObject().fromServerJSON(gameObject));
            });

            socket.on("server_addComponent", function(scene_id, gameObject_id, component) {
                var scene = _this.findByJSONId(scene_id);
                if (!scene) return;

                var gameObject = scene.findByJSONId(gameObject_id);
                if (!gameObject) return;

                gameObject.addComponent(new Component._types[component._type].fromServerJSON(component));
            });


            socket.on("server_removeScene", function(scene_id) {

                _this.removeScene(_this.findByJSONId(scene_id));
            });

            socket.on("server_removeGameObject", function(scene_id, gameObject_id) {
                var scene = _this.findByJSONId(scene_id);
                if (!scene) return;

                scene.removeGameObject(scene.findByJSONId(gameObject_id));
            });

            socket.on("server_removeComponent", function(scene_id, gameObject_id, component_type) {
                var scene = _this.findByJSONId(scene_id);
                if (!scene) return;

                var gameObject = scene.findByJSONId(gameObject_id);
                if (!gameObject) return;

                gameObject.removeComponent(gameObject.getComponent(component_type));
            });

            return this;
        };


        ClientGame.prototype.disconnect = function() {
            var socket = this.io;

            socket.disconnect();
            socket.removeAllListeners();
            this.io = this._sessionid = undefined;

            return this;
        };


        return ClientGame;
    }
);
