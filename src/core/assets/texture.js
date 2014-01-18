if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "core/assets/asset"
    ],
    function(Asset) {
        "use strict";


        function Texture(opts) {
            opts || (opts = {});

            Asset.call(this, opts);

            this.anisotropy = opts.anisotropy != undefined ? opts.anisotropy : 1;

            this.minFilter = opts.minFilter != undefined ? opts.minFilter : "LINEAR";
            this.magFilter = opts.magFilter != undefined ? opts.magFilter : "LINEAR";

            this.format = opts.format !== undefined ? opts.format : "RGBA";

            this._needsUpdate = true;
        }

        Asset.extend(Texture);


        Texture.prototype.setAnisotropy = function(value) {

            this.anisotropy = value;
            this._needsUpdate = true;
        };


        Texture.prototype.setMinFilter = function(value) {

            this.minFilter = value;
            this._needsUpdate = true;
        };


        Texture.prototype.setMagFilter = function(value) {

            this.magFilter = value;
            this._needsUpdate = true;
        };


        Texture.prototype.setFormat = function(value) {

            this.format = value;
            this._needsUpdate = true;
        };


        var CANVAS, CTX;
        Texture.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json);

            if ((pack || !this.src) && this.raw) {
                if (typeof(window) === "undefined") {
                    json.raw = this.raw;
                } else {
                    var raw = this.raw,
                        canvas = CANVAS || (CANVAS = document.createElement("canvas")),
                        ctx = CTX || (CTX = CANVAS.getContext("2d"));

                    canvas.width = raw.width;
                    canvas.height = raw.height;

                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(raw, 0, 0);

                    json.raw = canvas.toDataURL();
                }
            }

            json.anisotropy = this.anisotropy;
            json.minFilter = this.minFilter;
            json.magFilter = this.magFilter;
            json.format = this.format;

            return json;
        };


        Texture.prototype.fromServerJSON = function(json) {
            Asset.prototype.fromServerJSON.call(this, json);

            if (!json.src && json.raw) {
                if (typeof(window) === "undefined") {
                    this.raw = json.raw;
                } else {
                    var image = new Image;
                    image.src = json.raw;
                    this.raw = image;
                }
            }

            this.anisotropy = json.anisotropy;
            this.minFilter = json.minFilter;
            this.magFilter = json.magFilter;
            this.format = json.format;

            return this;
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

            this.anisotropy = json.anisotropy;
            this.minFilter = json.minFilter;
            this.magFilter = json.magFilter;
            this.format = json.format;

            return this;
        };


        return Texture;
    }
);
