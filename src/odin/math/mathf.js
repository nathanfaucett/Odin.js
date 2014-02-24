if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        var random = Math.random,
            abs = Math.abs,
            cos = Math.cos,
            pow = Math.pow,
            floor = Math.floor,
            ceil = Math.ceil,
            atan2 = Math.atan2,
            EPSILON = 0.000001,
            PI = 3.1415926535897932384626433832795028841968,
            TWO_PI = PI * 2,
            HALF_PI = PI * 0.5,
            TO_RADS = PI / 180,
            TO_DEGS = 180 / PI,
            keys = Object.keys,
            modulo, clamp01, standardRadian, standardAngle, radsToDegs;


        /**
         * @class Mathf
         * collection of common math functions
         */
        function Mathf() {

            /**
             * @property Number PI
             * The infamous 3.1415926535897932384626433832795028841968
             * @memberof Odin.Mathf
             */
            this.PI = PI;

            /**
             * @property Number TWO_PI
             * 2 * PI
             * @memberof Odin.Mathf
             */
            this.TWO_PI = TWO_PI;

            /**
             * @property Number HALF_PI
             * PI / 2
             * @memberof Odin.Mathf
             */
            this.HALF_PI = HALF_PI;

            /**
             * @property Number EPSILON
             * A small number value
             * @memberof Odin.Mathf
             */
            this.EPSILON = EPSILON;

            /**
             * @property Number TO_RADS
             * Degrees to radians conversion constant
             * @memberof Odin.Mathf
             */
            this.TO_RADS = TO_RADS;

            /**
             * @property Number TO_DEGS
             * Radians to degrees conversion constant
             * @memberof Odin.Mathf
             */
            this.TO_DEGS = TO_DEGS;


            this._classes = {};
        }


        Mathf.prototype.acos = Math.acos;
        Mathf.prototype.asin = Math.asin;
        Mathf.prototype.atan = Math.atan;
        Mathf.prototype.atan2 = Math.atan2;

        Mathf.prototype.cos = Math.cos;
        Mathf.prototype.sin = Math.sin;
        Mathf.prototype.tan = Math.tan;

        Mathf.prototype.abs = Math.abs;
        Mathf.prototype.ceil = Math.ceil;
        Mathf.prototype.exp = Math.exp;
        Mathf.prototype.floor = Math.floor;
        Mathf.prototype.log = Math.log;
        Mathf.prototype.max = Math.max;
        Mathf.prototype.min = Math.min;
        Mathf.prototype.pow = Math.pow;
        Mathf.prototype.random = Math.random;
        Mathf.prototype.round = Math.round;
        Mathf.prototype.sqrt = Math.sqrt;

        /**
         * @method equals
         * @memberof Odin.Mathf
         * returns if a = b within some value, defaults to Mathf.EPSILON
         * @param Number a
         * @param Number b
         * @param Number e
         * @return Boolean
         */
        Mathf.prototype.equals = function(a, b, e) {

            return abs(a - b) < (e || EPSILON);
        };

        /**
         * @method modulo
         * @memberof Odin.Mathf
         * returns remainder of a / b
         * @param Number a
         * @param Number b
         * @return Number
         */
        Mathf.prototype.modulo = modulo = function(a, b) {
            var r = a % b;

            return (r * b < 0) ? r + b : r;
        };

        /**
         * @method standardRadian
         * @memberof Odin.Mathf
         * convertes x to radian where 0 <= x < 2PI
         * @param Number x
         * @return Number
         */
        Mathf.prototype.standardRadian = standardRadian = function(x) {

            return modulo(x, TWO_PI);
        };

        /**
         * @method standardAngle
         * @memberof Odin.Mathf
         * convertes x to angle where 0 <= x < 360
         * @param Number x
         * @return Number
         */
        Mathf.prototype.standardAngle = standardAngle = function(x) {

            return modulo(x, 360);
        };

        /**
         * @method sign
         * @memberof Odin.Mathf
         * gets sign of x
         * @param Number x
         * @return Number
         */
        Mathf.prototype.sign = function(x) {

            return x < 0 ? -1 : 1;
        };

        /**
         * @method clamp
         * @memberof Odin.Mathf
         * clamp x between min and max
         * @param Number x
         * @param Number min
         * @param Number max
         * @return Number
         */
        Mathf.prototype.clamp = function(x, min, max) {

            return x < min ? min : x > max ? max : x;
        };

        /**
         * @method clampBottom
         * @memberof Odin.Mathf
         * clamp x between min and Infinity
         * @param Number x
         * @param Number min
         * @return Number
         */
        Mathf.prototype.clampBottom = function(x, min) {

            return x < min ? min : x;
        };

        /**
         * @method clampTop
         * @memberof Odin.Mathf
         * clamp x between -Infinity and max
         * @param Number x
         * @param Number max
         * @return Number
         */
        Mathf.prototype.clampTop = function(x, max) {

            return x > max ? max : x;
        };

        /**
         * @method clamp01
         * @memberof Odin.Mathf
         * clamp x between 0 and 1
         * @param Number x
         * @return Number
         */
        Mathf.prototype.clamp01 = clamp01 = function(x) {

            return x < 0 ? 0 : x > 1 ? 1 : x;
        };

        /**
         * @method truncate
         * @memberof Odin.Mathf
         * truncate x to have n number of decial places
         * @param Number x
         * @param Number n
         * @return Number
         */
        Mathf.prototype.truncate = function(x, n) {
            var p = pow(10, n),
                num = x * p;

            return (num < 0 ? ceil(num) : floor(num)) / p;
        };

        /**
         * @method lerp
         * @memberof Odin.Mathf
         * linear interpolation between a and b by x
         * @param Number a
         * @param Number b
         * @param Number x
         * @return Number
         */
        Mathf.prototype.lerp = function(a, b, x) {

            return a + (b - a) * x;
        };

        /**
         * @method lerpAngle
         * @memberof Odin.Mathf
         * linear interpolation between a and b by x insures 0 <= x < 2PI
         * @param Number a
         * @param Number b
         * @param Number x
         * @return Number
         */
        Mathf.prototype.lerpAngle = function(a, b, x) {

            return standardRadian(a + (b - a) * x);
        };

        /**
         * @method cosLerp
         * @memberof Odin.Mathf
         * cosine interpolation between a and b by x
         * @param Number a
         * @param Number b
         * @param Number x
         * @return Number
         */
        Mathf.prototype.lerpCos = function(a, b, x) {
            var ft = x * PI,
                f = (1 - cos(ft)) * 0.5;

            return a * (1 - f) + b * f;
        };

        /**
         * @method lerpCubic
         * @memberof Odin.Mathf
         * cubic interpolation between v1 and v2 by x
         * @param Number v0
         * @param Number v1
         * @param Number v2
         * @param Number v3
         * @param Number x
         * @return Number
         */
        Mathf.prototype.lerpCubic = function(v0, v1, v2, v3, x) {
            v0 || (v0 = v1);
            v3 || (v3 = v2);
            var P = (v3 - v2) - (v0 - v1),
                Q = (v0 - v1) - P,
                R = v2 - v0,
                S = v1,

                Px = P * x,
                Qx = Q * x,
                Rx = R * x;

            return (Px * Px * Px) + (Qx * Qx) + Rx + S;
        };

        /**
         * smooth step, if input is between min and max this returns a value proportionately between 0 and 1
         * @method smoothStep
         * @memberof Odin.Mathf
         * @param Number x
         * @param Number min
         * @param Number max
         * @return Number
         */
        Mathf.prototype.smoothStep = function(x, min, max) {
            if (x <= min) return 0;
            if (x >= max) return 1;

            x = (x - min) / (max - min);

            return x * x * (3 - 2 * x);
        };

        /**
         * @method smootherStep
         * @memberof Odin.Mathf
         * smoother step, if input is between min and max this returns a value proportionately between 0 and 1
         * @param Number x
         * @param Number min
         * @param Number max
         * @return Number
         */
        Mathf.prototype.smootherStep = function(x, min, max) {
            if (x <= min) return 0;
            if (x >= max) return 1;

            x = (x - min) / (max - min);

            return x * x * x * (x * (x * 6 - 15) + 10);
        };

        /**
         * @method pingPong
         * @memberof Odin.Mathf
         * PingPongs the value x, so that it is never larger than length and never smaller than 0.
         * @param Number x
         * @param Number length
         * @return Number
         */
        Mathf.prototype.pingPong = function(x, length) {
            length || (length = 1);

            return length - abs(x % (2 * length) - length);
        };

        /**
         * @method degsToRads
         * @memberof Odin.Mathf
         * convertes degrees to radians
         * @param Number x
         * @return Number
         */
        Mathf.prototype.degsToRads = function(x) {

            return standardRadian(x * TO_RADS);
        };

        /**
         * @method radsToDegs
         * @memberof Odin.Mathf
         * convertes radians to degrees
         * @param Number x
         * @return Number
         */
        Mathf.prototype.radsToDegs = radsToDegs = function(x) {

            return standardAngle(x * TO_DEGS);
        };

        /**
         * @method randInt
         * @memberof Odin.Mathf
         * returns random number between min and max
         * @param Number min
         * @param Number max
         * @return Number
         */
        Mathf.prototype.randInt = function(min, max) {

            return floor(min + (random() * (max + 1 - min)));
        };

        /**
         * @method randFloat
         * @memberof Odin.Mathf
         * returns random number between min and max
         * @param Number min
         * @param Number max
         * @return Number
         */
        Mathf.prototype.randFloat = function(min, max) {

            return min + (random() * (max - min));
        };

        /**
         * @method randSign
         * @memberof Odin.Mathf
         * returns either -1 or 1
         * @param Number min
         * @param Number max
         * @return Number
         */
        Mathf.prototype.randSign = function() {

            return random() < 0.5 ? 1 : -1;
        };

        /**
         * @method randChoice
         * @memberof Odin.Mathf
         * returns random item from array
         * @param Array array
         * @return Number
         */
        Mathf.prototype.randChoice = function(array) {

            return array[(random() * array.length) | 0];
        };

        /**
         * @method shuffle
         * @memberof Odin.Mathf
         * shuffles array
         * @param Array array
         * @return Array
         */
        Mathf.prototype.shuffle = function(array) {

            for (var j, x, i = array.length; i; j = (random() * i) | 0, x = array[--i], array[i] = array[j], array[j] = x);
            return array;
        };

        /**
         * @method randArg
         * @memberof Odin.Mathf
         * returns random argument from arguments
         * @return Number
         */
        Mathf.prototype.randArg = function() {

            return arguments[(random() * arguments.length) | 0];
        };

        /**
         * @method randChoiceObject
         * @memberof Odin.Mathf
         * returns random key from object
         * @param Object obj
         * @return Number
         */
        Mathf.prototype.randChoiceObject = function(obj) {
            var array = keys(obj);

            return array[(random() * array.length) | 0];
        };

        /**
         * @method isPowerOfTwo
         * @memberof Odin.Mathf
         * checks if x is a power of 2
         * @param Number x
         * @return Number
         */
        Mathf.prototype.isPowerOfTwo = function(x) {

            return (x & -x) === x;
        };

        /**
         * @method toPowerOfTwo
         * @memberof Odin.Mathf
         * returns number's next power of 2
         * @param Number x
         * @return Number
         */
        Mathf.prototype.toPowerOfTwo = function(x) {
            var i = 2;

            while (i < x) {
                i *= 2;
            }

            return i;
        };

        /**
         * @method fromJSON
         * @memberof Odin.Mathf
         * returns Math class based on json _className
         * @param Object json
         * @return MATH_CLASS
         */
        Mathf.prototype.fromJSON = function(json) {

            return new this._classes[json._className]().fromJSON(json);
        };


        var RIGHT = "right",
            UP_RIGHT = "up_right",
            UP = "up",
            UP_LEFT = "up_left",
            LEFT = "left",
            DOWN_LEFT = "down_left",
            DOWN = "down",
            DOWN_RIGHT = "down_right";
        /**
         * @method directionAngle
         * @memberof Odin.Mathf
         * returns direction string of an angle in radians
         * @param Number x
         * @param Number y
         * @return String
         */

        var n225 = 0.39269908169872414,
            n675 = 1.1780972450961724,
            n1125 = 1.9634954084936207,
            n1575 = 2.748893571891069,
            n2025 = 3.5342917352885173,
            n2475 = 4.319689898685966,
            n2925 = 5.105088062083414,
            n3375 = 5.8904862254808625;

        Mathf.prototype.directionAngle = function(a) {
            a = standardRadian(a);

            if (a >= n3375 && a < n225) return RIGHT;
            if (a >= n225 && a < n675) return UP_RIGHT;
            if (a >= n675 && a < n1125) return UP;
            if (a >= n1125 && a < n1575) return UP_LEFT;
            if (a >= n1575 && a < n2025) return LEFT;
            if (a >= n2025 && a < n2475) return DOWN_LEFT;
            if (a >= n2475 && a < n2925) return DOWN;
            if (a >= n2925 && a < n3375) return DOWN_RIGHT;

            return RIGHT;
        };

        /**
         * @method direction
         * @memberof Odin.Mathf
         * returns direction string from an x and a y coordinate
         * @param Number x
         * @param Number y
         * @return String
         */
        Mathf.prototype.direction = function(x, y) {
            var a = standardRadian(atan2(y, x));

            if (a >= n3375 && a < n225) return RIGHT;
            if (a >= n225 && a < n675) return UP_RIGHT;
            if (a >= n675 && a < n1125) return UP;
            if (a >= n1125 && a < n1575) return UP_LEFT;
            if (a >= n1575 && a < n2025) return LEFT;
            if (a >= n2025 && a < n2475) return DOWN_LEFT;
            if (a >= n2475 && a < n2925) return DOWN;
            if (a >= n2925 && a < n3375) return DOWN_RIGHT;

            return RIGHT;
        };


        return new Mathf;
    }
);
