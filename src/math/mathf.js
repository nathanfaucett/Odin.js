if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        var random = Math.random,
            abs = Math.abs,
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
         * @brief collection of common math functions
         */
        function Mathf() {

            /**
             * @property Number PI
             * @brief The infamous 3.1415926535897932384626433832795028841968
             * @memberof Mathf
             */
            this.PI = PI;

            /**
             * @property Number TWO_PI
             * @brief 2 * PI
             * @memberof Mathf
             */
            this.TWO_PI = TWO_PI;

            /**
             * @property Number HALF_PI
             * @brief PI / 2
             * @memberof Mathf
             */
            this.HALF_PI = HALF_PI;

            /**
             * @property Number EPSILON
             * @brief A small number value
             * @memberof Mathf
             */
            this.EPSILON = EPSILON;

            /**
             * @property Number TO_RADS
             * @brief Degrees to radians conversion constant
             * @memberof Mathf
             */
            this.TO_RADS = TO_RADS;

            /**
             * @property Number TO_DEGS
             * @brief Radians to degrees conversion constant
             * @memberof Mathf
             */
            this.TO_DEGS = TO_DEGS;
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
         * @memberof Mathf
         * @brief returns if a = b within some value, defaults to Mathf.EPSILON
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
         * @memberof Mathf
         * @brief returns remainder of a / b
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
         * @memberof Mathf
         * @brief convertes x to radian where 0 <= x < 2PI
         * @param Number x
         * @return Number
         */
        Mathf.prototype.standardRadian = standardRadian = function(x) {

            return modulo(x, TWO_PI);
        };

        /**
         * @method standardAngle
         * @memberof Mathf
         * @brief convertes x to angle where 0 <= x < 360
         * @param Number x
         * @return Number
         */
        Mathf.prototype.standardAngle = standardAngle = function(x) {

            return modulo(x, 360);
        };

        /**
         * @method sign
         * @memberof Mathf
         * @brief gets sign of x
         * @param Number x
         * @return Number
         */
        Mathf.prototype.sign = Math.sign || (Math.sign = function(x) {

            return x ? x < 0 ? -1 : 1 : 0;
        });

        /**
         * @method clamp
         * @memberof Mathf
         * @brief clamp x between min and max
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
         * @memberof Mathf
         * @brief clamp x between min and Infinity
         * @param Number x
         * @param Number min
         * @return Number
         */
        Mathf.prototype.clampBottom = function(x, min) {

            return x < min ? min : x;
        };

        /**
         * @method clampTop
         * @memberof Mathf
         * @brief clamp x between -Infinity and max
         * @param Number x
         * @param Number max
         * @return Number
         */
        Mathf.prototype.clampTop = function(x, max) {

            return x > max ? max : x;
        };

        /**
         * @method clamp01
         * @memberof Mathf
         * @brief clamp x between 0 and 1
         * @param Number x
         * @return Number
         */
        Mathf.prototype.clamp01 = clamp01 = function(x) {

            return x < 0 ? 0 : x > 1 ? 1 : x;
        };

        /**
         * @method truncate
         * @memberof Mathf
         * @brief truncate x to have n number of decial places
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
         * @memberof Mathf
         * @brief linear interpolation between a and b by x
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
         * @memberof Mathf
         * @brief linear interpolation between a and b by x insures 0 <= x < 2PI
         * @param Number a
         * @param Number b
         * @param Number x
         * @return Number
         */
        Mathf.prototype.lerpAngle = function(a, b, x) {

            return standardRadian(a + (b - a) * x);
        };

        /**
         * @method smoothStep
         * @memberof Mathf
         * @brief smooth step, if input is between min and max this returns a value proportionately between 0 and 1
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
         * @memberof Mathf
         * @brief smoother step, if input is between min and max this returns a value proportionately between 0 and 1
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
         * @memberof Mathf
         * @brief PingPongs the value x, so that it is never larger than length and never smaller than 0.
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
         * @memberof Mathf
         * @brief convertes degrees to radians
         * @param Number x
         * @return Number
         */
        Mathf.prototype.degsToRads = function(x) {

            return standardRadian(x * TO_RADS);
        };

        /**
         * @method radsToDegs
         * @memberof Mathf
         * @brief convertes radians to degrees
         * @param Number x
         * @return Number
         */
        Mathf.prototype.radsToDegs = radsToDegs = function(x) {

            return standardAngle(x * TO_DEGS);
        };

        /**
         * @method randInt
         * @memberof Mathf
         * @brief returns random number between min and max
         * @param Number min
         * @param Number max
         * @return Number
         */
        Mathf.prototype.randInt = function(min, max) {

            return~~ (min + (random() * (max + 1 - min)));
        };

        /**
         * @method randFloat
         * @memberof Mathf
         * @brief returns random number between min and max
         * @param Number min
         * @param Number max
         * @return Number
         */
        Mathf.prototype.randFloat = function(min, max) {

            return min + (random() * (max - min));
        };

        /**
         * @method randChoice
         * @memberof Mathf
         * @brief returns random item from array
         * @param Array array
         * @return Number
         */
        Mathf.prototype.randChoice = function(array) {

            return array[~~(random() * array.length)];
        };

        /**
         * @method randChoiceObject
         * @memberof Mathf
         * @brief returns random key from object
         * @param Array array
         * @return Number
         */
        Mathf.prototype.randChoiceObject = function(obj) {
            var array = keys(obj);

            return array[~~(random() * array.length)];
        };

        /**
         * @method isPowerOfTwo
         * @memberof Mathf
         * @brief checks if x is a power of 2
         * @param Number x
         * @return Number
         */
        Mathf.prototype.isPowerOfTwo = function(x) {

            return (x & -x) === x;
        };

        /**
         * @method toPowerOfTwo
         * @memberof Mathf
         * @brief returns number's next power of 2
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
         * @memberof Mathf
         * @brief returns direction string of an angle in radians
         * @param Number x
         * @param Number y
         * @return String
         */
        Mathf.prototype.directionAngle = function(a) {
            a = radsToDegs(a);

            if (a > 337.5 && a < 22.5) return RIGHT;
            if (a > 22.5 && a < 67.5) return UP_RIGHT;
            if (a > 67.5 && a < 112.5) return UP;
            if (a > 112.5 && a < 157.5) return UP_LEFT;
            if (a > 157.5 && a < 202.5) return LEFT;
            if (a > 202.5 && a < 247.5) return DOWN_LEFT;
            if (a > 247.5 && a < 292.5) return DOWN;
            if (a > 292.5 && a < 337.5) return DOWN_RIGHT;

            return RIGHT;
        };

        /**
         * @method direction
         * @memberof Mathf
         * @brief returns direction string from atan2( y, x )
         * @param Number x
         * @param Number y
         * @return String
         */
        Mathf.prototype.direction = function(x, y) {
            var a = radsToDegs(atan2(y, x));

            if (a > 337.5 && a < 22.5) return RIGHT;
            if (a > 22.5 && a < 67.5) return UP_RIGHT;
            if (a > 67.5 && a < 112.5) return UP;
            if (a > 112.5 && a < 157.5) return UP_LEFT;
            if (a > 157.5 && a < 202.5) return LEFT;
            if (a > 202.5 && a < 247.5) return DOWN_LEFT;
            if (a > 247.5 && a < 292.5) return DOWN;
            if (a > 292.5 && a < 337.5) return DOWN_RIGHT;

            return RIGHT;
        };


        return new Mathf;
    }
);
