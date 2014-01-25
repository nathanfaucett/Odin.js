if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/math/vec3",
        "odin/math/quat",
        "odin/math/mat4"
    ],
    function(Vec3, Quat, Mat4) {
        "use strict";


        var UNKNOWN = 0;
		
		
        function Bone(parentIndex, name) {

            this.name = name != undefined ? name : "Bone_" + UNKNOWN++;
            this.parentIndex = parentIndex != undefined ? parentIndex : -1;

            this.skinned = false;

            this.position = new Vec3;
            this.rotation = new Quat;
            this.scale = new Vec3(1, 1, 1);

            this.matrix = new Mat4;
            this.matrixWorld = new Mat4;
            this.bindPose = new Mat4;
			
			this.inheritPosition = true;
			this.inheritRotation = true;
            this.inheritScale = true;
        }


        Bone.prototype.copy = function(other) {

            this.name = other.name;
            this.parentIndex = other.parentIndex;

            this.skinned = other.skinned;

            this.position.copy(other.position);
            this.rotation.copy(other.rotation);
            this.scale.copy(other.scale);

            this.matrix.copy(other.matrix);
            this.matrixWorld.copy(other.matrixWorld);
            this.bindPose.copy(other.bindPose);

			this.inheritPosition = other.inheritPosition;
			this.inheritRotation = other.inheritRotation;
            this.inheritScale = other.inheritScale;

            return this;
        };


        Bone.prototype.toWorld = function(v) {

            return v.transformMat4(this.matrixWorld);
        };


        Bone.prototype.toLocal = function() {
            var mat = new Mat4;

            return function(v) {

                return v.transformMat4(mat.inverseMat(this.matrixWorld));
            };
        }();


        Bone.prototype.toJSON = function(json) {
            json || (json = {});

            json.name = this.name;
            json.parentIndex = this.parentIndex;

            json.skinned = this.skinned;

            json.position = this.position.toJSON(json.position);
            json.rotation = this.rotation.toJSON(json.rotation);
            json.scale = this.scale.toJSON(json.scale);

            json.matrix = this.matrix.toJSON(json.matrix);
            json.matrixWorld = this.matrixWorld.toJSON(json.matrixWorld);
            json.bindPose = this.bindPose.toJSON(json.bindPose);

			json.inheritPosition = this.inheritPosition;
			json.inheritRotation = this.inheritRotation;
            json.inheritScale = this.inheritScale;

			return json;
        };


        Bone.prototype.fromJSON = function(json) {

            this.name = json.name;
            this.parentIndex = json.parentIndex;

            this.skinned = json.skinned;

            this.position.fromJSON(json.position);
            this.rotation.fromJSON(json.rotation);
            this.scale.fromJSON(json.scale);

            this.matrix.fromJSON(json.matrix);
            this.matrixWorld.fromJSON(json.matrixWorld);
            this.bindPose.fromJSON(json.bindPose);

			this.inheritPosition = json.inheritPosition;
			this.inheritRotation = json.inheritRotation;
            this.inheritScale = json.inheritScale;

            return this;
        };


        return Bone;
    }
);
