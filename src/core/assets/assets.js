if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/class",
        "core/assets/asset",
        "core/game/log"
    ],
    function(Class, Asset, Log) {
        "use strict";


        function Assets() {

            Array.call(this);

            this.hash = {};
        }

        Assets.prototype = Object.create(Array.prototype);
        Assets.prototype.constructor = Assets;


        Assets.prototype.addAsset = function(asset) {
            var name = asset.name;

            if (this.hash[name]) {
                Log.warn("Assets.addAsset: Assets already have Asset named " + asset.name);
                return undefined;
            }

            asset.assets = this;
            this.push(asset);
            this.hash[name] = asset;

            return asset;
        };


        Assets.prototype.add = Assets.prototype.addAssets = function() {

            for (var i = arguments.length; i--;) this.addAsset(arguments[i]);
        };


        Assets.prototype.removeAsset = function(asset) {
            var name = typeof(asset) === "string" ? asset : asset.name;
            asset = this.hash[name];

            if (!asset) {
                Log.warn("Assets.removeAsset: Assets does not have an Asset named " + name);
                return undefined;
            }

            this.splice(this.indexOf(asset), 1);
            this.hash[name] = null;

            return asset;
        };


        Assets.prototype.remove = Assets.prototype.removeAssets = function() {

            for (var i = arguments.length; i--;) this.removeAsset(arguments[i]);
        };


        Assets.prototype.toJSON = function(json, pack) {
            json || (json = {});
            var jsonAssets = json.assets || (json.assets = []),
                jsonAsset,
                i = this.length;

            for (; i--;) {
                if ((jsonAsset = this[i]).json) jsonAssets[i] = jsonAsset.toJSON(jsonAssets[i], pack);
            }

            return json;
        };


        Assets.prototype.fromServerJSON = function(json) {
            var assetsHash = this.hash,
                jsonAssets = json.assets || (json.assets = []),
                asset, jsonAsset,
                i = jsonAssets.length;

            for (; i--;) {
                if (!(jsonAsset = jsonAssets[i])) continue;

                if ((asset = assetsHash[jsonAsset.name])) {
                    asset.fromServerJSON(jsonAsset);
                } else {
                    this.add(Class.fromServerJSON(jsonAsset));
                }
            }

            return this;
        };


        Assets.prototype.fromJSON = function(json) {
            var assetsHash = this.hash,
                jsonAssets = json.assets || (json.assets = []),
                asset, jsonAsset,
                i = jsonAssets.length;

            for (; i--;) {
                if (!(jsonAsset = jsonAssets[i])) continue;

                if ((asset = assetsHash[jsonAsset.name])) {
                    asset.fromJSON(jsonAsset);
                } else {
                    this.add(Class.fromJSON(jsonAsset));
                }
            }

            return this;
        };


        return new Assets;
    }
);
