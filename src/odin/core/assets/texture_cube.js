if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/enums",
        "odin/core/assets/asset"
    ],
    function(Enums, Asset) {
        "use strict";


        function TextureCube(opts) {
            opts || (opts = {});

            Asset.call(this, opts);

            this.flipY = opts.flipY != undefined ? !! opts.flipY : true;
            this.premultiplyAlpha = opts.premultiplyAlpha != undefined ? !! opts.premultiplyAlpha : false;

            this.anisotropy = opts.anisotropy != undefined ? opts.anisotropy : 1;

            this.filter = opts.filter != undefined ? opts.filter : Enums.FilterMode.Linear;
            this.format = opts.format != undefined ? opts.format : Enums.TextureFormat.RGBA;
            this.wrap = opts.wrap != undefined ? opts.wrap : Enums.TextureWrap.Repeat;

            this._webgl = undefined;

            this.needsUpdate = true;
        }

        Asset.extend(TextureCube);


        TextureCube.prototype.copy = function(other) {
            Asset.prototype.copy.call(this, other);

            this.anisotropy = other.anisotropy;
            this.filter = other.filter;
            this.format = other.format;
            this.wrap = other.wrap;

            return this;
        };


        TextureCube.prototype.setAnisotropy = function(value) {

            this.anisotropy = value;
            this.needsUpdate = true;
        };


        TextureCube.prototype.setFilter = function(value) {

            this.filter = value;
            this.needsUpdate = true;
        };


        TextureCube.prototype.setFormat = function(value) {

            this.format = value;
            this.needsUpdate = true;
        };


        TextureCube.prototype.setWrap = function(value) {

            this.wrap = value;
            this.needsUpdate = true;
        };



        TextureCube.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json);

            if ((pack || !this.src) && this.raw) {
                if (typeof(window) === "undefined") {
                    json.raw = this.raw;
                } else {
                    var jsonRaw = json.raw || (json.raw = []),
                        raw = this.raw,
                        i = 0,
                        il = raw.length;

                    for (; i < il; i++) jsonRaw[i] = imageToDataUrl(raw[i]);
                }
            }

            json.anisotropy = this.anisotropy;
            json.filter = this.filter;
            json.format = this.format;
            json.wrap = this.wrap;

            return json;
        };


        TextureCube.prototype.fromJSON = function(json) {
            Asset.prototype.fromJSON.call(this, json);

            if (!json.src && json.raw) {
                if (typeof(window) === "undefined") {
                    this.raw = json.raw;
                } else {
                    var jsonRaw = json.raw,
                        raw = this.raw,
                        i = 0,
                        il = jsonRaw.length;

                    for (; i < il; i++) {
                        var image = new Image;
                        image.src = sonRaw[i];
                        raw[i] = image;
                    }
                }
            }

            this.anisotropy = json.anisotropy;
            this.filter = json.filter;
            this.format = json.format;
            this.wrap = json.wrap;

            return this;
        };


        function imageToDataUrl(image) {
            if (typeof(window) === "undefined") return image;
            var canvas = document.createElement("canvas"),
                ctx = canvas.getContext("2d");

            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);

            return canvas.toDataURL();
        };


        return TextureCube;
    }
);
