if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/math/mathf",
        "odin/math/color",
        "odin/math/vec2",
        "odin/math/mat32",
        "odin/math/mat4",
        "odin/core/components/component"
    ],
    function(Mathf, Color, Vec2, Mat32, Mat4, Component) {
        "use strict";


        var clamp = Mathf.clamp;


        function Camera2D(opts) {
            opts || (opts = {});

            Component.call(this, "Camera2D", !! opts.sync, opts.json);

            this.width = 960;
            this.height = 640;

            this.aspect = this.width / this.height;

            this.orthographicSize = opts.orthographicSize !== undefined ? opts.orthographicSize : 2;

            this.minOrthographicSize = opts.minOrthographicSize !== undefined ? opts.minOrthographicSize : 0.01;
            this.maxOrthographicSize = opts.maxOrthographicSize !== undefined ? opts.maxOrthographicSize : 1024;

            this.projection = new Mat32;
            this.view = new Mat32;

            this._needsUpdate = true;
            this._active = false;
        }

        Camera2D.type = "Camera2D";
        Component.extend(Camera2D);


        Camera2D.prototype.copy = function(other) {

            this.width = other.width;
            this.height = other.height;

            this.orthographicSize = other.orthographicSize;
            this.minOrthographicSize = other.minOrthographicSize;
            this.maxOrthographicSize = other.maxOrthographicSize;

            this._needsUpdate = true;

            return this;
        };


        Camera2D.prototype.set = function(width, height) {

            this.width = width;
            this.height = height;
            this.aspect = width / height;
            this._needsUpdate = true;
        };


        Camera2D.prototype.setWidth = function(width) {

            this.width = width;
            this.aspect = width / this.height;
            this._needsUpdate = true;
        };


        Camera2D.prototype.setHeight = function(height) {

            this.height = height;
            this.aspect = this.width / height;
            this._needsUpdate = true;
        };


        Camera2D.prototype.setOrthographicSize = function(size) {

            this.orthographicSize = clamp(size, this.minOrthographicSize, this.maxOrthographicSize);
            this._needsUpdate = true;
        };


        var MAT32 = new Mat32,
            VEC2 = new Vec2;
        Camera2D.prototype.toWorld = function(v, out) {
            out || (out = new Vec3);

            out.x = 2 * v.x / this.width - 1;
            out.y = -2 * v.y / this.height + 1;
            out.transformMat32(MAT32.mmul(this.projection, this.view).inverse());

            return out;
        };


        Camera2D.prototype.toScreen = function(v, out) {
            out || (out = new Vec2);

            VEC2.copy(v).transformMat32(MAT32.mmul(this.projection, this.view));

            out.x = ((VEC2.x + 1) * 0.5) * this.width;
            out.y = ((1 - VEC2.y) * 0.5) * this.height;

            return v;
        };


        Camera2D.prototype.update = function() {
            if (!this._active) return;

            if (this._needsUpdate) {
                var orthographicSize = this.orthographicSize,
                    right = orthographicSize * this.aspect,
                    left = -right,
                    top = orthographicSize,
                    bottom = -top;

                this.projection.orthographic(left, right, bottom, top);
                this._needsUpdate = false;
            }

            this.view.inverseMat(this.transform2d.matrixWorld);
        };


        Camera2D.prototype.sort = function(a, b) {

            return a._active ? -1 : b._active ? 1 : -1;
        };


        Camera2D.prototype.toSYNC = function(json) {
            json = Component.prototype.toSYNC.call(this, json);

            json.width = this.width;
            json.height = this.height;

            json.orthographicSize = this.orthographicSize;
            json.minOrthographicSize = this.minOrthographicSize;
            json.maxOrthographicSize = this.maxOrthographicSize;

            return json;
        };


        Camera2D.prototype.fromSYNC = function(json) {
            Component.prototype.fromSYNC.call(this, json);
            if (json.width !== this.width || json.height !== this.height) this._needsUpdate = true;

            this.width = json.width;
            this.height = json.height;

            this.orthographicSize = json.orthographicSize;
            this.minOrthographicSize = json.minOrthographicSize;
            this.maxOrthographicSize = json.maxOrthographicSize;

            return this;
        };


        Camera2D.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.width = this.width;
            json.height = this.height;

            json.orthographicSize = this.orthographicSize;
            json.minOrthographicSize = this.minOrthographicSize;
            json.maxOrthographicSize = this.maxOrthographicSize;

            return json;
        };


        Camera2D.prototype.fromServerJSON = function(json) {
            Component.prototype.fromServerJSON.call(this, json);

            this.width = json.width;
            this.height = json.height;

            this.orthographicSize = json.orthographicSize;
            this.minOrthographicSize = json.minOrthographicSize;
            this.maxOrthographicSize = json.maxOrthographicSize;

            this._needsUpdate = true;

            return this;
        };


        Camera2D.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.width = json.width;
            this.height = json.height;

            this.orthographicSize = json.orthographicSize;
            this.minOrthographicSize = json.minOrthographicSize;
            this.maxOrthographicSize = json.maxOrthographicSize;

            this._needsUpdate = true;

            return this;
        };


        return Camera2D;
    }
);
