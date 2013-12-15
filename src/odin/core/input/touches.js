define([
        "odin/base/object_pool",
        "odin/core/input/touch"
    ],
    function(ObjectPool, Touch) {
        "use strict";
		
		
		var TOUCH_POOL = new ObjectPool(Touch);
		
		
        function Touches() {
			
			Array.call(this);
			this._SYNC = {};
        }
		
		Touches.prototype = Object.create(Array.prototype);
		Touches.prototype.constructor = Touches;
		Touches.TOUCH_POOL = TOUCH_POOL;
		
		Touches.prototype.start = function(evtTouch) {
			var touch = TOUCH_POOL.create();
			
			touch.clear();
			touch.id = evtTouch.identifier;
			touch.fromEvent(evtTouch);

			this.push(touch);
			
			return touch;
        };
		
		
		Touches.prototype.end = function(i) {
			var touch = this[i];
			
			TOUCH_POOL.removeObject(touch);
			this.splice(i, 1);
			
			return touch;
        };
		
		
		Touches.prototype.cancel = function() {

			TOUCH_POOL.clear();
			this.length = 0
			
			return touch;
        };
		
		
		Touches.prototype.move = function(i, evtTouch) {
			var touch = this[i];
			
			touch.fromEvent(evtTouch);
			
			return touch;
        };

		
		Touches.prototype.toSYNC = function(json) {
			json || (json = this._SYNC);
			var jsonTouches = json.touches || (json.touches = []),
				i;
			
			for (i = this.length; i--;) jsonTouches[i] = this[i].toSYNC(jsonTouches[i]);
			
			return json;
		};

		
		Touches.prototype.fromSYNC = function(json) {
			var jsonTouches = json.touches,
				touch, i, j, tl;
	
			for (i = jsonTouches.length, tl = this.length, j = tl; i--;) {
				if (i < tl) {
					this.splice(j--, 1);
					TOUCH_POOL.removeObject(this[j]);
				}
				
				if ((touch = this[i])) {
					touch.fromSYNC(jsonTouches[i]);
				} else {
					this[i] = TOUCH_POOL.create().fromSYNC(jsonTouches[i]);
				}
			}
			
			return this;
		};

		
		Touches.prototype.toJSON = function(json) {
			json || (json = {});
			var jsonTouches = json.touches || (json.touches = []),
				i;
			
			for (i = this.length; i--;) jsonTouches[i] = this[i].toJSON(jsonTouches[i]);
			return json;
		};

		
		Touches.prototype.fromJSON = function(json) {
			var jsonTouches = json.touches,
				touch, i, j, tl;
	
			for (i = jsonTouches.length, tl = this.length, j = tl; i--;) {
				if (i < tl) {
					this.splice(j--, 1);
					TOUCH_POOL.removeObject(this[j]);
				}
				
				if ((touch = this[i])) {
					touch.fromJSON(jsonTouches[i]);
				} else {
					this[i] = TOUCH_POOL.create().fromJSON(jsonTouches[i]);
				}
			}
			
			return this;
		};


        return Touches;
    }
);
