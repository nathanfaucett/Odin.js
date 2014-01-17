if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/audio_ctx",
        "base/time",
        "math/mathf",
        "math/vec2",
        "math/vec3",
        "core/components/component"
    ],
    function(AudioCtx, Time, Mathf, Vec2, Vec3, Component) {
        "use strict";


        var now = Time.now,
            clamp01 = Mathf.clamp01,
            defineProperty = Object.defineProperty;


        function AudioSource(opts) {
            opts || (opts = {});

            Component.call(this, "AudioSource", !! opts.sync, opts.json);

            this.clip = opts.clip;

            this._source = undefined;
            this._gain = undefined;
            this._panner = undefined;

            this.dopplerLevel = opts.dopplerLevel != undefined ? opts.dopplerLevel : 1;
            this._loop = opts.loop != undefined ? !! opts.loop : false;

            this.maxDistance = opts.maxDistance != undefined ? opts.maxDistance : 15;
            this.minDistance = opts.minDistance != undefined ? opts.minDistance : 1;

            this.offset = opts.offset != undefined ? opts.offset : new Vec3;

            this.pitch = opts.pitch != undefined ? opts.pitch : 0;

            this.playOnInit = opts.playOnInit != undefined ? !! opts.playOnInit : false;

            this.spread = opts.spread != undefined ? opts.spread : 0;

            this.time = opts.time != undefined ? opts.time : 0;
            this._volume = opts.volume != undefined ? opts.volume : 1;

            this.isPlaying = false;

            this._startTime = 0;

            var self = this;
            this._onended = function() {

                self.isPlaying = false;
                self.time = 0;
            };
        }

        AudioSource.type = "AudioSource";
        Component.extend(AudioSource);


        defineProperty(AudioSource.prototype, "volume", {
            get: function() {
                return this._volume;
            },
            set: function(value) {
                this._volume = clamp01(value);
                if (this._gain) this._gain.gain.value = this._volume;
            }
        });


        defineProperty(AudioSource.prototype, "loop", {
            get: function() {
                return this._loop;
            },
            set: function(value) {
                this._loop = !! value;
                if (this._source) this._source.loop = this._loop;
            }
        });


        AudioSource.prototype.init = function() {

            if (this.playOnInit) this.play();
        };


        var VEC2 = new Vec2,
            VEC3 = new Vec3;
        AudioSource.prototype.update = function() {
            if (this.dopplerLevel === 0 || !this.isPlaying) return;
            var transform2d, transform, camera, cameraTransform, panner;

            if (!(camera = this.gameObject.scene.game.camera)) return;
            if (!(panner = this._panner)) return;

            transform = this.transform;
            transform2d = this.transform2d;

            cameraTransform = camera.transform || camera.transform2d;

            if (transform2d) {
                VEC2.vadd(transform2d.position, this.offset);
                VEC2.sub(cameraTransform.position);
                VEC2.smul(this.dopplerLevel);

                panner.setPosition(VEC2.x, VEC2.y, camera.orthographicSize);
            } else {
                VEC3.vadd(transform.position, this.offset);
                VEC3.sub(cameraTransform.position);
                VEC3.smul(this.dopplerLevel);

                panner.setPosition(VEC3.x, VEC3.y, VEC3.z || 0);
            }
        };


        AudioSource.prototype.clear = function() {

            if (this.isPlaying) this.stop();

            this._source = undefined;
            this._gain = undefined;
            this._panner = undefined;
        };


        AudioSource.prototype.play = function(delay, offset) {
            if (!AudioCtx) return this;
            delay || (delay = 0);
            offset || (offset = 0);

            this.refresh();

            this.isPlaying = true;
            this._startTime = now();

            this.time = offset;
            this._source.start(delay, this.time);

            return this;
        };


        AudioSource.prototype.pause = function() {
            if (!AudioCtx) return this;

            this.isPlaying = false;
            this.time = now() - this._startTime;

            this._source.stop(this.time);

            return this;
        };


        AudioSource.prototype.stop = function() {
            if (!AudioCtx) return this;

            this.time = 0;
            this.isPlaying = false;

            this._source.stop(this.time);

            return this;
        };


        AudioSource.prototype.refresh = function() {
            var source = this._source = AudioCtx.createBufferSource(),
                gain = this._gain = AudioCtx.createGain(),
                panner = this._panner = AudioCtx.createPanner();

            gain.connect(AudioCtx.destination);
            panner.connect(gain);
            source.connect(panner);

            source.buffer = this.clip.buffer;
            source.onended = this._onended;

            gain.gain.value = this.volume;
            source.loop = this.loop;

            return this;
        };


        AudioSource.prototype.toSYNC = function(json) {
            json = Component.prototype.toSYNC.call(this, json);

            return json;
        };


        AudioSource.prototype.fromSYNC = function(json) {
            Component.prototype.fromSYNC.call(this, json);

            return this;
        };


        AudioSource.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.clip = this.clip ? this.clip.name : undefined;

            json.dopplerLevel = this.dopplerLevel;
            json.loop = this.loop;

            json.maxDistance = this.maxDistance;
            json.minDistance = this.minDistance;

            json.offset = this.offset.toJSON(json.offset);
            json.panLevel = this.panLevel;

            json.pitch = this.pitch;

            json.playOnInit = this.playOnInit;

            json.spread = this.spread;

            json.time = this.time;
            json.volume = this.volume;

            json.isPlaying = this.isPlaying;

            return json;
        };


        AudioSource.prototype.fromServerJSON = function(json) {
            Component.prototype.fromServerJSON.call(this, json);

            this.clip = json.clip ? Assets.hash[json.clip] : undefined;

            this.dopplerLevel = json.dopplerLevel;
            this.loop = json.loop;

            this.maxDistance = json.maxDistance;
            this.minDistance = json.minDistance;

            this.offset.fromJSON(json.offset);
            this.panLevel = json.panLevel;

            this.pitch = json.pitch;

            this.playOnInit = json.playOnInit;

            this.spread = json.spread;

            this.time = json.time;
            this.volume = json.volume;

            this.isPlaying = json.isPlaying;

            return this;
        };


        AudioSource.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.clip = json.clip ? Assets.hash[json.clip] : undefined;

            this.dopplerLevel = json.dopplerLevel;
            this.loop = json.loop;

            this.maxDistance = json.maxDistance;
            this.minDistance = json.minDistance;

            this.offset.fromJSON(json.offset);
            this.panLevel = json.panLevel;

            this.pitch = json.pitch;

            this.playOnInit = json.playOnInit;

            this.spread = json.spread;

            this.time = json.time;
            this.volume = json.volume;

            this.isPlaying = json.isPlaying;

            return this;
        };


        return AudioSource;
    }
);
