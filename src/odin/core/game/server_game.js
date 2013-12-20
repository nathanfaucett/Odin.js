if (typeof define !== 'function') { var define = require('amdefine')(module) }
define([
        "odin/base/class",
        "odin/base/time",
        "odin/core/game/config",
        "odin/core/game/game",
        "odin/core/game/log",
        "odin/core/game/client",
        "odin/core/assets/assets"
    ],
    function(Class, Time, Config, Game, Log, Client, Assets) {
        "use strict";
		
		
		var http = require("http"),
			https = require("https"),
			io = require("socket.io"),
			fs = require("fs"),
			url = require("url"),
			path = require("path"),
			cwd = process.cwd(),
			
			now = Time.now,
			stamp = Time.stamp;
		

        function ServerGame(opts) {
            opts || (opts = {});
			Config.fromJSON(opts);
			
            Game.call(this, opts);
			
			if (opts.credentials) {
				this._server = new https.Server(opts.credentials, handler);
			} else {
				this._server = new http.Server(handler);
			}
			
			this.io = io.listen(this._server);
			
			this.clients = [];
			this._clientHash = {};
			
			this.on("addScene", function(scene) {
				var sockets = this.io.sockets;
				
				scene.on("addGameObject", function(gameObject) {
					
					sockets.emit("server_addGameObject", scene._id, gameObject.toJSON() );
					
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
        Class.extend(ServerGame, Game);
		
		
		ServerGame.prototype.init = function() {
			var self = this,
				socket_io = this.io;
			
			socket_io.set("log level", (Config.debug ? 2 : 0));
			
			socket_io.on("connection", function(socket) {
				var id = socket.id,
					client = self.createClient(socket);
				
				socket.on("disconnect", function() {
					
					client = self.removeClient(socket);
					if (client) {
						client.emit("disconnect");
						self.emit("disconnect", client);
					}
				});
				
				socket.on("client_device", function(device) {
					
					client.device = device;
					Log.log("ServerGame: New Client\n", Log.object(device));
					socket.emit("server_ready", self.toJSON(), Assets.toJSON());
				});
				
				socket.on("client_ready", function() {
					
					self.emit("connection", client);
				});
				
				socket.on("client_sync_input", function(json) {
					
					client._inputNeedsUpdate = true;
					client.input.fromSYNC(json);
				});
				
				socket.on("client_resize", function(width, height) {
					var camera = client.camera;
					if(!camera) return;
					
					camera.set(width, height);
				});
			});
			
			this._loop.init();
			this._server.listen(Config.port, Config.host);
			
			this.emit("init");
			
			return this;
		};
		
		
		ServerGame.prototype.createClient = function(socket) {
			var id = socket.id,
				clientHash = this._clientHash,
				client;
			
			if (clientHash[id]) {
				Log.warn("ServerGame.createClient: Server already has Client with id "+ id);
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
				Log.warn("ServerGame.removeClient: Server dosen't have Client with id "+ id);
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
			
        ServerGame.prototype.loop = function(ms) {
            var clients = this.clients,
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
			
			for (i = clients.length; i--;) {
				client = clients[i];
				socket = client.socket;
				
				if (client._inputNeedsUpdate) {
					client._inputNeedsUpdate = false;
					socket.emit("server_sync_input");
				}
				
				client.input.update();
				client.emit("update");
				
				if ((scene = client.scene)) {
					scene.update();
					if (needsUpdate) socket.emit("server_sync_scene", scene.toSYNC());
				}
			}

            this.emit("update", time);
        }

		
		function handler(req, res) {
			var uri = url.parse(req.url).pathname,
				method = req.method,
				fileName;
			
			if (uri[0] === "/") uri = uri.slice(1);
			if (method === "GET") {
				fileName = path.resolve(cwd, uri);
				
				fs.stat(fileName, function(err, stat) {
					if (err) {
						sendError(res, 500, err);
						return;
					}
					
					if (stat.isDirectory()) {
						fileName = path.join(fileName, "index.html");
						sendFile(res, fileName);
						
						return;
					}
					
					sendFile(res, fileName);
				});
			}
		}
		
		
		function sendFile(res, fileName) {
			
			fs.exists(fileName, function(exists) {
				if (exists) {
					var type = MIME_TYPES[fileName.split(".").pop()] || "text/plain";
					
					fs.readFile(fileName, function(err, buffer) {
						res.setHeader("Content-Type", type);
						res.writeHead(200);
						res.write(buffer);
						res.end();
					});
				} else {
					sendError(res, 404, "File "+ fileName +" was not found on this server");
				}
			});
		}
		
		
		function sendError(res, code, msg) {
			code || (code = 500);
			var httpMsg = http.STATUS_CODES[code];
			msg || (msg = httpMsg);
			
			res.setHeader("Content-Type", "text/html");
			res.writeHead(code || 500);
			res.write(
				'<h1>'+ httpMsg +'</h1>'+
				'<p>'+ code +' - '+ msg +'</p>'
			);
			res.end();
		}
		
		
		var MIME_TYPES = {
			"txt": "text/plain",
			"html": "text/html",
			"css": "text/css",
			"xml": "application/xml",
			"json": "application/json",
			"js": "application/javascript",
			"jpg": "image/jpeg",
			"jpeg": "image/jpeg",
			"gif": "image/gif",
			"png": "image/png",
			"svg": "image/svg+xml"
	    };
		

        return ServerGame;
    }
);
