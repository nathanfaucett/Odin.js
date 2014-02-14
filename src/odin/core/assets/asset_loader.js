if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/util",
        "odin/base/event_emitter",
        "odin/base/audio_ctx",
        "odin/core/assets/asset",
        "odin/core/assets/assets",
        "odin/core/game/log"
    ],
    function(util, EventEmitter, AudioCtx, Asset, Assets, Log) {
        "use strict";


        var isArray = util.isArray,
            ajax = util.ajax,
            each = util.each;


        function getExt(src) {

            return src ? src.split(".").pop() : "none";
        };


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
                src = asset.src;

            if (!known || Assets.indexOf(asset) === -1) Assets.addAsset(asset);

            if (!asset.load || !src || asset.raw && !reload) {
                callback && callback()
                return;
            };

            if (isArray(src)) {
                var raw = [],
                    loaded = src.length;

                each(src, function(s, i) {
                    var ext = getExt(s);

                    if (!this[ext]) {
                        callback && callback(new Error("AssetLoader.load: has no loader named " + ext));
                        return false;
                    }

                    this[ext](s, function(err, data) {
                        if (err) {
                            callback && callback(new Error("AssetLoader.load: " + err.message));
                            return;
                        }
                        loaded--;
                        raw[i] = data;

                        if (loaded <= 0) {
                            asset.parse(raw);
                            self.emit("loadAsset", asset);
                            asset.emit("load", raw);
                            callback && callback();
                        }
                    });

                    return true;
                }, this);
            } else {
                var ext = getExt(src);

                if (!this[ext]) {
                    callback && callback(new Error("AssetLoader.load: has no loader named " + ext));
                    return;
                }

                this[ext](src, function(err, raw) {
                    if (err) {
                        callback && callback(new Error("AssetLoader.load: " + err.message));
                        return;
                    }

                    asset.parse(raw);
                    self.emit("loadAsset", asset);
                    asset.emit("load", raw);
                    callback && callback();
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

            ajax({
                src: src,
                before: function() {
                    this.setRequestHeader("Content-Type", "application/json");
                },
                success: function() {
                    var json = this.responseText;

                    try {
                        json = JSON.parse(this.responseText);
                    } catch (err) {
                        callback && callback(err);
                        return;
                    }

                    callback && callback(null, json);
                },
                error: function(err) {
                    callback && callback(err);
                }
            });
        };


        AssetLoader.prototype.ogg = AssetLoader.prototype.wav = AssetLoader.prototype.mp3 = AssetLoader.prototype.aac = function(src, callback) {

            ajax({
                src: src,
                before: function() {
                    this.responseType = "arraybuffer";
                },
                success: function() {
                    if (AudioCtx) {
                        AudioCtx.decodeAudioData(
                            this.response,
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
                },
                error: function(err) {
                    callback && callback(err);
                }
            });
        };


        return new AssetLoader;
    }
);
