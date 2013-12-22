if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define([
        "base/audio_context",
        "base/class",
        "math/mathf",
        "math/vec2",
        "core/components/component"
    ],
    function(audioContext, Class, Mathf, Vec2, Component) {
        "use strict";


        var clamp01 = Mathf.clamp01;


        function AudioSource(opts) {
            opts || (opts = {});

            Component.call(this, "AudioSource", opts.sync, opts.json);

            this.clip = opts.clip;
            this.doppler = opts.doppler != undefined ? !! opts.doppler : false;
            this.autoplay = opts.autoplay != undefined ? !! opts.autoplay : false;

            if (this.autoplay) this.play();
        }

        AudioSource.type = "AudioSource";
        Class.extend(AudioSource, Component);


        AudioSource.prototype.update = function() {
            if (!this.doppler) return;
            if (!this.gameObject.scene.game.camera) return;
            var camera = this.gameObject.scene.game.camera,
                cameraPosition = camera.transform2d.position,
                thisPosition = this.transform2d.position,
                clip = this.clip;

            audioContext.listener.setPosition(cameraPosition.x, cameraPosition.y, camera.orthographicSize);
            clip.setPosition(thisPosition.x, thisPosition.y, 0);
        };


        AudioSource.prototype.play = function(delay, offset, length) {

            this.clip.play(delay, offset, length);
            return this;
        };


        AudioSource.prototype.pause = function() {

            this.clip.pause();
            return this;
        };


        AudioSource.prototype.stop = function() {

            this.clip.stop();
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
            json || (json = {});
            Component.prototype.toJSON.call(this, json);

            json.doppler = this.doppler;
            json.clip = this.clip ? this.clip.name : undefined;
            json.autoplay = this.autoplay;

            return json;
        };


        AudioSource.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.doppler = json.doppler;
            this.clip = json.clip ? Assets.hash[json.clip] : undefined;

            this.autoplay = json.autoplay;
            if (this.autoplay) this.play();

            return this;
        };


        AudioSource.prototype.sort = function(a, b) {

            return a === b ? -1 : 1;
        };


        return AudioSource;
    }
);
