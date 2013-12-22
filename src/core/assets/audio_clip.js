if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define([
        "base/audio_context",
        "base/time",
        "core/assets/asset"
    ],
    function(audioContext, Time, Asset) {
        "use strict";


        var now = Time.now,
            defineProperty = Object.defineProperty;


        function AudioClip(opts) {
            opts || (opts = {});

            Asset.call(this, opts);

            this._volume = opts.volume != undefined ? opts.volume : 1;
            this._loop = opts.loop != undefined ? opts.loop : false;
            this._playbackRate = opts.playbackRate != undefined ? opts.playbackRate : 1;

            this._paused = false;
            this._startTime = 0;
            this.currentTime = 0;

            this._buffer = undefined;
            this.source = undefined;
            this.gain = undefined;
            this.panner = undefined;
        }

        AudioClip.type = "AudioClip";
        Asset.extend(AudioClip, Asset);


        defineProperty(AudioClip.prototype, "volume", {
            get: function() {
                return this._volume;
            },
            set: function(value) {
                this._volume = value;
                if (this.gain) this.gain.gain.value = value;
            }
        });


        defineProperty(AudioClip.prototype, "loop", {
            get: function() {
                return this._loop;
            },
            set: function(value) {
                this._loop = value;
                if (this.source) this.source.loop = value;
            }
        });


        defineProperty(AudioClip.prototype, "playbackRate", {
            get: function() {
                return this._playbackRate;
            },
            set: function(value) {
                this._playbackRate = value;
                if (this.source) this.source.playbackRate.value = value;
            }
        });


        defineProperty(AudioClip.prototype, "length", {
            get: function() {
                return this._buffer ? this._buffer.duration : 0;
            }
        });


        AudioClip.prototype.parse = function(raw) {

            Asset.prototype.parse.call(this, raw);
            var buffer = this._buffer = audioContext.createBuffer(raw, false),
                gain = this.gain = audioContext.createGain(),
                panner = this.panner = audioContext.createPanner(),
                source = refresh(this);

            gain.connect(audioContext.destination);
            gain.gain.value = this.volume;

            panner.connect(gain);

            source.loop = this.loop;
            source.playbackRate.value = this.playbackRate;

            return this;
        };


        AudioClip.prototype.play = function(delay, offset, length) {
            delay || (delay = 0);
            if (offset) this.currentTime = offset;
            length || (length = this.length);

            this._startTime = now();

            if (this.source) {
                if (!this._paused) {
                    refresh(this);
                    this.currentTime = 0;
                }
                this.source.start(delay, this.currentTime, length);
                this._paused = false;
            }

            return this;
        };


        AudioClip.prototype.pause = function() {

            this._paused = true;
            this.currentTime = now() - this._startTime;
            if (this.source) this.source.stop(0);

            return this;
        };


        AudioClip.prototype.stop = function() {

            this.currentTime = 0;
            if (this.source) this.source.stop(0);

            return this;
        };


        AudioClip.prototype.setPosition = function(x, y, z) {
            if (!this.source) return this;

            this.panner.setPosition(x, y, z);
            return this;
        };


        AudioClip.prototype.setOrientation = function(x, y, z) {
            if (!this.source) return this;

            this.panner.setOrientation(x, y, z);
            return this;
        };


        AudioClip.prototype.toJSON = function(json) {
            json || (json = {});
            Asset.prototype.toJSON.call(this, json);

            json.loop = this.loop;
            json.volume = this.volume;
            json.playbackRate = this.playbackRate;

            return json;
        };


        AudioClip.prototype.fromJSON = function(json) {
            Asset.prototype.fromJSON.call(this, json);

            this.loop = json.loop;
            this.volume = json.volume;
            this.playbackRate = json.playbackRate;

            return this;
        };


        function refresh(clip) {
            var source = clip.source = audioContext.createBufferSource();

            source.buffer = clip._buffer;
            source.connect(clip.panner);
            clip.refresh && clip.refresh();

            return source;
        }


        return AudioClip;
    }
);
