if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/math/vec3",
        "odin/math/quat",
        "odin/math/mat4",
        "odin/core/components/component",
    ],
    function(Vec3, Quat, Mat4, Component) {
        "use strict";


        var UNKNOWN = 0;


        function Bone(opts) {
            opts || (opts = {});

            Component.call(this, "Bone", opts);

            this.parentIndex = opts.parentIndex != undefined ? opts.parentIndex : -1;
            this.name = opts.name != undefined ? opts.name : "Bone_" + UNKNOWN++;

            this.skinned = opts.skinned != undefined ? opts.skinned : false;
            this.bindPose = opts.bindPose != undefined ? opts.bindPose : new Mat4;
            this.uniform = new Mat4;

            this.inheritPosition = opts.inheritPosition != undefined ? opts.inheritPosition : true;
            this.inheritRotation = opts.inheritRotation != undefined ? opts.inheritRotation : true;
            this.inheritScale = opts.inheritScale != undefined ? opts.inheritScale : true;
        }

        Component.extend(Bone);
        Bone.order = 1000000;


        Bone.prototype.copy = function(other) {

            this.name = other.name;
            this.parentIndex = other.parentIndex;

            this.skinned = other.skinned;
            this.bindPose.copy(other.bindPose);

            this.inheritPosition = other.inheritPosition;
            this.inheritRotation = other.inheritRotation;
            this.inheritScale = other.inheritScale;

            return this;
        };


        var MAT = new Mat4,
            POSITION = new Vec3,
            SCALE = new Vec3,
            ROTATION = new Quat;
        Bone.prototype.update = function() {
            if (!this.skinned) return;
            var transform = this.transform,
                uniform = this.uniform,
                parent = transform.parent,
                inheritPosition = this.inheritPosition,
                inheritScale = this.inheritScale,
                inheritRotation = this.inheritRotation;

            uniform.copy(transform.matrix);

            if (parent && this.parentIndex !== -1) {
                MAT.copy(parent.bone.uniform);

                if (!inheritPosition || !inheritScale || !inheritRotation) {
                    MAT.decompose(POSITION, SCALE, ROTATION);

                    if (!inheritPosition) POSITION.set(0.0, 0.0, 0.0);
                    if (!inheritScale) SCALE.set(1.0, 1.0, 1.0);
                    if (!inheritRotation) ROTATION.set(0.0, 0.0, 0.0, 1.0);

                    MAT.compose(POSITION, SCALE, ROTATION);
                }

                uniform.mmul(MAT, uniform);
            }
        };


        Bone.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.name = this.name;
            json.parentIndex = this.parentIndex;

            json.skinned = this.skinned;
            json.bindPose = this.bindPose.toJSON(json.bindPose);

            json.inheritPosition = this.inheritPosition;
            json.inheritRotation = this.inheritRotation;
            json.inheritScale = this.inheritScale;

            return json;
        };


        Bone.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.name = json.name;
            this.parentIndex = json.parentIndex;

            this.skinned = json.skinned;
            this.bindPose.fromJSON(json.bindPose);

            this.inheritPosition = json.inheritPosition;
            this.inheritRotation = json.inheritRotation;
            this.inheritScale = json.inheritScale;

            return this;
        };


        Bone.prototype.sort = function(a, b) {

            return b.parentIndex - a.parentIndex;
        };


        return Bone;
    }
);
