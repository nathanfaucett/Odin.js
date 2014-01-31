if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        var util = {},

            isServer = typeof(window) === "undefined",

            ObjectProto = Object.prototype,
            toString = ObjectProto.toString,
            hasOwnProperty = ObjectProto.hasOwnProperty,

            SPILTER = /[ \_\-\.]+|(?=[A-Z][^A-Z])/g,
            UNDERSCORE = /([a-z])([A-Z])/g,
            FORMAT_REGEX = /%[sdj%]/g,

            fromCharCode = String.fromCharCode;


        function format(fmt) {
            var i = 1,
                args = arguments,
                len = args.length;

            return String(fmt).replace(FORMAT_REGEX, function(x) {
                if (x === "%%") return "%";
                if (i >= len) return x;

                switch (x) {
                    case "%s":
                        return String(args[i++]);
                    case "%d":
                        return Number(args[i++]);
                    case "%j":
                        try {
                            return JSON.stringify(args[i++]);
                        } catch (e) {
                            return "[Circular]";
                        }
                    default:
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


        function copy(obj) {
            var c = {},
                key;

            for (key in add) {
                if (obj[key] != undefined) c[key] = obj[key];
            }

            return c;
        };
        util.copy = copy;


        function clear(obj) {
            var key;

            for (key in obj) delete obj[key];

            return obj;
        };
        util.clear = clear;


        var isArray = Array.isArray || (Array.isArray = function(obj) {
            return toString.call(obj) === "[object Array]";
        });
        util.isArray = isArray;


        var keys = Object.keys || (Object.keys = function(obj) {
            var out = [],
                key;

            for (key in obj) {
                if (hasOwnProperty.call(obj, key)) out.push(key);
            }
            return out;
        });
        util.keys = keys;


        function has(obj, key) {

            return hasOwnProperty.call(obj, key);
        }
        util.has = has;


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


        return util;
    }
);
