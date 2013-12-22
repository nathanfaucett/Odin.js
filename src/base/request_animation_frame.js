if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define(
    function() {
        "use strict";


        var RATE = 1000 / 60,
            w = typeof(window) !== "undefined" ? window : global;


        return (
            w.requestAnimationFrame ||
            w.webkitRequestAnimationFrame ||
            w.mozRequestAnimationFrame ||
            w.oRequestAnimationFrame ||
            w.msRequestAnimationFrame ||
            function(callback, element) {

                return w.setTimeout(callback, RATE);
            }
        );
    }
);
