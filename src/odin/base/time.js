define(
    function() {
        "use strict";
		
        
        var w = typeof window !== "undefined" ? window : {},
			performance = typeof w.performance !== "undefined" ? w.performance : {},
			defineProperty = Object.defineProperty,
            START_MS = Date.now(),
            START = START_MS * 0.001,
			delta = 1 / 60,
            fixedDelta = delta,
            globalFixed = delta,
            scale = 1;

		
		performance.now = (
			performance.now ||
			performance.webkitNow ||
			performance.mozNow ||
			performance.msNow ||
			performance.oNow ||
			function() {
				return Date.now() - START_MS;
			}
		);
		
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

            return START + now();
        };
		
		
        return new Time;
    }
);