define([
        "odin/math/mathf",
        "odin/math/vec3"
    ],
    function(Mathf, Vec3) {
        "use strict";


        /**
         * @class AABB3
         * @brief 2d axis aligned bounding box
         * @param Vec3 min
         * @param Vec3 max
         */
        function AABB3(min, max) {

            /**
             * @property Vec3 min
             * @memberof AABB3
             */
            this.min = min || new Vec3(Infinity, Infinity, Infinity);

            /**
             * @property Vec3 max
             * @memberof AABB3
             */
            this.max = max || new Vec3(-Infinity, -Infinity, -Infinity);
        }

        /**
         * @method clone
         * @memberof AABB3
         * @brief returns new copy of this
         * @return AABB3
         */
        AABB3.prototype.clone = function() {

            return new AABB3(this.min.clone(), this.max.clone());
        };

        /**
         * @method copy
         * @memberof AABB3
         * @brief copies other AABB
         * @param AABB3 other
         * @return this
         */
        AABB3.prototype.copy = function(other) {

            this.min.copy(other.min);
            this.max.copy(other.max);

            return this;
        };

        /**
         * @method set
         * @memberof AABB3
         * @brief set min and max vectors
         * @param Vec3 min
         * @param Vec3 max
         * @return this
         */
        AABB3.prototype.set = function(min, max) {

            this.min.copy(min);
            this.max.copy(max);

            return this;
        };

        /**
         * @method expandPoint
         * @memberof AABB3
         * @param Vec3 v
         * @return this
         */
        AABB3.prototype.expandPoint = function(v) {

            this.min.min(v);
            this.max.max(v);

            return this;
        };

        /**
         * @method expandVec
         * @memberof AABB3
         * @param Vec3 v
         * @return this
         */
        AABB3.prototype.expandVec = function(v) {

            this.min.sub(v);
            this.max.add(v);

            return this;
        };

        /**
         * @method expandScalar
         * @memberof AABB3
         * @param Number s
         * @return this
         */
        AABB3.prototype.expandScalar = function(s) {

            this.min.ssub(s);
            this.max.sadd(s);

            return this;
        };

        /**
         * @method union
         * @memberof AABB3
         * @brief joins this and another aabb
         * @param AABB3 aabb
         * @return this
         */
        AABB3.prototype.union = function(other) {

            this.min.min(other.min);
            this.max.max(other.max);

            return this;
        };

        /**
         * @method clear
         * @memberof AABB3
         * @brief clears aabb
         * @return this
         */
        AABB3.prototype.clear = function() {

            this.min.set(Infinity, Infinity, Infinity);
            this.max.set(-Infinity, -Infinity, -Infinity);

            return this;
        };

        /**
         * @method contains
         * @memberof AABB3
         * @brief checks if AABB contains point
         * @param Vec3 point
         * @return Boolean
         */
        AABB3.prototype.contains = function(point) {
            var min = this.min,
                max = this.max,
                px = point.x,
                py = point.y,
                pz = point.z;

            return !(
                px < min.x || px > max.x ||
                py < min.y || py > max.y ||
                pz < min.z || pz > max.z
            );
        };

        /**
         * @method intersects
         * @memberof AABB3
         * @brief checks if AABB intersects AABB
         * @param AABB3 other
         * @return Boolean
         */
        AABB3.prototype.intersects = function(other) {
            var aMin = this.min,
                aMax = this.max,
                bMin = other.min,
                bMax = other.max;

            return !(
                bMax.x < aMin.x || bMin.x > aMax.x ||
                bMax.y < aMin.y || bMin.y > aMax.y ||
                bMax.z < aMin.z || bMin.z > aMax.z
            );
        };

        /**
         * @method fromPoints
         * @memberof AABB3
         * @brief set min and max from array of vectors
         * @param Array points
         * @return this
         */
        AABB3.prototype.fromPoints = function(points) {
            var v, i = points.length,
                minx = Infinity,
                miny = Infinity,
                minz = Infinity,
                maxx = -Infinity,
                maxy = -Infinity,
                maxz = -Infinity,
                min = this.min,
                max = this.max,
                x, y, z;

            while (i--) {
                v = points[i];
                x = v.x;
                y = v.y;
                z = v.z;

                minx = minx > x ? x : minx;
                miny = miny > y ? y : miny;
                minz = minz > z ? z : minz;

                maxx = maxx < x ? x : maxx;
                maxy = maxy < y ? y : maxy;
                maxz = maxz < z ? z : maxz;
            }

            min.x = minx;
            min.y = miny;
            min.z = minz;
            max.x = maxx;
            max.y = maxy;
            max.z = maxz;

            return this;
        };

        /**
         * @method fromCenterSize
         * @memberof AABB3
         * @brief sets this from a center point and a size vector
         * @param Vec3 center
         * @param Vec3 size
         * @return this
         */
        AABB3.prototype.fromCenterSize = function(center, size) {
            var min = this.min,
                max = this.max,
                x = center.x,
                y = center.y,
                z = center.z,
                hx = size.x * 0.5,
                hy = size.y * 0.5,
                hz = size.z * 0.5;

            min.x = x - hx;
            min.y = y - hy;
            min.z = z - hz;

            max.x = x + hx;
            max.y = y + hy;
            max.z = z + hz;

            return this;
        };

        /**
         * @method fromJSON
         * @memberof AABB3
         * @brief sets values from json object
         * @param Object json
         * @return this
         */
        AABB3.prototype.fromJSON = function(json) {

            this.min.fromJSON(json.min);
            this.max.fromJSON(json.max);

            return this;
        };

        /**
         * @method toJSON
         * @memberof AABB3
         * @brief returns json object
         * @return Object
         */
        AABB3.prototype.toJSON = function() {

            return {
                min: this.min.toJSON(),
                max: this.max.toJSON()
            };
        };

        /**
         * @method toString
         * @memberof AABB3
         * @brief converts AABB to string "AABB3( min: Vec3( -1, -1 ), max: Vec3( 1, 1 ) )"
         * @return String
         */
        AABB3.prototype.toString = function() {
            var min = this.min,
                max = this.max;

            return "AABB3( min: " + min + ", max: " + max + " )";
        };


        return AABB3;
    }
);
