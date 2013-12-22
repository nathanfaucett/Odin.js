if (typeof define !== 'function') {
    var define = require('amdefine')(module)
}
define([
        "math/mathf",
        "math/vec3"
    ],
    function(Mathf, Vec3) {
        "use strict";


        var abs = Math.abs,
            sqrt = Math.sqrt,
            acos = Math.acos,
            sin = Math.sin,
            cos = Math.cos,
            EPSILON = Mathf.EPSILON;

        /**
         * @class Quat
         * @brief quaterian
         * @param Number x
         * @param Number y
         * @param Number z
         * @param Number w
         */
        function Quat(x, y, z, w) {

            /**
             * @property Number x
             * @memberof Quat
             */
            this.x = x || 0;

            /**
             * @property Number y
             * @memberof Quat
             */
            this.y = y || 0;

            /**
             * @property Number z
             * @memberof Quat
             */
            this.z = z || 0;

            /**
             * @property Number w
             * @memberof Quat
             */
            this.w = w !== undefined ? w : 1;
        }

        /**
         * @method clone
         * @memberof Quat
         * @brief returns new instance of this
         * @return Quat
         */
        Quat.prototype.clone = function() {

            return new Quat(this.x, this.y, this.z, this.w);
        };

        /**
         * @method copy
         * @memberof Quat
         * @brief copies other
         * @param Quat other
         * @return this
         */
        Quat.prototype.copy = function(other) {

            this.x = other.x;
            this.y = other.y;
            this.z = other.z;
            this.w = other.w;

            return this;
        };

        /**
         * @method set
         * @memberof Quat
         * @brief sets values of this
         * @param Number x
         * @param Number y
         * @param Number z
         * @param Number w
         * @return this
         */
        Quat.prototype.set = function(x, y, z, w) {

            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;

            return this;
        };

        /**
         * @method mul
         * @memberof Quat
         * @brief muliples this's values by other's
         * @param Quat other
         * @return this
         */
        Quat.prototype.mul = function(other) {
            var ax = this.x,
                ay = this.y,
                az = this.z,
                aw = this.w,
                bx = other.x,
                by = other.y,
                bz = other.z,
                bw = other.w;

            this.x = ax * bw + aw * bx + ay * bz - az * by;
            this.y = ay * bw + aw * by + az * bx - ax * bz;
            this.z = az * bw + aw * bz + ax * by - ay * bx;
            this.w = aw * bw - ax * bx - ay * by - az * bz;

            return this;
        };

        /**
         * @method qmul
         * @memberof Quat
         * @brief muliples a and b saves it in this
         * @param Quat a
         * @param Quat b
         * @return this
         */
        Quat.prototype.qmul = function(a, b) {
            var ax = a.x,
                ay = a.y,
                az = a.z,
                aw = a.w,
                bx = b.x,
                by = b.y,
                bz = b.z,
                bw = b.w;

            this.x = ax * bw + aw * bx + ay * bz - az * by;
            this.y = ay * bw + aw * by + az * bx - ax * bz;
            this.z = az * bw + aw * bz + ax * by - ay * bx;
            this.w = aw * bw - ax * bx - ay * by - az * bz;

            return this;
        };

        /**
         * @method div
         * @memberof Quat
         * @brief divides this's values by other's
         * @param Quat other
         * @return this
         */
        Quat.prototype.div = function(other) {
            var ax = this.x,
                ay = this.y,
                az = this.z,
                aw = this.w,
                bx = -other.x,
                by = -other.y,
                bz = -other.z,
                bw = other.w;

            this.x = ax * bw + aw * bx + ay * bz - az * by;
            this.y = ay * bw + aw * by + az * bx - ax * bz;
            this.z = az * bw + aw * bz + ax * by - ay * bx;
            this.w = aw * bw - ax * bx - ay * by - az * bz;

            return this;
        };

        /**
         * @method qdiv
         * @memberof Quat
         * @brief divides b from a saves it in this
         * @param Quat a
         * @param Quat b
         * @return this
         */
        Quat.prototype.qdiv = function(a, b) {
            var ax = a.x,
                ay = a.y,
                az = a.z,
                aw = a.w,
                bx = -b.x,
                by = -b.y,
                bz = -b.z,
                bw = b.w;

            this.x = ax * bw + aw * bx + ay * bz - az * by;
            this.y = ay * bw + aw * by + az * bx - ax * bz;
            this.z = az * bw + aw * bz + ax * by - ay * bx;
            this.w = aw * bw - ax * bx - ay * by - az * bz;

            return this;
        };

        /**
         * @method length
         * @memberof Quat
         * @brief returns the length of this
         * @return Number
         */
        Quat.prototype.length = function() {
            var x = this.x,
                y = this.y,
                z = this.z,
                w = this.w,
                lsq = x * x + y * y + z * z + w * w;

            return lsq > 0 ? sqrt(lsq) : 0;
        };

        /**
         * @method lengthSq
         * @memberof Quat
         * @brief returns the squared length of this
         * @return Number
         */
        Quat.prototype.lengthSq = function() {
            var x = this.x,
                y = this.y,
                z = this.z,
                w = this.w;

            return x * x + y * y + z * z + w * w;
        };

        /**
         * @method normalize
         * @memberof Quat
         * @brief returns this with a length of 1
         * @return this
         */
        Quat.prototype.normalize = function() {
            var x = this.x,
                y = this.y,
                z = this.z,
                w = this.w,
                l = x * x + y * y + z * z + w * w;

            l = l > 0 ? 1 / sqrt(l) : 0;

            this.x *= l;
            this.y *= l;
            this.z *= l;
            this.w *= l;

            return this;
        };

        /**
         * @method inverse
         * @memberof Quat
         * @brief returns the inverse of this
         * @return this
         */
        Quat.prototype.inverse = function() {
            var x = this.x,
                y = this.y,
                z = this.z,
                w = this.w,
                d = x * x + y * y + z * z + w * w,
                invD = d > 0 ? 1 / d : 0;

            this.x *= -invD;
            this.y *= -invD;
            this.z *= -invD;
            this.w *= invD;

            return this;
        };

        /**
         * @method inverseQuat
         * @memberof Quat
         * @brief returns the inverse of other
         * @param Quat other
         * @return this
         */
        Quat.prototype.inverseQuat = function(other) {
            var x = other.x,
                y = other.y,
                z = other.z,
                w = other.w,
                d = x * x + y * y + z * z + w * w,
                invD = d > 0 ? 1 / d : 0;

            this.x = -x * invD;
            this.y = -y * invD;
            this.z = -z * invD;
            this.w = w * invD;

            return this;
        };

        /**
         * @method conjugate
         * @memberof Quat
         * @brief this faster than inverse, if quat is normalized and produces the same result
         * @return this
         */
        Quat.prototype.conjugate = function() {

            this.x = -this.x;
            this.y = -this.y;
            this.z = -this.z;

            return this;
        };

        /**
         * @method calculateW
         * @memberof Quat
         * @brief calculates w component of quat
         * @return this
         */
        Quat.prototype.calculateW = function() {
            var x = this.x,
                y = this.y,
                z = this.z;

            this.w = -sqrt(abs(1 - x * x - y * y - z * z));

            return this;
        };

        /**
         * @method lerp
         * @memberof Quat
         * @brief linear interpolation between this and other by x
         * @param Quat other
         * @param Number x
         * @return this
         */
        Quat.prototype.lerp = function(other, x) {

            this.x += (other.x - this.x) * x;
            this.y += (other.y - this.y) * x;
            this.z += (other.z - this.z) * x;
            this.w += (other.w - this.w) * x;

            return this;
        };

        /**
         * @method qlerp
         * @memberof Quat
         * @brief linear interpolation between a and b by x
         * @param Quat a
         * @param Quat b
         * @param Number x
         * @return this
         */
        Quat.prototype.qlerp = function(a, b, x) {
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
         * @method nlerp
         * @memberof Quat
         * @brief faster but less accurate than slerp
         * @param Quat other
         * @param Number x
         * @return this
         */
        Quat.prototype.nlerp = function(other, x) {

            this.x += (other.x - this.x) * x;
            this.y += (other.y - this.y) * x;
            this.z += (other.z - this.z) * x;
            this.w += (other.w - this.w) * x;

            return this.normalize();
        };

        /**
         * @method qnlerp
         * @memberof Quat
         * @brief faster but less accurate than qslerp
         * @param Quat a
         * @param Quat b
         * @param Number x
         * @return this
         */
        Quat.prototype.qnlerp = function(a, b, x) {
            var ax = a.x,
                ay = a.y,
                az = a.z,
                aw = a.w;

            this.x = ax + (b.x - ax) * x;
            this.y = ay + (b.y - ay) * x;
            this.z = az + (b.z - az) * x;
            this.w = aw + (b.w - aw) * x;

            return this.normalize();
        };

        /**
         * @method slerp
         * @memberof Quat
         * @brief spherical linear Interpolation of this and other by x
         * @param Quat other
         * @param Number x
         * @return this
         */
        Quat.prototype.slerp = function(other, x) {
            var ax = this.x,
                ay = this.y,
                az = this.z,
                aw = this.w,
                bx = other.x,
                by = other.y,
                bz = other.z,
                bw = other.w,

                omega, sinom, scale0, scale1,
                cosom = ax * bx + ay * by + az * bz + aw * bw;

            if (cosom < 0) {
                cosom *= -1;
                bx *= -1;
                by *= -1;
                bz *= -1;
                bw *= -1;
            }

            if (1 - cosom > EPSILON) {
                omega = acos(cosom);
                sinom = 1 / sin(omega);
                scale0 = sin((1 - x) * omega) * sinom;
                scale1 = sin(x * omega) * sinom;
            } else {
                scale0 = 1 - x;
                scale1 = x;
            }

            this.x = scale0 * ax + scale1 * bx;
            this.y = scale0 * ay + scale1 * by;
            this.z = scale0 * az + scale1 * bz;
            this.w = scale0 * aw + scale1 * bw;

            return this;
        };

        /**
         * @method qslerp
         * @memberof Quat
         * @brief spherical linear Interpolation between a and b by x
         * @param Quat a
         * @param Quat b
         * @param Number x
         * @return this
         */
        Quat.prototype.qslerp = function(a, b, x) {
            var ax = a.x,
                ay = a.y,
                az = a.z,
                aw = a.w,
                bx = b.x,
                by = b.y,
                bz = b.z,
                bw = b.w,

                omega, sinom, scale0, scale1,
                cosom = ax * bx + ay * by + az * bz + aw * bw;

            if (cosom < 0) {
                cosom *= -1;
                bx *= -1;
                by *= -1;
                bz *= -1;
                bw *= -1;
            }

            if (1 - cosom > EPSILON) {
                omega = acos(cosom);
                sinom = 1 / sin(omega);
                scale0 = sin((1 - x) * omega) * sinom;
                scale1 = sin(x * omega) * sinom;
            } else {
                scale0 = 1 - x;
                scale1 = x;
            }

            this.x = scale0 * ax + scale1 * bx;
            this.y = scale0 * ay + scale1 * by;
            this.z = scale0 * az + scale1 * bz;
            this.w = scale0 * aw + scale1 * bw;

            return this;
        };

        /**
         * @method qdot
         * @memberof Quat
         * @brief dot product of two quats, can be called as a static function Quat.qdot( a, b )
         * @param Quat a
         * @param Quat b
         * @return Number
         */
        Quat.qdot = Quat.prototype.qdot = function(a, b) {

            return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
        };

        /**
         * @method dot
         * @memberof Quat
         * @brief dot product of this and other
         * @param Quat other
         * @return Number
         */
        Quat.prototype.dot = function(other) {

            return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
        };

        /**
         * @method rotateX
         * @memberof Quat
         * @brief sets quat's x rotation
         * @param Number angle
         * @return this
         */
        Quat.prototype.rotateX = function(angle) {
            var halfAngle = angle * 0.5,
                x = this.x,
                y = this.y,
                z = this.z,
                w = this.w,
                s = sin(halfAngle),
                c = cos(halfAngle);

            this.x = x * c + w * s;
            this.y = y * c + z * s;
            this.z = z * c - y * s;
            this.w = w * c - x * s;

            return this;
        };

        /**
         * @method rotateY
         * @memberof Quat
         * @brief sets quat's y rotation
         * @param Number angle
         * @return this
         */
        Quat.prototype.rotateY = function(angle) {
            var halfAngle = angle * 0.5,
                x = this.x,
                y = this.y,
                z = this.z,
                w = this.w,
                s = sin(halfAngle),
                c = cos(halfAngle);

            this.x = x * c - z * s;
            this.y = y * c + w * s;
            this.z = z * c + x * s;
            this.w = w * c - y * s;

            return this;
        };

        /**
         * @method rotateZ
         * @memberof Quat
         * @brief sets quat's z rotation
         * @param Number angle
         * @return this
         */
        Quat.prototype.rotateZ = function(angle) {
            var halfAngle = angle * 0.5,
                x = this.x,
                y = this.y,
                z = this.z,
                w = this.w,
                s = sin(halfAngle),
                c = cos(halfAngle);

            this.x = x * c + y * s;
            this.y = y * c - x * s;
            this.z = z * c + w * s;
            this.w = w * c - z * s;

            return this;
        };

        /**
         * @method rotate
         * @memberof Quat
         * @brief rotates quat by z then x then y in that order
         * @param Number x
         * @param Number y
         * @param Number z
         * @return this
         */
        Quat.prototype.rotate = function(x, y, z) {

            this.rotateZ(z);
            this.rotateX(x);
            this.rotateY(y);

            return this;
        };

        /**
         * @method lookRotation
         * @memberof Quat
         * @brief creates a rotation with the specified forward and upwards directions
         * @param Vec3 forward
         * @param Vec3 up
         * @return this
         */
        Quat.prototype.lookRotation = function(forward, up) {
            var fx = forward.x,
                fy = forward.y,
                fz = forward.z,
                ux = up.x,
                uy = u.y,
                uz = up.z,

                ax = uy * fz - uz * fy,
                ay = uz * fx - ux * fz,
                az = ux * fy - uy * fx,

                d = (1 + ux * fx + uy * fy + uz * fz) * 2,
                dsq = d * d
                s = 1 / dsq;

            this.x = ax * s;
            this.y = ay * s;
            this.z = az * s;
            this.w = dsq * 0.5;

            return this;
        };

        /**
         * @method fromAxisAngle
         * @memberof Quat
         * @brief sets quat from axis and angle
         * @param Vec3 axis
         * @param Number angle
         * @return this
         */
        Quat.prototype.fromAxisAngle = function(axis, angle) {
            var halfAngle = angle * 0.5,
                s = sin(halfAngle);

            this.x = axis.x * s;
            this.y = axis.y * s;
            this.z = axis.z * s;
            this.w = cos(halfAngle);

            return this;
        };

        /**
         * @method fromVec3s
         * @memberof Quat
         * @brief sets quat from two vectors
         * @param Vec3 u
         * @param Vec3 v
         * @return this
         */
        Quat.prototype.fromVec3s = function() {
            var a = new Vec3;

            return function(u, v) {
                a.vcross(u, v);

                this.x = a.x;
                this.y = a.y;
                this.z = a.z;
                this.w = sqrt(u.lengthSq() * v.lengthSq()) + u.dot(v);

                return this.normalize();
            };
        }();

        /**
         * @method fromMat3
         * @memberof Quat
         * @brief sets values from Mat3
         * @param Mat3 m
         * @return this
         */
        Quat.prototype.fromMat3 = function(m) {
            var te = m.elements,
                m11 = te[0],
                m12 = te[3],
                m13 = te[6],
                m21 = te[1],
                m22 = te[4],
                m23 = te[7],
                m31 = te[2],
                m32 = te[5],
                m33 = te[8],
                trace = m11 + m22 + m33,
                s, invS;

            if (trace > 0) {
                s = 0.5 / sqrt(trace + 1);

                this.w = 0.25 / s;
                this.x = (m32 - m23) * s;
                this.y = (m13 - m31) * s;
                this.z = (m21 - m12) * s;
            } else if (m11 > m22 && m11 > m33) {
                s = 2 * sqrt(1 + m11 - m22 - m33);
                invS = 1 / s;

                this.w = (m32 - m23) * invS;
                this.x = 0.25 * s;
                this.y = (m12 + m21) * invS;
                this.z = (m13 + m31) * invS;
            } else if (m22 > m33) {
                s = 2 * sqrt(1 + m22 - m11 - m33);
                invS = 1 / s;

                this.w = (m13 - m31) * invS;
                this.x = (m12 + m21) * invS;
                this.y = 0.25 * s;
                this.z = (m23 + m32) * invS;
            } else {
                s = 2 * sqrt(1 + m33 - m11 - m22);
                invS = 1 / s;

                this.w = (m21 - m12) * invS;
                this.x = (m13 + m31) * invS;
                this.y = (m23 + m32) * invS;
                this.z = 0.25 * s;
            }

            return this;
        };

        /**
         * @method fromMat4
         * @memberof Quat
         * @brief sets values from Mat4
         * @param Mat4 m
         * @return this
         */
        Quat.prototype.fromMat4 = function(m) {
            var te = m.elements,
                m11 = te[0],
                m12 = te[4],
                m13 = te[8],
                m21 = te[1],
                m22 = te[5],
                m23 = te[9],
                m31 = te[2],
                m32 = te[6],
                m33 = te[10],
                trace = m11 + m22 + m33,
                s, invS;

            if (trace > 0) {
                s = 0.5 / sqrt(trace + 1);

                this.w = 0.25 / s;
                this.x = (m32 - m23) * s;
                this.y = (m13 - m31) * s;
                this.z = (m21 - m12) * s;
            } else if (m11 > m22 && m11 > m33) {
                s = 2 * sqrt(1 + m11 - m22 - m33);
                invS = 1 / s;

                this.w = (m32 - m23) * invS;
                this.x = 0.25 * s;
                this.y = (m12 + m21) * invS;
                this.z = (m13 + m31) * invS;
            } else if (m22 > m33) {
                s = 2 * sqrt(1 + m22 - m11 - m33);
                invS = 1 / s;

                this.w = (m13 - m31) * invS;
                this.x = (m12 + m21) * invS;
                this.y = 0.25 * s;
                this.z = (m23 + m32) * invS;
            } else {
                s = 2 * sqrt(1 + m33 - m11 - m22);
                invS = 1 / s;

                this.w = (m21 - m12) * invS;
                this.x = (m13 + m31) * invS;
                this.y = (m23 + m32) * invS;
                this.z = 0.25 * s;
            }

            return this;
        };

        /**
         * @method fromArray
         * @memberof Quat
         * @brief sets values from array
         * @param Array array
         * @return this
         */
        Quat.prototype.fromArray = function(array) {

            this.x = array[0];
            this.y = array[1];
            this.z = array[2];
            this.w = array[3];

            return this;
        };

        /**
         * @method fromJSON
         * @memberof Quat
         * @brief sets values from JSON object
         * @param Object json
         * @return this
         */
        Quat.prototype.fromJSON = function(json) {

            this.x = json.x;
            this.y = json.y;
            this.z = json.z;
            this.w = json.w;

            return this;
        };

        /**
         * @method toArray
         * @memberof Quat
         * @brief returns array of this
         * @return Object
         */
        Quat.prototype.toArray = function() {

            return [this.x, this.y, this.z, this.w];
        };

        /**
         * @method toJSON
         * @memberof Quat
         * @brief returns json object of this
         * @return Object
         */
        Quat.prototype.toJSON = function() {

            return {
                x: this.x,
                y: this.y,
                z: this.z,
                w: this.w
            };
        };

        /**
         * @method toString
         * @memberof Quat
         * @brief returns string of this
         * @return String
         */
        Quat.prototype.toString = function() {

            return "Quat( " + this.x + ", " + this.y + ", " + this.z + ", " + this.w + " )";
        };


        return Quat;
    }
);
