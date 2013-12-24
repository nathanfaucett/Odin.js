if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define([
        "core/game/log"
    ],
    function(Log) {
        "use strict";


        var w = typeof(window) !== "undefined" ? window : global,
            ctx = (
                w.AudioContext ||
                w.webkitAudioContext ||
                w.mozAudioContext ||
                w.oAudioContext ||
                w.msAudioContext
            );

        if (!ctx) Log.error("AudioContext not supported by this Browser");

        return ctx ? new ctx : false;
    }
);
