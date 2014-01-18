if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "core/assets/asset"
    ],
    function(Asset) {
        "use strict";


        function SpriteSheet(opts) {
            opts || (opts = {});

            Asset.call(this, opts);
        }

        Asset.extend(SpriteSheet);


        SpriteSheet.prototype.parse = function(raw) {
            Asset.prototype.parse.call(this, raw);

            for (var key in raw) {
                if (!this[key]) {
                    this[key] = raw[key];
                } else {
                    Log.error("SpriteSheet.parse: invalid animation name " + key + " in file " + this.src);
                }
            }

            return this;
        };


        SpriteSheet.prototype.clear = function() {
            for (var key in this.raw) this[key] = null;
            Asset.prototype.clear.call(this);

            return this;
        };


        SpriteSheet.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json);

            if ((pack || !this.src) && this.raw) json.raw = JSON.stringify(this.raw);

            return json;
        };


        SpriteSheet.prototype.fromServerJSON = function(json) {
            Asset.prototype.fromServerJSON.call(this, json);

            if (!json.src && json.raw) this.raw = JSON.parse(json.raw);
            this.parse(this.raw);

            return this;
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
