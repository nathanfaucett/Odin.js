if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        var util = {},
            random = Math.random,

            isServer = typeof(window) === "undefined",

            ObjectProto = Object.prototype,
            toString = ObjectProto.toString,
            hasOwnProperty = ObjectProto.hasOwnProperty,

            ArrayProto = Array.prototype,
            ArrayForEach = ArrayProto.forEach,

            keys = Object.keys || (Object.keys = function(obj) {
                var out = [],
                    key;

                for (key in obj) {
                    if (hasOwnProperty.call(obj, key)) out.push(key);
                }
                return out;
            }),

            isArray = Array.isArray || (Array.isArray = function(obj) {
                return toString.call(obj) === "[object Array]";
            }),

            SPILTER = /[ \_\-\.]+|(?=[A-Z][^A-Z])/g,
            UNDERSCORE = /([a-z])([A-Z])/g,
            FORMAT_REGEX = /%[sdj%]/g;

        function isObject(obj) {

            return obj === Object(obj);
        }
        util.isObject = isObject;


        function isArrayLike(obj) {

            return typeof(obj) === "object" && typeof(obj.length) === "number";
        }
        util.isArrayLike = isArrayLike;
        util.isArray = isArray;


        function isArguments(obj) {

            return toString.call(obj) === "[object Arguments]";
        }
        util.isArguments = isArguments;


        function isFunction(obj) {

            return typeof(obj) === "function"
        }
        util.isFunction = isFunction;


        function isString(obj) {

            return toString.call(obj) === "[object String]";
        }
        util.isString = isString;


        function isNumber(obj) {

            return toString.call(obj) === "[object Number]";
        }
        util.isNumber = isNumber;


        function isDecimal(obj) {

            return isNumber(obj) && obj % 1 !== 0;
        }
        util.isDecimal = isDecimal;


        function isInteger(obj) {

            return isNumber(obj) && obj % 1 === 0;
        }
        util.isInteger = isInteger;


        function isDate(obj) {

            return toString.call(obj) === "[object Date]";
        }
        util.isDate = isDate;


        function isRegExp(obj) {

            return toString.call(obj) === "[object RegExp]";
        }
        util.isRegExp = isRegExp;


        util.isFinite = isFinite;


        util.isNaN = isNaN;


        function isBoolean(obj) {

            return obj === true || obj === false || toString.call(obj) === "[object Boolean]";
        }
        util.isBoolean = isBoolean;


        function isNull(obj) {

            return obj === null;
        }
        util.isNull = isNull;


        function isUndefined(obj) {

            return obj === void 0;
        }
        util.isUndefined = isUndefined;


        function has(obj, key) {

            return hasOwnProperty.call(obj, key);
        }
        util.has = has;


        function format(fmt) {
            var i = 1,
                args = arguments,
                len = args.length;

            return String(fmt).replace(FORMAT_REGEX, function(x) {
                if (x === "%%") return "%";
                if (i >= len) return x;

                if (x === "%s") {
                    return String(args[i++]);
                } else if (x === "%d") {
                    return Number(args[i++]);
                } else if (x === "%j") {
                    try {
                        return JSON.stringify(args[i++]);
                    } catch (e) {
                        return "[Circular]";
                    }
                } else {
                    return x;
                }
            });
        }
        util.format = format;


        function camelize(word, lowFirstLetter) {
            var parts = word.split(SPILTER),
                string = "",
                part, i, il;

            for (i = 0, il = parts.length; i < il; i++) {
                part = parts[i];
                string += part[0].toUpperCase() + part.slice(1).toLowerCase();
            }

            return lowFirstLetter ? string[0].toLowerCase() + string.slice(1) : string;
        };
        util.camelize = camelize;


        function underscore(word) {

            return word.replace(SPILTER, "").replace(UNDERSCORE, "$1_$2").toLowerCase();
        };
        util.underscore = underscore;


        function merge(obj, add) {
            var key;

            for (key in add) {
                if (obj[key] == undefined) obj[key] = add[key];
            }

            return obj;
        };
        util.merge = merge;


        function override(obj, add) {
            var key;

            for (key in add) {
                if (add[key] != undefined) obj[key] = add[key];
            }

            return obj;
        };
        util.override = override;


        function copy(obj, out) {
            var type = typeof(obj),
                key, i, il;

            if (type !== "object") return obj;

            if (isArrayLike(obj)) {
                out = [];
                for (i = 0, il = obj.length; i < il; i++) out[i] = copy(obj[i]);
            } else if (isObject(obj)) {
                out = {};
                for (key in obj) out[key] = copy(obj[key]);
            }

            return out;
        };
        util.copy = copy;


        function clear(obj) {
            var key;

            for (key in obj) delete obj[key];

            return obj;
        };
        util.clear = clear;


        util.keys = keys;


        function arrayBufferToBase64(buffer) {
            var binary = "",
                bytes = new Uint8Array(buffer),
                len = bytes.byteLength,
                i = 0;

            for (; i < len; i++) binary += String.fromCharCode(bytes[i]);

            return isServer ? new Buffer(binary.toString(), "binary").toString("base64") : window.btoa(binary);
        }
        util.arrayBufferToBase64 = arrayBufferToBase64;


        function base64ToArrayBuffer(str) {
            var binary = isServer ? new Buffer(str, "base64").toString("binary") : window.atob(str),
                len = binary.length,
                bytes = new Uint8Array(len).
                i = 0;

            for (; i < len; i++) bytes[i] = str.charCodeAt(i);

            return bytes.buffer;
        }
        util.base64ToArrayBuffer = base64ToArrayBuffer;


        function uid() {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(UID_REPLACER, function(c) {
                var a = 16 * random() | 0;
                return ("x" == c ? a : a & 3 | 8).toString(16);
            })
        }
        var UID_REPLACER = /[xy]/g;
        util.uid = uid;


        function each(obj, iterator, ctx) {
            if (obj == null) return;

            if (ArrayForEach && obj.forEach === ArrayForEach) {
                obj.forEach(iterator, ctx);
            } else if (obj.length === +obj.length) {
                for (var i = 0, length = obj.length; i < length; i++) {
                    if (iterator.call(ctx, obj[i], i, obj) === false) return;
                }
            } else {
                var objKeys = keys(obj);

                for (var i = 0, length = objKeys.length; i < length; i++) {
                    if (iterator.call(ctx, obj[objKeys[i]], objKeys[i], obj) === false) return;
                }
            }
        }
        util.each = each;


        if (!isServer) {
            util.createWorker = function(fn) {
                var blobURL = URL.createObjectURL(new Blob(["(" + fn.toString() + ")()"], {
                    type: "application/javascript"
                })),
                    worker = new Worker(blobURL);

                URL.revokeObjectURL(blobURL);

                return worker;
            };

            util.ajax = function ajax(opts) {
                opts || (opts = {});
                var request = new XMLHttpRequest,
                    src = opts.src,
                    method = opts.method || (opts.method = "GET"),
                    before = opts.before,
                    success = opts.success,
                    error = opts.error,
                    async = opts.async != undefined ? !! opts.async : true;

                request.addEventListener("load", function() {
                    var status = this.status;

                    if ((status > 199 && status < 301) || status == 304) {
                        if (typeof(success) === "function") success.call(this);
                    } else {
                        if (typeof(error) === "function") {
                            error.call(this, new Error(method + " " + src + " " + status));
                        } else {
                            throw new Error(method + " " + src + " " + status);
                        }
                    }
                }, false);
                request.addEventListener("error", function() {
                    if (typeof(error) === "function") {
                        error(new Error(method + " " + src));
                    } else {
                        throw new Error(method + " " + src);
                    }
                }, false);

                request.open(method, src, async);
                if (typeof(before) === "function") before.call(request);
                request.send();
            };
        }


        return util;
    }
);
