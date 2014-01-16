if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "core/assets/asset",
        "core/game/log"
    ],
    function(Asset, Log) {
        "use strict";


        function Material(opts) {
            opts || (opts = {});

            Asset.call(this, opts);
        }

        Material.type = "Material";
        Asset.extend(Material);


        Material.prototype.parse = function(raw) {

            Asset.prototype.parse.call(this, raw);

            for (var key in raw) {
                if (!this[key]) {
                    this[key] = raw[key];
                } else {
                    Log.warn("Material.parse: bad name " + key + " in file " + this.src);
                }
            }

            return this;
        };


        Material.prototype.clear = function() {

            for (var key in this.raw) this[key] = null;
            Asset.prototype.clear.call(this);

            return this;
        };


        Material.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json);


            return json;
        };


        Material.prototype.fromJSON = function(json) {
            Asset.prototype.fromJSON.call(this, json);

            return this;
        };


        return Material;
    }
);
