if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/assets",
        "odin/core/components/component"
    ],
    function(Assets, Component) {
        "use strict";


        /**
         * @class MeshFilter
         * @extends Component
         * @brief base class for handling meshes
         * @param Object options
         */
        function MeshFilter(opts) {
            opts || (opts = {});

            Component.call(this, "MeshFilter", opts);

            /**
             * @property Mesh mesh
             * @memberof MeshFilter
             */
            this.mesh = opts.mesh != undefined ? opts.mesh : undefined;

            /**
             * @property Material material
             * @memberof MeshFilter
             */
            this.material = opts.material != undefined ? opts.material : undefined;


            this.bones = [];
            this._webglMeshInitted = false;
        }

        Component.extend(MeshFilter);


        MeshFilter.prototype.copy = function(other) {

            this.mesh = other.mesh;
            this.material = other.material;

            this._webglMeshInitted = false;

            return this;
        };


        MeshFilter.prototype.init = function() {
            var bones = this.bones,
                meshBones = this.mesh.bones,
                i = meshBones.length;

            while (i--) bones[i] = meshBones[i].clone();
        };


        MeshFilter.prototype.clear = function() {
            Component.prototype.clear.call(this);

            this.mesh = undefined;
            this.material = undefined;

            this.bones.length = 0;
            this._webglMeshInitted = false;

            return this;
        };


        MeshFilter.prototype.sort = function(a, b) {

            return a.mesh === b.mesh ? -1 : 1;
        };


        MeshFilter.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.mesh = this.mesh ? this.mesh.name : undefined;
            json.material = this.material ? this.material.name : undefined;

            return json;
        };


        MeshFilter.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.mesh = json.mesh ? Assets.get(json.mesh) : undefined;
            this.material = json.material ? Assets.get(json.material) : undefined;

            this.bones.length = 0;
            this._webglMeshInitted = false;

            return this;
        };


        return MeshFilter;
    }
);
