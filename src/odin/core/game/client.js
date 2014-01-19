if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/core/input/input",
        "odin/core/scene",
        "odin/core/game/log"
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
            this._inputStamp = 0;
        }
        Class.extend(Client);


        Client.prototype.setScene = function(scene) {
            if (typeof(scene) === "string") scene = this.game._sceneNameHash[scene];
            if (!(scene instanceof Scene)) {
                Log.error("Client.setScene: can't add passed argument, it is not an instance of Scene");
                return this;
            }
            var scenes = this.game.scenes,
                index = scenes.indexOf(scene),
                socket = this.socket;

            if (index !== -1) {
                this.scene = scene;
                this.emit("setScene", scene);
                socket.emit("server_setScene", scene._id);
            } else {
                Log.error("Client.setScene: Scene is not a member of Game");
            }

            return this;
        };


        Client.prototype.setCamera = function(gameObject) {
            var scene = this.scene,
                lastCamera = this.camera,
                index;

            if (!scene) {
                Log.error("Client.setCamera: can't set camera without an active scene, use Client.setScene first");
                return this;
            }

            index = scene.gameObjects.indexOf(gameObject);
            if (index === -1) {
                Log.error("Client.setCamera: GameObject is not a member of the active Scene, adding it...");
                scene.addGameObject(gameObject);
            }

            this.camera = gameObject.camera || gameObject.camera2d;

            if (this.camera) {
                this.camera._active = true;
                if (lastCamera) lastCamera._active = false;

                this.socket.emit("server_setCamera", gameObject._id);
                this.emit("setCamera", this.camera);
            } else {
                Log.error("Client.setCamera: GameObject does't have a Camera or a Camera2D Component");
            }

            return this;
        };


        return Client;
    }
);
