if (typeof define !== 'function') { var define = require('amdefine')(module) }
define([
        "odin/math/mathf",
        "odin/math/vec3"
    ],
    function(Mathf, Vec3) {
        "use strict";


        var sqrt = Math.sqrt,
            cos = Math.cos,
            sin = Math.sin,
            tan = Math.tan,
            degsToRads = Mathf.degsToRads;

        /**
         * @class Mat4
         * @brief 4x4 matrix
         * @param Number m11
         * @param Number m12
         * @param Number m13
         * @param Number m14
         * @param Number m21
         * @param Number m22
         * @param Number m23
         * @param Number m24
         * @param Number m31
         * @param Number m32
         * @param Number m33
         * @param Number m34
         * @param Number m41
         * @param Number m42
         * @param Number m43
         * @param Number m44
         */
        function Mat4(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44) {
            var te = new Float32Array(16);

            /**
             * @property Float32Array elements
             * @memberof Mat4
             */
            this.elements = te;

            te[0] = m11 !== undefined ? m11 : 1;
            te[4] = m12 || 0;
            te[8] = m13 || 0;
            te[12] = m14 || 0;
            te[1] = m21 || 0;
            te[5] = m22 !== undefined ? m22 : 1;
            te[9] = m23 || 0;
            te[13] = m24 || 0;
            te[2] = m31 || 0;
            te[6] = m32 || 0;
            te[10] = m33 !== undefined ? m33 : 1;
            te[14] = m34 || 0;
            te[3] = m41 || 0;
            te[7] = m42 || 0;
            te[11] = m43 || 0;
            te[15] = m44 !== undefined ? m44 : 1;
        }

        /**
         * @method clone
         * @memberof Mat4
         * @brief returns new instance of this
         * @return Mat4
         */
        Mat4.prototype.clone = function() {
            var te = this.elements;

            return new Mat4(
                te[0], te[4], te[8], te[12],
                te[1], te[5], te[9], te[13],
                te[2], te[6], te[10], te[14],
                te[3], te[7], te[11], te[15]
            );
        };

        /**
         * @method copy
         * @memberof Mat4
         * @brief copies other
         * @param Mat4 other
         * @return this
         */
        Mat4.prototype.copy = function(other) {
            var te = this.elements,
                me = other.elements;

            te[0] = me[0];
            te[1] = me[1];
            te[2] = me[2];
            te[3] = me[3];
            te[4] = me[4];
            te[5] = me[5];
            te[6] = me[6];
            te[7] = me[7];
            te[8] = me[8];
            te[9] = me[9];
            te[10] = me[10];
            te[11] = me[11];
            te[12] = me[12];
            te[13] = me[13];
            te[14] = me[14];
            te[15] = me[15];

            return this;
        };

        /**
         * @method set
         * @memberof Mat4
         * @brief sets values of this
         * @param Number m11
         * @param Number m12
         * @param Number m13
         * @param Number m14
         * @param Number m21
         * @param Number m22
         * @param Number m23
         * @param Number m24
         * @param Number m31
         * @param Number m32
         * @param Number m33
         * @param Number m34
         * @param Number m41
         * @param Number m42
         * @param Number m43
         * @param Number m44
         * @return this
         */
        Mat4.prototype.set = function(m11, m12, m13, m14, m21, m22, m23, m24, m31, m32, m33, m34, m41, m42, m43, m44) {
            var te = this.elements;

            te[0] = m11;
            te[4] = m12;
            te[8] = m13;
            te[12] = m14;
            te[1] = m21;
            te[5] = m22;
            te[9] = m23;
            te[13] = m24;
            te[2] = m31;
            te[6] = m32;
            te[10] = m33;
            te[14] = m34;
            te[3] = m41;
            te[7] = m42;
            te[11] = m43;
            te[15] = m44;

            return this;
        };

        /**
         * @method mul
         * @memberof Mat4
         * @brief muliples this's values by other's
         * @param Mat4 other
         * @return this
         */
        Mat4.prototype.mul = function(other) {
            var ae = this.elements,
                be = other.elements,

                a11 = ae[0],
                a12 = ae[4],
                a13 = ae[8],
                a14 = ae[12],
                a21 = ae[1],
                a22 = ae[5],
                a23 = ae[9],
                a24 = ae[13],
                a31 = ae[2],
                a32 = ae[6],
                a33 = ae[10],
                a34 = ae[14],
                a41 = ae[3],
                a42 = ae[7],
                a43 = ae[11],
                a44 = ae[15],

                b11 = be[0],
                b12 = be[4],
                b13 = be[8],
                b14 = be[12],
                b21 = be[1],
                b22 = be[5],
                b23 = be[9],
                b24 = be[13],
                b31 = be[2],
                b32 = be[6],
                b33 = be[10],
                b34 = be[14],
                b41 = be[3],
                b42 = be[7],
                b43 = be[11],
                b44 = be[15];

            ae[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
            ae[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
            ae[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
            ae[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

            ae[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
            ae[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
            ae[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
            ae[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

            ae[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
            ae[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
            ae[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
            ae[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

            ae[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
            ae[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
            ae[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
            ae[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

            return this;
        };

        /**
         * @method mmul
         * @memberof Mat4
         * @brief muliples a and b saves it in this
         * @param Mat4 a
         * @param Mat4 b
         * @return this
         */
        Mat4.prototype.mmul = function(a, b) {
            var te = this.elements,
                ae = a.elements,
                be = b.elements,

                a11 = ae[0],
                a12 = ae[4],
                a13 = ae[8],
                a14 = ae[12],
                a21 = ae[1],
                a22 = ae[5],
                a23 = ae[9],
                a24 = ae[13],
                a31 = ae[2],
                a32 = ae[6],
                a33 = ae[10],
                a34 = ae[14],
                a41 = ae[3],
                a42 = ae[7],
                a43 = ae[11],
                a44 = ae[15],

                b11 = be[0],
                b12 = be[4],
                b13 = be[8],
                b14 = be[12],
                b21 = be[1],
                b22 = be[5],
                b23 = be[9],
                b24 = be[13],
                b31 = be[2],
                b32 = be[6],
                b33 = be[10],
                b34 = be[14],
                b41 = be[3],
                b42 = be[7],
                b43 = be[11],
                b44 = be[15];

            te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
            te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
            te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
            te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

            te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
            te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
            te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
            te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

            te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
            te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
            te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
            te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

            te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
            te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
            te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
            te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

            return this;
        };

        /**
         * @method smul
         * @memberof Mat4
         * @brief muliples this by a scalar value
         * @param Number s
         * @return this
         */
        Mat4.prototype.smul = function(s) {
            var te = this.elements;

            te[0] *= s;
            te[1] *= s;
            te[2] *= s;
            te[3] *= s;
            te[4] *= s;
            te[5] *= s;
            te[6] *= s;
            te[7] *= s;
            te[8] *= s;
            te[9] *= s;
            te[10] *= s;
            te[11] *= s;
            te[12] *= s;
            te[13] *= s;
            te[14] *= s;
            te[15] *= s;

            return this;
        };

        /**
         * @method sdiv
         * @memberof Mat4
         * @brief divides this by scalar value
         * @param Number s
         * @return this
         */
        Mat4.prototype.sdiv = function(s) {
            var te = this.elements;

            s = s !== 0 ? 1 / s : 1;

            te[0] *= s;
            te[1] *= s;
            te[2] *= s;
            te[3] *= s;
            te[4] *= s;
            te[5] *= s;
            te[6] *= s;
            te[7] *= s;
            te[8] *= s;
            te[9] *= s;
            te[10] *= s;
            te[11] *= s;
            te[12] *= s;
            te[13] *= s;
            te[14] *= s;
            te[15] *= s;

            return this;
        };

        /**
         * @method identity
         * @memberof Mat4
         * @brief identity matrix
         * @return this
         */
        Mat4.prototype.identity = function() {
            var te = this.elements;

            te[0] = 1;
            te[1] = 0;
            te[2] = 0;
            te[3] = 0;
            te[4] = 0;
            te[5] = 1;
            te[6] = 0;
            te[7] = 0;
            te[8] = 0;
            te[9] = 0;
            te[10] = 1;
            te[11] = 0;
            te[12] = 0;
            te[13] = 0;
            te[14] = 0;
            te[15] = 1;

            return this;
        };

        /**
         * @method zero
         * @memberof Mat4
         * @brief zero matrix
         * @return this
         */
        Mat4.prototype.zero = function() {
            var te = this.elements;

            te[0] = 0;
            te[1] = 0;
            te[2] = 0;
            te[3] = 0;
            te[4] = 0;
            te[5] = 0;
            te[6] = 0;
            te[7] = 0;
            te[8] = 0;
            te[9] = 0;
            te[10] = 0;
            te[11] = 0;
            te[12] = 0;
            te[13] = 0;
            te[14] = 0;
            te[15] = 0;

            return this;
        };

        /**
         * @method determinant
         * @memberof Mat4
         * @brief returns the determinant of this
         * @return this
         */
        Mat4.prototype.determinant = function() {
            var te = this.elements,
                m11 = ae[0],
                m12 = ae[4],
                m13 = ae[8],
                m14 = ae[12],
                m21 = ae[1],
                m22 = ae[5],
                m23 = ae[9],
                m24 = ae[13],
                m31 = ae[2],
                m32 = ae[6],
                m33 = ae[10],
                m34 = ae[14],
                m41 = ae[3],
                m42 = ae[7],
                m43 = ae[11],
                m44 = ae[15];

            return (
                m41 * (m14 * m23 * m32 - m13 * m24 * m32 - m14 * m22 * m33 + m12 * m24 * m33 + m13 * m22 * m34 - m12 * m23 * m34) +
                m42 * (m11 * m23 * m34 - m11 * m24 * m33 + m14 * m21 * m33 - m13 * m21 * m34 + m13 * m24 * m31 - m14 * m23 * m31) +
                m43 * (m11 * m24 * m32 - m11 * m22 * m34 - m14 * m21 * m32 + m12 * m21 * m34 + m14 * m22 * m31 - m12 * m24 * m31) +
                m44 * (-m13 * m22 * m31 - m11 * m23 * m32 + m11 * m22 * m33 + m13 * m21 * m32 - m12 * m21 * m33 + m12 * m23 * m31)
            );
        };

        /**
         * @method inverse
         * @memberof Mat4
         * @brief returns the inverse of this
         * @return this
         */
        Mat4.prototype.inverse = function() {
            var te = this.elements,
                m11 = te[0],
                m12 = te[4],
                m13 = te[8],
                m14 = te[12],
                m21 = te[1],
                m22 = te[5],
                m23 = te[9],
                m24 = te[13],
                m31 = te[2],
                m32 = te[6],
                m33 = te[10],
                m34 = te[14],
                m41 = te[3],
                m42 = te[7],
                m43 = te[11],
                m44 = te[15],

                m0 = m23 * m34 * m42 - m24 * m33 * m42 + m24 * m32 * m43 - m22 * m34 * m43 - m23 * m32 * m44 + m22 * m33 * m44,
                m4 = m14 * m33 * m42 - m13 * m34 * m42 - m14 * m32 * m43 + m12 * m34 * m43 + m13 * m32 * m44 - m12 * m33 * m44,
                m8 = m13 * m24 * m42 - m14 * m23 * m42 + m14 * m22 * m43 - m12 * m24 * m43 - m13 * m22 * m44 + m12 * m23 * m44,
                m12 = m14 * m23 * m32 - m13 * m24 * m32 - m14 * m22 * m33 + m12 * m24 * m33 + m13 * m22 * m34 - m12 * m23 * m34,

                det = m11 * m0 + m21 * m4 + m31 * m8 + m41 * m12;

            det = det === 0 ? 0 : 1 / det;

            te[0] = m0 * det;
            te[4] = m4 * det;
            te[8] = m8 * det;
            te[12] = m12 * det;
            te[1] = (m24 * m33 * m41 - m23 * m34 * m41 - m24 * m31 * m43 + m21 * m34 * m43 + m23 * m31 * m44 - m21 * m33 * m44) * det;
            te[5] = (m13 * m34 * m41 - m14 * m33 * m41 + m14 * m31 * m43 - m11 * m34 * m43 - m13 * m31 * m44 + m11 * m33 * m44) * det;
            te[9] = (m14 * m23 * m41 - m13 * m24 * m41 - m14 * m21 * m43 + m11 * m24 * m43 + m13 * m21 * m44 - m11 * m23 * m44) * det;
            te[13] = (m13 * m24 * m31 - m14 * m23 * m31 + m14 * m21 * m33 - m11 * m24 * m33 - m13 * m21 * m34 + m11 * m23 * m34) * det;
            te[2] = (m22 * m34 * m41 - m24 * m32 * m41 + m24 * m31 * m42 - m21 * m34 * m42 - m22 * m31 * m44 + m21 * m32 * m44) * det;
            te[6] = (m14 * m32 * m41 - m12 * m34 * m41 - m14 * m31 * m42 + m11 * m34 * m42 + m12 * m31 * m44 - m11 * m32 * m44) * det;
            te[10] = (m12 * m24 * m41 - m14 * m22 * m41 + m14 * m21 * m42 - m11 * m24 * m42 - m12 * m21 * m44 + m11 * m22 * m44) * det;
            te[14] = (m14 * m22 * m31 - m12 * m24 * m31 - m14 * m21 * m32 + m11 * m24 * m32 + m12 * m21 * m34 - m11 * m22 * m34) * det;
            te[3] = (m23 * m32 * m41 - m22 * m33 * m41 - m23 * m31 * m42 + m21 * m33 * m42 + m22 * m31 * m43 - m21 * m32 * m43) * det;
            te[7] = (m12 * m33 * m41 - m13 * m32 * m41 + m13 * m31 * m42 - m11 * m33 * m42 - m12 * m31 * m43 + m11 * m32 * m43) * det;
            te[11] = (m13 * m22 * m41 - m12 * m23 * m41 - m13 * m21 * m42 + m11 * m23 * m42 + m12 * m21 * m43 - m11 * m22 * m43) * det;
            te[15] = (m12 * m23 * m31 - m13 * m22 * m31 + m13 * m21 * m32 - m11 * m23 * m32 - m12 * m21 * m33 + m11 * m22 * m33) * det;

            return this;
        };

        /**
         * @method inverseMat
         * @memberof Mat4
         * @brief returns the inverse of other
         * @param Mat4 other
         * @return this
         */
        Mat4.prototype.inverseMat = function(other) {
            var te = this.elements,
                me = other.elements,
                m11 = me[0],
                m12 = me[4],
                m13 = me[8],
                m14 = me[12],
                m21 = me[1],
                m22 = me[5],
                m23 = me[9],
                m24 = me[13],
                m31 = me[2],
                m32 = me[6],
                m33 = me[10],
                m34 = me[14],
                m41 = me[3],
                m42 = me[7],
                m43 = me[11],
                m44 = me[15],

                m0 = m23 * m34 * m42 - m24 * m33 * m42 + m24 * m32 * m43 - m22 * m34 * m43 - m23 * m32 * m44 + m22 * m33 * m44,
                m4 = m14 * m33 * m42 - m13 * m34 * m42 - m14 * m32 * m43 + m12 * m34 * m43 + m13 * m32 * m44 - m12 * m33 * m44,
                m8 = m13 * m24 * m42 - m14 * m23 * m42 + m14 * m22 * m43 - m12 * m24 * m43 - m13 * m22 * m44 + m12 * m23 * m44,
                m12 = m14 * m23 * m32 - m13 * m24 * m32 - m14 * m22 * m33 + m12 * m24 * m33 + m13 * m22 * m34 - m12 * m23 * m34,

                det = m11 * m0 + m21 * m4 + m31 * m8 + m41 * m12;

            det = det === 0 ? 0 : 1 / det;

            te[0] = m0 * det;
            te[4] = m4 * det;
            te[8] = m8 * det;
            te[12] = m12 * det;
            te[1] = (m24 * m33 * m41 - m23 * m34 * m41 - m24 * m31 * m43 + m21 * m34 * m43 + m23 * m31 * m44 - m21 * m33 * m44) * det;
            te[5] = (m13 * m34 * m41 - m14 * m33 * m41 + m14 * m31 * m43 - m11 * m34 * m43 - m13 * m31 * m44 + m11 * m33 * m44) * det;
            te[9] = (m14 * m23 * m41 - m13 * m24 * m41 - m14 * m21 * m43 + m11 * m24 * m43 + m13 * m21 * m44 - m11 * m23 * m44) * det;
            te[13] = (m13 * m24 * m31 - m14 * m23 * m31 + m14 * m21 * m33 - m11 * m24 * m33 - m13 * m21 * m34 + m11 * m23 * m34) * det;
            te[2] = (m22 * m34 * m41 - m24 * m32 * m41 + m24 * m31 * m42 - m21 * m34 * m42 - m22 * m31 * m44 + m21 * m32 * m44) * det;
            te[6] = (m14 * m32 * m41 - m12 * m34 * m41 - m14 * m31 * m42 + m11 * m34 * m42 + m12 * m31 * m44 - m11 * m32 * m44) * det;
            te[10] = (m12 * m24 * m41 - m14 * m22 * m41 + m14 * m21 * m42 - m11 * m24 * m42 - m12 * m21 * m44 + m11 * m22 * m44) * det;
            te[14] = (m14 * m22 * m31 - m12 * m24 * m31 - m14 * m21 * m32 + m11 * m24 * m32 + m12 * m21 * m34 - m11 * m22 * m34) * det;
            te[3] = (m23 * m32 * m41 - m22 * m33 * m41 - m23 * m31 * m42 + m21 * m33 * m42 + m22 * m31 * m43 - m21 * m32 * m43) * det;
            te[7] = (m12 * m33 * m41 - m13 * m32 * m41 + m13 * m31 * m42 - m11 * m33 * m42 - m12 * m31 * m43 + m11 * m32 * m43) * det;
            te[11] = (m13 * m22 * m41 - m12 * m23 * m41 - m13 * m21 * m42 + m11 * m23 * m42 + m12 * m21 * m43 - m11 * m22 * m43) * det;
            te[15] = (m12 * m23 * m31 - m13 * m22 * m31 + m13 * m21 * m32 - m11 * m23 * m32 - m12 * m21 * m33 + m11 * m22 * m33) * det;

            return this;
        };

        /**
         * @method transpose
         * @memberof Mat4
         * @brief transposes this matrix
         * @return this
         */
        Mat4.prototype.transpose = function() {
            var te = this.elements,
                tmp;

            tmp = te[1];
            te[1] = te[4];
            te[4] = tmp;
            tmp = te[2];
            te[2] = te[8];
            te[8] = tmp;
            tmp = te[6];
            te[6] = te[9];
            te[9] = tmp;

            tmp = te[3];
            te[3] = te[12];
            te[12] = tmp;
            tmp = te[7];
            te[7] = te[13];
            te[13] = tmp;
            tmp = te[11];
            te[11] = te[14];
            te[14] = tmp;

            return this;
        };

        /**
         * @method setTrace
         * @memberof Mat4
         * @brief sets the diagonal of matrix
         * @param Vec4 v
         * @return this
         */
        Mat4.prototype.setTrace = function(v) {
            var te = this.elements,
                w = v.w;

            te[0] = v.x;
            te[5] = v.y;
            te[10] = v.z;
            te[15] = w !== undefined ? w : 1;

            return this;
        };

        /**
         * @method lookAt
         * @memberof Mat4
         * @brief makes matrix look from eye at target along up vector
         * @param Vec3 eye
         * @param Vec3 target
         * @param Vec3 up
         * @return this
         */
        Mat4.prototype.lookAt = function() {
            var dup = new Vec3(0, 0, 1),
                x = new Vec3,
                y = new Vec3,
                z = new Vec3;

            return function(eye, target, up) {
                var te = this.elements;

                up = up || dup;

                z.vsub(target, eye).normalize();
                x.vcross(up, z).normalize();
                y.vcross(z, x);

                te[0] = x.x;
                te[4] = y.x;
                te[8] = z.x;
                te[1] = x.y;
                te[5] = y.y;
                te[9] = z.y;
                te[2] = x.z;
                te[6] = y.z;
                te[10] = z.z;

                return this;
            };
        }();

        /**
         * @method compose
         * @memberof Mat4
         * @brief sets matrix from position, scale, and quaternion
         * @param Vec3 position
         * @param Vec3 scale
         * @param Quat rotation
         * @return this
         */
        Mat4.prototype.compose = function(position, scale, rotation) {
            var te = this.elements,
                x = rotation.x,
                y = rotation.y,
                z = rotation.z,
                w = rotation.w,
                x2 = x + x,
                y2 = y + y,
                z2 = z + z,
                xx = x * x2,
                xy = x * y2,
                xz = x * z2,
                yy = y * y2,
                yz = y * z2,
                zz = z * z2,
                wx = w * x2,
                wy = w * y2,
                wz = w * z2,

                sx = scale.x,
                sy = scale.y,
                sz = scale.z;

            te[0] = (1 - (yy + zz)) * sx;
            te[4] = (xy - wz) * sy;
            te[8] = (xz + wy) * sz;

            te[1] = (xy + wz) * sx;
            te[5] = (1 - (xx + zz)) * sy;
            te[9] = (yz - wx) * sz;

            te[2] = (xz - wy) * sx;
            te[6] = (yz + wx) * sy;
            te[10] = (1 - (xx + yy)) * sz;

            te[3] = 0;
            te[7] = 0;
            te[11] = 0;

            te[12] = position.x;
            te[13] = position.y;
            te[14] = position.z;
            te[15] = 1;

            return this;
        };

        /**
         * @method decompose
         * @memberof Mat4
         * @brief gets matrix position, scale, quaternion
         * @param Vec3 position
         * @param Vec3 scale
         * @param Quat quaternion
         * @return this
         */
        Mat4.prototype.decompose = function(position, scale, quaternion) {
            var te = this.elements,

                m11 = te[0],
                m12 = te[4],
                m13 = te[8],
                m21 = te[1],
                m22 = te[5],
                m23 = te[9],
                m31 = te[2],
                m32 = te[6],
                m33 = te[10],
                trace, x = 0,
                y = 0,
                z = 0,
                w = 1,
                s,

                sx = scale.set(m11, m21, m31).length(),
                sy = scale.set(m12, m22, m32).length(),
                sz = scale.set(m13, m23, m33).length(),

                invSx = 1 / sx,
                invSy = 1 / sy,
                invSz = 1 / sz;

            scale.x = sx;
            scale.y = sy;
            scale.z = sz;

            position.x = te[12];
            position.y = te[13];
            position.z = te[14];

            m11 *= invSx;
            m12 *= invSy;
            m13 *= invSz;
            m21 *= invSx;
            m22 *= invSy;
            m23 *= invSz;
            m31 *= invSx;
            m32 *= invSy;
            m33 *= invSz;

            trace = m11 + m22 + m33;

            if (trace > 0) {
                s = 0.5 / sqrt(trace + 1.0);

                w = 0.25 / s;
                x = (m32 - m23) * s;
                y = (m13 - m31) * s;
                z = (m21 - m12) * s;
            } else if (m11 > m22 && m11 > m33) {
                s = 2.0 * sqrt(1.0 + m11 - m22 - m33);

                w = (m32 - m23) / s;
                x = 0.25 * s;
                y = (m12 + m21) / s;
                z = (m13 + m31) / s;
            } else if (m22 > m33) {
                s = 2.0 * sqrt(1.0 + m22 - m11 - m33);

                w = (m13 - m31) / s;
                x = (m12 + m21) / s;
                y = 0.25 * s;
                z = (m23 + m32) / s;
            } else {
                s = 2.0 * sqrt(1.0 + m33 - m11 - m22);

                w = (m21 - m12) / s;
                x = (m13 + m31) / s;
                y = (m23 + m32) / s;
                z = 0.25 * s;
            }

            quaternion.x = x;
            quaternion.y = y;
            quaternion.w = w;
            quaternion.z = z;

            return this;
        };

        /**
         * @method setPosition
         * @memberof Mat4
         * @brief sets position of matrix
         * @param Vec3 v
         * @return this
         */
        Mat4.prototype.setPosition = function(v) {
            var te = this.elements,
                z = v.z;

            te[12] = v.x;
            te[13] = v.y;
            te[14] = z !== undefined ? z : 0;

            return this;
        };

        /**
         * @method extractPosition
         * @memberof Mat4
         * @brief gets position from other saves it in this
         * @param Mat4 other
         * @return this
         */
        Mat4.prototype.extractPosition = function(other) {
            var te = this.elements,
                me = other.elements;

            te[12] = me[12];
            te[13] = me[13];
            te[14] = me[14];

            return this;
        };

        /**
         * @method extractRotation
         * @memberof Mat4
         * @brief gets rotation from other saves it in this
         * @param Mat4 other
         * @return this
         */
        Mat4.prototype.extractRotation = function() {
            var vec = new Vec3();

            return function(other) {
                var te = this.elements,
                    me = other.elements,

                    lx = vec.set(me[0], me[1], me[2]).lengthSq(),
                    ly = vec.set(me[4], me[5], me[6]).lengthSq(),
                    lz = vec.set(me[8], me[9], me[10]).lengthSq(),

                    scaleX = lx > 0 ? 1 / sqrt(lx) : 0,
                    scaleY = ly > 0 ? 1 / sqrt(ly) : 0,
                    scaleZ = lz > 0 ? 1 / sqrt(lz) : 0;

                te[0] = me[0] * scaleX;
                te[1] = me[1] * scaleX;
                te[2] = me[2] * scaleX;

                te[4] = me[4] * scaleY;
                te[5] = me[5] * scaleY;
                te[6] = me[6] * scaleY;

                te[8] = me[8] * scaleZ;
                te[9] = me[9] * scaleZ;
                te[10] = me[10] * scaleZ;

                return this;
            };
        }();

        /**
         * @method extractRotationScale
         * @memberof Mat4
         * @brief gets rotation with scale from other saves it in this
         * @param Mat4 other
         * @return this
         */
        Mat4.prototype.extractRotationScale = function() {
            var vec = new Vec3();

            return function(other) {
                var te = this.elements,
                    me = other.elements

                    te[0] = me[0];
                te[1] = me[1];
                te[2] = me[2];

                te[4] = me[4];
                te[5] = me[5];
                te[6] = me[6];

                te[8] = me[8];
                te[9] = me[9];
                te[10] = me[10];

                return this;
            };
        }();

        /**
         * @method translate
         * @memberof Mat4
         * @brief translates matrix by vector
         * @param Vec3 v
         * @return this
         */
        Mat4.prototype.translate = function(v) {
            var te = this.elements,
                x = v.x,
                y = v.y,
                z = v.z || 0;

            te[12] = te[0] * x + te[4] * y + te[8] * z + te[12];
            te[13] = te[1] * x + te[5] * y + te[9] * z + te[13];
            te[14] = te[2] * x + te[6] * y + te[10] * z + te[14];
            te[15] = te[3] * x + te[7] * y + te[11] * z + te[15];

            return this;
        };

        /**
         * @method scale
         * @memberof Mat4
         * @brief scales matrix by vector
         * @param Vec3 v
         * @return this
         */
        Mat4.prototype.scale = function(v) {
            var te = this.elements,
                x = v.x,
                y = v.y,
                z = v.z;

            te[0] *= x;
            te[4] *= y;
            te[8] *= z;
            te[1] *= x;
            te[5] *= y;
            te[9] *= z;
            te[2] *= x;
            te[6] *= y;
            te[10] *= z;
            te[3] *= x;
            te[7] *= y;
            te[11] *= z;

            return this;
        };

        /**
         * @method rotateX
         * @memberof Mat4
         * @brief rotates matrix along x axis by angle
         * @param Number angle
         * @return this
         */
        Mat4.prototype.rotateX = function(angle) {
            var te = this.elements,
                m12 = te[4],
                m22 = te[5],
                m32 = te[6],
                m42 = te[7],
                m13 = te[8],
                m23 = te[9],
                m33 = te[10],
                m43 = te[11],
                c = cos(angle),
                s = sin(angle);

            te[4] = c * m12 + s * m13;
            te[5] = c * m22 + s * m23;
            te[6] = c * m32 + s * m33;
            te[7] = c * m42 + s * m43;

            te[8] = c * m13 - s * m12;
            te[9] = c * m23 - s * m22;
            te[10] = c * m33 - s * m32;
            te[11] = c * m43 - s * m42;

            return this;
        };

        /**
         * @method rotateY
         * @memberof Mat4
         * @brief rotates matrix along y axis by angle
         * @param Number angle
         * @return this
         */
        Mat4.prototype.rotateY = function(angle) {
            var te = this.elements,
                m11 = te[0],
                m21 = te[1],
                m31 = te[2],
                m41 = te[3],
                m13 = te[8],
                m23 = te[9],
                m33 = te[10],
                m43 = te[11],
                c = cos(angle),
                s = sin(angle);

            te[0] = c * m11 - s * m13;
            te[1] = c * m21 - s * m23;
            te[2] = c * m31 - s * m33;
            te[3] = c * m41 - s * m43;

            te[8] = c * m13 + s * m11;
            te[9] = c * m23 + s * m21;
            te[10] = c * m33 + s * m31;
            te[11] = c * m43 + s * m41;

            return this;
        };

        /**
         * @method rotateZ
         * @memberof Mat4
         * @brief rotates matrix along z axis by angle
         * @param Number angle
         * @return this
         */
        Mat4.prototype.rotateZ = function(angle) {
            var te = this.elements,
                m11 = te[0],
                m21 = te[1],
                m31 = te[2],
                m41 = te[3],
                m12 = te[4],
                m22 = te[5],
                m32 = te[6],
                m42 = te[7],
                c = cos(angle),
                s = sin(angle);

            te[0] = c * m11 + s * m12;
            te[1] = c * m21 + s * m22;
            te[2] = c * m31 + s * m32;
            te[3] = c * m41 + s * m42;

            te[4] = c * m12 - s * m11;
            te[5] = c * m22 - s * m21;
            te[6] = c * m32 - s * m31;
            te[7] = c * m42 - s * m41;

            return this;
        };

        /**
         * @method makeTranslation
         * @memberof Mat4
         * @brief makes this a translation matrix
         * @param Number x
         * @param Number y
         * @param Number z
         * @return this
         */
        Mat4.prototype.makeTranslation = function(x, y, z) {

            return this.set(
                1, 0, 0, x,
                0, 1, 0, y,
                0, 0, 1, z,
                0, 0, 0, 1
            );
        };

        /**
         * @method makeScale
         * @memberof Mat4
         * @brief makes this a scale matrix
         * @param Number x
         * @param Number y
         * @param Number z
         * @return this
         */
        Mat4.prototype.makeScale = function(x, y, z) {

            return this.set(
                x, 0, 0, 0,
                0, y, 0, 0,
                0, 0, z, 0,
                0, 0, 0, 1
            );
        };

        /**
         * @method makeRotationX
         * @memberof Mat4
         * @brief makes this a rotation matrix along x axis
         * @param Number angle
         * @return this
         */
        Mat4.prototype.makeRotationX = function(angle) {
            var c = cos(angle),
                s = sin(angle);

            return this.set(
                1, 0, 0, 0,
                0, c, -s, 0,
                0, s, c, 0,
                0, 0, 0, 1
            );
        };

        /**
         * @method makeRotationY
         * @memberof Mat4
         * @brief makes this a rotation matrix along y axis
         * @param Number angle
         * @return this
         */
        Mat4.prototype.makeRotationY = function(angle) {
            var c = cos(angle),
                s = sin(angle);

            return this.set(
                c, 0, s, 0,
                0, 1, 0, 0, -s, 0, c, 0,
                0, 0, 0, 1
            );
        };

        /**
         * @method makeRotationZ
         * @memberof Mat4
         * @brief makes this a rotation matrix along z axis
         * @param Number angle
         * @return this
         */
        Mat4.prototype.makeRotationZ = function(angle) {
            var c = cos(angle),
                s = sin(angle);

            return this.set(
                c, -s, 0, 0,
                s, c, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            );
        };

        /**
         * @method frustum
         * @memberof Mat4
         * @brief makes frustum matrix
         * @param Number left
         * @param Number right
         * @param Number bottom
         * @param Number top
         * @param Number near
         * @param Number far
         * @return this
         */
        Mat4.prototype.frustum = function(left, right, bottom, top, near, far) {
            var te = this.elements,
                rl = 1 / (right - left),
                tb = 1 / (top - bottom),
                nf = 1 / (near - far);

            te[0] = (near * 2) * rl;
            te[1] = 0;
            te[2] = 0;
            te[3] = 0;
            te[4] = 0;
            te[5] = (near * 2) * tb;
            te[6] = 0;
            te[7] = 0;
            te[8] = (right + left) * rl;
            te[9] = (top + bottom) * tb;
            te[10] = (far + near) * nf;
            te[11] = -1;
            te[12] = 0;
            te[13] = 0;
            te[14] = (far * near * 2) * nf;
            te[15] = 0;

            return this;
        };

        /**
         * @method perspective
         * @memberof Mat4
         * @brief makes perspective matrix
         * @param Number fov
         * @param Number aspect
         * @param Number near
         * @param Number far
         * @return this
         */
        Mat4.prototype.perspective = function(fov, aspect, near, far) {
            var te = this.elements,
                f = 1 / tan(degsToRads(fov * 0.5)),
                nf = 1 / (near - far);

            te[0] = f / aspect;
            te[1] = 0;
            te[2] = 0;
            te[3] = 0;
            te[4] = 0;
            te[5] = f;
            te[6] = 0;
            te[7] = 0;
            te[8] = 0;
            te[9] = 0;
            te[10] = (far + near) * nf;
            te[11] = -1;
            te[12] = 0;
            te[13] = 0;
            te[14] = (2 * far * near) * nf;
            te[15] = 0;

            return this;
        };

        /**
         * @method orthographic
         * @memberof Mat4
         * @brief makes orthographic matrix
         * @param Number left
         * @param Number right
         * @param Number bottom
         * @param Number top
         * @param Number near
         * @param Number far
         * @return this
         */
        Mat4.prototype.orthographic = function(left, right, bottom, top, near, far) {
            var te = this.elements,
                lr = 1 / (left - right),
                bt = 1 / (bottom - top),
                nf = 1 / (near - far);

            te[0] = -2 * lr;
            te[1] = 0;
            te[2] = 0;
            te[3] = 0;
            te[4] = 0;
            te[5] = -2 * bt;
            te[6] = 0;
            te[7] = 0
            te[8] = 0;
            te[9] = 0;
            te[10] = 2 * nf;
            te[11] = 0;
            te[12] = (left + right) * lr;
            te[13] = (top + bottom) * bt;
            te[14] = (far + near) * nf;
            te[15] = 1;

            return this;
        };

        /**
         * @method fromMat2
         * @memberof Mat4
         * @brief sets this from Mat2
         * @param Mat2 m
         * @return this
         */
        Mat4.prototype.fromMat2 = function(m) {
            var te = this.elements,
                me = m.elements;

            te[0] = me[0];
            te[1] = me[1];
            te[2] = 0;
            te[3] = 0;
            te[4] = me[2];
            te[5] = me[3];
            te[6] = 0;
            te[7] = 0;
            te[8] = 0;
            te[9] = 0;
            te[10] = 1;
            te[11] = 0;
            te[12] = 0;
            te[13] = 0;
            te[14] = 0;
            te[15] = 1;

            return this;
        };

        /**
         * @method fromMat32
         * @memberof Mat4
         * @brief sets this from Mat32
         * @param Mat32 m
         * @return this
         */
        Mat4.prototype.fromMat32 = function(m) {
            var te = this.elements,
                me = m.elements;

            te[0] = me[0];
            te[1] = me[1];
            te[2] = 0;
            te[3] = 0;
            te[4] = me[2];
            te[5] = me[3];
            te[6] = 0;
            te[7] = 0;
            te[8] = 0;
            te[9] = 0;
            te[10] = 1;
            te[11] = 0;
            te[12] = me[4];
            te[13] = me[5];
            te[14] = 0;
            te[15] = 1;

            return this;
        };

        /**
         * @method fromMat3
         * @memberof Mat4
         * @brief sets this from Mat3
         * @param Mat3 m
         * @return this
         */
        Mat4.prototype.fromMat3 = function(m) {
            var te = this.elements,
                me = m.elements;

            te[0] = me[0];
            te[1] = me[1];
            te[2] = me[2];
            te[3] = 0;
            te[4] = me[3];
            te[5] = me[4];
            te[6] = me[5];
            te[7] = 0;
            te[8] = me[6];
            te[9] = me[7];
            te[10] = me[8];
            te[11] = 0;
            te[12] = 0;
            te[13] = 0;
            te[14] = 0;
            te[15] = 1;

            return this;
        };

        /**
         * @method fromQuat
         * @memberof Mat4
         * @brief sets rotation of this from quaterian
         * @param Quat q
         * @return this
         */
        Mat4.prototype.fromQuat = function(q) {
            var te = this.elements,
                x = q.x,
                y = q.y,
                z = q.z,
                w = q.w,
                x2 = x + x,
                y2 = y + y,
                z2 = z + z,
                xx = x * x2,
                xy = x * y2,
                xz = x * z2,
                yy = y * y2,
                yz = y * z2,
                zz = z * z2,
                wx = w * x2,
                wy = w * y2,
                wz = w * z2;

            te[0] = 1 - (yy + zz);
            te[4] = xy - wz;
            te[8] = xz + wy;

            te[1] = xy + wz;
            te[5] = 1 - (xx + zz);
            te[9] = yz - wx;

            te[2] = xz - wy;
            te[6] = yz + wx;
            te[10] = 1 - (xx + yy);

            te[3] = 0;
            te[7] = 0;
            te[11] = 0;

            te[12] = 0;
            te[13] = 0;
            te[14] = 0;
            te[15] = 1;

            return this;
        };

        /**
         * @method fromJSON
         * @memberof Mat4
         * @brief sets values from JSON object
         * @param Object json
         * @return this
         */
        Mat4.prototype.fromJSON = function(json) {
            var te = this.elements,
                me = json.elements;

            te[0] = me[0];
            te[1] = me[1];
            te[2] = me[2];
            te[3] = me[3];
            te[4] = me[4];
            te[5] = me[5];
            te[6] = me[6];
            te[7] = me[7];
            te[8] = me[8];
            te[9] = me[9];
            te[10] = me[10];
            te[11] = me[11];
            te[12] = me[12];
            te[13] = me[13];
            te[14] = me[14];
            te[15] = me[15];

            return this;
        };

        /**
         * @method toJSON
         * @memberof Mat4
         * @brief returns json object of this
         * @return Object
         */
        Mat4.prototype.toJSON = function() {
            json || (json = {});
            var te = this.elements,
                je = json.elements || (json.elements = []);
            
            je[0] = te[0];
            je[1] = te[1];
            je[2] = te[2];
            je[3] = te[3];
            je[4] = te[4];
            je[5] = te[5];
            je[6] = te[6];
            je[7] = te[7];
            je[8] = te[8];
            
            return json;
        };

        /**
         * @method toString
         * @memberof Mat4
         * @brief returns string of this
         * @return String
         */
        Mat4.prototype.toString = function() {
            var te = this.elements;

            return (
                "Mat4[" + te[0] + ", " + te[4] + ", " + te[8] + ", " + te[12] + "]\n" +
                "     [" + te[1] + ", " + te[5] + ", " + te[9] + ", " + te[13] + "]\n" +
                "     [" + te[2] + ", " + te[6] + ", " + te[10] + ", " + te[14] + "]\n" +
                "     [" + te[3] + ", " + te[7] + ", " + te[11] + ", " + te[15] + "]"
            );
        };


        return Mat4;
    }
);
