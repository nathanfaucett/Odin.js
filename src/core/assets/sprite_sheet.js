if (typeof define !== 'function') { var define = require('amdefine')(module) }
define([
		"core/assets/asset",
		"core/game/log"
	],
    function(Asset, Log) {
        "use strict";
		
		
		function SpriteSheet(opts) {
			opts || (opts = {});
			
			Asset.call(this, opts);
		}
		
		SpriteSheet.type = "SpriteSheet";
		Asset.extend(SpriteSheet, Asset);

		
		SpriteSheet.prototype.parse = function(raw) {
			
			Asset.prototype.parse.call(this, raw);
			
			for (var key in raw) {
				if (!this[key]) {
					this[key] = raw[key];
				} else {
					Log.warn("SpriteSheet.parse: bad name "+ key +" in file "+ this.src);
				}
			}
			
			return this;
		};
		
		
		SpriteSheet.prototype.clear = function() {
			
			for (var key in this.raw) this[key] = null;
			Asset.prototype.clear.call(this);
			
			return this;
		};

		
		SpriteSheet.prototype.toJSON = function(json) {
			json || (json = {});
			Asset.prototype.toJSON.call(this, json);
			
			if (!this.src && this.raw) json.raw = JSON.stringify(this.raw);
			
			return json;
		};

		
		SpriteSheet.prototype.fromJSON = function(json) {
			Asset.prototype.fromJSON.call(this, json);
			
			if (!json.src && json.raw) this.raw = JSON.parse(json.raw);
			this.parse(this.raw);
			
			return this;
		};


        return SpriteSheet;
    }
);
