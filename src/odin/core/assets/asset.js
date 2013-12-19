if (typeof define !== 'function') { var define = require('amdefine')(module) }
define([
		"odin/core/game/log"
	],
    function(Log) {
        "use strict";
        
		
		var ASSET_ID = 0;
		
		
		function Asset(opts) {
			opts || (opts = {});
			
			this._id = ++ASSET_ID;
			this._type = this.constructor.name || "UnknownAsset";
			
			this.sync = opts.sync != undefined ? !!opts.sync : false;
			this.json = opts.json != undefined ? !!opts.json : true;
			
			this.assets = undefined;
			this.name = opts.name != undefined ? opts.name : "Asset"+ this._id;
			this.src = opts.src;
			this.raw = opts.raw;
			
			this._SYNC = {};
		}
		
		Asset._types = {Asset: Asset};
		Asset.prototype._type = undefined;
		Asset.prototype._onExtend = function(child) {
			Asset._types[child.name] = child;
		}
		
		
		Asset.prototype.mimeType = function() {
			
			return this.src ? this.src.split(".").pop() : false;
		};
		
		
		Asset.prototype.clear = function() {
			
			this.raw = null;
			return this;
		};
		
		
		Asset.prototype.destroy = function() {
			if (!this.assets) {
                Log.warn("Asset.destroy: can't destroy Asset if it's not added to Assets");
                return this;
            }
			
			this.assets.removeAsset(this);
			this.clear();
			
			return this;
		};
		
		
		Asset.prototype.parse = function(raw) {
			
			this.raw = raw;
			return this;
		};

		
		Asset.prototype.toSYNC = function(json) {
			json || (json = this._SYNC);
			
			return json;
		};

		
		Asset.prototype.fromSYNC = function(json) {
			
			return this;
		};

		
		Asset.prototype.toJSON = function(json) {
			json || (json = {});
			
			json._type = this._type;
			
			json.name = this.name;
			json.src = this.src;
			
			return json;
		};

		
		Asset.prototype.fromJSON = function(json) {
			
			this._type = json._type;
			
			this.name = json.name;
			this.src = json.src;
			
			return this;
		};
		
		
		function extend(child, parent) {
			var parentProto = parent.prototype,
				childProto = child.prototype = Object.create(parentProto),
				key;
			
			for (key in parentProto) childProto[key] = parentProto[key];
			childProto.constructor = child;
			
			if (parentProto._onExtend) parentProto._onExtend(child);
			child.extend = extend;
		};
		
		
		Asset.extend = extend;


        return Asset;
    }
);