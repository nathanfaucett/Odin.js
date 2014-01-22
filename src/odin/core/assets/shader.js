if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/asset"
    ],
    function(Asset) {
        "use strict";


        function Shader(opts) {
            opts || (opts = {});

            Asset.call(this, opts);

            this.vertex = opts.vertex;
            this.fragment = opts.fragment;
        }

        Asset.extend(Shader);


        Shader.prototype.parse = function(raw) {
            Asset.prototype.parse.call(this, raw);

            return this;
        };


        Shader.prototype.clear = function() {
            Asset.prototype.clear.call(this);

            return this;
        };


        Shader.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json, pack);

            return json;
        };


        Shader.prototype.fromServerJSON = function(json) {
            Asset.prototype.fromServerJSON.call(this, json);

            return this;
        };


        Shader.prototype.fromJSON = function(json) {
            Asset.prototype.fromJSON.call(this, json);

            return this;
        };


        return Shader;
    }
);
