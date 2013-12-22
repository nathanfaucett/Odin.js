if (typeof define !== 'function') { var define = require('amdefine')(module) }
define([
		"base/request_animation_frame",
		"core/game/log"
	],
    function(requestAnimationFrame, Log) {
        "use strict";
		

        function Loop(callback, ctx) {
			ctx || (ctx = this);

            this._loopState = L_PAUSED;
            this._runState = R_PAUSED;

            this.callback = callback;
            this.ctx = ctx || this;
			
			var self = this;
			this._run = function(ms) {
				
				self._runState = R_RUNNING;
	
				if (callback) {
					callback.call(ctx, ms);
	
					if (self._loopState === L_RUNNING) {
						self._pump();
					} else {
						self.pause();
					}
				}
	
				self._runState = R_PAUSED;
			}
        }


        Loop.prototype.init = Loop.prototype.resume = function() {
            if (!this.callback) {
                Log.warn("Loop.resume: can't run loop without callback");
                return;
            }

            this._loopState = L_RUNNING;

            if (this._runState === R_PAUSED) this._pump();
        };


        Loop.prototype.pause = function() {

            this._loopState = L_PAUSED;
        };


        Loop.prototype.isRunning = function() {

            return this._loopState === L_RUNNING;
        };


        Loop.prototype.isPaused = function() {

            return this._loopState === L_PAUSED;
        };


        Loop.prototype._pump = function() {

            requestAnimationFrame(this._run);
        };

		
        var L_RUNNING = Loop.L_RUNNING = 1,
            L_PAUSED = Loop.L_PAUSED = 2,

            R_RUNNING = Loop.R_RUNNING = 1,
            R_PAUSED = Loop.R_PAUSED = 2;

			
        return Loop;
    }
);
