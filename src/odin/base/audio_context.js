if (typeof define !== 'function') { var define = require('amdefine')(module) }
define([
		"odin/core/game/log"
	],
    function(Log) {
        "use strict";


        var w = typeof(window) !== "undefined" ? window : global,
			audioContext = (
				w.AudioContext ||
				w.webkitAudioContext ||
				w.mozAudioContext ||
				w.oAudioContext ||
				w.msAudioContext
			);
		
		if (!audioContext) Log.error("AudioContext not supported by Browser");
			
        return audioContext ? new audioContext : false;
    }
);