if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/asset"
    ],
    function(Asset) {
        "use strict";


        function MeshAnimations(opts) {
            opts || (opts = {});

            Asset.call(this, opts);
        }

        Asset.extend(MeshAnimations);


        MeshAnimations.prototype.copy = function(other) {
            Asset.prototype.copy.call(this, other);
            var raw = other.raw,
                key;

            for (key in raw) this[key] = raw[key];

            return this;
        };


        MeshAnimations.prototype.parse = function(raw) {
            Asset.prototype.parse.call(this, raw);

            for (var key in raw) {
                if (!this[key]) {
                    this[key] = raw[key];
                } else {
                    Log.error("MeshAnimations.parse: invalid animation name " + key + " in file " + this.src);
                }
            }

            return this;
        };


        MeshAnimations.prototype.clear = function() {
            for (var key in this.raw) this[key] = null;
            Asset.prototype.clear.call(this);

            return this;
        };


        MeshAnimations.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json);

            if ((pack || !this.src) && this.raw) json.raw = JSON.stringify(this.raw);

            return json;
        };


        MeshAnimations.prototype.fromJSON = function(json) {
            Asset.prototype.fromJSON.call(this, json);

            if (!json.src && json.raw) this.raw = JSON.parse(json.raw);
            this.parse(this.raw);

            return this;
        };


        return MeshAnimations;
    }
);
