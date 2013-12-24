if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define([
        "core/game/log"
    ],
    function(Log) {
        "use strict";


        var ASSET_ID = 0,
            defineProperty = Object.defineProperty;


        function Asset(opts) {
            opts || (opts = {});

            this._id = ++ASSET_ID;
            this._type = this.constructor.name || "UnknownAsset";

            this.json = opts.json != undefined ? !!opts.json : true;

            this.assets = undefined;
            this._name = opts.name != undefined ? opts.name : "Asset" + this._id;
            this.src = opts.src;
            this.raw = opts.raw;
        }

        Asset.type = "Asset";
        Asset._types = {
            Asset: Asset
        };
        Asset.prototype._onExtend = function(child) {

            Asset._types[child.type] = child;
        }

		
		defineProperty(Asset.prototype, "name", {
			get: function() {
				return this._name;
			},
			set: function(value) {
				var assets = this.assets,
					hash;
				
				if (assets) {
					hash = assets.hash;
					
					if (hash[value]) {
						Log.warn("Asset.set name: can't change name to "+ value +" Assets already have an asset with same name");
						return;
					}
						
					delete hash[this.name];
					hash[value] = this;
				}

				this._name = value;
			}
		});


        Asset.prototype.clone = function() {

            return new this.constructor().copy(this);
        };


        Asset.prototype.copy = function(other) {

            this.sync = other.sync;
            this.json = other.json;

            this.name = other.name + "." + this._id;
            this.src = other.src;
            this.raw = other.raw;

            if (this.assets !== other.assets) other.assets.addAsset(this);

            return this;
        };


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


        Asset.prototype.toJSON = function(json, pack) {
            json || (json = {});

            json._type = this._type;

            json.name = this.name;
            if (!pack) json.src = this.src;
			
            return json;
        };


        Asset.prototype.fromJSON = function(json) {

            this._type = json._type;

            this.name = json.name;
            this.src = json.src;
			
            return this;
        };


        function extend(child, parent) {

            child.prototype = Object.create(parent.prototype);
            child.prototype.constructor = child;

            if (parent.prototype._onExtend) parent.prototype._onExtend(child);
            child.extend = extend;
        };


        Asset.extend = extend;


        return Asset;
    }
);
