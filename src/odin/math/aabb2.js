define([
        "odin/math/mathf",
        "odin/math/vec2"
    ],
    function(Mathf, Vec2) {
        "use strict";


        /**
         * @class AABB2
         * @brief 2d axis aligned bounding box
         * @param Vec2 min
         * @param Vec2 max
         */
        function AABB2(min, max) {

            /**
             * @property Vec2 min
             * @memberof AABB2
             */
            this.min = min || new Vec2(Infinity, Infinity);

            /**
             * @property Vec2 max
             * @memberof AABB2
             */
            this.max = max || new Vec2(-Infinity, -Infinity);
        }

        /**
         * @method clone
         * @memberof AABB2
         * @brief returns new copy of this
         * @return AABB2
         */
        AABB2.prototype.clone = function() {

            return new AABB2(this.min.clone(), this.max.clone());
        };

        /**
         * @method copy
         * @memberof AABB2
         * @brief copies other AABB
         * @param AABB2 other
         * @return this
         */
        AABB2.prototype.copy = function(other) {

            this.min.copy(other.min);
            this.max.copy(other.max);

            return this;
        };

        /**
         * @method set
         * @memberof AABB2
         * @brief set min and max vectors
         * @param Vec2 min
         * @param Vec2 max
         * @return this
         */
        AABB2.prototype.set = function(min, max) {

            this.min.copy(min);
            this.max.copy(max);

            return this;
        };

        /**
         * @method expandPoint
         * @memberof AABB2
         * @param Vec2 v
         * @return this
         */
        AABB2.prototype.expandPoint = function(v) {

            this.min.min(v);
            this.max.max(v);

            return this;
        };

        /**
         * @method expandVec
         * @memberof AABB2
         * @param Vec2 v
         * @return this
         */
        AABB2.prototype.expandVec = function(v) {

            this.min.sub(v);
            this.max.add(v);

            return this;
        };

        /**
         * @method expandScalar
         * @memberof AABB2
         * @param Number s
         * @return this
         */
        AABB2.prototype.expandScalar = function(s) {

            this.min.ssub(s);
            this.max.sadd(s);

            return this;
        };

        /**
         * @method union
         * @memberof AABB2
         * @brief joins this and another aabb
         * @param AABB2 aabb
         * @return this
         */
        AABB2.prototype.union = function(other) {

            this.min.min(other.min);
            this.max.max(other.max);

            return this;
        };

        /**
         * @method clear
         * @memberof AABB2
         * @brief clears aabb
         * @return this
         */
        AABB2.prototype.clear = function() {

            this.min.set(Infinity, Infinity);
            this.max.set(-Infinity, -Infinity);

            return this;
        };

        /**
         * @method contains
         * @memberof AABB2
         * @brief checks if AABB contains point
         * @param Vec2 point
         * @return Boolean
         */
        AABB2.prototype.contains = function(point) {
            var min = this.min,
                max = this.max,
                px = point.x,
                py = point.y;

            return !(
                px < min.x || px > max.x ||
                py < min.y || py > max.y
            );
        };

        /**
         * @method intersects
         * @memberof AABB2
         * @brief checks if AABB intersects AABB
         * @param AABB2 other
         * @return Boolean
         */
        AABB2.prototype.intersects = function(other) {
            var aMin = this.min,
                aMax = this.max,
                bMin = other.min,
                bMax = other.max;

            return !(
                bMax.x < aMin.x || bMin.x > aMax.x ||
                bMax.y < aMin.y || bMin.y > aMax.y
            );
        };

        /**
         * @method fromPoints
         * @memberof AABB2
         * @brief set min and max from array of vectors
         * @param Array points
         * @return this
         */
        AABB2.prototype.fromPoints = function(points) {
            var v, i = points.length,
                minx = Infinity,
                miny = Infinity,
                maxx = -Infinity,
                maxy = -Infinity,
                min = this.min,
                max = this.max,
                x, y;

            while (i--) {
                v = points[i];
                x = v.x;
                y = v.y;

                minx = minx > x ? x : minx;
                miny = miny > y ? y : miny;

                maxx = maxx < x ? x : maxx;
                maxy = maxy < y ? y : maxy;
            }

            min.x = minx;
            min.y = miny;
            max.x = maxx;
            max.y = maxy;

            return this;
        };

        /**
         * @method fromCenterSize
         * @memberof AABB2
         * @brief sets this from a center point and a size vector
         * @param Vec2 center
         * @param Vec2 size
         * @return this
         */
        AABB2.prototype.fromCenterSize = function(center, size) {
            var min = this.min,
                max = this.max,
                x = center.x,
                y = center.y,
                hx = size.x * 0.5,
                hy = size.y * 0.5;

            min.x = x - hx;
            min.y = y - hy;

            max.x = x + hx;
            max.y = y + hy;

            return this;
        };

        /**
         * @method fromJSON
         * @memberof AABB2
         * @brief sets values from json object
         * @param Object json
         * @return this
         */
        AABB2.prototype.fromJSON = function(json) {

            this.min.fromJSON(json.min);
            this.max.fromJSON(json.max);

            return this;
        };

        /**
         * @method toJSON
         * @memberof AABB2
         * @brief returns json object
         * @return Object
         */
        AABB2.prototype.toJSON = function() {

            return {
                min: this.min.toJSON(),
                max: this.max.toJSON()
            };
        };

        /**
         * @method toString
         * @memberof AABB2
         * @brief converts AABB to string "AABB2( min: Vec2( -1, -1 ), max: Vec2( 1, 1 ) )"
         * @return String
         */
        AABB2.prototype.toString = function() {
            var min = this.min,
                max = this.max;

            return "AABB2( min: " + min + ", max: " + max + " )";
        };


        return AABB2;
    }
);
