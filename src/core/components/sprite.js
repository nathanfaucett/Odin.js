if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/time",
        "math/vec2",
        "core/enums",
        "core/components/component",
        "core/assets/assets"
    ],
    function(Time, Vec2, Enums, Component, Assets) {
        "use strict";


        function Sprite(opts) {
            opts || (opts = {});

            Component.call(this, "Sprite", !! opts.sync, opts.json);

            this.visible = opts.visible != undefined ? !! opts.visible : true;
            this.blending = opts.blending != undefined ? opts.blending : Enums.Blending.Default;

            this.z = opts.z != undefined ? opts.z : 0;

            this.alpha = opts.alpha != undefined ? opts.alpha : 1;

            this.texture = opts.texture != undefined ? opts.texture : undefined;

            this.width = opts.width || 1;
            this.height = opts.height || 1;

            this.x = opts.x || 0;
            this.y = opts.y || 0;
            this.w = opts.w || 1;
            this.h = opts.h || 1;
        }

        Sprite.type = "Sprite";
        Component.extend(Sprite);


        Sprite.prototype.copy = function(other) {

            this.visible = other.visible;
            this.blending = other.blending;

            this.z = other.z;

            this.alpha = other.alpha;

            this.texture = other.texture;

            this.width = other.width;
            this.height = other.height;

            this.x = other.x;
            this.y = other.y;
            this.w = other.w;
            this.h = other.h;

            return this;
        };


        Sprite.prototype.clear = function() {

            this.texture = undefined;

            return this;
        };


        Sprite.prototype.toSYNC = function(json) {
            json = Component.prototype.toSYNC.call(this, json);

            json.visible = this.visible;
            json.blending = this.blending;

            json.z = this.z;

            json.alpha = this.alpha;

            json.width = this.width;
            json.height = this.height;

            json.x = this.x;
            json.y = this.y;
            json.w = this.w;
            json.h = this.h;

            return json;
        };


        Sprite.prototype.fromSYNC = function(json) {
            Component.prototype.fromSYNC.call(this, json);

            this.visible = json.visible;
            this.blending = json.blending;

            this.z = json.z;

            this.alpha = json.alpha;

            this.width = json.width;
            this.height = json.height;

            this.x = json.x;
            this.y = json.y;
            this.w = json.w;
            this.h = json.h;

            return this;
        };


        Sprite.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.visible = this.visible;
            json.blending = this.blending;

            json.z = this.z;

            json.alpha = this.alpha;

            json.texture = this.texture ? this.texture.name : undefined;

            json.width = this.width;
            json.height = this.height;

            json.x = this.x;
            json.y = this.y;
            json.w = this.w;
            json.h = this.h;

            return json;
        };


        Sprite.prototype.fromServerJSON = function(json) {
            Component.prototype.fromServerJSON.call(this, json);

            this.visible = json.visible;
            this.blending = json.blending;

            this.z = json.z;

            this.alpha = json.alpha;

            this.texture = json.texture ? Assets.hash[json.texture] : undefined;

            this.width = json.width;
            this.height = json.height;

            this.x = json.x;
            this.y = json.y;
            this.w = json.w;
            this.h = json.h;

            return this;
        };


        Sprite.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.visible = json.visible;
            this.blending = json.blending;

            this.z = json.z;

            this.alpha = json.alpha;

            this.texture = json.texture ? Assets.hash[json.texture] : undefined;

            this.width = json.width;
            this.height = json.height;

            this.x = json.x;
            this.y = json.y;
            this.w = json.w;
            this.h = json.h;

            return this;
        };


        Sprite.prototype.sort = function(a, b) {

            return b.z - a.z;
        };


        return Sprite;
    }
);
