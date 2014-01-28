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

        return ctx ? new ctx : false;
    }
);
