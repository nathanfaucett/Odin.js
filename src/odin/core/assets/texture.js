if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/enums",
        "odin/core/assets/asset"
    ],
    function(Enums, Asset) {
        "use strict";


        function Texture(opts) {
            opts || (opts = {});

            Asset.call(this, opts);

            this.width = 0;
            this.height = 0;

            this.invWidth = 0;
            this.invHeight = 0;

            this.generateMipmap = opts.generateMipmap != undefined ? !! opts.generateMipmap : true;
            this.flipY = opts.flipY != undefined ? !! opts.flipY : true;
            this.premultiplyAlpha = opts.premultiplyAlpha != undefined ? !! opts.premultiplyAlpha : false;

            this.anisotropy = opts.anisotropy != undefined ? opts.anisotropy : 1;

            this.filter = opts.filter != undefined ? opts.filter : Enums.FilterMode.Linear;
            this.format = opts.format != undefined ? opts.format : Enums.TextureFormat.RGBA;
            this.wrap = opts.wrap != undefined ? opts.wrap : Enums.TextureWrap.Repeat;

            this._webgl = undefined;

            this.needsUpdate = true;
        }

        Asset.extend(Texture);


        Texture.prototype.copy = function(other) {
            Asset.prototype.copy.call(this, other);

            this.width = other.width;
            this.height = other.height;

            this.invWidth = other.invWidth;
            this.invHeight = other.invHeight;

            this.generateMipmap = other.generateMipmap;
            this.flipY = other.flipY;
            this.premultiplyAlpha = other.premultiplyAlpha;

            this.anisotropy = other.anisotropy;

            this.filter = other.filter;
            this.format = other.format;
            this.wrap = other.wrap;

            return this;
        };


        Texture.prototype.parse = function(raw) {
            Asset.prototype.parse.call(this, raw);

            this.width = raw.width;
            this.height = raw.height;

            this.invWidth = 1 / this.width;
            this.invHeight = 1 / this.height;

            return this;
        };


        Texture.prototype.setMipmap = function(value) {

            this.generateMipmap = value != undefined ? !! value : !this.generateMipmap;
            this.needsUpdate = true;
        };


        Texture.prototype.setAnisotropy = function(value) {

            this.anisotropy = value;
            this.needsUpdate = true;
        };


        Texture.prototype.setFilter = function(value) {

            this.filter = value;
            this.needsUpdate = true;
        };


        Texture.prototype.setFormat = function(value) {

            this.format = value;
            this.needsUpdate = true;
        };


        Texture.prototype.setWrap = function(value) {

            this.wrap = value;
            this.needsUpdate = true;
        };


        Texture.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json);

            if ((pack || !this.src) && this.raw) {
                if (typeof(window) === "undefined") {
                    json.raw = this.raw;
                } else {
                    var raw = this.raw,
                        canvas = document.createElement("canvas"),
                        ctx = canvas.getContext("2d");

                    canvas.width = raw.width;
                    canvas.height = raw.height;
                    ctx.drawImage(raw, 0, 0);

                    json.raw = canvas.toDataURL();
                }
            }

            json.width = this.width;
            json.height = this.height;

            json.invWidth = this.invWidth;
            json.invHeight = this.invHeight;

            json.generateMipmap = this.generateMipmap;
            json.flipY = this.flipY;
            json.premultiplyAlpha = this.premultiplyAlpha;

            json.anisotropy = this.anisotropy;

            json.filter = this.filter;
            json.format = this.format;
            json.wrap = this.wrap;

            return json;
        };


        Texture.prototype.fromJSON = function(json) {
            Asset.prototype.fromJSON.call(this, json);

            if (!json.src && json.raw) {
                if (typeof(window) === "undefined") {
                    this.raw = json.raw;
                } else {
                    var image = new Image;
                    image.src = json.raw;
                    this.raw = image;
                }
            }

            this.width = json.width;
            this.height = json.height;

            this.invWidth = json.invWidth;
            this.invHeight = json.invHeight;

            this.generateMipmap = json.generateMipmap;
            this.flipY = json.flipY;
            this.premultiplyAlpha = json.premultiplyAlpha;

            this.anisotropy = json.anisotropy;

            this.filter = json.filter;
            this.format = json.format;
            this.wrap = json.wrap;

            return this;
        };


        return Texture;
    }
);
