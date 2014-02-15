if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/game/log",
        "odin/base/class"
    ],
    function(Log, Class) {
        "use strict";


        var defineProperty = Object.defineProperty;


        function Asset(opts) {
            opts || (opts = {});

            Class.call(this);

            this._name = opts.name != undefined ? opts.name : "Asset_" + this._id;
            this._loaded = false;

            this.json = opts.json != undefined ? !! opts.json : true;

            this.assets = undefined;
            this.load = opts.load != undefined ? !! opts.load : true;
            this.src = opts.src;
            this.raw = opts.raw;
        }

        Class.extend(Asset);


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
                        Log.warn("Asset.set name: can't change name to " + value + " Assets already have an asset with same name");
                        return;
                    }

                    delete hash[this.name];
                    hash[value] = this;
                }

                this._name = value;
            }
        });


        Asset.prototype.copy = function(other) {

            this.sync = other.sync;
            this.json = other.json;

            this.name = other.name + "." + this._id;
            this.src = other.src;
            this.raw = other.raw;

            if (other.assets && this.assets !== other.assets) other.assets.addAsset(this);

            return this;
        };


        Asset.prototype.clear = function() {

            this.raw = null;
            return this;
        };


        Asset.prototype.destroy = function() {
            if (!this.assets) {
                Log.error("Asset.destroy: can't destroy Asset if it's not added to Assets");
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
            json = Class.prototype.toJSON.call(this, json);

            json.name = this.name;
            if (!pack) json.src = this.src;

            return json;
        };


        Asset.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);

            this.name = json.name;
            this.src = json.src;

            return this;
        };


        return Asset;
    }
);
