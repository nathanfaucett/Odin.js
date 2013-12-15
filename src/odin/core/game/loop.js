if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
		"odin/base/request_animation_frame"
	],
    function(requestAnimationFrame) {
        "use strict";

		
        var L_STARTED = Loop.L_STARTED = 1,
            L_PAUSED = Loop.L_PAUSED = 2,
            L_RUNNING = Loop.L_RUNNING = 3,
            L_IDLE = Loop.L_IDLE = 4,

            R_RUNNING = Loop.R_RUNNING = 1,
            R_IDLE = Loop.R_IDLE = 2;
		

        function Loop(callback, ctx) {

            this._loopState = L_PAUSED;
            this._runState = R_IDLE;

            this.callback = callback;
            this.ctx = ctx || this;
        }


        Loop.prototype._run = function(ms) {

            this._runState = R_RUNNING;

            if (this.callback) {
                this.callback.call(this.ctx, ms);

                if (this._loopState === L_STARTED) {
                    this._pump();
                } else {
                    this.suspend();
                }
            }

            this._runState = R_IDLE;
        };


        Loop.prototype._pump = function() {

            requestAnimationFrame(this._run.bind(this));
        };


        Loop.prototype.suspend = function() {

            this._loopState = L_PAUSED;
        };


        Loop.prototype.resume = function() {
            if (!this.callback) {
                console.warn("Loop.resume: can\'t run loop without callback");
                return;
            }

            this._loopState = L_STARTED;

            if (this._runState === R_IDLE) this._pump();
        };


        Loop.prototype.isStarted = function() {

            return this._loopState === L_STARTED;
        };


        return Loop;
    }
);
