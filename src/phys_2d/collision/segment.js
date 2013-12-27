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
            SEGMENT = Shape.SEGMENT,
            PI = Math.PI,
            inv12 = 1 / 12;

        /**
         * @class Phys2D.Segment
         * @extends Phys2D.Shape
         * @brief thick rounded line segment
         * @param Object options
         */
        function Segment(opts) {
            opts || (opts = {});

            Shape.call(this, opts);

            this._type = SEGMENT;

            /**
             * @property Number length
             * @memberof Phys2D.Segment
             */
            this.length = opts.length !== undefined ? opts.length : 0.5;

            /**
             * @property Number radius
             * @memberof Phys2D.Segment
             */
            this.radius = opts.radius !== undefined ? opts.radius : 0.25;

            /**
             * @property Vec2 normal
             * @memberof Phys2D.Segment
             */
            this.normal = new Vec2(1, 0);
        }

        Class.extend(Segment, Shape);


        Segment.prototype.copy = function(other) {

            this.density = other.density;

            this.localPosition.copy(other.localPosition);
            this.localRotation = other.localRotation;

            this.friction = other.friction;
            this.elasticity = other.elasticity;

            this.length = other.length;
            this.radius = other.radius;
            this.normal.copy(other.normal);

            return this;
        };

        /**
         * @method pointQuery
         * @memberof Phys2D.Segment
         * @param Vec2 point
         * @return Boolean
         */
        Segment.prototype.pointQuery = function(p) {

            return false;
        };

        /**
         * @method centroid
         * @memberof Phys2D.Segment
         * @param Vec2 v
         * @return Vec2
         */
        Segment.prototype.centroid = function(v) {
            var localPos = this.localPosition;

            v.x = localPos.x;
            v.y = localPos.y;

            return v;
        };

        /**
         * @method area
         * @memberof Phys2D.Segment
         * @return Number
         */
        Segment.prototype.area = function() {
            var r = this.radius;

            return r * (PI * r + 2 * this.length);
        };

        /**
         * @method inertia
         * @memberof Phys2D.Segment
         * @param Number mass
         * @return Number
         */
        Segment.prototype.inertia = function(mass) {
            var r = this.radius,
                length = this.length + r + r,
                localPos = this.localPosition,
                x = localPos.x,
                y = localPos.y;

            return mass * (length * length * inv12 + (x * x + y * y));
        };

        /**
         * @method update
         * @memberof Phys2D.Segment
         * @param Mat32 matrix
         */
        Segment.prototype.update = function(matrix) {
            var localMatrix = this.matrix,
                matrixWorld = this.matrixWorld,
                localPos = this.localPosition,
                pos = this.position,
                x, y, normal = this.normal,
                nx, ny,
                r = this.radius,
                length = this.length * 0.5,
                aabb = this.aabb,
                min = aabb.min,
                max = aabb.max;

            matrixWorld.mmul(matrix, localMatrix);
            normal.transformMat2(matrix);

            nx = -normal.y * length;
            ny = normal.x * length;

            pos.x = localPos.x;
            pos.y = localPos.y;
            pos.transformMat32(matrix);
            x = pos.x;
            y = pos.y;

            min.x = x - (nx - r);
            min.y = y - (ny - r);
            max.x = x + (nx + r);
            max.y = y + (ny + r);
        };


        return Segment;
    }
);
