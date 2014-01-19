if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/asset"
    ],
    function(Asset) {
        "use strict";


        function Mesh(opts) {
            opts || (opts = {});

            Asset.call(this, opts);
        }

        Asset.extend(Mesh);


        Mesh.prototype.parse = function(raw) {
            Asset.prototype.parse.call(this, raw);

            return this;
        };


        Mesh.prototype.clear = function() {
            Asset.prototype.clear.call(this);

            return this;
        };


        Mesh.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json, pack);

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
