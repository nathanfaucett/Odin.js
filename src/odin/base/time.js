if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/game/config"
    ],
    function(Config) {
        "use strict";


        var isServer = typeof(window) === "undefined",
            w = isServer ? {} : window,
            performance = typeof(w.performance) !== "undefined" ? w.performance : {},
            defineProperty = Object.defineProperty,
            START_MS = Date.now(),
            START = START_MS * 0.001,
            DELTA = 1 / 60,
            FIXED_DELTA = DELTA,
            GLOBAL_FIXED = DELTA,
            SCALE = 1,
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
            this.delta = DELTA;
            this.frameCount = 0;

            defineProperty(this, "scale", {
                get: function() {
                    return SCALE;
                },
                set: function(value) {
                    SCALE = value;
                    FIXED_DELTA = GLOBAL_FIXED * value
                }
            });

            defineProperty(this, "fixedDelta", {
                get: function() {
                    return FIXED_DELTA;
                },
                set: function(value) {
                    GLOBAL_FIXED = value;
                    FIXED_DELTA = GLOBAL_FIXED * SCALE;
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


        var frameCount = 0,
            last = -1 / 60,
            time = 0,
            delta = 1 / 60,
            fpsFrame = 0,
            fpsLast = 0,
            fpsTime = 0;

        Time.prototype.update = function() {
            var MIN_DELTA = Config.MIN_DELTA,
                MAX_DELTA = Config.MAX_DELTA;

            this.frameCount = frameCount++;

            last = time;
            time = now();
            this.sinceStart = time;

            fpsTime = time;
            fpsFrame++;

            if (fpsLast + 1 < fpsTime) {
                this.fps = fpsFrame / (fpsTime - fpsLast);

                fpsLast = fpsTime;
                fpsFrame = 0;
            }

            delta = (time - last) * SCALE;
            this.delta = delta < MIN_DELTA ? MIN_DELTA : delta > MAX_DELTA ? MAX_DELTA : delta;

            this.time = time * SCALE;
        };


        return new Time;
    }
);
