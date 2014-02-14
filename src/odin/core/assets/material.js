if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/util",
        "odin/math/vec3",
        "odin/math/rect",
        "odin/math/color",
        "odin/core/assets/asset",
        "odin/core/assets/assets",
        "odin/core/enums"
    ],
    function(util, Rect, Vec3, Color, Asset, Assets, Enums) {
        "use strict";


        var merge = util.merge;


        function Material(opts) {
            opts || (opts = {});

            Asset.call(this, opts);

            this.blending = opts.blending != undefined ? opts.blending : Enums.Blending.Default;
            this.shading = opts.shading != undefined ? opts.shading : Enums.Shading.Lambert;
            this.side = opts.side != undefined ? opts.side : Enums.Side.Front;

            this.lineWidth = opts.lineWidth != undefined ? opts.lineWidth : 1;

            this.wireframe = opts.wireframe != undefined ? opts.wireframe : false;
            this.wireframeLineWidth = opts.wireframeLineWidth != undefined ? opts.wireframeLineWidth : 1;

            this.shader = opts.shader != undefined ? opts.shader : undefined;

            this._webgl = undefined;

            this.uniforms = merge(opts.uniforms || {}, {
                diffuseMap: undefined,
                diffuseColor: new Color(1, 1, 1)
            });

            this.needsUpdate = true;
        }

        Asset.extend(Material);


        Material.prototype.copy = function(other) {
            Asset.prototype.copy.call(this, other);

            this.blending = other.blending;
            this.shading = other.shading;
            this.side = other.side;

            this.lineWidth = other.lineWidth;

            this.wireframe = other.wireframe;
            this.wireframeLineWidth = other.wireframeLineWidth;

            this.shader = other.shader;

            this.uniforms = other.uniforms;

            return this;
        };


        Material.prototype.parse = function(raw) {
            Asset.prototype.parse.call(this, raw);

            this.fromJSON(raw);

            return this;
        };


        Material.prototype.clear = function() {
            Asset.prototype.clear.call(this);

            return this;
        };


        Material.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json, pack);

            json.blending = this.blending;
            json.shading = this.shading;
            json.side = this.side;

            json.lineWidth = this.lineWidth;

            json.wireframe = this.wireframe;
            json.wireframeLineWidth = this.wireframeLineWidth;

            json.shader = this.shader != undefined ? this.shader.name : undefined;

            toJSON(this.uniforms, json.uniforms || (json.uniforms = {}));

            return json;
        };


        Material.prototype.fromJSON = function(json) {
            Asset.prototype.fromJSON.call(this, json);

            this.blending = json.blending;
            this.shading = json.shading;
            this.side = json.side;

            this.lineWidth = json.lineWidth;

            this.wireframe = json.wireframe;
            this.wireframeLineWidth = json.wireframeLineWidth;

            this.shader = json.shader != undefined ? Assets.get(json.shader) : undefined;

            fromJSON(this.uniforms, json.uniforms);

            return this;
        };


        function toJSON(obj, json) {
            var value, key;

            for (key in obj) {
                value = obj[key];

                if (typeof(value) !== "object") {
                    json[key] = value;
                } else if (value.toJSON) {
                    json[key] = value.toJSON(json[key]);
                } else {
                    json[key] = value;
                }
            }

            return json;
        }


        function fromJSON(obj, json) {
            var classes = Class._classes,
                mathClasses = Mathf._classes,
                value, key;

            for (key in json) {
                value = json[key];

                if (typeof(value) !== "object") {
                    obj[key] = value;
                } else if (mathClasses[value._className]) {
                    obj[key] = Mathf.fromJSON(value);
                } else if (classes[value._className]) {
                    obj[key] = Class.fromJSON(value);
                } else {
                    obj[key] = value;
                }
            }
        }


        return Material;
    }
);
