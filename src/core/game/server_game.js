if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/time",
        "core/game/config",
        "core/game/game",
        "core/game/log",
        "core/game/client",
        "core/assets/assets"
    ],
    function(Time, Config, Game, Log, Client, Assets) {
        "use strict";


        var http = require("http"),
            https = require("https"),
            io = require("socket.io"),
            fs = require("fs"),
            path = require("path"),
            cwd = process.cwd(),

            stamp = Time.stamp,
            now = Time.now;


        function ServerGame(opts) {
            opts || (opts = {});
            Config.fromJSON(opts);

            Game.call(this, opts);

            this.io = io.listen(Config.port, Config.host);

            this.clients = [];
            this._clientHash = {};

            this.on("addScene", function(scene) {
                var sockets = this.io.sockets;

                scene.on("addGameObject", function(gameObject) {

                    sockets.emit("server_addGameObject", scene._id, gameObject.toJSON());

                    gameObject.on("addComponent", function(component) {

                        sockets.emit("server_addComponent", scene._id, gameObject._id, component);
                    });

                    gameObject.on("removeComponent", function(component) {

                        sockets.emit("server_removeComponent", scene._id, gameObject._id, component._type);
                    });
                });

                scene.on("removeGameObject", function(gameObject) {
                    gameObject.off("addComponent");
                    gameObject.off("removeComponent");

                    sockets.emit("server_removeGameObject", scene._id, gameObject._id);
                });
            });

            this.on("removeScene", function(scene) {
                scene.off("addGameObject");
                scene.off("removeGameObject");

                sockets.emit("server_removeScene", scene._id);
            });
        }

        Game.extend(ServerGame);


        ServerGame.prototype.init = function() {
            var self = this,
                socket_io = this.io;

            socket_io.set("log level", (Config.debug ? 2 : 0));

            socket_io.on("connection", function(socket) {
                var id = socket.id,
                    client = self.createClient(socket);

                socket.on("disconnect", function() {

                    client = self.removeClient(socket);
                    client.emit("disconnect");
                    self.emit("disconnect", client);
                });

                socket.on("client_device", function(device) {

                    client.device = device;
                    Log.log("ServerGame: New Client\n", Log.object(device));
                    socket.emit("server_ready", self.toJSON(), Assets.toJSON());
                });

                socket.on("client_ready", function() {

                    self.emit("connection", client);
                });

                socket.on("client_sync_input", function(json, timeStamp) {

                    client._inputNeedsUpdate = true;
                    client._inputStamp = timeStamp;
                    client.input.fromSYNC(json);
                });

                socket.on("client_resize", function(width, height) {
                    var camera = client.camera;
                    if (!camera) return;

                    camera.set(width, height);
                });
            });

            this._loop.init();
            this.emit("init");

            return this;
        };


        ServerGame.prototype.createClient = function(socket) {
            var id = socket.id,
                clientHash = this._clientHash,
                client;

            if (clientHash[id]) {
                Log.warn("ServerGame.createClient: Server already has Client with id " + id);
                return undefined;
            }

            client = new Client({
                id: id,
                socket: socket,
                game: this
            });

            clientHash[id] = client;
            this.clients.push(client);

            return client;
        };


        ServerGame.prototype.removeClient = function(socket) {
            var id = socket.id,
                clients = this.clients,
                clientHash = this._clientHash,
                client = clientHash[id],
                index = clients.indexOf(client);

            if (!client || index === -1) {
                Log.warn("ServerGame.removeClient: Server dosen't have Client with id " + id);
                return undefined;
            }

            clientHash[id] = undefined;
            this.clients.splice(index, 1);

            return client;
        };


        ServerGame.prototype.findClientById = function(id) {

            return this._clientHash[id];
        };


        var frameCount = 0,
            last = -1 / 60,
            time = 0,
            delta = 1 / 60,
            fpsFrame = 0,
            fpsLast = 0,
            fpsTime = 0,
            lastUpdate = 0;

        ServerGame.prototype.loop = function() {
            var clients = this.clients,
                scenes = this.scenes,
                needsUpdate = false,
                client, socket, scene,
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
            Time.delta = delta = delta < MIN_DELTA ? MIN_DELTA : delta > MAX_DELTA ? MAX_DELTA : delta;

            Time.time = time * Time.scale;

            lastUpdate += delta;
            if (lastUpdate > Config.SCENE_SYNC_RATE) {
                lastUpdate = 0;
                needsUpdate = true;
            }

            for (i = scenes.length; i--;) scenes[i].update();

            for (i = clients.length; i--;) {
                client = clients[i];
                socket = client.socket;

                if (client._inputNeedsUpdate) {
                    client._inputNeedsUpdate = false;
                    socket.emit("server_sync_input", client._inputStamp);
                }

                client.input.update();
                client.emit("update");

                if ((scene = client.scene)) {
                    if (needsUpdate) socket.emit("server_sync_scene", scene.toSYNC(), stamp());
                }
            }

            this.emit("update", time);
        }


        return ServerGame;
    }
);
