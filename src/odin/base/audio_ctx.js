if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        var w = typeof(window) !== "undefined" ? window : global,
            ctx = (
                w.AudioContext ||
                w.webkitAudioContext ||
                w.mozAudioContext ||
                w.oAudioContext ||
                w.msAudioContext
            );

        if (ctx) {
            ctx = new ctx;

            ctx.createGain || (ctx.createGain = ctx.createGain || ctx.createGainNode);
            ctx.createPanner || (ctx.createPanner = ctx.createPanner || ctx.createPannerNode);

            AudioBufferSourceNode.prototype.start || (AudioBufferSourceNode.prototype.start = function(delay, time) {

                this.noteOn(delay, time);
            });
            AudioBufferSourceNode.prototype.stop || (AudioBufferSourceNode.prototype.stop = function(time) {

                this.noteOff(time);
            });

        }

        return ctx ? ctx : false;
    }
);
