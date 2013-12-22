if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define(
    function() {
        "use strict";


        var sqrt = Math.sqrt;

        /**
         * @class Vec2
         * @brief 2d vector
         * @param Number x
         * @param Number y
         */
        function Vec2(x, y) {

            /**
             * @property Number x
             * @memberof Vec2
             */
            this.x = x || 0;

            /**
             * @property Number y
             * @memberof Vec2
             */
            this.y = y || 0;
        }

        /**
         * @method clone
         * @memberof Vec2
         * @brief returns new instance of this
         * @return Vec2
         */
        Vec2.prototype.clone = function() {

            return new Vec2(this.x, this.y);
        };

        /**
         * @method copy
         * @memberof Vec2
         * @brief copies other
         * @param Vec2 other
         * @return this
         */
        Vec2.prototype.copy = function(other) {

            this.x = other.x;
            this.y = other.y;

            return this;
        };

        /**
         * @method set
         * @memberof Vec2
         * @brief sets values of this
         * @param Number x
         * @param Number y
         * @return this
         */
        Vec2.prototype.set = function(x, y) {

            this.x = x;
            this.y = y;

            return this;
        };

        /**
         * @method add
         * @memberof Vec2
         * @brief adds other's values to this
         * @param Vec2 other
         * @return this
         */
        Vec2.prototype.add = function(other) {

            this.x += other.x;
            this.y += other.y;

            return this;
        };

        /**
         * @method vadd
         * @memberof Vec2
         * @brief adds a and b together saves it in this
         * @param Vec2 a
         * @param Vec2 b
         * @return this
         */
        Vec2.prototype.vadd = function(a, b) {

            this.x = a.x + b.x;
            this.y = a.y + b.y;

            return this;
        };

        /**
         * @method sadd
         * @memberof Vec2
         * @brief adds scalar value to this
         * @param Number s
         * @return this
         */
        Vec2.prototype.sadd = function(s) {

            this.x += s;
            this.y += s;

            return this;
        };

        /**
         * @method sub
         * @memberof Vec2
         * @brief subtracts other's values from this
         * @param Vec2 other
         * @return this
         */
        Vec2.prototype.sub = function(other) {

            this.x -= other.x;
            this.y -= other.y;

            return this;
        };

        /**
         * @method vsub
         * @memberof Vec2
         * @brief subtracts b from a saves it in this
         * @param Vec2 a
         * @param Vec2 b
         * @return this
         */
        Vec2.prototype.vsub = function(a, b) {

            this.x = a.x - b.x;
            this.y = a.y - b.y;

            return this;
        };

        /**
         * @method ssub
         * @memberof Vec2
         * @brief subtracts this by a scalar value
         * @param Number s
         * @return this
         */
        Vec2.prototype.ssub = function(s) {

            this.x -= s;
            this.y -= s;

            return this;
        };

        /**
         * @method mul
         * @memberof Vec2
         * @brief muliples this's values by other's
         * @param Vec2 other
         * @return this
         */
        Vec2.prototype.mul = function(other) {

            this.x *= other.x;
            this.y *= other.y;

            return this;
        };

        /**
         * @method vmul
         * @memberof Vec2
         * @brief muliples a and b saves it in this
         * @param Vec2 a
         * @param Vec2 b
         * @return this
         */
        Vec2.prototype.vmul = function(a, b) {

            this.x = a.x * b.x;
            this.y = a.y * b.y;

            return this;
        };

        /**
         * @method smul
         * @memberof Vec2
         * @brief muliples this by a scalar value
         * @param Number s
         * @return this
         */
        Vec2.prototype.smul = function(s) {

            this.x *= s;
            this.y *= s;

            return this;
        };

        /**
         * @method div
         * @memberof Vec2
         * @brief divides this's values by other's
         * @param Vec2 other
         * @return this
         */
        Vec2.prototype.div = function(other) {
            var x = other.x,
                y = other.y;

            this.x *= x !== 0 ? 1 / x : 0;
            this.y *= y !== 0 ? 1 / y : 0;

            return this;
        };

        /**
         * @method vdiv
         * @memberof Vec2
         * @brief divides b from a saves it in this
         * @param Vec2 a
         * @param Vec2 b
         * @return this
         */
        Vec2.prototype.vdiv = function(a, b) {
            var x = b.x,
                y = b.y;

            this.x = x !== 0 ? a.x / x : 0;
            this.y = y !== 0 ? a.y / y : 0;

            return this;
        };

        /**
         * @method sdiv
         * @memberof Vec2
         * @brief divides this by scalar value
         * @param Number s
         * @return this
         */
        Vec2.prototype.sdiv = function(s) {
            s = s === 0 ? 0 : 1 / s;

            this.x *= s;
            this.y *= s;

            return this;
        };

        /**
         * @method length
         * @memberof Vec2
         * @brief returns the length of this
         * @return Number
         */
        Vec2.prototype.length = function() {
            var x = this.x,
                y = this.y,
                lsq = x * x + y * y;

            if (lsq === 1) return 1;

            return lsq > 0 ? sqrt(lsq) : 0;
        };

        /**
         * @method lengthSq
         * @memberof Vec2
         * @brief returns the squared length of this
         * @return Number
         */
        Vec2.prototype.lengthSq = function() {
            var x = this.x,
                y = this.y;

            return x * x + y * y;
        };

        /**
         * @method setLength
         * @memberof Vec2
         * @brief sets this so its magnitude is equal to length
         * @param Number length
         * @return Vec2
         */
        Vec2.prototype.setLength = function(length) {
            var x = this.x,
                y = this.y,
                l = x * x + y * y;

            if (l === 1) {
                this.x *= length;
                this.y *= length;

                return this;
            }

            l = l > 0 ? 1 / sqrt(l) : 0;

            this.x *= l * length;
            this.y *= l * length;

            return this;
        };

        /**
         * @method normalize
         * @memberof Vec2
         * @brief returns this with a length of 1
         * @return this
         */
        Vec2.prototype.normalize = function() {
            var x = this.x,
                y = this.y,
                l = x * x + y * y;

            if (l === 1) return this;

            l = l > 0 ? 1 / sqrt(l) : 0;

            this.x *= l;
            this.y *= l;

            return this;
        };

        /**
         * @method inverse
         * @memberof Vec2
         * @brief returns the inverse of this
         * @return this
         */
        Vec2.prototype.inverse = function() {

            this.x *= -1;
            this.y *= -1;

            return this;
        };

        /**
         * @method inverseVec
         * @memberof Vec2
         * @brief returns the inverse of other
         * @param Vec2 other
         * @return this
         */
        Vec2.prototype.inverseVec = function(other) {

            this.x = -other.x;
            this.y = -other.y;

            return this;
        };

        /**
         * @method lerp
         * @memberof Vec2
         * @brief linear interpolation between this and other by x
         * @param Vec2 other
         * @param Number x
         * @return Vec2
         */
        Vec2.prototype.lerp = function(other, x) {

            this.x += (other.x - this.x) * x;
            this.y += (other.y - this.y) * x;

            return this;
        };

        /**
         * @method vlerp
         * @memberof Vec2
         * @brief linear interpolation between a and b by x
         * @param Vec2 a
         * @param Vec2 b
         * @param Number x
         * @return Vec2
         */
        Vec2.prototype.vlerp = function(a, b, x) {
            var ax = a.x,
                ay = a.y;

            this.x = ax + (b.x - ax) * x;
            this.y = ay + (b.y - ay) * x;

            return this;
        };

        /**
         * @method vdot
         * @memberof Vec2
         * @brief dot product of two vectors, can be called as a static function Vec2.vdot( a, b )
         * @param Vec2 a
         * @param Vec2 b
         * @return Number
         */
        Vec2.vdot = Vec2.prototype.vdot = function(a, b) {

            return a.x * b.x + a.y * b.y;
        };

        /**
         * @method dot
         * @memberof Vec2
         * @brief dot product of this and other vector
         * @param Vec2 other
         * @return Number
         */
        Vec2.prototype.dot = function(other) {

            return this.x * other.x + this.y * other.y;
        };

        /**
         * @method vcross
         * @memberof Vec2
         * @brief cross product between a vector and b vector, can be called as a static function Vec2.vcross( a, b )
         * @param Vec2 a
         * @param Vec2 b
         * @return Number
         */
        Vec2.vcross = Vec2.prototype.vcross = function(a, b) {

            return a.x * b.y - a.y * b.x;
        };

        /**
         * @method cross
         * @memberof Vec2
         * @brief cross product between this vector and other
         * @param Vec2 other
         * @return Number
         */
        Vec2.prototype.cross = function(other) {

            return this.x * other.y - this.y * other.x;
        };

        /**
         * @method min
         * @memberof Vec2
         * @brief returns min values from this and other vector
         * @param Vec2 other
         * @return this
         */
        Vec2.prototype.min = function(other) {
            var ax = this.x,
                ay = this.y,
                bx = other.x,
                by = other.y;

            this.x = bx < ax ? bx : ax;
            this.y = by < ay ? by : ay;

            return this;
        };

        /**
         * @method max
         * @memberof Vec2
         * @brief returns max values from this and other vector
         * @param Vec2 other
         * @return this
         */
        Vec2.prototype.max = function(other) {
            var ax = this.x,
                ay = this.y,
                bx = other.x,
                by = other.y;

            this.x = bx > ax ? bx : ax;
            this.y = by > ay ? by : ay;

            return this;
        };

        /**
         * @method clamp
         * @memberof Vec2
         * @brief clamp values between min and max's values
         * @param Vec2 min
         * @param Vec2 max
         * @return this
         */
        Vec2.prototype.clamp = function(min, max) {
            var x = this.x,
                y = this.y,
                minx = min.x,
                miny = min.y,
                maxx = max.x,
                maxy = max.y;

            this.x = x < minx ? minx : x > maxx ? maxx : x;
            this.y = y < miny ? miny : y > maxy ? maxy : y;

            return this;
        };

        /**
         * @method transformAngle
         * @memberof Vec2
         * @brief transforms this with angle
         * @param Mat2 m
         * @return this
         */
        Vec2.prototype.transformAngle = function(a) {
            var x = this.x,
                y = this.y,
                c = cos(a),
                s = sin(a);

            this.x = x * c - y * s;
            this.y = x * s + y * c;

            return this;
        };

        /**
         * @method transformMat2
         * @memberof Vec2
         * @brief transforms this with Mat2
         * @param Mat2 m
         * @return this
         */
        Vec2.prototype.transformMat2 = function(m) {
            var me = m.elements,
                x = this.x,
                y = this.y;

            this.x = x * me[0] + y * me[2];
            this.y = x * me[1] + y * me[3];

            return this;
        };

        /**
         * @method untransformMat2
         * @memberof Vec2
         * @brief untransforms this with Mat2
         * @param Mat2 m
         * @return this
         */
        Vec2.prototype.untransformMat2 = function(m) {
            var me = m.elements,
                x = this.x,
                y = this.y;

            this.x = x * me[0] + y * me[1];
            this.y = x * me[2] + y * me[3];

            return this;
        };

        /**
         * @method transformMat32
         * @memberof Vec2
         * @brief transforms this with Mat32
         * @param Mat32 m
         * @return this
         */
        Vec2.prototype.transformMat32 = function(m) {
            var me = m.elements,
                x = this.x,
                y = this.y;

            this.x = x * me[0] + y * me[2] + me[4];
            this.y = x * me[1] + y * me[3] + me[5];

            return this;
        };

        /**
         * @method untransformMat32
         * @memberof Vec2
         * @brief untransforms this with Mat32
         * @param Mat32 m
         * @return this
         */
        Vec2.prototype.untransformMat32 = function(m) {
            var me = m.elements,
                x = this.x - me[4],
                y = this.y - me[5];

            this.x = x * me[0] + y * me[1];
            this.y = x * me[2] + y * me[3];

            return this;
        };

        /**
         * @method transformMat3
         * @memberof Vec2
         * @brief transforms this with Mat3
         * @param Mat3 m
         * @return this
         */
        Vec2.prototype.transformMat3 = function(m) {
            var me = m.elements,
                x = this.x,
                y = this.y;

            this.x = x * me[0] + y * me[3] + me[6];
            this.y = x * me[1] + y * me[4] + me[7];

            return this;
        };

        /**
         * @method transformMat4
         * @memberof Vec2
         * @brief transforms this with Mat4
         * @param Mat4 m
         * @return this
         */
        Vec2.prototype.transformMat4 = function(m) {
            var me = m.elements,
                x = this.x,
                y = this.y;

            this.x = x * me[0] + y * me[4] + me[12];
            this.y = x * me[1] + y * me[5] + me[13];

            return this;
        };

        /**
         * @method fromVec3
         * @memberof Vec2
         * @brief sets values from Vec3
         * @param Vec3 v
         * @return this
         */
        Vec2.prototype.fromVec3 = function(v) {

            this.x = v.x;
            this.y = v.y;

            return this;
        };

        /**
         * @method fromVec4
         * @memberof Vec2
         * @brief sets values from Vec4
         * @param Vec4 v
         * @return this
         */
        Vec2.prototype.fromVec4 = function(v) {

            this.x = v.x;
            this.y = v.y;

            return this;
        };

        /**
         * @method positionFromMat32
         * @memberof Vec2
         * @brief sets position from Mat32
         * @param Mat32 m
         * @return this
         */
        Vec2.prototype.positionFromMat32 = function(m) {
            var me = m.elements;

            this.x = me[4];
            this.y = me[5];

            return this;
        };

        /**
         * @method positionFromMat4
         * @memberof Vec2
         * @brief sets position from Mat4
         * @param Mat4 m
         * @return this
         */
        Vec2.prototype.positionFromMat4 = function(m) {
            var me = m.elements;

            this.x = me[12];
            this.y = me[13];

            return this;
        };

        /**
         * @method scaleFromMat2
         * @memberof Vec2
         * @brief sets this from Mat2 scale
         * @param Mat2 m
         * @return this
         */
        Vec2.prototype.scaleFromMat2 = function(m) {
            var me = m.elements,
                x = this.set(me[0], m[2]).length(),
                y = this.set(me[1], m[3]).length();

            this.x = x;
            this.y = y;

            return this;
        };

        /**
         * @method scaleFromMat32
         * @memberof Vec2
         * @brief sets this from Mat32 scale
         * @param Mat32 m
         * @return this
         */
        Vec2.prototype.scaleFromMat32 = Vec2.prototype.scaleFromMat2;

        /**
         * @method fromJSON
         * @memberof Vec2
         * @brief sets values from JSON object
         * @param Object json
         * @return this
         */
        Vec2.prototype.fromJSON = function(json) {

            this.x = json.x;
            this.y = json.y;

            return this;
        };

        /**
         * @method toJSON
         * @memberof Vec2
         * @brief returns json object of this
         * @return Object
         */
        Vec2.prototype.toJSON = function(json) {
            json || (json = {});

            json.x = this.x;
            json.y = this.y;

            return json;
        };

        /**
         * @method toString
         * @memberof Vec2
         * @brief returns string of this
         * @return String
         */
        Vec2.prototype.toString = function() {

            return "Vec2( " + this.x + ", " + this.y + " )";
        };


        return Vec2;
    }
);
