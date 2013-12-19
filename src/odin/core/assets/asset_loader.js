if (typeof define !== 'function') { var define = require('amdefine')(module) }
define([
		"odin/core/assets/asset",
		"odin/core/assets/assets",
		"odin/core/game/log"
	],
    function(Asset, Assets, Log) {
        "use strict";
        
		
		var FUNC = function() {};
		
		
		function AssetLoader() {}
		
		
		AssetLoader.prototype.load = function(callback, reload) {
			callback || (callback = FUNC);
			var count = Assets.length, i,
				fn = function(err) {
					if (err) Log.warn(err.message);
					
					count--;
					if (count === 0) callback();
				};
			
			for (i = count; i--;) this.loadAsset(Assets[i], fn, reload);
		};
		
		
		AssetLoader.prototype.loadAsset = function(asset, callback, reload) {
			var mimeType;
			
			if (asset.raw && !reload) {
				callback()
				return;
			};
			
			if ((mimeType = asset.mimeType())) {
				if (!this[mimeType]) {
					callback(new Error("AssetLoader.load: has no loader named "+ mimeType))
					return;
				}
				
				this[mimeType](asset.src, function(err, raw) {
					if (err) {
						callback(new Error("AssetLoader.load: "+ err.message));
						return;
					}
					
					asset.parse(raw);
					callback();
				});
			}
		};
		
		
		AssetLoader.prototype.gif = AssetLoader.prototype.jpg = AssetLoader.prototype.jpeg = AssetLoader.prototype.png = function(src, callback) {
			var image = new Image;
			
			image.onload = function() {
				callback && callback(null, image);
			};
			image.onerror = function(error) {
				callback && callback(error);
			};
			
			image.src = src;
		};


		AssetLoader.prototype.json = function(src, callback) {
			var request = new XMLHttpRequest;
			
			request.onreadystatechange = function() {
			
				if (this.readyState == 1) {
					this.send(null);
				} else if (this.readyState == 4) {
					var status = this.status,
						json;
					
					if ((status > 199 && status < 301) || status == 304) {
						try{
							json = JSON.parse(this.responseText);
						} catch(e) {
							callback && callback(e);
							return;
						}
						
						callback && callback(null, json);
					} else {
						callback && callback(new Error(status));
					}
				}
			};
			
			request.open("GET", src, true);
		};


        return new AssetLoader;
    }
);
