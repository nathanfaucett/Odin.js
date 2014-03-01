if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/math/mathf"
    ],
    function(Mathf) {
        "use strict";


        var cos = Math.cos,
            sin = Math.sin,
            atan2 = Math.atan2;

        /**
         * @class Mat2
         * 2x2 matrix
         * @param Number m11
         * @param Number m12
         * @param Number m21
         * @param Number m22
         */
        function Mat2(m11, m12, m21, m22) {
            var te = new Float32Array(4);

            /**
             * @property Float32Array elements
             * @memberof Odin.Mat2
             */
            this.elements = te;

            te[0] = m11 !== undefined ? m11 : 1.0;
            te[2] = m12 || 0.0;
            te[1] = m21 || 0.0;
            te[3] = m22 !== undefined ? m22 : 1.0;
        }

        Mathf._classes["Mat2"] = Mat2;

        /**
         * @method clone
         * @memberof Odin.Mat2
         * returns new instance of this
         * @return Mat2
         */
        Mat2.prototype.clone = function() {
            var te = this.elements;

            return new Mat2(
                te[0], te[1],
                te[2], te[3]
            );
        };

        /**
         * @method copy
         * @memberof Odin.Mat2
         * copies other
         * @param Mat2 other
         * @return this
         */
        Mat2.prototype.copy = function(other) {
            var te = this.elements,
                me = other.elements;

            te[0] = me[0];
            te[1] = me[1];
            te[2] = me[2];
            te[3] = me[3];

            return this;
        };

        /**
         * @method set
         * @memberof Odin.Mat2
         * sets values of this
         * @param Number m11
         * @param Number m12
         * @param Number m21
         * @param Number m22
         * @return this
         */
        Mat2.prototype.set = function(m11, m12, m21, m22) {
            var te = this.elements;

            te[0] = m11;
            te[2] = m12;
            te[1] = m21;
            te[3] = m22;

            return this;
        };

        /**
         * @method mul
         * @memberof Odin.Mat2
         * muliples this's values by other's
         * @param Mat2 other
         * @return this
         */
        Mat2.prototype.mul = function(other) {
            var ae = this.elements,
                be = other.elements,

                a11 = ae[0],
                a12 = ae[2],
                a21 = ae[1],
                a22 = ae[3],

                b11 = be[0],
                b12 = be[2],
                b21 = be[1],
                b22 = be[3];

            ae[0] = a11 * b11 + a21 * b12;
            ae[1] = a12 * b11 + a22 * b12;

            ae[2] = a11 * b21 + a21 * b22;
            ae[3] = a12 * b21 + a22 * b22;

            return this;
        };

        /**
         * @method mmul
         * @memberof Odin.Mat2
         * muliples a and b saves it in this
         * @param Mat2 a
         * @param Mat2 b
         * @return this
         */
        Mat2.prototype.mmul = function(a, b) {
            var te = this.elements,
                ae = a.elements,
                be = b.elements,

                a11 = ae[0],
                a12 = ae[2],
                a21 = ae[1],
                a22 = ae[3],

                b11 = be[0],
                b12 = be[2],
                b21 = be[1],
                b22 = be[3];

            te[0] = a11 * b11 + a21 * b12;
            te[1] = a12 * b11 + a22 * b12;

            te[2] = a11 * b21 + a21 * b22;
            te[3] = a12 * b21 + a22 * b22;

            return this;
        };

        /**
         * @method smul
         * @memberof Odin.Mat2
         * muliples this by a scalar value
         * @param Number s
         * @return this
         */
        Mat2.prototype.smul = function(s) {
            var te = this.elements;

            te[0] *= s;
            te[1] *= s;
            te[2] *= s;
            te[3] *= s;

            return this;
        };

        /**
         * @method sdiv
         * @memberof Odin.Mat2
         * divides this by scalar value
         * @param Number s
         * @return this
         */
        Mat2.prototype.sdiv = function(s) {
            var te = this.elements;

            s = s !== 0.0 ? 1.0 / s : 1.0;

            te[0] *= s;
            te[1] *= s;
            te[2] *= s;
            te[3] *= s;

            return this;
        };

        /**
         * @method identity
         * @memberof Odin.Mat2
         * identity matrix
         * @return this
         */
        Mat2.prototype.identity = function() {
            var te = this.elements;

            te[0] = 1;
            te[1] = 0.0;
            te[2] = 0.0;
            te[3] = 1;

            return this;
        };

        /**
         * @method zero
         * @memberof Odin.Mat2
         * zero matrix
         * @return this
         */
        Mat2.prototype.zero = function() {
            var te = this.elements;

            te[0] = 0.0;
            te[1] = 0.0;
            te[2] = 0.0;
            te[3] = 0.0;

            return this;
        };

        /**
         * @method determinant
         * @memberof Odin.Mat2
         * returns the determinant of this
         * @return this
         */
        Mat2.prototype.determinant = function() {
            var te = this.elements;

            return te[0] * te[3] - te[2] * te[1];
        };

        /**
         * @method inverse
         * @memberof Odin.Mat2
         * returns the inverse of this
         * @return this
         */
        Mat2.prototype.inverse = function() {
            var te = this.elements,

                m11 = te[0],
                m12 = te[2],
                m21 = te[1],
                m22 = te[3],

                det = m11 * m22 - m12 * m21;

            det = det === 0.0 ? 0.0 : 1.0 / det;

            te[0] = m22 * det;
            te[1] = -m12 * det;
            te[2] = -m21 * det;
            te[3] = m11 * det;

            return this;
        };

        /**
         * @method inverseMat
         * @memberof Odin.Mat2
         * returns the inverse of other
         * @param Mat2 other
         * @return this
         */
        Mat2.prototype.inverseMat = function(other) {
            var te = this.elements,
                me = other.elements,

                m11 = me[0],
                m12 = me[2],
                m21 = me[1],
                m22 = me[3],

                det = m11 * m22 - m12 * m21;

            det = det === 0.0 ? 0.0 : 1.0 / det;

            te[0] = m22 * det;
            te[1] = -m12 * det;
            te[2] = -m21 * det;
            te[3] = m11 * det;

            return this;
        };

        /**
         * @method transpose
         * @memberof Odin.Mat2
         * transposes this matrix
         * @return this
         */
        Mat2.prototype.transpose = function() {
            var te = this.elements,
                tmp;

            tmp = te[1];
            te[1] = te[2];
            te[2] = tmp;

            return this;
        };

        /**
         * @method setTrace
         * @memberof Odin.Mat2
         * sets the diagonal of matrix
         * @param Number x
         * @param Number y
         * @return this
         */
        Mat2.prototype.setTrace = function(x, y) {
            var te = this.elements;

            te[0] = x;
            te[3] = y;

            return this;
        };

        /**
         * @method setRotation
         * @memberof Odin.Mat2
         * sets the rotation in radians this
         * @param Number angle
         * @return this
         */
        Mat2.prototype.setRotation = function(angle) {
            var te = this.elements,
                c = cos(angle),
                s = sin(angle);

            te[0] = c;
            te[1] = s;
            te[2] = -s;
            te[3] = c;

            return this;
        };

        /**
         * @method getRotation
         * @memberof Odin.Mat2
         * returns the rotation in radians of this
         * @return Number
         */
        Mat2.prototype.getRotation = function() {
            var te = this.elements;

            return atan2(te[1], te[0]);
        };

        /**
         * @method rotate
         * @memberof Odin.Mat2
         * rotates this by angle in radians
         * @param Number angle
         * @return this
         */
        Mat2.prototype.rotate = function(angle) {
            var te = this.elements,

                m11 = te[0],
                m12 = te[2],
                m21 = te[1],
                m22 = te[3],

                s = sin(angle),
                c = sin(angle);

            te[0] = m11 * c + m12 * s;
            te[1] = m11 * -s + m12 * c;
            te[2] = m21 * c + m22 * s;
            te[3] = m21 * -s + m22 * c;

            return this;
        };

        /**
         * @method fromMat3
         * @memberof Odin.Mat2
         * sets this from Mat3
         * @param Mat3 m
         * @return this
         */
        Mat2.prototype.fromMat3 = function(m) {
            var te = this.elements,
                me = m.elements;

            te[0] = me[0];
            te[1] = me[1];
            te[2] = me[3];
            te[3] = me[4];

            return this;
        };

        /**
         * @method fromMat4
         * @memberof Odin.Mat2
         * sets this from Mat4
         * @param Mat4 m
         * @return this
         */
        Mat2.prototype.fromMat4 = function(m) {
            var te = this.elements,
                me = m.elements;

            te[0] = me[0];
            te[1] = me[1];
            te[2] = me[4];
            te[3] = me[5];

            return this;
        };

        /**
         * @memberof Odin.Mat2
         * @param Odin.Mat2 other
         * @return this
         */
        Mat2.prototype.equals = function(other) {
            var ae = this.elements,
                be = other.elements;

            return !(
                ae[0] !== be[0] ||
                ae[1] !== be[1] ||
                ae[2] !== be[2] ||
                ae[3] !== be[3]
            );
        };

        /**
         * @memberof Odin.Mat2
         * @param Odin.Mat2 other
         * @return this
         */
        Mat2.prototype.notEquals = function(other) {
            var ae = this.elements,
                be = other.elements;

            return (
                ae[0] !== be[0] ||
                ae[1] !== be[1] ||
                ae[2] !== be[2] ||
                ae[3] !== be[3]
            );
        };

        /**
         * @method fromJSON
         * @memberof Odin.Mat2
         * sets values from JSON object
         * @param Object json
         * @return this
         */
        Mat2.prototype.fromJSON = function(json) {
            var te = this.elements,
                me = json.elements;

            te[0] = me[0];
            te[1] = me[1];
            te[2] = me[2];
            te[3] = me[3];

            return this;
        };

        /**
         * @method toJSON
         * @memberof Odin.Mat2
         * returns json object of this
         * @return Object
         */
        Mat2.prototype.toJSON = function(json) {
            json || (json = {});
            var te = this.elements,
                je = json.elements || (json.elements = []);

            json._className = "Mat2";
            je[0] = te[0];
            je[1] = te[1];
            je[2] = te[2];
            je[3] = te[3];

            return json;
        };

        /**
         * @method toString
         * @memberof Odin.Mat2
         * returns string of this
         * @return String
         */
        Mat2.prototype.toString = function() {
            var te = this.elements;

            return (
                "Mat2[ " + te[0] + ", " + te[2] + "]\n" +
                "     [ " + te[1] + ", " + te[3] + "]"
            );
        };


        return Mat2;
    }
);
