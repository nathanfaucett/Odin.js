if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/event_emitter",
        "odin/base/audio_ctx",
        "odin/core/assets/asset",
        "odin/core/assets/assets",
        "odin/core/game/log"
    ],
    function(EventEmitter, AudioCtx, Asset, Assets, Log) {
        "use strict";


        function AssetLoader() {

            EventEmitter.call(this);
        }

        EventEmitter.extend(AssetLoader);


        AssetLoader.prototype.load = function(callback, reload) {
            var self = this,
                count = Assets.length,
                i = count,
                fn = function(err) {
                    if (err) Log.error(err.message);

                    count--;
                    if (count === 0) {
                        self.emit("load");
                        callback && callback();
                    }
                };

            if (!count) callback && callback();

            for (; i--;) this.loadAsset(Assets[i], fn, reload, true);
        };


        AssetLoader.prototype.loadAsset = function(asset, callback, reload, known) {
            var self = this,
                ext;

            if (!known || Assets.indexOf(asset) === -1) Assets.addAsset(asset);

            if (!asset.load || asset.raw && !reload) {
                callback && callback()
                return;
            };

            if ((ext = asset.ext())) {
                if (!this[ext]) {
                    callback && callback(new Error("AssetLoader.load: has no loader named " + ext));
                    return;
                }

                this[ext](asset.src, function(err, raw) {
                    if (err) {
                        callback && callback(new Error("AssetLoader.load: " + err.message));
                        return;
                    }

                    asset.parse(raw);
                    self.emit("loadAsset", asset);
                    callback && callback();
                });
            } else {
                callback && callback(new Error("AssetLoader.load: could not get an ext from asset " + asset.name));
            }
        };


        AssetLoader.prototype.gif = AssetLoader.prototype.jpg = AssetLoader.prototype.jpeg = AssetLoader.prototype.png = function(src, callback) {
            var image = new Image;

            image.onload = function() {
                callback && callback(null, image);
            };
            image.onerror = function() {
                callback && callback(new Error("GET " + src + " 404 (Not Found)"));
            };

            image.src = src;
        };


        AssetLoader.prototype.json = function(src, callback) {
            var request = new XMLHttpRequest;

            request.onload = function() {
                var status = this.status,
                    json;

                if ((status > 199 && status < 301) || status == 304) {
                    try {
                        json = JSON.parse(this.responseText);
                    } catch (err) {
                        callback && callback(err);
                        return;
                    }

                    callback && callback(null, json);
                } else {
                    callback && callback(new Error(status));
                }
            };
            request.onerror = function() {
                callback && callback(new Error("GET " + src + " 404 (Not Found)"));
            };

            request.open("GET", src, true);
            request.setRequestHeader("Content-Type", "application/json");
            request.send();
        };


        AssetLoader.prototype.ogg = AssetLoader.prototype.wav = AssetLoader.prototype.mp3 = AssetLoader.prototype.aac = function(src, callback) {
            var request = new XMLHttpRequest;

            request.onload = function() {
                var status = this.status;

                if ((status > 199 && status < 301) || status == 304) {
                    if (AudioCtx) {
                        AudioCtx.decodeAudioData(this.response,
                            function success(buffer) {
                                callback && callback(null, buffer);
                            },
                            function failure() {
                                callback && callback(new Error("AudioContext Failed to parse Audio Clip"));
                            }
                        );
                    } else {
                        callback && callback(new Error("AudioContext (WebAudio API) is not supported by this browser"));
                    }
                } else {
                    callback && callback(new Error(status));
                }
            };
            request.onerror = function() {
                callback && callback(new Error("GET " + src + " 404 (Not Found)"));
            };

            request.open("GET", src, true);
            request.responseType = "arraybuffer";
            request.send();
        };


        AssetLoader.prototype.shader = AssetLoader.prototype.glsl = function(src, callback) {
            var request = new XMLHttpRequest;

            request.onload = function() {
                var status = this.status;

                if ((status > 199 && status < 301) || status == 304) {
                    callback && callback(null, this.responseText);
                } else {
                    callback && callback(new Error(status));
                }
            };
            request.onerror = function() {
                callback && callback(new Error("GET " + src + " 404 (Not Found)"));
            };

            request.open("GET", src, true);
            request.setRequestHeader("Content-Type", "text/plain");
            request.send();
        };


        return new AssetLoader;
    }
);
