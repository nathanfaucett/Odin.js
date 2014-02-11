if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/enums",
        "odin/math/vec3",
        "odin/math/color",
        "odin/core/components/component"
    ],
    function(Enums, Vec3, Color, Component) {
        "use strict";


        var cos = Math.cos,
            defineProperty = Object.defineProperty;


        function Light(opts) {
            opts || (opts = {});

            Component.call(this, "Light", opts);

            this.visible = opts.visible != undefined ? !! opts.visible : true;
            this.type = opts.type != undefined ? opts.type : Enums.LightType.Point;

            this.color = opts.color != undefined ? opts.color : new Color(1, 1, 1);
            this.energy = opts.energy != undefined ? opts.energy : 1;
            this.distance = opts.distance != undefined ? opts.distance : 0;

            this._angleCos = 0;
            this._angle = 0;
            this.angle = opts.angle != undefined ? opts.angle : Math.PI * 0.0625;
            this.exponent = opts.exponent != undefined ? opts.exponent : 10;

            this.target = opts.target != undefined ? opts.target : new Vec3;

            this.constant = opts.constant != undefined ? opts.constant : 10;
            this.linear = opts.linear != undefined ? opts.linear : 1;
            this.quadratic = opts.quadratic != undefined ? opts.quadratic : 0;
        }

        Component.extend(Light);


        defineProperty(Light.prototype, "angle", {
            get: function() {
                return this._angle;
            },
            set: function(value) {
                this._angle = value;
                this._angleCos = cos(value);
            }
        });


        Light.prototype.copy = function(other) {

            this.visible = other.visible;
            this.type = other.type;

            this.color.copy(other.color);
            this.energy = other.energy;
            this.distance = other.distance;
            this.angle = other.angle;

            this.constant = other.constant;
            this.linear = other.linear;
            this.quadratic = other.quadratic;

            return this;
        };


        Light.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.visible = this.visible;
            json.type = this.type;

            json.color = this.color.toJSON(json.color);
            json.energy = this.energy;
            json.distance = this.distance;
            json.angle = this.angle;

            json.constant = this.constant;
            json.linear = this.linear;
            json.quadratic = this.quadratic;

            return json;
        };


        Light.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.visible = json.visible;
            this.type = json.type;

            this.color.fromJSON(json.color);
            this.energy = json.energy;
            this.distance = json.distance;
            this.angle = json.angle;

            this.constant = json.constant;
            this.linear = json.linear;
            this.quadratic = json.quadratic;

            return this;
        };


        return Light;
    }
);
