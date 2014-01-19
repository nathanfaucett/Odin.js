if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/math/mathf",
        "odin/math/color",
        "odin/math/vec3",
        "odin/math/mat4",
        "odin/core/components/component"
    ],
    function(Mathf, Color, Vec3, Mat4, Component) {
        "use strict";


        var degsToRads = Mathf.degsToRads;


        function Camera(opts) {
            opts || (opts = {});

            Component.call(this, "Camera", opts);

            this.width = 960;
            this.height = 640;

            this.aspect = this.width / this.height;
            this.fov = opts.fov !== undefined ? opts.fov : 35;

            this.near = opts.near !== undefined ? opts.near : 0.1;
            this.far = opts.far !== undefined ? opts.far : 512;

            this.orthographic = opts.orthographic !== undefined ? !! opts.orthographic : false;
            this.orthographicSize = opts.orthographicSize !== undefined ? opts.orthographicSize : 2;

            this.minOrthographicSize = opts.minOrthographicSize !== undefined ? opts.minOrthographicSize : 0.01;
            this.maxOrthographicSize = opts.maxOrthographicSize !== undefined ? opts.maxOrthographicSize : 1024;

            this.projection = new Mat4;
            this.view = new Mat4;

            this._needsUpdate = true;
            this._active = false;
        }

        Camera.type = "Camera";
        Component.extend(Camera);


        Camera.prototype.copy = function(other) {

            this.width = other.width;
            this.height = other.height;
            this.aspect = other.aspect;

            this.far = other.far;
            this.near = other.near;
            this.fov = other.fov;

            this.orthographic = other.orthographic;
            this.orthographicSize = other.orthographicSize;
            this.minOrthographicSize = other.minOrthographicSize;
            this.maxOrthographicSize = other.maxOrthographicSize;

            this._needsUpdate = true;

            return this;
        };


        Camera.prototype.set = function(width, height) {

            this.width = width;
            this.height = height;
            this.aspect = width / height;
            this._needsUpdate = true;
        };


        Camera.prototype.setWidth = function(width) {

            this.width = width;
            this.aspect = width / this.height;
            this._needsUpdate = true;
        };


        Camera.prototype.setHeight = function(height) {

            this.height = height;
            this.aspect = this.width / height;
            this._needsUpdate = true;
        };


        Camera.prototype.setFov = function(value) {

            this.fov = value;
            this._needsUpdate = true;
        };


        Camera.prototype.setNear = function(value) {

            this.near = value;
            this._needsUpdate = true;
        };


        Camera.prototype.setFar = function(value) {

            this.far = value;
            this._needsUpdate = true;
        };


        Camera.prototype.setOrthographic = function(value) {

            this.orthographic = !! value;
            this._needsUpdate = true;
        };


        Camera.prototype.toggleOrthographic = function() {

            this.orthographic = !this.orthographic;
            this._needsUpdate = true;
        };


        Camera.prototype.setOrthographicSize = function(size) {

            this.orthographicSize = clamp(size, this.minOrthographicSize, this.maxOrthographicSize);
            this._needsUpdate = true;
        };


        var MAT4 = new Mat4,
            VEC3 = new Vec3;

        Camera.prototype.toWorld = function(v, out) {
            out || (out = new Vec3);

            out.x = 2 * v.x / this.width - 1;
            out.y = -2 * v.y / this.height + 1;
            out.transformMat4(MAT4.mmul(this.projection, this.view).inverse());
            out.z = this.near;

            return out;
        };


        Camera.prototype.toScreen = function(v, out) {
            out || (out = new Vec2);

            VEC3.copy(v);
            VEC3.transformMat4(MAT4.mmul(this.projection, this.view));

            out.x = ((VEC3.x + 1) * 0.5) * this.width;
            out.y = ((1 - VEC3.y) * 0.5) * this.height;

            return v;
        };


        Camera.prototype.update = function() {
            if (!this._active) return;

            if (this._needsUpdate) {

                if (!this.orthographic) {

                    this.projection.perspective(degsToRads(this.fov), this.aspect, this.near, this.far);
                } else {
                    this.orthographicSize = clamp(this.orthographicSize, this.minOrthographicSize, this.maxOrthographicSize);

                    var orthographicSize = this.orthographicSize,
                        right = orthographicSize * this.aspect,
                        left = -right,
                        top = orthographicSize,
                        bottom = -top;

                    this.projection.orthographic(left, right, bottom, top, this.near, this.far);
                }

                this._needsUpdate = false;
            }

            this.view.inverseMat(this.transform.matrixWorld);
        };


        Camera.prototype.sort = function(a, b) {

            return a._active ? -1 : b._active ? 1 : -1;
        };


        Camera.prototype.toSYNC = function(json) {
            json = Component.prototype.toSYNC.call(this, json);

            json.width = this.width;
            json.height = this.height;
            json.aspect = this.aspect;

            json.far = this.far;
            json.near = this.near;
            json.fov = this.fov;

            json.orthographic = this.orthographic;
            json.orthographicSize = this.orthographicSize;
            json.minOrthographicSize = this.minOrthographicSize;
            json.maxOrthographicSize = this.maxOrthographicSize;

            return json;
        };


        Camera.prototype.fromSYNC = function(json) {
            Component.prototype.fromSYNC.call(this, json);
            if (json.width !== this.width || json.height !== this.height) this._needsUpdate = true;

            this.width = json.width;
            this.height = json.height;
            this.aspect = json.aspect;

            this.far = json.far;
            this.near = json.near;
            this.fov = json.fov;

            this.orthographic = json.orthographic;
            this.orthographicSize = json.orthographicSize;
            this.minOrthographicSize = json.minOrthographicSize;
            this.maxOrthographicSize = json.maxOrthographicSize;

            return this;
        };


        Camera.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.width = this.width;
            json.height = this.height;
            json.aspect = this.aspect;

            json.far = this.far;
            json.near = this.near;
            json.fov = this.fov;

            json.orthographic = this.orthographic;
            json.orthographicSize = this.orthographicSize;
            json.minOrthographicSize = this.minOrthographicSize;
            json.maxOrthographicSize = this.maxOrthographicSize;

            return json;
        };


        Camera.prototype.fromServerJSON = function(json) {
            Component.prototype.fromServerJSON.call(this, json);

            this.width = json.width;
            this.height = json.height;
            this.aspect = json.aspect;

            this.far = json.far;
            this.near = json.near;
            this.fov = json.fov;

            this.orthographic = json.orthographic;
            this.orthographicSize = json.orthographicSize;
            this.minOrthographicSize = json.minOrthographicSize;
            this.maxOrthographicSize = json.maxOrthographicSize;

            this._needsUpdate = true;

            return this;
        };


        Camera.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.width = json.width;
            this.height = json.height;
            this.aspect = json.aspect;

            this.far = json.far;
            this.near = json.near;
            this.fov = json.fov;

            this.orthographic = json.orthographic;
            this.orthographicSize = json.orthographicSize;
            this.minOrthographicSize = json.minOrthographicSize;
            this.maxOrthographicSize = json.maxOrthographicSize;

            this._needsUpdate = true;

            return this;
        };


        return Camera;
    }
);
