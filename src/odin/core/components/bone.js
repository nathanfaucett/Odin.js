if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/time",
        "odin/math/mathf",
        "odin/math/mat4",
        "odin/math/vec3",
        "odin/math/quat",
        "odin/core/assets/assets",
        "odin/core/components/component",
        "odin/core/enums"
    ],
    function(Time, Mathf, Mat4, Vec3, Quat, Assets, Component, Enums) {
        "use strict";


        var clamp01 = Mathf.clamp01,
            abs = Math.abs,
            WrapMode = Enums.WrapMode;


        function Bone(opts) {
            opts || (opts = {});

            Component.call(this, "Bone", opts);

            this.parentIndex = parentIndex != undefined ? parentIndex : -1;
            this.name = name != undefined ? name : "Bone_" + UNKNOWN++;

            this.skinned = false;
            this.bindPose = new Mat4;
            this.uniform = new Mat4;

            this.inheritPosition = true;
            this.inheritRotation = true;
            this.inheritScale = true;
        }

        Component.extend(Bone);


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


        return Bone;
    }
);
