if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "core/assets/asset",
        "core/game/log"
    ],
    function(Asset, Log) {
        "use strict";


        function Mesh(opts) {
            opts || (opts = {});

            Asset.call(this, opts);
        }

        Mesh.type = "Mesh";
        Asset.extend(Mesh);


        Mesh.prototype.parse = function(raw) {

            Asset.prototype.parse.call(this, raw);

            for (var key in raw) {
                if (!this[key]) {
                    this[key] = raw[key];
                } else {
                    Log.warn("Mesh.parse: bad name " + key + " in file " + this.src);
                }
            }

            return this;
        };


        Mesh.prototype.clear = function() {

            for (var key in this.raw) this[key] = null;
            Asset.prototype.clear.call(this);

            return this;
        };


        Mesh.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json);

            return json;
        };


        Mesh.prototype.fromServerJSON = function(json) {
            Asset.prototype.fromServerJSON.call(this, json);

            return this;
        };


        Mesh.prototype.fromJSON = function(json) {
            Asset.prototype.fromJSON.call(this, json);

            return this;
        };


        return Mesh;
    }
);
