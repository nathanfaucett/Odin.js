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


        var degsToRads = Mathf.degsToRads,
            clamp = Mathf.clamp,
            EPSILON = Mathf.EPSILON;


        function Camera(opts) {
            opts || (opts = {});

            Component.call(this, "Camera", opts);

            this.width = 960;
            this.height = 640;
            this.invWidth = 1 / this.width;
            this.invHeight = 1 / this.height;

            this.background = opts.background != undefined ? opts.background : new Color(0.5, 0.5, 0.5);

            this.aspect = this.width / this.height;
            this.fov = opts.fov != undefined ? opts.fov : 35;

            this.near = opts.near != undefined ? opts.near : 0.0625;
            this.far = opts.far != undefined ? opts.far : 16384;

            this.orthographic = opts.orthographic != undefined ? !! opts.orthographic : false;
            this.orthographicSize = opts.orthographicSize != undefined ? opts.orthographicSize : 2;

            this.minOrthographicSize = opts.minOrthographicSize != undefined ? opts.minOrthographicSize : EPSILON;
            this.maxOrthographicSize = opts.maxOrthographicSize != undefined ? opts.maxOrthographicSize : 1024;

            this.projection = new Mat4;
            this.view = new Mat4;

            this.needsUpdate = true;
            this._active = false;
        }

        Component.extend(Camera);


        Camera.prototype.copy = function(other) {

            this.width = other.width;
            this.height = other.height;
            this.aspect = other.aspect;

            this.invWidth = 1 / this.width;
            this.invHeight = 1 / this.height;

            this.background.copy(other.background);

            this.far = other.far;
            this.near = other.near;
            this.fov = other.fov;

            this.orthographic = other.orthographic;
            this.orthographicSize = other.orthographicSize;
            this.minOrthographicSize = other.minOrthographicSize;
            this.maxOrthographicSize = other.maxOrthographicSize;

            this.needsUpdate = true;

            return this;
        };


        Camera.prototype.set = function(width, height) {

            this.width = width;
            this.height = height;

            this.invWidth = 1 / this.width;
            this.invHeight = 1 / this.height;

            this.aspect = width / height;
            this.needsUpdate = true;
        };


        Camera.prototype.setWidth = function(width) {

            this.width = width;
            this.aspect = width / this.height;

            this.invWidth = 1 / this.width;

            this.needsUpdate = true;
        };


        Camera.prototype.setHeight = function(height) {

            this.height = height;
            this.aspect = this.width / height;

            this.invHeight = 1 / this.height;

            this.needsUpdate = true;
        };


        Camera.prototype.setFov = function(value) {

            this.fov = value;
            this.needsUpdate = true;
        };


        Camera.prototype.setNear = function(value) {

            this.near = value;
            this.needsUpdate = true;
        };


        Camera.prototype.setFar = function(value) {

            this.far = value;
            this.needsUpdate = true;
        };


        Camera.prototype.setOrthographic = function(value) {

            this.orthographic = !! value;
            this.needsUpdate = true;
        };


        Camera.prototype.toggleOrthographic = function() {

            this.orthographic = !this.orthographic;
            this.needsUpdate = true;
        };


        Camera.prototype.setOrthographicSize = function(size) {

            this.orthographicSize = clamp(size, this.minOrthographicSize, this.maxOrthographicSize);
            this.needsUpdate = true;
        };


        var MAT4 = new Mat4,
            VEC3 = new Vec3;

        Camera.prototype.toWorld = function(v, out) {
            out || (out = new Vec3);

            out.x = 2 * (v.x * this.invWidth) - 1;
            out.y = -2 * (v.y * this.invHeight) + 1;
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

            if (this.needsUpdate) {

                if (!this.orthographic) {
                    this.projection.perspective(degsToRads(this.fov), this.aspect, this.near, this.far);
                } else {
                    this.orthographicSize = clamp(this.orthographicSize, this.minOrthographicSize, this.maxOrthographicSize);

                    var orthographicSize = this.orthographicSize,
                        right = orthographicSize * this.aspect,
                        left = -right,
                        top = orthographicSize,
                        bottom = -top;

                    this.projection.orthographic(left, right, top, bottom, this.near, this.far);
                }

                this.needsUpdate = false;
            }

            this.view.inverseMat((this.transform || this.transform2d).matrixWorld);
        };


        Camera.prototype.sort = function(a, b) {

            return a._active ? -1 : b._active ? 1 : -1;
        };


        Camera.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.width = this.width;
            json.height = this.height;
            json.aspect = this.aspect;

            json.background = this.background.toJSON(json.background);

            json.far = this.far;
            json.near = this.near;
            json.fov = this.fov;

            json.orthographic = this.orthographic;
            json.orthographicSize = this.orthographicSize;
            json.minOrthographicSize = this.minOrthographicSize;
            json.maxOrthographicSize = this.maxOrthographicSize;

            return json;
        };


        Camera.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.width = json.width;
            this.height = json.height;
            this.aspect = json.aspect;

            this.background.fromJSON(json.background);

            this.far = json.far;
            this.near = json.near;
            this.fov = json.fov;

            this.orthographic = json.orthographic;
            this.orthographicSize = json.orthographicSize;
            this.minOrthographicSize = json.minOrthographicSize;
            this.maxOrthographicSize = json.maxOrthographicSize;

            this.needsUpdate = true;

            return this;
        };


        return Camera;
    }
);
