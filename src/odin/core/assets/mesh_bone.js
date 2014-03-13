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


        function MeshBone(parentIndex, name) {

            this.parentIndex = parentIndex != undefined ? parentIndex : -1;
            this.name = name != undefined ? name : "MeshBone_" + UNKNOWN++;

            this.skinned = false;
            this.position = new Vec3;
            this.rotation = new Quat;
            this.scale = new Vec3;
            this.bindPose = new Mat4;
        }


        MeshBone.prototype.clone = function() {

            return new MeshBone().copy(this);
        };


        MeshBone.prototype.copy = function(other) {

            this.name = other.name;
            this.parentIndex = other.parentIndex;

            this.skinned = other.skinned;
            this.position.copy(other.position);
            this.rotation.copy(other.rotation);
            this.scale.copy(other.scale);
            this.bindPose.copy(other.bindPose);

            return this;
        };


        MeshBone.prototype.toJSON = function(json) {
            json || (json = {});

            json.name = this.name;
            json.parentIndex = this.parentIndex;

            json.skinned = this.skinned;
            json.position = this.position.toJSON(json.position);
            json.rotation = this.rotation.toJSON(json.rotation);
            json.scale = this.scale.toJSON(json.scale);
            json.bindPose = this.bindPose.toJSON(json.bindPose);

            return json;
        };


        MeshBone.prototype.fromJSON = function(json) {

            this.name = json.name;
            this.parentIndex = json.parentIndex;

            this.skinned = json.skinned;
            this.position.fromJSON(json.position);
            this.rotation.fromJSON(json.rotation);
            this.scale.fromJSON(json.scale);
            this.bindPose.fromJSON(json.bindPose);

            return this;
        };


        return MeshBone;
    }
);
