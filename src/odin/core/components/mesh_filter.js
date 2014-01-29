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
             * @property Boolean castShadows
             * @memberof MeshFilter
             */
            this.castShadows = opts.castShadows !== undefined ? !! opts.castShadows : true;

            /**
             * @property Boolean receiveShadows
             * @memberof MeshFilter
             */
            this.receiveShadows = opts.receiveShadows !== undefined ? !! opts.receiveShadows : true;

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
        }

        Component.extend(MeshFilter);


        MeshFilter.prototype.copy = function(other) {

            this.castShadows = other.castShadows;
            this.receiveShadows = other.receiveShadows;

            this.mesh = other.mesh;
            this.material = other.material;

            return this;
        };


        MeshFilter.prototype.clear = function() {
            Component.prototype.clear.call(this);

            this.mesh = undefined;
            this.material = undefined;

            return this;
        };


        MeshFilter.prototype.sort = function(a, b) {

            return a.mesh === b.mesh ? -1 : 1;
        };


        MeshFilter.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.castShadows = this.castShadows;
            json.receiveShadows = this.receiveShadows;

            json.mesh = this.mesh ? this.mesh.name : undefined;
            json.material = this.material ? this.material.name : undefined;

            return json;
        };


        MeshFilter.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.castShadows = json.castShadows;
            this.receiveShadows = json.receiveShadows;

            this.mesh = json.mesh ? Assets.hash[json.mesh] : undefined;
            this.material = json.material ? Assets.hash[json.material] : undefined;

            return this;
        };


        return MeshFilter;
    }
);
