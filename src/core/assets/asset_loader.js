if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define([
        "base/event_emitter",
        "base/audio_context",
        "core/assets/asset",
        "core/assets/assets",
        "core/game/log"
    ],
    function(EventEmitter, audioContext, Asset, Assets, Log) {
        "use strict";


        var FUNC = function() {};


        function AssetLoader() {

            EventEmitter.call(this);
        }

        EventEmitter.extend(AssetLoader, EventEmitter);


        AssetLoader.prototype.load = function(callback, reload) {
            callback || (callback = FUNC);
            var self = this,
                count = Assets.length,
                i,
                fn = function(err) {
                    if (err) Log.warn(err.message);

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
                mimeType;

            if (asset.raw && !reload) {
                callback()
                return;
            };

            if ((mimeType = asset.mimeType())) {
                if (!this[mimeType]) {
                    callback(new Error("AssetLoader.load: has no loader named " + mimeType))
                    return;
                }

                this[mimeType](asset.src, function(err, raw) {
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

            image.addEventListener("load", function(e) {
                callback && callback(null, image);
            }, false);
            image.addEventListener("error", function(e) {
                callback && callback(e);
            }, false);

            image.src = src;
        };


        AssetLoader.prototype.json = function(src, callback) {
            var request = new XMLHttpRequest;

            request.addEventListener("readystatechange", function(e) {

                if (this.readyState == 1) {
                    this.send(null);
                } else if (this.readyState == 4) {
                    var status = this.status,
                        json;

                    if ((status > 199 && status < 301) || status == 304) {
                        try {
                            json = JSON.parse(this.responseText);
                        } catch (e) {
                            callback && callback(e);
                            return;
                        }

                        callback && callback(null, json);
                    } else {
                        callback && callback(new Error(status));
                    }
                }
            }, false);

            request.open("GET", src, true);
        };


        AssetLoader.prototype.ogg = AssetLoader.prototype.wav = AssetLoader.prototype.mp3 = AssetLoader.prototype.aac = function(src, callback) {
            var request = new XMLHttpRequest;

            request.addEventListener("readystatechange", function(e) {

                if (this.readyState == 1) {
                    this.send(null);
                } else if (this.readyState == 4) {
                    var status = this.status;

                    if ((status > 199 && status < 301) || status == 304) {
                        callback && callback(null, this.response);
                    } else {
                        callback && callback(new Error(status));
                    }
                }
            }, false);

            request.responseType = "arraybuffer";
            request.open("GET", src, true);
        };


        return new AssetLoader;
    }
);
