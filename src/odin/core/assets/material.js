if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/math/vec2",
        "odin/math/mat4",
        "odin/core/assets/asset",
        "odin/core/assets/assets"
    ],
    function(Vec2, Mat4, Asset, Assets) {
        "use strict";


        function Material(opts) {
            opts || (opts = {});

            Asset.call(this, opts);

			this.matrix = new Mat4;

			this.vertex = opts.vertex || "void main() {}";
			this.fragment = opts.fragment || "void main() {}";

            this.color = opts.color != undefined ? opts.color : new Color(0, 0, 0);
            this.specular = opts.specular != undefined ? opts.specular : new Color(0.5, 0.5, 0.5);
            this.emissive = opts.emissive != undefined ? opts.emissive : new Color(0, 0, 0);

			this.alpha = opts.alpha != undefined ? opts.alpha : 1;
            this.shininess = opts.shininess != undefined ? opts.shininess : 0.5;

            this.mainTexture = opts.mainTexture != undefined ? opts.mainTexture : undefined;
            this.mainTextureOffset = opts.mainTextureOffset != undefined ? opts.mainTextureOffset : new Vec2;
            this.mainTextureScale = opts.mainTextureScale != undefined ? opts.mainTextureScale : new Vec2(1, 1);
        }

        Asset.extend(Material);


        Material.prototype.parse = function(raw) {
            Asset.prototype.parse.call(this, raw);
			
			this.fromJSON(raw);
			
            return this;
        };


        Material.prototype.clear = function() {
            Asset.prototype.clear.call(this);
			
			this.vertex = "";
			this.fragment = "";
			
			this.mainTexture = undefined;
			
            return this;
        };


        Material.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json, pack);
			
			json.vertex = this.vertex;
			json.fragment = this.fragment;
			
            json.color = this.color.toJSON(json.color);
            json.specular = this.specular.toJSON(json.specular);
            json.emissive = this.emissive.toJSON(json.emissive);
			
			json.alpha = this.alpha;
            json.shininess = this.shininess;
			
            json.mainTexture = json.mainTexture != undefined ? json.mainTexture.name : undefined;
            json.mainTextureOffset = this.mainTextureOffset.toJSON(json.mainTextureOffset);
            json.mainTextureScale = this.mainTextureScale.toJSON(json.mainTextureScale);
			
            return json;
        };


        Material.prototype.fromServerJSON = function(json) {
            Asset.prototype.fromServerJSON.call(this, json);
			
			this.fromJSON(json);
			
            return this;
        };


        Material.prototype.fromJSON = function(json) {
            Asset.prototype.fromJSON.call(this, json);
			
			this.vertex = json.vertex;
			this.fragment = json.fragment;
			
			this.color.fromJSON(json.color);
            this.specular.fromJSON(json.specular);
            this.emissive.fromJSON(json.emissive);
			
			this.alpha = json.alpha;
            this.shininess = json.shininess;
			
            this.mainTexture = json.mainTexture != undefined ? Assets.hash[json.mainTexture] : undefined;
            this.mainTextureOffset.fromJSON(json.mainTextureOffset);
            this.mainTextureScale.fromJSON(json.mainTextureScale);
			
            return this;
        };


        return Material;
    }
);
