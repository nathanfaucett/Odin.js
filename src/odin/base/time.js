if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        var isServer = typeof(window) === "undefined",
            w = isServer ? {} : window,
            performance = typeof(w.performance) !== "undefined" ? w.performance : {},
            defineProperty = Object.defineProperty,
            START_MS = Date.now(),
            START = START_MS * 0.001,
            delta = 1 / 60,
            fixedDelta = delta,
            globalFixed = delta,
            scale = 1,
            DateNow;


        if (isServer) {
            var HR_TIME = process.hrtime();

            DateNow = function() {
                var hrtime = process.hrtime(HR_TIME),
                    s = hrtime[0] * 1000,
                    ns = hrtime[1] * 1e-6;

                return s + ns;
            }
        } else {
            DateNow = function() {
                return Date.now() - START_MS;
            }
        }


        performance.now || (performance.now = (
            performance.webkitNow ||
            performance.mozNow ||
            performance.msNow ||
            performance.oNow ||
            DateNow
        ));

        function now() {

            return performance.now() * 0.001;
        }


        function Time() {

            this.start = START;
            this.sinceStart = 0;
            this.time = 0;
            this.fps = 60;
            this.delta = delta;
            this.frameCount = 0;

            defineProperty(this, "scale", {
                get: function() {
                    return scale;
                },
                set: function(value) {
                    scale = value;
                    fixedDelta = globalFixed * value
                }
            });

            defineProperty(this, "fixedDelta", {
                get: function() {
                    return fixedDelta;
                },
                set: function(value) {
                    globalFixed = value;
                    fixedDelta = globalFixed * scale;
                }
            });
        }


        Time.prototype.now = now;


        Time.prototype.stamp = function() {

            return Date.now() * 0.001;
        };


        Time.prototype.stampMS = function() {

            return Date.now();
        };


        return new Time;
    }
);
