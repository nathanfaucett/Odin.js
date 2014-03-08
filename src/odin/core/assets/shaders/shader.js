if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/asset"
    ],
    function(Asset) {
        "use strict";


        function Shader(opts) {
            opts || (opts = {});

            Asset.call(this, opts);

            this.fallback = opts.fallback || "";

            this.vertex = opts.vertex || "void main(void) {}";
            this.fragment = opts.fragment || "void main(void) {}";

            this.lights = opts.lights != undefined ? opts.lights : false;
            this.specular = opts.specular != undefined ? opts.specular : true;
            this.vertexLit = opts.vertexLit != undefined ? opts.vertexLit : false;
            this.shadows = opts.shadows != undefined ? opts.shadows : false;
            this.fog = opts.fog != undefined ? opts.fog : false;

            this.OES_standard_derivatives = opts.OES_standard_derivatives != undefined ? opts.OES_standard_derivatives : false;
        }

        Asset.extend(Shader);


        Shader.prototype.copy = function(other) {
            Asset.prototype.copy.call(this, other);

            this.fallback = other.fallback;

            this.vertex = other.vertex;
            this.fragment = other.fragment;

            this.lights = other.lights;
            this.specular = other.specular;
            this.vertexLit = other.vertexLit;
            this.shadows = other.shadows;
            this.fog = other.fog;

            this.OES_standard_derivatives = other.OES_standard_derivatives;

            return this;
        };


        Shader.prototype.parse = function(raw) {
            Asset.prototype.parse.call(this, raw);

            this.fromJSON(raw);

            return this;
        };


        Shader.prototype.clear = function() {
            Asset.prototype.clear.call(this);

            this.vertex = "";
            this.fragment = "";

            return this;
        };


        Shader.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json, pack);

            json.fallback = this.fallback;

            json.vertex = this.vertex;
            json.fragment = this.fragment;

            json.lights = this.lights;
            json.specular = this.specular;
            json.vertexLit = this.vertexLit;
            json.shadows = this.shadows;
            json.fog = this.fog;

            json.OES_standard_derivatives = this.OES_standard_derivatives;

            return json;
        };


        Shader.prototype.fromJSON = function(json) {
            Asset.prototype.fromJSON.call(this, json);

            this.fallback = json.fallback;

            this.vertex = json.vertex;
            this.fragment = json.fragment;

            this.lights = json.lights;
            this.specular = json.specular;
            this.vertexLit = json.vertexLit;
            this.shadows = json.shadows;
            this.fog = json.fog;

            this.OES_standard_derivatives = json.OES_standard_derivatives;

            return this;
        };


        return Shader;
    }
);
