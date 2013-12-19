if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(
    function() {
        "use strict";


        var sqrt = Math.sqrt,
            cos = Math.cos,
            sin = Math.sin,
            atan2 = Math.atan2;

        /**
         * @class Mat32
         * @brief 3x2 matrix
         * @param Number m11
         * @param Number m12
         * @param Number m13
         * @param Number m21
         * @param Number m22
         * @param Number m23
         */
        function Mat32(m11, m12, m13, m21, m22, m23) {
            var te = new Float32Array(6);

            /**
             * @property Float32Array elements
             * @memberof Mat32
             */
            this.elements = te;

            te[0] = m11 !== undefined ? m11 : 1;
            te[2] = m12 || 0;
            te[4] = m13 || 0;
            te[1] = m21 || 0;
            te[3] = m22 !== undefined ? m22 : 1;
            te[5] = m23 || 0;
        }

        /**
         * @method clone
         * @memberof Mat32
         * @brief returns new instance of this
         * @return Mat32
         */
        Mat32.prototype.clone = function() {
            var te = this.elements;

            return new Mat32(
                te[0], te[1], te[2],
                te[3], te[4], te[5]
            );
        };

        /**
         * @method copy
         * @memberof Mat32
         * @brief copies other
         * @param Mat32 other
         * @return this
         */
        Mat32.prototype.copy = function(other) {
            var te = this.elements,
                me = other.elements;

            te[0] = me[0];
            te[1] = me[1];
            te[2] = me[2];
            te[3] = me[3];
            te[4] = me[4];
            te[5] = me[5];

            return this;
        };

        /**
         * @method set
         * @memberof Mat32
         * @brief sets values of this
         * @param Number m11
         * @param Number m12
         * @param Number m13
         * @param Number m21
         * @param Number m22
         * @param Number m23
         * @return this
         */
        Mat32.prototype.set = function(m11, m12, m13, m21, m22, m23) {
            var te = this.elements;

            te[0] = m11;
            te[2] = m12;
            te[4] = m13;
            te[1] = m21;
            te[3] = m22;
            te[5] = m23;

            return this;
        };

        /**
         * @method mul
         * @memberof Mat32
         * @brief muliples this's values by other's
         * @param Mat32 other
         * @return this
         */
        Mat32.prototype.mul = function(other) {
            var ae = this.elements,
                be = other.elements,

                a11 = ae[0],
                a12 = ae[2],
                a13 = ae[4],
                a21 = ae[1],
                a22 = ae[3],
                a23 = ae[5],

                b11 = be[0],
                b12 = be[2],
                b13 = be[4],
                b21 = be[1],
                b22 = be[3],
                b23 = be[5];

            ae[0] = a11 * b11 + a21 * b12;
            ae[2] = a12 * b11 + a22 * b12;

            ae[1] = a11 * b21 + a21 * b22;
            ae[3] = a12 * b21 + a22 * b22;

            ae[4] = a11 * b13 + a12 * b23 + a13;
            ae[5] = a21 * b13 + a22 * b23 + a23;

            return this;
        };

        /**
         * @method mmul
         * @memberof Mat32
         * @brief muliples a and b saves it in this
         * @param Mat32 a
         * @param Mat32 b
         * @return this
         */
        Mat32.prototype.mmul = function(a, b) {
            var te = this.elements,
                ae = a.elements,
                be = b.elements,

                a11 = ae[0],
                a12 = ae[2],
                a13 = ae[4],
                a21 = ae[1],
                a22 = ae[3],
                a23 = ae[5],

                b11 = be[0],
                b12 = be[2],
                b13 = be[4],
                b21 = be[1],
                b22 = be[3],
                b23 = be[5];

            te[0] = a11 * b11 + a21 * b12;
            te[2] = a12 * b11 + a22 * b12;

            te[1] = a11 * b21 + a21 * b22;
            te[3] = a12 * b21 + a22 * b22;

            te[4] = a11 * b13 + a12 * b23 + a13;
            te[5] = a21 * b13 + a22 * b23 + a23;

            return this;
        };

        /**
         * @method smul
         * @memberof Mat32
         * @brief muliples this by a scalar value
         * @param Number s
         * @return this
         */
        Mat32.prototype.smul = function(s) {
            var te = this.elements;

            te[0] *= s;
            te[1] *= s;
            te[2] *= s;
            te[3] *= s;
            te[4] *= s;
            te[5] *= s;

            return this;
        };

        /**
         * @method sdiv
         * @memberof Mat32
         * @brief divides this by scalar value
         * @param Number s
         * @return this
         */
        Mat32.prototype.sdiv = function(s) {
            var te = this.elements;

            s = s !== 0 ? 1 / s : 1;

            te[0] *= s;
            te[1] *= s;
            te[2] *= s;
            te[3] *= s;
            te[4] *= s;
            te[5] *= s;

            return this;
        };

        /**
         * @method identity
         * @memberof Mat32
         * @brief identity matrix
         * @return this
         */
        Mat32.prototype.identity = function() {
            var te = this.elements;

            te[0] = 1;
            te[1] = 0;
            te[2] = 0;
            te[3] = 1;
            te[4] = 0;
            te[5] = 0;

            return this;
        };

        /**
         * @method zero
         * @memberof Mat32
         * @brief zero matrix
         * @return this
         */
        Mat32.prototype.zero = function() {
            var te = this.elements;

            te[0] = 0;
            te[1] = 0;
            te[2] = 0;
            te[3] = 0;
            te[4] = 0;
            te[5] = 0;

            return this;
        };

        /**
         * @method determinant
         * @memberof Mat32
         * @brief returns the determinant of this
         * @return this
         */
        Mat32.prototype.determinant = function() {
            var te = this.elements;

            return te[0] * te[3] - te[2] * te[1];
        };

        /**
         * @method inverse
         * @memberof Mat32
         * @brief returns the inverse of this
         * @return this
         */
        Mat32.prototype.inverse = function() {
            var te = this.elements,

                m11 = te[0],
                m12 = te[2],
                m13 = te[4],
                m21 = te[1],
                m22 = te[3],
                m23 = te[5],

                det = m11 * m22 - m12 * m21;

            det = det !== 0 ? 1 / det : 0;

            te[0] = m22 * det;
            te[1] = -m12 * det;
            te[2] = -m21 * det;
            te[3] = m11 * det;

            te[4] = (m12 * m23 - m22 * m13) * det;
            te[5] = (m21 * m13 - m11 * m23) * det;

            return this;
        };

        /**
         * @method inverseMat
         * @memberof Mat32
         * @brief returns the inverse of other
         * @param Mat32 other
         * @return this
         */
        Mat32.prototype.inverseMat = function(other) {
            var te = this.elements,
                me = other.elements,

                m11 = me[0],
                m12 = me[2],
                m13 = me[4],
                m21 = me[1],
                m22 = me[3],
                m23 = me[5],

                det = m11 * m22 - m12 * m21;

            det = det !== 0 ? 1 / det : 0;

            te[0] = m22 * det;
            te[1] = -m12 * det;
            te[2] = -m21 * det;
            te[3] = m11 * det;

            te[4] = (m12 * m23 - m22 * m13) * det;
            te[5] = (m21 * m13 - m11 * m23) * det;

            return this;
        };

        /**
         * @method transpose
         * @memberof Mat32
         * @brief transposes this matrix
         * @return this
         */
        Mat32.prototype.transpose = function() {
            var te = this.elements,
                tmp;

            tmp = te[1];
            te[1] = te[2];
            te[2] = tmp;

            return this;
        };

        /**
         * @method setTrace
         * @memberof Mat32
         * @brief sets the diagonal of matrix
         * @param Number x
         * @param Number y
         * @return this
         */
        Mat32.prototype.setTrace = function(x, y) {
            var te = this.elements;

            te[0] = x;
            te[3] = y;

            return this;
        };

        /**
         * @method lookAt
         * @memberof Mat32
         * @brief makes matrix look from eye to target
         * @param Vec2 eye
         * @param Vec2 target
         * @return this
         */
        Mat32.prototype.lookAt = function(eye, target) {
            var te = this.elements,
                x = target.x - eye.x,
                y = target.y - eye.y,
                a = atan2(y, x) - HALF_PI,
                c = cos(a),
                s = sin(a);

            te[0] = c;
            te[1] = s;
            te[2] = -s;
            te[3] = c;

            return this;
        };

        /**
         * @method compose
         * @memberof Mat32
         * @brief sets matrix from position, scale, and an angle in radians
         * @param Vec2 position
         * @param Vec2 scale
         * @param Number angle
         * @return this
         */
        Mat32.prototype.compose = function(position, scale, angle) {
            var te = this.elements,
                sx = scale.x,
                sy = scale.y,
                c = cos(angle),
                s = sin(angle);

            te[0] = c * sx;
            te[1] = s * sx;
            te[2] = -s * sy;
            te[3] = c * sy;

            te[4] = position.x;
            te[5] = position.y;

            return this;
        };

        /**
         * @method decompose
         * @memberof Mat32
         * @brief gets matrix position, scale, and returns its angle in radians
         * @param Vec2 position
         * @param Vec2 scale
         * @return Number
         */
        Mat32.prototype.decompose = function(position, scale) {
            var te = this.elements,
                m11 = te[0],
                m12 = te[1],
                sx = scale.set(m11, m12).length(),
                sy = scale.set(te[2], te[3]).length();

            position.x = te[4];
            position.y = te[5];

            scale.x = sx;
            scale.y = sy;

            return atan2(m12, m11);
        };

        /**
         * @method setRotation
         * @memberof Mat32
         * @brief sets the rotation in radians this
         * @param Number angle
         * @return this
         */
        Mat32.prototype.setRotation = function(angle) {
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
         * @memberof Mat32
         * @brief returns the rotation in radians of this
         * @return Number
         */
        Mat32.prototype.getRotation = function() {
            var te = this.elements;

            return atan2(te[1], te[0]);
        };

        /**
         * @method setPosition
         * @memberof Mat32
         * @brief sets the position of this
         * @param Vec2 v
         * @return this
         */
        Mat32.prototype.setPosition = function(v) {
            var te = this.elements;

            te[4] = v.x;
            te[5] = v.y;

            return this;
        };

        /**
         * @method getPosition
         * @memberof Mat32
         * @brief gets the position of this
         * @param Vec2 v
         * @return Vec2
         */
        Mat32.prototype.getPosition = function(v) {
            var te = this.elements;

            v.x = te[4];
            v.y = te[5];

            return v;
        };

        /**
         * @method extractPosition
         * @memberof Mat32
         * @brief gets position from other saves it in this
         * @param Mat32 other
         * @return this
         */
        Mat32.prototype.extractPosition = function(other) {
            var te = this.elements,
                me = other.elements;

            te[4] = me[4];
            te[5] = me[5];

            return this;
        };

        /**
         * @method extractRotation
         * @memberof Mat32
         * @brief gets rotation from other saves it in this
         * @param Mat32 other
         * @return this
         */
        Mat32.prototype.extractRotation = function(other) {
            var te = this.elements,
                me = other.elements,

                m11 = me[0],
                m12 = me[2],
                m21 = me[1],
                m22 = me[3],

                x = m11 * m11 + m21 * m21,
                y = m12 * m12 + m22 * m22,

                sx = x > 0 ? 1 / sqrt(x) : 0,
                sy = y > 0 ? 1 / sqrt(y) : 0;

            te[0] = m11 * sx;
            te[1] = m21 * sx;

            te[2] = m12 * sy;
            te[3] = m22 * sy;

            return this;
        };

        /**
         * @method translate
         * @memberof Mat32
         * @brief translates matrix by vector
         * @param Vec2 v
         * @return this
         */
        Mat32.prototype.translate = function(v) {
            var te = this.elements,
                x = v.x,
                y = v.y;

            te[4] = te[0] * x + te[2] * y + te[4];
            te[5] = te[1] * x + te[3] * y + te[5];

            return this;
        };

        /**
         * @method rotate
         * @memberof Mat32
         * @brief rotates this by angle in radians
         * @param Number angle
         * @return this
         */
        Mat32.prototype.rotate = function(angle) {
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
         * @method scale
         * @memberof Mat32
         * @brief scales matrix by vector
         * @param Vec2 v
         * @return this
         */
        Mat32.prototype.scale = function(v) {
            var te = this.elements,
                x = v.x,
                y = v.y;

            te[0] *= x;
            te[1] *= x;
            te[4] *= x;

            te[2] *= y;
            te[3] *= y;
            te[5] *= y;

            return this;
        };

        /**
         * @method orthographic
         * @memberof Mat32
         * @brief makes orthographic matrix
         * @param Number left
         * @param Number right
         * @param Number bottom
         * @param Number top
         * @return Mat32
         */
        Mat32.prototype.orthographic = function(left, right, bottom, top) {
            var te = this.elements,
                w = 1 / (right - left),
                h = 1 / (top - bottom),
                x = (right + left) * w,
                y = (top + bottom) * h;

            te[0] = 2 * w;
            te[1] = 0;
            te[2] = 0;
            te[3] = 2 * h;

            te[4] = -x;
            te[5] = -y;

            return this;
        };

        /**
         * @method fromMat3
         * @memberof Mat32
         * @brief sets this from Mat3
         * @param Mat3 m
         * @return this
         */
        Mat32.prototype.fromMat3 = function(m) {
            var te = this.elements,
                me = m.elements;

            te[0] = me[0];
            te[1] = me[1];
            te[2] = me[3];
            te[3] = me[4];
            te[4] = 0;
            te[5] = 0;

            return this;
        };

        /**
         * @method fromMat4
         * @memberof Mat32
         * @brief sets this from Mat4
         * @param Mat4 m
         * @return this
         */
        Mat32.prototype.fromMat4 = function(m) {
            var te = this.elements,
                me = m.elements;

            te[0] = me[0];
            te[1] = me[1];
            te[2] = me[4];
            te[3] = me[5];
            te[4] = me[11];
            te[5] = me[12];

            return this;
        };

        /**
         * @method fromJSON
         * @memberof Mat32
         * @brief sets values from JSON object
         * @param Object json
         * @return this
         */
        Mat32.prototype.fromJSON = function(json) {
            var te = this.elements,
                me = json.elements;

            te[0] = me[0];
            te[1] = me[1];
            te[2] = me[2];
            te[3] = me[3];
            te[4] = me[4];
            te[5] = me[5];

            return this;
        };

        /**
         * @method toJSON
         * @memberof Mat32
         * @brief returns json object of this
         * @return Object
         */
        Mat32.prototype.toJSON = function() {
            json || (json = {});
            var te = this.elements,
                je = json.elements || (json.elements = []);
            
            je[0] = te[0];
            je[1] = te[1];
            je[2] = te[2];
            je[3] = te[3];
            je[4] = te[4];
            je[5] = te[5];
            
            return json;
        };

        /**
         * @method toString
         * @memberof Mat32
         * @brief returns string of this
         * @return String
         */
        Mat32.prototype.toString = function() {
            var te = this.elements;

            return (
                "Mat32[ " + te[0] + ", " + te[2] + ", " + te[4] + "]\n" +
                "     [ " + te[1] + ", " + te[3] + ", " + te[5] + "]"
            );
        };


        return Mat32;
    }
);
