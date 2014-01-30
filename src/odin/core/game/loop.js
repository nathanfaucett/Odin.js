if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/request_animation_frame",
        "odin/core/game/log"
    ],
    function(requestAnimationFrame, Log) {
        "use strict";


        function Loop(callback, ctx) {
            ctx || (ctx = this);
			
			this.paused = true;
			
            this.callback = callback;
            this.ctx = ctx || this;

            var self = this;
            this._run = function(ms) {

                if (self.callback) {
                    self.callback.call(ctx, ms);

                    if (!self.paused) {
                        self._pump();
                    } else {
                        self.pause();
                    }
                }
            }
        }


        Loop.prototype.resume = function() {
            if (!this.callback) {
                Log.warn("Loop.resume: can't run loop without callback");
                return;
            }

            this.paused = false;
			this._pump();
        };


        Loop.prototype.pause = function() {

            this.paused = true;
        };


        Loop.prototype.isRunning = function() {

            return !this.paused;
        };


        Loop.prototype.isPaused = function() {

            return this.paused;
        };


        Loop.prototype._pump = function() {

            requestAnimationFrame(this._run);
        };


        return Loop;
    }
);
