if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/class",
        "phys_2d/collision/shape"
    ],
    function(Class, Shape) {
        "use strict";


        var OBJECT = {},
            CIRCLE = Shape.CIRCLE,
            PI = Math.PI;

        /**
         * @class Phys2D.Circle
         * @extends Phys2D.Shape
         * @brief circle shape
         * @param Object options
         */
        function Circle(opts) {
            opts || (opts = {});

            Shape.call(this, opts);

            this._type = CIRCLE;

            /**
             * @property Number radius
             * @memberof Phys2D.Circle
             */
            this.radius = opts.radius !== undefined ? opts.radius : 0.5;

            /**
             * @property Number innerRadius
             * @memberof Phys2D.Circle
             */
            this.innerRadius = opts.innerRadius !== undefined ? opts.innerRadius : 0;
        }

        Class.extend(Circle, Shape);


        Circle.prototype.copy = function(other) {

            this.density = other.density;

            this.localPosition.copy(other.localPosition);
            this.localRotation = other.localRotation;

            this.friction = other.friction;
            this.elasticity = other.elasticity;

            this.radius = other.radius;
            this.innerRadius = other.innerRadius;

            return this;
        };

        /**
         * @method pointQuery
         * @memberof Phys2D.Circle
         * @param Vec2 point
         * @return Boolean
         */
        Circle.prototype.pointQuery = function(p) {
            var x = this.position,
                dx = x.x - p.x,
                dy = x.y - p.y,
                d = dx * dx + dy * dy,
                r = this.radius,
                ir = this.innerRadius;

            if (d > r * r) return false;

            return d > ir * ir;
        };

        /**
         * @method centroid
         * @memberof Phys2D.Circle
         * @param Vec2 v
         * @return Vec2
         */
        Circle.prototype.centroid = function(v) {
            var localPos = this.localPosition;

            v.x = localPos.x;
            v.y = localPos.y;

            return v;
        };

        /**
         * @method area
         * @memberof Phys2D.Circle
         * @return Number
         */
        Circle.prototype.area = function() {
            var r = this.radius,
                ir = this.innerRadius;

            return PI * (r * r - ir * ir);
        };

        /**
         * @method inertia
         * @memberof Phys2D.Circle
         * @param Number mass
         * @return Number
         */
        Circle.prototype.inertia = function(mass) {
            var r = this.radius,
                ir = this.innerRadius,
                localPos = this.localPosition,
                x = localPos.x,
                y = localPos.y;

            return mass * (((r * r + ir * ir) * 0.5) + (x * x + y * y));
        };

        /**
         * @method update
         * @memberof Phys2D.Circle
         * @param Mat32 matrix
         */
        Circle.prototype.update = function(matrix) {
            var localMatrix = this.matrix,
                matrixWorld = this.matrixWorld,
                localPos = this.localPosition,
                pos = this.position,
                x, y, r = this.radius,
                aabb = this.aabb,
                min = aabb.min,
                max = aabb.max;

            matrixWorld.mmul(matrix, localMatrix);

            pos.x = localPos.x;
            pos.y = localPos.y;
            pos.transformMat32(matrix);
            x = pos.x;
            y = pos.y;

            min.x = x - r;
            min.y = y - r;
            max.x = x + r;
            max.y = y + r;
        };


        return Circle;
    }
);
