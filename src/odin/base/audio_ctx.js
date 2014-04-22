if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/dom",
        "odin/base/device"
    ],
    function(Dom, Device) {
        "use strict";


        var w = typeof(window) !== "undefined" ? window : global,
            addEvent = Dom.addEvent,
            removeEvent = Dom.removeEvent,
            AudioContext = (
                w.AudioContext ||
                w.webkitAudioContext ||
                w.mozAudioContext ||
                w.oAudioContext ||
                w.msAudioContext
            ),
            audioContext = null;

        if (typeof(AudioContext) !== "undefined") {
            audioContext = new AudioContext();
            var AudioContextPrototype = AudioContext.prototype;

            AudioContextPrototype.UNLOCKED = !Device.mobile;
            AudioContextPrototype.createGain || (AudioContextPrototype.createGain = AudioContextPrototype.createGainNode);
            AudioContextPrototype.createPanner || (AudioContextPrototype.createPanner = AudioContextPrototype.createPannerNode);
            AudioContextPrototype.createDelay || (AudioContextPrototype.createDelay = AudioContextPrototype.createDelayNode);
            AudioContextPrototype.createScriptProcessor || (AudioContextPrototype.createScriptProcessor = AudioContextPrototype.createJavaScriptNode);

            var OscillatorPrototype = audioContext.createOscillator().constructor.prototype,
                BufferSourceNodePrototype = audioContext.createBufferSource().constructor.prototype,
                GainPrototype = audioContext.createGain().gain.constructor.prototype;

            OscillatorPrototype.start || (OscillatorPrototype.start = OscillatorPrototype.noteOn);
            OscillatorPrototype.stop || (OscillatorPrototype.stop = OscillatorPrototype.stop);
            OscillatorPrototype.setPeriodicWave || (OscillatorPrototype.setPeriodicWave = OscillatorPrototype.setWaveTable);

            BufferSourceNodePrototype.start || (BufferSourceNodePrototype.start = BufferSourceNodePrototype.noteOn);
            BufferSourceNodePrototype.stop || (BufferSourceNodePrototype.stop = BufferSourceNodePrototype.stop);

            GainPrototype.setTargetAtTime || (GainPrototype.setTargetAtTime = GainPrototype.setTargetValueAtTime);

            var onTouchStart = function(e) {
                window.removeEventListener("touchstart", onTouchStart, false);
                var buffer = audioContext.createBuffer(1, 1, 22050),
                    source = audioContext.createBufferSource();

                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start(0);

                audioContext.UNLOCKED = true;
                window.dispatchEvent(new Event("audiocontextunlock"));
            };
            window.addEventListener("touchstart", onTouchStart, false);
        }

        return audioContext != undefined ? audioContext : false;
    }
);
