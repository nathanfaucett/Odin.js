if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/asset"
    ],
    function(Asset) {
        "use strict";


        function Material(opts) {
            opts || (opts = {});

            Asset.call(this, opts);
        }

        Asset.extend(Material);


        Material.prototype.parse = function(raw) {
            Asset.prototype.parse.call(this, raw);

            return this;
        };


        Material.prototype.clear = function() {
            Asset.prototype.clear.call(this);

            return this;
        };


        Material.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json, pack);

            return json;
        };


        Material.prototype.fromServerJSON = function(json) {
            Asset.prototype.fromServerJSON.call(this, json);

            return this;
        };


        Material.prototype.fromJSON = function(json) {
            Asset.prototype.fromJSON.call(this, json);

            return this;
        };


        return Material;
    }
);
