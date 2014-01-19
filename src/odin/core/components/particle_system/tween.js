if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        function Tween(opts) {
            opts || (opts = {});

            this.times = opts.times || [];
            this.values = opts.values || [];
        }


        Tween.prototype.copy = function(other) {

            this.times = other.times.slice();
            this.values = other.values.slice();

            return this;
        };


        Tween.prototype.clear = function() {

            this.times.length = 0;
            this.values.length = 0;

            return this;
        };


        Tween.prototype.update = function(time, out) {
            var times = this.times,
                values = this.values,
                i = 0,
                n = times.length,
                t;

            while (i < n && time > times[i]) i++;

            if (i === 0) return values[0];
            if (i === n) return values[n - 1];

            t = (time - times[i - 1]) / (times[i] - times[i - 1]);

            if (out) return out.copy(values[i - 1]).lerp(values[i], t);
            return values[i - 1] + t * (values[i] - values[i - 1]);
        };


        Tween.prototype.toJSON = function(json) {
            json || (json = {});
            var times = this.times,
                values = this.values,
                jsonTimes = json.times || (json.times = []),
                jsonValues = json.values || (json.values = []),
                i;

            for (i = times.length; i--;) jsonTimes[i] = times[i];
            for (i = values.length; i--;) jsonValues[i] = values[i].toJSON ? values[i].toJSON(jsonValues[i]) : values[i];

            return json;
        };


        Tween.prototype.fromJSON = function(json) {
            var times = this.times,
                values = this.values,
                jsonTimes = json.times,
                jsonValues = json.values,
                i;

            for (i = jsonTimes.length; i--;) times[i] = jsonTimes[i];
            for (i = jsonValues.length; i--;) values[i] = jsonValues[i];

            return this;
        };


        return Tween;
    }
);
