if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/event_emitter",
        "base/audio_ctx",
        "core/assets/asset",
        "core/assets/assets",
        "core/game/log"
    ],
    function(EventEmitter, AudioCtx, Asset, Assets, Log) {
        "use strict";


        var FUNC = function() {};


        function AssetLoader() {

            EventEmitter.call(this);
        }

        EventEmitter.extend(AssetLoader);


        AssetLoader.prototype.load = function(callback, reload) {
            callback || (callback = FUNC);
            var self = this,
                count = Assets.length,
                i,
                fn = function(err) {
                    if (err) Log.error(err.message);

                    count--;
                    if (count === 0) {
                        self.emit("load");
                        callback();
                    }
                };

            for (i = count; i--;) this.loadAsset(Assets[i], fn, reload);
        };


        AssetLoader.prototype.loadAsset = function(asset, callback, reload) {
            var self = this,
                ext;

            if (asset.raw && !reload) {
                callback()
                return;
            };

            if ((ext = asset.ext())) {
                if (!this[ext]) {
                    callback(new Error("AssetLoader.load: has no loader named " + ext))
                    return;
                }

                this[ext](asset.src, function(err, raw) {
                    if (err) {
                        callback(new Error("AssetLoader.load: " + err.message));
                        return;
                    }

                    asset.parse(raw);
                    self.emit("loadAsset", asset);
                    callback();
                });
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

            console.log(request);
            request.open("GET", src, true);
            request.setRequestHeader("Content-Type", "application/json");
            request.send();
        };


        AssetLoader.prototype.ogg = AssetLoader.prototype.wav = AssetLoader.prototype.mp3 = AssetLoader.prototype.aac = function(src, callback) {
            var request = new XMLHttpRequest;

            request.onload = function() {
                var status = this.status;

                if ((status > 199 && status < 301) || status == 304) {
                    AudioCtx.decodeAudioData(this.response,
                        function success(buffer) {
                            callback && callback(null, buffer);
                        },
                        function failure() {
                            callback && callback(new Error("AudioContext Failed to parse Audio Clip"));
                        }
                    );
                } else {
                    callback && callback(new Error(status));
                }
            };

            request.open("GET", src, true);
            request.responseType = "arraybuffer";
            request.send();
        };


        return new AssetLoader;
    }
);
