if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define(
    function() {
        "use strict";


        var sqrt = Math.sqrt;

        /**
         * @class Vec4
         * @brief 3d vector
         * @param Number x
         * @param Number y
         * @param Number z
         * @param Number w
         */
        function Vec4(x, y, z, w) {

            /**
             * @property Number x
             * @memberof Vec4
             */
            this.x = x || 0;

            /**
             * @property Number y
             * @memberof Vec4
             */
            this.y = y || 0;

            /**
             * @property Number z
             * @memberof Vec4
             */
            this.z = z || 0;

            /**
             * @property Number w
             * @memberof Vec4
             */
            this.w = w !== undefined ? w : 1;
        }

        /**
         * @method clone
         * @memberof Vec4
         * @brief returns new instance of this
         * @return Vec4
         */
        Vec4.prototype.clone = function() {

            return new Vec4(this.x, this.y, this.z, this.w);
        };

        /**
         * @method copy
         * @memberof Vec4
         * @brief copies other
         * @param Vec4 other
         * @return this
         */
        Vec4.prototype.copy = function(other) {

            this.x = other.x;
            this.y = other.y;
            this.z = other.z;
            this.w = other.w;

            return this;
        };

        /**
         * @method set
         * @memberof Vec4
         * @brief sets values of this
         * @param Number x
         * @param Number y
         * @param Number z
         * @param Number w
         * @return this
         */
        Vec4.prototype.set = function(x, y, z, w) {

            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;

            return this;
        };

        /**
         * @method add
         * @memberof Vec4
         * @brief adds other's values to this
         * @param Vec4 other
         * @return this
         */
        Vec4.prototype.add = function(other) {

            this.x += other.x;
            this.y += other.y;
            this.z += other.z;
            this.w += other.w;

            return this;
        };

        /**
         * @method vadd
         * @memberof Vec4
         * @brief adds a and b together saves it in this
         * @param Vec4 a
         * @param Vec4 b
         * @return this
         */
        Vec4.prototype.vadd = function(a, b) {

            this.x = a.x + b.x;
            this.y = a.y + b.y;
            this.z = a.z + b.z;
            this.w = a.w + b.w;

            return this;
        };

        /**
         * @method sadd
         * @memberof Vec4
         * @brief adds scalar value to this
         * @param Number s
         * @return this
         */
        Vec4.prototype.sadd = function(s) {

            this.x += s;
            this.y += s;
            this.z += s;
            this.w += s;

            return this;
        };

        /**
         * @method sub
         * @memberof Vec4
         * @brief subtracts other's values from this
         * @param Vec4 other
         * @return this
         */
        Vec4.prototype.sub = function(other) {

            this.x -= other.x;
            this.y -= other.y;
            this.z -= other.z;
            this.w -= other.w;

            return this;
        };

        /**
         * @method vsub
         * @memberof Vec4
         * @brief subtracts b from a saves it in this
         * @param Vec4 a
         * @param Vec4 b
         * @return this
         */
        Vec4.prototype.vsub = function(a, b) {

            this.x = a.x - b.x;
            this.y = a.y - b.y;
            this.z = a.z - b.z;
            this.w = a.w - b.w;

            return this;
        };

        /**
         * @method ssub
         * @memberof Vec4
         * @brief subtracts this by a scalar value
         * @param Number s
         * @return this
         */
        Vec4.prototype.ssub = function(s) {

            this.x -= s;
            this.y -= s;
            this.z -= s;
            this.w -= s;

            return this;
        };

        /**
         * @method mul
         * @memberof Vec4
         * @brief muliples this's values by other's
         * @param Vec4 other
         * @return this
         */
        Vec4.prototype.mul = function(other) {

            this.x *= other.x;
            this.y *= other.y;
            this.z *= other.z;
            this.w *= other.w;

            return this;
        };

        /**
         * @method vmul
         * @memberof Vec4
         * @brief muliples a and b saves it in this
         * @param Vec4 a
         * @param Vec4 b
         * @return this
         */
        Vec4.prototype.vmul = function(a, b) {

            this.x = a.x * b.x;
            this.y = a.y * b.y;
            this.z = a.z * b.z;
            this.w = a.w * b.w;

            return this;
        };

        /**
         * @method smul
         * @memberof Vec4
         * @brief muliples this by a scalar value
         * @param Number s
         * @return this
         */
        Vec4.prototype.smul = function(s) {

            this.x *= s;
            this.y *= s;
            this.z *= s;
            this.w *= s;

            return this;
        };

        /**
         * @method div
         * @memberof Vec4
         * @brief divides this's values by other's
         * @param Vec4 other
         * @return this
         */
        Vec4.prototype.div = function(other) {
            var x = other.x,
                y = other.y,
                z = other.z,
                w = other.w;

            this.x *= x !== 0 ? 1 / x : 0;
            this.y *= y !== 0 ? 1 / y : 0;
            this.z *= z !== 0 ? 1 / z : 0;
            this.w *= w !== 0 ? 1 / w : 0;

            return this;
        };

        /**
         * @method vdiv
         * @memberof Vec4
         * @brief divides b from a saves it in this
         * @param Vec4 a
         * @param Vec4 b
         * @return this
         */
        Vec4.prototype.vdiv = function(a, b) {
            var x = b.x,
                y = b.y,
                z = b.z,
                w = b.w;

            this.x = x !== 0 ? a.x / x : 0;
            this.y = y !== 0 ? a.y / y : 0;
            this.z = z !== 0 ? a.z / z : 0;
            this.w = w !== 0 ? a.w / w : 0;

            return this;
        };

        /**
         * @method sdiv
         * @memberof Vec4
         * @brief divides this by scalar value
         * @param Number s
         * @return this
         */
        Vec4.prototype.sdiv = function(s) {
            s = s === 0 ? 0 : 1 / s;

            this.x *= s;
            this.y *= s;
            this.z *= s;
            this.w *= s;

            return this;
        };

        /**
         * @method length
         * @memberof Vec4
         * @brief returns the length of this
         * @return Number
         */
        Vec4.prototype.length = function() {
            var x = this.x,
                y = this.y,
                z = this.z,
                w = this.w,
                lsq = x * x + y * y + z * z + w * w;

            if (lsq === 1) return 1;

            return lsq > 0 ? sqrt(lsq) : 0;
        };

        /**
         * @method lengthSq
         * @memberof Vec4
         * @brief returns the squared length of this
         * @return Number
         */
        Vec4.prototype.lengthSq = function() {
            var x = this.x,
                y = this.y,
                z = this.z,
                w = this.w;

            return x * x + y * y + z * z + w * w;
        };

        /**
         * @method setLength
         * @memberof Vec4
         * @brief sets this so its magnitude is equal to length
         * @param Number length
         * @return Vec4
         */
        Vec4.prototype.setLength = function(length) {
            var x = this.x,
                y = this.y,
                z = this.z,
                w = this.w,
                l = x * x + y * y + z * z + w * w;

            if (l === 1) {
                this.x *= length;
                this.y *= length;
                this.z *= length;
                this.w *= length;

                return this;
            }

            l = l > 0 ? 1 / sqrt(l) : 0;

            this.x *= l * length;
            this.y *= l * length;
            this.z *= l * length;
            this.w *= l * length;

            return this;
        };

        /**
         * @method normalize
         * @memberof Vec4
         * @brief returns this with a length of 1
         * @return this
         */
        Vec4.prototype.normalize = function() {
            var x = this.x,
                y = this.y,
                z = this.z,
                w = this.w,
                l = x * x + y * y + z * z + w * w;

            if (l === 1) return this;

            l = l > 0 ? 1 / sqrt(l) : 0;

            this.x *= l;
            this.y *= l;
            this.z *= l;
            this.w *= l;

            return this;
        };

        /**
         * @method inverse
         * @memberof Vec4
         * @brief returns the inverse of this
         * @return this
         */
        Vec4.prototype.inverse = function() {

            this.x *= -1;
            this.y *= -1;
            this.z *= -1;
            this.w *= -1;

            return this;
        };

        /**
         * @method inverseVec
         * @memberof Vec4
         * @brief returns the inverse of other
         * @param Vec4 other
         * @return this
         */
        Vec4.prototype.inverseVec = function(other) {

            this.x = -other.x;
            this.y = -other.y;
            this.z = -other.z;
            this.w = -other.w;

            return this;
        };

        /**
         * @method lerp
         * @memberof Vec4
         * @brief linear interpolation between this and other by x
         * @param Vec4 other
         * @param Number x
         * @return Vec4
         */
        Vec4.prototype.lerp = function(other, x) {

            this.x += (other.x - this.x) * x;
            this.y += (other.y - this.y) * x;
            this.z += (other.z - this.z) * x;
            this.w += (other.w - this.w) * x;

            return this;
        };

        /**
         * @method vlerp
         * @memberof Vec4
         * @brief linear interpolation between a and b by x
         * @param Vec4 a
         * @param Vec4 b
         * @param Number x
         * @return Vec4
         */
        Vec4.prototype.vlerp = function(a, b, x) {
            var ax = a.x,
                ay = a.y,
                az = a.z,
                aw = a.w;

            this.x = ax + (b.x - ax) * x;
            this.y = ay + (b.y - ay) * x;
            this.z = az + (b.z - az) * x;
            this.w = aw + (b.w - aw) * x;

            return this;
        };

        /**
         * @method vdot
         * @memberof Vec4
         * @brief dot product of two vectors, can be called as a static function Vec4.vdot( a, b )
         * @param Vec4 a
         * @param Vec4 b
         * @return Number
         */
        Vec4.vdot = Vec4.prototype.vdot = function(a, b) {

            return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
        };

        /**
         * @method dot
         * @memberof Vec4
         * @brief dot product of this and other vector
         * @param Vec4 other
         * @return Number
         */
        Vec4.prototype.dot = function(other) {

            return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
        };

        /**
         * @method min
         * @memberof Vec4
         * @brief returns min values from this and other vector
         * @param Vec4 other
         * @return this
         */
        Vec4.prototype.min = function(other) {
            var ax = this.x,
                ay = this.y,
                az = this.z,
                aw = this.w,
                bx = other.x,
                by = other.y,
                bz = other.z,
                bw = this.w;

            this.x = bx < ax ? bx : ax;
            this.y = by < ay ? by : ay;
            this.z = bz < az ? bz : az;
            this.w = bw < aw ? bw : aw;

            return this;
        };

        /**
         * @method max
         * @memberof Vec4
         * @brief returns max values from this and other vector
         * @param Vec4 other
         * @return this
         */
        Vec4.prototype.max = function(other) {
            var ax = this.x,
                ay = this.y,
                az = this.z,
                aw = this.w,
                bx = other.x,
                by = other.y,
                bz = other.z,
                bw = this.w;

            this.x = bx > ax ? bx : ax;
            this.y = by > ay ? by : ay;
            this.z = bz > az ? bz : az;
            this.w = bw > aw ? bw : aw;

            return this;
        };

        /**
         * @method clamp
         * @memberof Vec4
         * @brief clamp values between min and max's values
         * @param Vec4 min
         * @param Vec4 max
         * @return this
         */
        Vec4.prototype.clamp = function(min, max) {
            var x = this.x,
                y = this.y,
                z = this.z,
                w = this.w,
                minx = min.x,
                miny = min.y,
                minz = min.z,
                minw = min.w,
                maxx = max.x,
                maxy = max.y,
                maxz = max.z,
                maxw = maxw;

            this.x = x < minx ? minx : x > maxx ? maxx : x;
            this.y = y < miny ? miny : y > maxy ? maxy : y;
            this.z = z < minz ? minz : z > maxz ? maxz : z;
            this.w = w < minw ? minw : w > maxw ? maxw : w;

            return this;
        };

        /**
         * @method transformMat4
         * @memberof Vec4
         * @brief transforms this with Mat4
         * @param Mat4 m
         * @return this
         */
        Vec4.prototype.transformMat4 = function(m) {
            var me = m.elements,
                x = this.x,
                y = this.y,
                z = this.z,
                w = this.w;

            this.x = x * me[0] + y * me[4] + z * me[8] + w * me[12];
            this.y = x * me[1] + y * me[5] + z * me[9] + w * me[13];
            this.z = x * me[2] + y * me[6] + z * me[10] + w * me[14];
            this.w = x * me[3] + y * me[7] + z * me[11] + w * me[15];

            return this;
        };

        /**
         * @method fromVec2
         * @memberof Vec4
         * @brief sets values from Vec2
         * @param Vec2 v
         * @return this
         */
        Vec4.prototype.fromVec2 = function(v) {

            this.x = v.x;
            this.y = v.y;
            this.z = 0;
            this.w = 1;

            return this;
        };

        /**
         * @method fromVec3
         * @memberof Vec4
         * @brief sets values from Vec3
         * @param Vec3 v
         * @return this
         */
        Vec4.prototype.fromVec3 = function(v) {

            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
            this.w = 1;

            return this;
        };

        /**
         * @method positionFromMat4
         * @memberof Vec4
         * @brief sets position from Mat4
         * @param Mat4 m
         * @return this
         */
        Vec4.prototype.positionFromMat4 = function(m) {
            var me = m.elements;

            this.x = me[12];
            this.y = me[13];
            this.z = me[14];
            this.w = me[15];

            return this;
        };

        /**
         * @method fromJSON
         * @memberof Vec4
         * @brief sets values from JSON object
         * @param Object json
         * @return this
         */
        Vec4.prototype.fromJSON = function(json) {

            this.x = json.x;
            this.y = json.y;
            this.z = json.z;
            this.w = json.w;

            return this;
        };

        /**
         * @method toJSON
         * @memberof Vec4
         * @brief returns json object of this
         * @return Object
         */
        Vec4.prototype.toJSON = function(json) {
            json || (json = {});

            json.x = this.x;
            json.y = this.y;
            json.z = this.z;
            json.w = this.w;

            return json;
        };

        /**
         * @method fromArray
         * @memberof Vec4
         * @brief sets values from Array object
         * @param Array array
         * @return this
         */
        Vec4.prototype.fromArray = function(array) {

            this.x = array[0];
            this.y = array[1];
            this.z = array[2];
            this.w = array[3];

            return this;
        };

        /**
         * @method toArray
         * @memberof Vec4
         * @brief returns array object of this
         * @return Array
         */
        Vec4.prototype.toArray = function(array) {
            array || (array = []);

            array[0] = this.x;
            array[1] = this.y;
            array[2] = this.z;
            array[3] = this.w;

            return array;
        };

        /**
         * @method toString
         * @memberof Vec4
         * @brief returns string of this
         * @return String
         */
        Vec4.prototype.toString = function() {

            return "Vec4( " + this.x + ", " + this.y + ", " + this.z + ", " + this.w + " )";
        };


        return Vec4;
    }
);
