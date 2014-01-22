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

            this.alpha = opts.alpha !== undefined ? opts.alpha : 1;

            this.color = opts.color !== undefined ? opts.color : new Color(0, 0, 0);
            this.specular = opts.specular !== undefined ? opts.specular : new Color(0.5, 0.5, 0.5);
            this.emissive = opts.emissive !== undefined ? opts.emissive : new Color(0, 0, 0);

            this.shininess = opts.shininess !== undefined ? opts.shininess : 0.5;

            this.mainTexture = opts.mainTexture !== undefined ? opts.mainTexture : undefined;
            this.mainTextureOffset = opts.mainTextureOffset !== undefined ? opts.mainTextureOffset : new Vec2;
            this.mainTextureScale = opts.mainTextureScale !== undefined ? opts.mainTextureScale : new Vec2(1, 1);

            this.shader = opts.shader instanceof Shader ? opts.shader : new Shader(opts);
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
