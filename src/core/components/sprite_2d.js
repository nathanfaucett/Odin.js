if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define([
        "base/class",
        "base/time",
        "math/vec2",
        "core/components/component",
        "core/assets/assets"
    ],
    function(Class, Time, Vec2, Component, Assets) {
        "use strict";


        function Sprite2D(opts) {
            opts || (opts = {});

            Component.call(this, "Sprite2D", opts.sync != undefined ? !! opts.sync : false, opts.json);

            this.visible = opts.visible != undefined ? !! opts.visible : true;

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

        Sprite2D.type = "Sprite2D";
        Class.extend(Sprite2D, Component);


        Sprite2D.prototype.copy = function(other) {

            this.visible = other.visible;

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


        Sprite2D.prototype.toSYNC = function(json) {
            json = Component.prototype.toSYNC.call(this, json);

            json.visible = this.visible;

            json.z = this.z;

            json.alpha = this.alpha;

            json.width = this.width;
            json.height = this.height;

            return json;
        };


        Sprite2D.prototype.fromSYNC = function(json) {
            Component.prototype.fromSYNC.call(this, json);

            this.visible = json.visible;

            this.z = json.z;

            this.alpha = json.alpha;

            this.width = json.width;
            this.height = json.height;

            return this;
        };


        Sprite2D.prototype.toJSON = function(json) {
            json || (json = {});
            Component.prototype.toJSON.call(this, json);

            json.visible = this.visible;

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


        Sprite2D.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.visible = json.visible;

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


        Sprite2D.prototype.sort = function(a, b) {

            return b.z - a.z;
        };


        var ONCE = Sprite2D.ONCE = 1,
            LOOP = Sprite2D.LOOP = 2,
            PING_PONG = Sprite2D.PING_PONG = 3;


        return Sprite2D;
    }
);
