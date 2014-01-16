define(
    'core/game/config', [], function() {



        function Config() {

            this.debug = false;

            this.forceCanvas = false;
            this.renderer = "";

            this.host = "127.0.0.1";
            this.port = 3000;

            this.MAX_SERVER_STATES = 10;
            this.SCENE_SYNC_RATE = 0.5;

            this.MIN_DELTA = 0.000001;
            this.MAX_DELTA = 1;
        }


        Config.prototype.fromJSON = function(json) {

            for (var key in json)
                if (this[key] != undefined) this[key] = json[key];
            return this;
        };


        return new Config;
    }
);


define('core/game/log', [
        "core/game/config"
    ],
    function(Config) {



        var has = Object.prototype.hasOwnProperty;


        function Log() {}


        Log.prototype.debug = Log.prototype.info = Log.prototype.log = function() {
            if (!Config.debug) return;

            console.log.apply(console, arguments);
        };


        Log.prototype.warn = function() {
            if (!Config.debug || !Config.warn) return;

            console.warn.apply(console, arguments);
        };


        Log.prototype.error = function() {
            if (!Config.debug || !Config.error) return;

            console.error.apply(console, arguments);
        };


        Log.prototype.object = function(obj) {
            if (!Config.debug) return "";
            var str = "",
                key, value, type,
                values = arguments[1] || (arguments[1] = []);

            for (key in obj) {
                if (!has.call(obj, key)) continue;

                value = obj[key];
                if (~values.indexOf(value)) continue;

                type = typeof(value);

                if (type === "object") {
                    values.push(value);
                    str += "\t" + key + " = " + this.object(value, values);
                } else if (type !== "function") {
                    str += "\t" + key + " = " + value + "\n";
                } else {
                    values.push(value);
                }
            }

            return str;
        };


        return new Log;
    }
);


define('base/audio_ctx', [
        "core/game/log"
    ],
    function(Log) {



        var w = typeof(window) !== "undefined" ? window : global,
            ctx = (
                w.AudioContext ||
                w.webkitAudioContext ||
                w.mozAudioContext ||
                w.oAudioContext ||
                w.msAudioContext
            );

        if (!ctx) Log.error("AudioContext not supported by this Browser");

        return ctx ? new ctx : false;
    }
);


define(
    'base/event_emitter', [], function() {



        var shift = Array.prototype.shift,
            SPLITER = /[ ,]+/;


        function EventEmitter() {

            this._events = {};
        }


        EventEmitter.prototype.on = function(type, listener, ctx) {
            var types = type.split(SPLITER),
                events = this._events,
                i;

            for (i = types.length; i--;) {
                type = types[i];
                (events[type] || (events[type] = [])).push({
                    listener: listener,
                    ctx: ctx || this
                });
            }

            return this;
        };


        EventEmitter.prototype.once = function(type, listener, ctx) {
            var self = this;
            ctx = ctx || this;

            function once() {
                self.off(type, once);
                listener.apply(ctx, arguments);
            }

            return this.on(type, once, ctx);
        };


        EventEmitter.prototype.listenTo = function(obj, type, listener, ctx) {
            if (!obj.on || !obj.addEventListenerTo) throw "Can't listen to Object, it's not a instance of EventEmitter";

            obj.on(type, listener, ctx || this);

            return this;
        };


        EventEmitter.prototype.off = function(type, listener, ctx) {
            var types = type.split(SPLITER),
                thisEvents = this._events,
                events, event,
                i, j;

            for (i = types.length; i--;) {
                type = types[i];

                if (!type) {
                    for (i in thisEvents) thisEvents[i].length = 0;
                    return this;
                }

                events = thisEvents[type];
                if (!events) return this;

                if (!listener) {
                    events.length = 0;
                } else {
                    ctx = ctx || this;

                    for (j = events.length; j--;) {
                        event = events[j];

                        if (event.listener === listener && event.ctx === ctx) {
                            events.splice(j, 1);
                            break;
                        }
                    }
                }
            }

            return this;
        };


        EventEmitter.prototype.emit = function(type) {
            var events = this._events[type],
                a1, a2, a3, a4,
                event,
                i;

            if (!events || !events.length) return this;

            switch (arguments.length) {
                case 1:
                    for (i = events.length; i--;)(event = events[i]).listener.call(event.ctx);
                    break;

                case 2:
                    a1 = arguments[1];
                    for (i = events.length; i--;)(event = events[i]).listener.call(event.ctx, a1);
                    break;

                case 3:
                    a1 = arguments[1];
                    a2 = arguments[2];
                    for (i = events.length; i--;)(event = events[i]).listener.call(event.ctx, a1, a2);
                    break;

                case 4:
                    a1 = arguments[1];
                    a2 = arguments[2];
                    a3 = arguments[3];
                    for (i = events.length; i--;)(event = events[i]).listener.call(event.ctx, a1, a2, a3);
                    break;

                case 5:
                    a1 = arguments[1];
                    a2 = arguments[2];
                    a3 = arguments[3];
                    a4 = arguments[4];
                    for (i = events.length; i--;)(event = events[i]).listener.call(event.ctx, a1, a2, a3, a4);
                    break;

                default:
                    shift.apply(arguments);
                    for (i = events.length; i--;)(event = events[i]).listener.apply(event.ctx, arguments);
            }

            return this;
        };


        EventEmitter.extend = function(child, parent) {
            if (!parent) parent = this;

            child.prototype = Object.create(parent.prototype);
            child.prototype.constructor = child;

            child.extend = this.extend;

            if (parent.prototype._onExtend) parent.prototype._onExtend(child);
            if (child.prototype._onInherit) child.prototype._onInherit(parent);

            return child;
        };


        return EventEmitter;
    }
);


define('base/class', [
        "base/event_emitter"
    ],
    function(EventEmitter) {



        var CLASS_ID = 0,
            IS_SERVER = !(typeof(window) !== "undefined" && window.document),
            IS_CLIENT = !IS_SERVER,

            defineProperty = Object.defineProperty;


        function Class() {

            EventEmitter.call(this);

            this._id = ++CLASS_ID;
            this._serverId = -1;

            this._SYNC = {};
        }

        EventEmitter.extend(Class);


        defineProperty(Class.prototype, "isServer", {
            get: function() {
                return IS_SERVER;
            }
        });


        defineProperty(Class.prototype, "isClient", {
            get: function() {
                return IS_CLIENT;
            }
        });


        Class.prototype.clone = function() {

            return new this.constructor().copy(this);
        };


        Class.prototype.copy = function() {

            return this;
        };


        Class.prototype.toSYNC = function(json) {
            json || (json = this._SYNC);

            json._id = this._id;

            return json;
        };


        Class.prototype.fromSYNC = function(json) {
            this._SYNC = json;

            return this;
        };


        Class.prototype.toJSON = function(json) {
            json || (json = {});

            json._id = this._id;

            return json;
        };


        Class.prototype.fromJSON = function(json) {

            this._serverId = json._id;

            return this;
        };


        return Class;
    }
);


define(
    'base/device', [], function() {



        function Device() {
            var userAgent = navigator.userAgent.toLowerCase(),
                audio = new Audio,
                video = document.createElement("video");

            this.userAgent = userAgent;

            this.pixelRatio = window.devicePixelRatio || 1;
            this.invPixelRatio = 1 / this.pixelRatio;

            this.browser = userAgent.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i)[1];
            this.touch = "ontouchstart" in window;
            this.mobile = /android|webos|iphone|ipad|ipod|blackberry/i.test(userAgent);

            this.webgl = (function() {
                var canvas = document.createElement("canvas"),
                    names = ["3d", "moz-webgl", "experimental-webgl", "webkit-3d", "webgl"],
                    has, i;

                for (i = names.length; i--;) {
                    has = !! canvas.getContext(names[i]);
                    if (has) break;
                }

                return has;
            }());

            this.canvas = (function() {
                var canvas = document.createElement("canvas"),
                    has = !! canvas.getContext("2d");

                return has;
            }());

            this.gamepads = !! navigator.getGamepads || !! navigator.webkitGetGamepads || !! navigator.webkitGamepads;

            this.audioMpeg = !! audio.canPlayType("audio/mpeg");
            this.audioOgg = !! audio.canPlayType("audio/ogg");
            this.audioMp4 = !! audio.canPlayType("audio/mp4");

            this.videoWebm = !! video.canPlayType("video/webm");
            this.videoOgg = !! video.canPlayType("video/ogg");
            this.videoMp4 = !! video.canPlayType("video/mp4");
        }


        return new Device;
    }
);


define('base/dom', [
        "core/game/log"
    ],
    function(Log) {



        var SPLITER = /[ ,]+/,

            regAttribute = /attribute\s+([a-z]+\s+)?([A-Za-z0-9]+)\s+([a-zA-Z_0-9]+)\s*(\[\s*(.+)\s*\])?/,
            regUniform = /uniform\s+([a-z]+\s+)?([A-Za-z0-9]+)\s+([a-zA-Z_0-9]+)\s*(\[\s*(.+)\s*\])?/,

            WEBGL_NAMES = ["webgl", "webkit-3d", "moz-webgl", "experimental-webgl", "3d"],
            WEBGL_ATTRIBUTES = {
                alpha: true,
                antialias: true,
                depth: true,
                premultipliedAlpha: true,
                preserveDrawingBuffer: false,
                stencil: true
            };


        function Dom() {}


        Dom.prototype.addEvent = function(obj, name, callback, ctx) {
            var names = name.split(SPLITER),
                i,
                scope = ctx || obj,
                afn = function(e) {
                    if (callback) callback.call(scope, e || window.event);
                };

            for (i = names.length; i--;) {
                name = names[i];

                if (obj.attachEvent) {
                    obj.attachEvent("on" + name, afn);
                } else {
                    obj.addEventListener(name, afn, false);
                }
            }
        };


        Dom.prototype.removeEvent = function(obj, name, callback, ctx) {
            var names = name.split(SPLITER),
                i, il,
                scope = ctx || obj,
                afn = function(e) {
                    if (callback) callback.call(scope, e || window.event);
                };

            for (i = 0, il = names.length; i < il; i++) {
                name = names[i];

                if (obj.detachEvent) {
                    obj.detachEvent("on" + name, afn);
                } else {
                    obj.removeEventListener(name, afn, false);
                }
            }
        };


        Dom.prototype.addMeta = function(id, name, content) {
            var meta = document.createElement("meta"),
                head = document.head;

            if (id) meta.id = id;
            if (name) meta.name = name;
            if (content) meta.content = content;

            head.insertBefore(meta, head.firstChild);
        };


        Dom.prototype.getWebGLContext = function(canvas, attributes) {
            var key, gl, i;

            attributes || (attributes = {});
            for (key in WEBGL_ATTRIBUTES)
                if (attributes[key] != undefined) attributes[key] = WEBGL_ATTRIBUTES[key];

            for (i = WEBGL_NAMES.length; i--;) {

                try {
                    gl = canvas.getContext(WEBGL_NAMES[i], attributes);
                } catch (err) {
                    Log.warn("Dom.getWebGLContext: could not get a WebGL Context " + err.message || "");
                }
                if (gl) break;
            }

            return gl;
        };


        var createShader = Dom.prototype.createShader = function(gl, source, type) {
            var shader = gl.createShader(type);

            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                Log.warn("Dom.createShader: problem compiling shader " + gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return undefined;
            }

            return shader;
        };


        Dom.prototype.createProgram = function(gl, vertex, fragment) {
            var program = gl.createProgram(),
                shader;

            shader = createShader(gl, vertex, gl.VERTEX_SHADER);
            gl.attachShader(program, shader);
            gl.deleteShader(shader);

            shader = createShader(gl, fragment, gl.FRAGMENT_SHADER);
            gl.attachShader(program, shader);
            gl.deleteShader(shader);

            gl.linkProgram(program);
            gl.validateProgram(program);
            gl.useProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                Log.warn("Dom.createProgram: problem compiling Program " + gl.getProgramInfoLog(program));
                gl.deleteProgram(program);
                return undefined;
            }

            return program;
        };


        Dom.prototype.parseUniformsAttributes = function(gl, program, vertexShader, fragmentShader, attributes, uniforms) {
            var src = vertexShader + fragmentShader,
                lines = src.split("\n"),
                matchAttributes, matchUniforms,
                name, length, line,
                i, j;

            for (i = lines.length; i--;) {
                line = lines[i];
                matchAttributes = line.match(regAttribute);
                matchUniforms = line.match(regUniform);

                if (matchAttributes) {
                    name = matchAttributes[3];
                    attributes[name] = gl.getAttribLocation(program, name);
                }
                if (matchUniforms) {
                    name = matchUniforms[3];
                    length = parseInt(matchUniforms[5]);

                    if (length) {
                        uniforms[name] = [];
                        for (j = length; j--;) uniforms[name][j] = gl.getUniformLocation(program, name + "[" + j + "]");
                    } else {
                        uniforms[name] = gl.getUniformLocation(program, name);
                    }
                }
            }
        };


        return new Dom;
    }
);


define(
    'base/object_pool', [], function() {



        function ObjectPool(constructor) {

            this.pooled = [];
            this.objects = [];
            this.object = constructor;
        }


        ObjectPool.prototype.create = function() {
            var pooled = this.pooled,
                object = pooled.length ? pooled.pop() : new this.object;

            this.objects.push(object);

            return object;
        };


        ObjectPool.prototype.removeObject = function(object) {
            var objects = this.objects,
                pooled = this.pooled,
                index = objects.indexOf(object);

            if (index > -1) {
                pooled.push(object);
                objects.splice(index, 1);
            }

            return this;
        };


        ObjectPool.prototype.remove = ObjectPool.prototype.removeObjects = function() {

            for (var i = arguments.length; i--;) this.removeObject(arguments[i]);

            return this;
        };


        ObjectPool.prototype.clear = function() {
            var objects = this.objects,
                pooled = this.pooled,
                i;

            for (i = objects.length; i--;) pooled.push(objects[i]);
            objects.length = 0;

            return this;
        };


        return ObjectPool;
    }
);


define(
    'base/request_animation_frame', [], function() {



        var RATE = 1000 / 60,
            w = typeof(window) !== "undefined" ? window : global;


        return (
            w.requestAnimationFrame ||
            w.webkitRequestAnimationFrame ||
            w.mozRequestAnimationFrame ||
            w.oRequestAnimationFrame ||
            w.msRequestAnimationFrame ||
            function(callback) {

                return w.setTimeout(callback, RATE);
            }
        );
    }
);

(function() {

    var io = (function(exports, global) {

        /**
         * IO namespace.
         *
         * @namespace
         */

        var io = exports;

        /**
         * Socket.IO version
         *
         * @api public
         */

        io.version = '0.9.16';

        /**
         * Protocol implemented.
         *
         * @api public
         */

        io.protocol = 1;

        /**
         * Available transports, these will be populated with the available transports
         *
         * @api public
         */

        io.transports = [];

        /**
         * Keep track of jsonp callbacks.
         *
         * @api private
         */

        io.j = [];

        /**
         * Keep track of our io.Sockets
         *
         * @api private
         */
        io.sockets = {};


        /**
         * Manages connections to hosts.
         *
         * @param {String} uri
         * @Param {Boolean} force creation of new socket (defaults to false)
         * @api public
         */

        io.connect = function(host, details) {
            var uri = io.util.parseUri(host),
                uuri, socket;

            if (global && global.location) {
                uri.protocol = uri.protocol || global.location.protocol.slice(0, -1);
                uri.host = uri.host || (global.document ? global.document.domain : global.location.hostname);
                uri.port = uri.port || global.location.port;
            }

            uuri = io.util.uniqueUri(uri);

            var options = {
                host: uri.host,
                secure: 'https' == uri.protocol,
                port: uri.port || ('https' == uri.protocol ? 443 : 80),
                query: uri.query || ''
            };

            io.util.merge(options, details);

            if (options['force new connection'] || !io.sockets[uuri]) {
                socket = new io.Socket(options);
            }

            if (!options['force new connection'] && socket) {
                io.sockets[uuri] = socket;
            }

            socket = socket || io.sockets[uuri];

            // if path is different from '' or /
            return socket.of(uri.path.length > 1 ? uri.path : '');
        };

        return io;
    })({}, this);

    (function(exports, global) {

        /**
         * Utilities namespace.
         *
         * @namespace
         */

        var util = exports.util = {};


        var re = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

        var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password',
            'host', 'port', 'relative', 'path', 'directory', 'file', 'query',
            'anchor'
        ];

        util.parseUri = function(str) {
            var m = re.exec(str || ''),
                uri = {}, i = 14;

            while (i--) {
                uri[parts[i]] = m[i] || '';
            }

            return uri;
        };

        /**
         * Produces a unique url that identifies a Socket.IO connection.
         *
         * @param {Object} uri
         * @api public
         */

        util.uniqueUri = function(uri) {
            var protocol = uri.protocol,
                host = uri.host,
                port = uri.port;

            if ('document' in global) {
                host = host || document.domain;
                port = port || (protocol == 'https' && document.location.protocol !== 'https:' ? 443 : document.location.port);
            } else {
                host = host || 'localhost';

                if (!port && protocol == 'https') {
                    port = 443;
                }
            }

            return (protocol || 'http') + '://' + host + ':' + (port || 80);
        };

        /**
         * Mergest 2 query strings in to once unique query string
         *
         * @param {String} base
         * @param {String} addition
         * @api public
         */

        util.query = function(base, addition) {
            var query = util.chunkQuery(base || ''),
                components = [];

            util.merge(query, util.chunkQuery(addition || ''));
            for (var part in query) {
                if (query.hasOwnProperty(part)) {
                    components.push(part + '=' + query[part]);
                }
            }

            return components.length ? '?' + components.join('&') : '';
        };

        /**
         * Transforms a querystring in to an object
         *
         * @param {String} qs
         * @api public
         */

        util.chunkQuery = function(qs) {
            var query = {}, params = qs.split('&'),
                i = 0,
                l = params.length,
                kv;

            for (; i < l; ++i) {
                kv = params[i].split('=');
                if (kv[0]) {
                    query[kv[0]] = kv[1];
                }
            }

            return query;
        };

        /**
         * Executes the given function when the page is loaded.
         *
         *     io.util.load(function () { console.log('page loaded'); });
         *
         * @param {Function} fn
         * @api public
         */

        var pageLoaded = false;

        util.load = function(fn) {
            if ('document' in global && document.readyState === 'complete' || pageLoaded) {
                return fn();
            }

            util.on(global, 'load', fn, false);
        };

        /**
         * Adds an event.
         *
         * @api private
         */

        util.on = function(element, event, fn, capture) {
            if (element.attachEvent) {
                element.attachEvent('on' + event, fn);
            } else if (element.addEventListener) {
                element.addEventListener(event, fn, capture);
            }
        };

        /**
         * Generates the correct `XMLHttpRequest` for regular and cross domain requests.
         *
         * @param {Boolean} [xdomain] Create a request that can be used cross domain.
         * @returns {XMLHttpRequest|false} If we can create a XMLHttpRequest.
         * @api private
         */

        util.request = function(xdomain) {

            if (xdomain && 'undefined' != typeof XDomainRequest && !util.ua.hasCORS) {
                return new XDomainRequest();
            }

            if ('undefined' != typeof XMLHttpRequest && (!xdomain || util.ua.hasCORS)) {
                return new XMLHttpRequest();
            }

            if (!xdomain) {
                try {
                    return new window[(['Active'].concat('Object').join('X'))]('Microsoft.XMLHTTP');
                } catch (e) {}
            }

            return null;
        };

        /**
         * XHR based transport constructor.
         *
         * @constructor
         * @api public
         */

        /**
         * Change the internal pageLoaded value.
         */

        if ('undefined' != typeof window) {
            util.load(function() {
                pageLoaded = true;
            });
        }

        /**
         * Defers a function to ensure a spinner is not displayed by the browser
         *
         * @param {Function} fn
         * @api public
         */

        util.defer = function(fn) {
            if (!util.ua.webkit || 'undefined' != typeof importScripts) {
                return fn();
            }

            util.load(function() {
                setTimeout(fn, 100);
            });
        };

        /**
         * Merges two objects.
         *
         * @api public
         */

        util.merge = function merge(target, additional, deep, lastseen) {
            var seen = lastseen || [],
                depth = typeof deep == 'undefined' ? 2 : deep,
                prop;

            for (prop in additional) {
                if (additional.hasOwnProperty(prop) && util.indexOf(seen, prop) < 0) {
                    if (typeof target[prop] !== 'object' || !depth) {
                        target[prop] = additional[prop];
                        seen.push(additional[prop]);
                    } else {
                        util.merge(target[prop], additional[prop], depth - 1, seen);
                    }
                }
            }

            return target;
        };

        /**
         * Merges prototypes from objects
         *
         * @api public
         */

        util.mixin = function(ctor, ctor2) {
            util.merge(ctor.prototype, ctor2.prototype);
        };

        /**
         * Shortcut for prototypical and static inheritance.
         *
         * @api private
         */

        util.inherit = function(ctor, ctor2) {
            function f() {};
            f.prototype = ctor2.prototype;
            ctor.prototype = new f;
        };

        /**
         * Checks if the given object is an Array.
         *
         *     io.util.isArray([]); // true
         *     io.util.isArray({}); // false
         *
         * @param Object obj
         * @api public
         */

        util.isArray = Array.isArray || function(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        };

        /**
         * Intersects values of two arrays into a third
         *
         * @api public
         */

        util.intersect = function(arr, arr2) {
            var ret = [],
                longest = arr.length > arr2.length ? arr : arr2,
                shortest = arr.length > arr2.length ? arr2 : arr;

            for (var i = 0, l = shortest.length; i < l; i++) {
                if (~util.indexOf(longest, shortest[i]))
                    ret.push(shortest[i]);
            }

            return ret;
        };

        /**
         * Array indexOf compatibility.
         *
         * @see bit.ly/a5Dxa2
         * @api public
         */

        util.indexOf = function(arr, o, i) {

            for (var j = arr.length, i = i < 0 ? i + j < 0 ? 0 : i + j : i || 0; i < j && arr[i] !== o; i++) {}

            return j <= i ? -1 : i;
        };

        /**
         * Converts enumerables to array.
         *
         * @api public
         */

        util.toArray = function(enu) {
            var arr = [];

            for (var i = 0, l = enu.length; i < l; i++)
                arr.push(enu[i]);

            return arr;
        };

        /**
         * UA / engines detection namespace.
         *
         * @namespace
         */

        util.ua = {};

        /**
         * Whether the UA supports CORS for XHR.
         *
         * @api public
         */

        util.ua.hasCORS = 'undefined' != typeof XMLHttpRequest && (function() {
            try {
                var a = new XMLHttpRequest();
            } catch (e) {
                return false;
            }

            return a.withCredentials != undefined;
        })();

        /**
         * Detect webkit.
         *
         * @api public
         */

        util.ua.webkit = 'undefined' != typeof navigator && /webkit/i.test(navigator.userAgent);

        /**
         * Detect iPad/iPhone/iPod.
         *
         * @api public
         */

        util.ua.iDevice = 'undefined' != typeof navigator && /iPad|iPhone|iPod/i.test(navigator.userAgent);

    })('undefined' != typeof io ? io : module.exports, this);

    (function(exports, io) {

        /**
         * Expose constructor.
         */

        exports.EventEmitter = EventEmitter;

        /**
         * Event emitter constructor.
         *
         * @api public.
         */

        function EventEmitter() {};

        /**
         * Adds a listener
         *
         * @api public
         */

        EventEmitter.prototype.on = function(name, fn) {
            if (!this.$events) {
                this.$events = {};
            }

            if (!this.$events[name]) {
                this.$events[name] = fn;
            } else if (io.util.isArray(this.$events[name])) {
                this.$events[name].push(fn);
            } else {
                this.$events[name] = [this.$events[name], fn];
            }

            return this;
        };

        EventEmitter.prototype.addListener = EventEmitter.prototype.on;

        /**
         * Adds a volatile listener.
         *
         * @api public
         */

        EventEmitter.prototype.once = function(name, fn) {
            var self = this;

            function on() {
                self.removeListener(name, on);
                fn.apply(this, arguments);
            };

            on.listener = fn;
            this.on(name, on);

            return this;
        };

        /**
         * Removes a listener.
         *
         * @api public
         */

        EventEmitter.prototype.removeListener = function(name, fn) {
            if (this.$events && this.$events[name]) {
                var list = this.$events[name];

                if (io.util.isArray(list)) {
                    var pos = -1;

                    for (var i = 0, l = list.length; i < l; i++) {
                        if (list[i] === fn || (list[i].listener && list[i].listener === fn)) {
                            pos = i;
                            break;
                        }
                    }

                    if (pos < 0) {
                        return this;
                    }

                    list.splice(pos, 1);

                    if (!list.length) {
                        delete this.$events[name];
                    }
                } else if (list === fn || (list.listener && list.listener === fn)) {
                    delete this.$events[name];
                }
            }

            return this;
        };

        /**
         * Removes all listeners for an event.
         *
         * @api public
         */

        EventEmitter.prototype.removeAllListeners = function(name) {
            if (name === undefined) {
                this.$events = {};
                return this;
            }

            if (this.$events && this.$events[name]) {
                this.$events[name] = null;
            }

            return this;
        };

        /**
         * Gets all listeners for a certain event.
         *
         * @api publci
         */

        EventEmitter.prototype.listeners = function(name) {
            if (!this.$events) {
                this.$events = {};
            }

            if (!this.$events[name]) {
                this.$events[name] = [];
            }

            if (!io.util.isArray(this.$events[name])) {
                this.$events[name] = [this.$events[name]];
            }

            return this.$events[name];
        };

        /**
         * Emits an event.
         *
         * @api public
         */

        EventEmitter.prototype.emit = function(name) {
            if (!this.$events) {
                return false;
            }

            var handler = this.$events[name];

            if (!handler) {
                return false;
            }

            var args = Array.prototype.slice.call(arguments, 1);

            if ('function' == typeof handler) {
                handler.apply(this, args);
            } else if (io.util.isArray(handler)) {
                var listeners = handler.slice();

                for (var i = 0, l = listeners.length; i < l; i++) {
                    listeners[i].apply(this, args);
                }
            } else {
                return false;
            }

            return true;
        };

    })(
        'undefined' != typeof io ? io : module.exports, 'undefined' != typeof io ? io : module.parent.exports
    );
    /**
     * Based on JSON2 (http://www.JSON.org/js.html).
     */

    (function(exports, nativeJSON) {


        // use native JSON if it's available
        if (nativeJSON && nativeJSON.parse) {
            return exports.JSON = {
                parse: nativeJSON.parse,
                stringify: nativeJSON.stringify
            };
        }

        var JSON = exports.JSON = {};

        function f(n) {
            // Format integers to have at least two digits.
            return n < 10 ? '0' + n : n;
        }

        function date(d) {
            return isFinite(d.valueOf()) ?
                d.getUTCFullYear() + '-' +
                f(d.getUTCMonth() + 1) + '-' +
                f(d.getUTCDate()) + 'T' +
                f(d.getUTCHours()) + ':' +
                f(d.getUTCMinutes()) + ':' +
                f(d.getUTCSeconds()) + 'Z' : null;
        };

        var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
            escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
            gap,
            indent,
            meta = { // table of character substitutions
                '\b': '\\b',
                '\t': '\\t',
                '\n': '\\n',
                '\f': '\\f',
                '\r': '\\r',
                '"': '\\"',
                '\\': '\\\\'
            },
            rep;


        function quote(string) {

            // If the string contains no control characters, no quote characters, and no
            // backslash characters, then we can safely slap some quotes around it.
            // Otherwise we must also replace the offending characters with safe escape
            // sequences.

            escapable.lastIndex = 0;
            return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' : '"' + string + '"';
        }


        function str(key, holder) {

            // Produce a string from holder[key].

            var i, // The loop counter.
                k, // The member key.
                v, // The member value.
                length,
                mind = gap,
                partial,
                value = holder[key];

            // If the value has a toJSON method, call it to obtain a replacement value.

            if (value instanceof Date) {
                value = date(key);
            }

            // If we were called with a replacer function, then call the replacer to
            // obtain a replacement value.

            if (typeof rep === 'function') {
                value = rep.call(holder, key, value);
            }

            // What happens next depends on the value's type.

            switch (typeof value) {
                case 'string':
                    return quote(value);

                case 'number':

                    // JSON numbers must be finite. Encode non-finite numbers as null.

                    return isFinite(value) ? String(value) : 'null';

                case 'boolean':
                case 'null':

                    // If the value is a boolean or null, convert it to a string. Note:
                    // typeof null does not produce 'null'. The case is included here in
                    // the remote chance that this gets fixed someday.

                    return String(value);

                    // If the type is 'object', we might be dealing with an object or an array or
                    // null.

                case 'object':

                    // Due to a specification blunder in ECMAScript, typeof null is 'object',
                    // so watch out for that case.

                    if (!value) {
                        return 'null';
                    }

                    // Make an array to hold the partial results of stringifying this object value.

                    gap += indent;
                    partial = [];

                    // Is the value an array?

                    if (Object.prototype.toString.apply(value) === '[object Array]') {

                        // The value is an array. Stringify every element. Use null as a placeholder
                        // for non-JSON values.

                        length = value.length;
                        for (i = 0; i < length; i += 1) {
                            partial[i] = str(i, value) || 'null';
                        }

                        // Join all of the elements together, separated with commas, and wrap them in
                        // brackets.

                        v = partial.length === 0 ? '[]' : gap ?
                            '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                            '[' + partial.join(',') + ']';
                        gap = mind;
                        return v;
                    }

                    // If the replacer is an array, use it to select the members to be stringified.

                    if (rep && typeof rep === 'object') {
                        length = rep.length;
                        for (i = 0; i < length; i += 1) {
                            if (typeof rep[i] === 'string') {
                                k = rep[i];
                                v = str(k, value);
                                if (v) {
                                    partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                }
                            }
                        }
                    } else {

                        // Otherwise, iterate through all of the keys in the object.

                        for (k in value) {
                            if (Object.prototype.hasOwnProperty.call(value, k)) {
                                v = str(k, value);
                                if (v) {
                                    partial.push(quote(k) + (gap ? ': ' : ':') + v);
                                }
                            }
                        }
                    }

                    // Join all of the member texts together, separated with commas,
                    // and wrap them in braces.

                    v = partial.length === 0 ? '{}' : gap ?
                        '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
                        '{' + partial.join(',') + '}';
                    gap = mind;
                    return v;
            }
        }

        // If the JSON object does not yet have a stringify method, give it one.

        JSON.stringify = function(value, replacer, space) {

            // The stringify method takes a value and an optional replacer, and an optional
            // space parameter, and returns a JSON text. The replacer can be a function
            // that can replace values, or an array of strings that will select the keys.
            // A default replacer method can be provided. Use of the space parameter can
            // produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

            // If the space parameter is a number, make an indent string containing that
            // many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

                // If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

            // If there is a replacer, it must be a function or an array.
            // Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

            // Make a fake root object containing our value under the key of ''.
            // Return the result of stringifying the value.

            return str('', {
                '': value
            });
        };

        // If the JSON object does not yet have a parse method, give it one.

        JSON.parse = function(text, reviver) {
            // The parse method takes a text and an optional reviver function, and returns
            // a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

                // The walk method is used to recursively walk the resulting structure so
                // that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


            // Parsing happens in four stages. In the first stage, we replace certain
            // Unicode characters with escape sequences. JavaScript handles many characters
            // incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function(a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

            // In the second stage, we run the text against regular expressions that look
            // for non-JSON patterns. We are especially concerned with '()' and 'new'
            // because they can cause invocation, and '=' because it can cause mutation.
            // But just to be safe, we want to reject all unexpected forms.

            // We split the second stage into 4 regexp operations in order to work around
            // crippling inefficiencies in IE's and Safari's regexp engines. First we
            // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
            // replace all simple value tokens with ']' characters. Third, we delete all
            // open brackets that follow a colon or comma or that begin the text. Finally,
            // we look to see that the remaining characters are only whitespace or ']' or
            // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                    .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                    .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

                // In the third stage we use the eval function to compile the text into a
                // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
                // in JavaScript: it can begin a block or an object literal. We wrap the text
                // in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

                // In the optional fourth stage, we recursively walk the new structure, passing
                // each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({
                        '': j
                    }, '') : j;
            }

            // If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };

    })(
        'undefined' != typeof io ? io : module.exports, typeof JSON !== 'undefined' ? JSON : undefined
    );
    (function(exports, io) {

        /**
         * Parser namespace.
         *
         * @namespace
         */

        var parser = exports.parser = {};

        /**
         * Packet types.
         */

        var packets = parser.packets = [
            'disconnect', 'connect', 'heartbeat', 'message', 'json', 'event', 'ack', 'error', 'noop'
        ];

        /**
         * Errors reasons.
         */

        var reasons = parser.reasons = [
            'transport not supported', 'client not handshaken', 'unauthorized'
        ];

        /**
         * Errors advice.
         */

        var advice = parser.advice = [
            'reconnect'
        ];

        /**
         * Shortcuts.
         */

        var JSON = io.JSON,
            indexOf = io.util.indexOf;

        /**
         * Encodes a packet.
         *
         * @api private
         */

        parser.encodePacket = function(packet) {
            var type = indexOf(packets, packet.type),
                id = packet.id || '',
                endpoint = packet.endpoint || '',
                ack = packet.ack,
                data = null;

            switch (packet.type) {
                case 'error':
                    var reason = packet.reason ? indexOf(reasons, packet.reason) : '',
                        adv = packet.advice ? indexOf(advice, packet.advice) : '';

                    if (reason !== '' || adv !== '')
                        data = reason + (adv !== '' ? ('+' + adv) : '');

                    break;

                case 'message':
                    if (packet.data !== '')
                        data = packet.data;
                    break;

                case 'event':
                    var ev = {
                        name: packet.name
                    };

                    if (packet.args && packet.args.length) {
                        ev.args = packet.args;
                    }

                    data = JSON.stringify(ev);
                    break;

                case 'json':
                    data = JSON.stringify(packet.data);
                    break;

                case 'connect':
                    if (packet.qs)
                        data = packet.qs;
                    break;

                case 'ack':
                    data = packet.ackId + (packet.args && packet.args.length ? '+' + JSON.stringify(packet.args) : '');
                    break;
            }

            // construct packet with required fragments
            var encoded = [
                type, id + (ack == 'data' ? '+' : ''), endpoint
            ];

            // data fragment is optional
            if (data !== null && data !== undefined)
                encoded.push(data);

            return encoded.join(':');
        };

        /**
         * Encodes multiple messages (payload).
         *
         * @param {Array} messages
         * @api private
         */

        parser.encodePayload = function(packets) {
            var decoded = '';

            if (packets.length == 1)
                return packets[0];

            for (var i = 0, l = packets.length; i < l; i++) {
                var packet = packets[i];
                decoded += '\ufffd' + packet.length + '\ufffd' + packets[i];
            }

            return decoded;
        };

        /**
         * Decodes a packet
         *
         * @api private
         */

        var regexp = /([^:]+):([0-9]+)?(\+)?:([^:]+)?:?([\s\S]*)?/;

        parser.decodePacket = function(data) {
            var pieces = data.match(regexp);

            if (!pieces) return {};

            var id = pieces[2] || '',
                data = pieces[5] || '',
                packet = {
                    type: packets[pieces[1]],
                    endpoint: pieces[4] || ''
                };

            // whether we need to acknowledge the packet
            if (id) {
                packet.id = id;
                if (pieces[3])
                    packet.ack = 'data';
                else
                    packet.ack = true;
            }

            // handle different packet types
            switch (packet.type) {
                case 'error':
                    var pieces = data.split('+');
                    packet.reason = reasons[pieces[0]] || '';
                    packet.advice = advice[pieces[1]] || '';
                    break;

                case 'message':
                    packet.data = data || '';
                    break;

                case 'event':
                    try {
                        var opts = JSON.parse(data);
                        packet.name = opts.name;
                        packet.args = opts.args;
                    } catch (e) {}

                    packet.args = packet.args || [];
                    break;

                case 'json':
                    try {
                        packet.data = JSON.parse(data);
                    } catch (e) {}
                    break;

                case 'connect':
                    packet.qs = data || '';
                    break;

                case 'ack':
                    var pieces = data.match(/^([0-9]+)(\+)?(.*)/);
                    if (pieces) {
                        packet.ackId = pieces[1];
                        packet.args = [];

                        if (pieces[3]) {
                            try {
                                packet.args = pieces[3] ? JSON.parse(pieces[3]) : [];
                            } catch (e) {}
                        }
                    }
                    break;

                case 'disconnect':
                case 'heartbeat':
                    break;
            };

            return packet;
        };

        /**
         * Decodes data payload. Detects multiple messages
         *
         * @return {Array} messages
         * @api public
         */

        parser.decodePayload = function(data) {
            // IE doesn't like data[i] for unicode chars, charAt works fine
            if (data.charAt(0) == '\ufffd') {
                var ret = [];

                for (var i = 1, length = ''; i < data.length; i++) {
                    if (data.charAt(i) == '\ufffd') {
                        ret.push(parser.decodePacket(data.substr(i + 1).substr(0, length)));
                        i += Number(length) + 1;
                        length = '';
                    } else {
                        length += data.charAt(i);
                    }
                }

                return ret;
            } else {
                return [parser.decodePacket(data)];
            }
        };

    })(
        'undefined' != typeof io ? io : module.exports, 'undefined' != typeof io ? io : module.parent.exports
    );


    (function(exports, io) {

        /**
         * Expose constructor.
         */

        exports.Transport = Transport;

        /**
         * This is the transport template for all supported transport methods.
         *
         * @constructor
         * @api public
         */

        function Transport(socket, sessid) {
            this.socket = socket;
            this.sessid = sessid;
        };

        /**
         * Apply EventEmitter mixin.
         */

        io.util.mixin(Transport, io.EventEmitter);


        /**
         * Indicates whether heartbeats is enabled for this transport
         *
         * @api private
         */

        Transport.prototype.heartbeats = function() {
            return true;
        };

        /**
         * Handles the response from the server. When a new response is received
         * it will automatically update the timeout, decode the message and
         * forwards the response to the onMessage function for further processing.
         *
         * @param {String} data Response from the server.
         * @api private
         */

        Transport.prototype.onData = function(data) {
            this.clearCloseTimeout();

            // If the connection in currently open (or in a reopening state) reset the close
            // timeout since we have just received data. This check is necessary so
            // that we don't reset the timeout on an explicitly disconnected connection.
            if (this.socket.connected || this.socket.connecting || this.socket.reconnecting) {
                this.setCloseTimeout();
            }

            if (data !== '') {
                // todo: we should only do decodePayload for xhr transports
                var msgs = io.parser.decodePayload(data);

                if (msgs && msgs.length) {
                    for (var i = 0, l = msgs.length; i < l; i++) {
                        this.onPacket(msgs[i]);
                    }
                }
            }

            return this;
        };

        /**
         * Handles packets.
         *
         * @api private
         */

        Transport.prototype.onPacket = function(packet) {
            this.socket.setHeartbeatTimeout();

            if (packet.type == 'heartbeat') {
                return this.onHeartbeat();
            }

            if (packet.type == 'connect' && packet.endpoint == '') {
                this.onConnect();
            }

            if (packet.type == 'error' && packet.advice == 'reconnect') {
                this.isOpen = false;
            }

            this.socket.onPacket(packet);

            return this;
        };

        /**
         * Sets close timeout
         *
         * @api private
         */

        Transport.prototype.setCloseTimeout = function() {
            if (!this.closeTimeout) {
                var self = this;

                this.closeTimeout = setTimeout(function() {
                    self.onDisconnect();
                }, this.socket.closeTimeout);
            }
        };

        /**
         * Called when transport disconnects.
         *
         * @api private
         */

        Transport.prototype.onDisconnect = function() {
            if (this.isOpen) this.close();
            this.clearTimeouts();
            this.socket.onDisconnect();
            return this;
        };

        /**
         * Called when transport connects
         *
         * @api private
         */

        Transport.prototype.onConnect = function() {
            this.socket.onConnect();
            return this;
        };

        /**
         * Clears close timeout
         *
         * @api private
         */

        Transport.prototype.clearCloseTimeout = function() {
            if (this.closeTimeout) {
                clearTimeout(this.closeTimeout);
                this.closeTimeout = null;
            }
        };

        /**
         * Clear timeouts
         *
         * @api private
         */

        Transport.prototype.clearTimeouts = function() {
            this.clearCloseTimeout();

            if (this.reopenTimeout) {
                clearTimeout(this.reopenTimeout);
            }
        };

        /**
         * Sends a packet
         *
         * @param {Object} packet object.
         * @api private
         */

        Transport.prototype.packet = function(packet) {
            this.send(io.parser.encodePacket(packet));
        };

        /**
         * Send the received heartbeat message back to server. So the server
         * knows we are still connected.
         *
         * @param {String} heartbeat Heartbeat response from the server.
         * @api private
         */

        Transport.prototype.onHeartbeat = function() {
            this.packet({
                type: 'heartbeat'
            });
        };

        /**
         * Called when the transport opens.
         *
         * @api private
         */

        Transport.prototype.onOpen = function() {
            this.isOpen = true;
            this.clearCloseTimeout();
            this.socket.onOpen();
        };

        /**
         * Notifies the base when the connection with the Socket.IO server
         * has been disconnected.
         *
         * @api private
         */

        Transport.prototype.onClose = function() {
            /* FIXME: reopen delay causing a infinit loop
			var self = this;
    this.reopenTimeout = setTimeout(function () {
      self.open();
    }, this.socket.options['reopen delay']);*/

            this.isOpen = false;
            this.socket.onClose();
            this.onDisconnect();
        };

        /**
         * Generates a connection url based on the Socket.IO URL Protocol.
         * See <https://github.com/learnboost/socket.io-node/> for more details.
         *
         * @returns {String} Connection url
         * @api private
         */

        Transport.prototype.prepareUrl = function() {
            var options = this.socket.options;

            return this.scheme() + '://' + options.host + ':' + options.port + '/' + options.resource + '/' + io.protocol + '/' + this.name + '/' + this.sessid;
        };

        /**
         * Checks if the transport is ready to start a connection.
         *
         * @param {Socket} socket The socket instance that needs a transport
         * @param {Function} fn The callback
         * @api private
         */

        Transport.prototype.ready = function(socket, fn) {
            fn.call(this);
        };
    })(
        'undefined' != typeof io ? io : module.exports, 'undefined' != typeof io ? io : module.parent.exports
    );


    (function(exports, io, global) {

        /**
         * Expose constructor.
         */

        exports.Socket = Socket;

        /**
         * Create a new `Socket.IO client` which can establish a persistent
         * connection with a Socket.IO enabled server.
         *
         * @api public
         */

        function Socket(options) {
            this.options = {
                port: 80,
                secure: false,
                document: 'document' in global ? document : false,
                resource: 'socket.io',
                transports: io.transports,
                'connect timeout': 10000,
                'try multiple transports': true,
                'reconnect': true,
                'reconnection delay': 500,
                'reconnection limit': Infinity,
                'reopen delay': 3000,
                'max reconnection attempts': 10,
                'sync disconnect on unload': false,
                'auto connect': true,
                'flash policy port': 10843,
                'manualFlush': false
            };

            io.util.merge(this.options, options);

            this.connected = false;
            this.open = false;
            this.connecting = false;
            this.reconnecting = false;
            this.namespaces = {};
            this.buffer = [];
            this.doBuffer = false;

            if (this.options['sync disconnect on unload'] &&
                (!this.isXDomain() || io.util.ua.hasCORS)) {
                var self = this;
                io.util.on(global, 'beforeunload', function() {
                    self.disconnectSync();
                }, false);
            }

            if (this.options['auto connect']) {
                this.connect();
            }
        };

        /**
         * Apply EventEmitter mixin.
         */

        io.util.mixin(Socket, io.EventEmitter);

        /**
         * Returns a namespace listener/emitter for this socket
         *
         * @api public
         */

        Socket.prototype.of = function(name) {
            if (!this.namespaces[name]) {
                this.namespaces[name] = new io.SocketNamespace(this, name);

                if (name !== '') {
                    this.namespaces[name].packet({
                        type: 'connect'
                    });
                }
            }

            return this.namespaces[name];
        };

        /**
         * Emits the given event to the Socket and all namespaces
         *
         * @api private
         */

        Socket.prototype.publish = function() {
            this.emit.apply(this, arguments);

            var nsp;

            for (var i in this.namespaces) {
                if (this.namespaces.hasOwnProperty(i)) {
                    nsp = this.of(i);
                    nsp.$emit.apply(nsp, arguments);
                }
            }
        };

        /**
         * Performs the handshake
         *
         * @api private
         */

        function empty() {};

        Socket.prototype.handshake = function(fn) {
            var self = this,
                options = this.options;

            function complete(data) {
                if (data instanceof Error) {
                    self.connecting = false;
                    self.onError(data.message);
                } else {
                    fn.apply(null, data.split(':'));
                }
            };

            var url = [
                'http' + (options.secure ? 's' : '') + ':/', options.host + ':' + options.port, options.resource, io.protocol, io.util.query(this.options.query, 't=' + +new Date)
            ].join('/');

            if (this.isXDomain() && !io.util.ua.hasCORS) {
                var insertAt = document.getElementsByTagName('script')[0],
                    script = document.createElement('script');

                script.src = url + '&jsonp=' + io.j.length;
                insertAt.parentNode.insertBefore(script, insertAt);

                io.j.push(function(data) {
                    complete(data);
                    script.parentNode.removeChild(script);
                });
            } else {
                var xhr = io.util.request();

                xhr.open('GET', url, true);
                if (this.isXDomain()) {
                    xhr.withCredentials = true;
                }
                xhr.onreadystatechange = function() {
                    if (xhr.readyState == 4) {
                        xhr.onreadystatechange = empty;

                        if (xhr.status == 200) {
                            complete(xhr.responseText);
                        } else if (xhr.status == 403) {
                            self.onError(xhr.responseText);
                        } else {
                            self.connecting = false;
                            !self.reconnecting && self.onError(xhr.responseText);
                        }
                    }
                };
                xhr.send(null);
            }
        };

        /**
         * Find an available transport based on the options supplied in the constructor.
         *
         * @api private
         */

        Socket.prototype.getTransport = function(override) {
            var transports = override || this.transports;

            for (var i = 0, transport; transport = transports[i]; i++) {
                if (io.Transport[transport] && io.Transport[transport].check(this) && (!this.isXDomain() || io.Transport[transport].xdomainCheck(this))) {
                    return new io.Transport[transport](this, this.sessionid);
                }
            }

            return null;
        };

        /**
         * Connects to the server.
         *
         * @param {Function} [fn] Callback.
         * @returns {io.Socket}
         * @api public
         */

        Socket.prototype.connect = function(fn) {
            if (this.connecting) {
                return this;
            }

            var self = this;
            self.connecting = true;

            this.handshake(function(sid, heartbeat, close, transports) {
                self.sessionid = sid;
                self.closeTimeout = close * 1000;
                self.heartbeatTimeout = heartbeat * 1000;
                if (!self.transports)
                    self.transports = self.origTransports = (transports ? io.util.intersect(
                        transports.split(','), self.options.transports
                    ) : self.options.transports);

                self.setHeartbeatTimeout();

                function connect(transports) {
                    if (self.transport) self.transport.clearTimeouts();

                    self.transport = self.getTransport(transports);
                    if (!self.transport) return self.publish('connect_failed');

                    // once the transport is ready
                    self.transport.ready(self, function() {
                        self.connecting = true;
                        self.publish('connecting', self.transport.name);
                        self.transport.open();

                        if (self.options['connect timeout']) {
                            self.connectTimeoutTimer = setTimeout(function() {
                                if (!self.connected) {
                                    self.connecting = false;

                                    if (self.options['try multiple transports']) {
                                        var remaining = self.transports;

                                        while (remaining.length > 0 && remaining.splice(0, 1)[0] !=
                                            self.transport.name) {}

                                        if (remaining.length) {
                                            connect(remaining);
                                        } else {
                                            self.publish('connect_failed');
                                        }
                                    }
                                }
                            }, self.options['connect timeout']);
                        }
                    });
                }

                connect(self.transports);

                self.once('connect', function() {
                    clearTimeout(self.connectTimeoutTimer);

                    fn && typeof fn == 'function' && fn();
                });
            });

            return this;
        };

        /**
         * Clears and sets a new heartbeat timeout using the value given by the
         * server during the handshake.
         *
         * @api private
         */

        Socket.prototype.setHeartbeatTimeout = function() {
            clearTimeout(this.heartbeatTimeoutTimer);
            if (this.transport && !this.transport.heartbeats()) return;

            var self = this;
            this.heartbeatTimeoutTimer = setTimeout(function() {
                self.transport.onClose();
            }, this.heartbeatTimeout);
        };

        /**
         * Sends a message.
         *
         * @param {Object} data packet.
         * @returns {io.Socket}
         * @api public
         */

        Socket.prototype.packet = function(data) {
            if (this.connected && !this.doBuffer) {
                this.transport.packet(data);
            } else {
                this.buffer.push(data);
            }

            return this;
        };

        /**
         * Sets buffer state
         *
         * @api private
         */

        Socket.prototype.setBuffer = function(v) {
            this.doBuffer = v;

            if (!v && this.connected && this.buffer.length) {
                if (!this.options['manualFlush']) {
                    this.flushBuffer();
                }
            }
        };

        /**
         * Flushes the buffer data over the wire.
         * To be invoked manually when 'manualFlush' is set to true.
         *
         * @api public
         */

        Socket.prototype.flushBuffer = function() {
            this.transport.payload(this.buffer);
            this.buffer = [];
        };


        /**
         * Disconnect the established connect.
         *
         * @returns {io.Socket}
         * @api public
         */

        Socket.prototype.disconnect = function() {
            if (this.connected || this.connecting) {
                if (this.open) {
                    this.of('').packet({
                        type: 'disconnect'
                    });
                }

                // handle disconnection immediately
                this.onDisconnect('booted');
            }

            return this;
        };

        /**
         * Disconnects the socket with a sync XHR.
         *
         * @api private
         */

        Socket.prototype.disconnectSync = function() {
            // ensure disconnection
            var xhr = io.util.request();
            var uri = [
                'http' + (this.options.secure ? 's' : '') + ':/', this.options.host + ':' + this.options.port, this.options.resource, io.protocol, '', this.sessionid
            ].join('/') + '/?disconnect=1';

            xhr.open('GET', uri, false);
            xhr.send(null);

            // handle disconnection immediately
            this.onDisconnect('booted');
        };

        /**
         * Check if we need to use cross domain enabled transports. Cross domain would
         * be a different port or different domain name.
         *
         * @returns {Boolean}
         * @api private
         */

        Socket.prototype.isXDomain = function() {

            var port = global.location.port ||
                ('https:' == global.location.protocol ? 443 : 80);

            return this.options.host !== global.location.hostname || this.options.port != port;
        };

        /**
         * Called upon handshake.
         *
         * @api private
         */

        Socket.prototype.onConnect = function() {
            if (!this.connected) {
                this.connected = true;
                this.connecting = false;
                if (!this.doBuffer) {
                    // make sure to flush the buffer
                    this.setBuffer(false);
                }
                this.emit('connect');
            }
        };

        /**
         * Called when the transport opens
         *
         * @api private
         */

        Socket.prototype.onOpen = function() {
            this.open = true;
        };

        /**
         * Called when the transport closes.
         *
         * @api private
         */

        Socket.prototype.onClose = function() {
            this.open = false;
            clearTimeout(this.heartbeatTimeoutTimer);
        };

        /**
         * Called when the transport first opens a connection
         *
         * @param text
         */

        Socket.prototype.onPacket = function(packet) {
            this.of(packet.endpoint).onPacket(packet);
        };

        /**
         * Handles an error.
         *
         * @api private
         */

        Socket.prototype.onError = function(err) {
            if (err && err.advice) {
                if (err.advice === 'reconnect' && (this.connected || this.connecting)) {
                    this.disconnect();
                    if (this.options.reconnect) {
                        this.reconnect();
                    }
                }
            }

            this.publish('error', err && err.reason ? err.reason : err);
        };

        /**
         * Called when the transport disconnects.
         *
         * @api private
         */

        Socket.prototype.onDisconnect = function(reason) {
            var wasConnected = this.connected,
                wasConnecting = this.connecting;

            this.connected = false;
            this.connecting = false;
            this.open = false;

            if (wasConnected || wasConnecting) {
                this.transport.close();
                this.transport.clearTimeouts();
                if (wasConnected) {
                    this.publish('disconnect', reason);

                    if ('booted' != reason && this.options.reconnect && !this.reconnecting) {
                        this.reconnect();
                    }
                }
            }
        };

        /**
         * Called upon reconnection.
         *
         * @api private
         */

        Socket.prototype.reconnect = function() {
            this.reconnecting = true;
            this.reconnectionAttempts = 0;
            this.reconnectionDelay = this.options['reconnection delay'];

            var self = this,
                maxAttempts = this.options['max reconnection attempts'],
                tryMultiple = this.options['try multiple transports'],
                limit = this.options['reconnection limit'];

            function reset() {
                if (self.connected) {
                    for (var i in self.namespaces) {
                        if (self.namespaces.hasOwnProperty(i) && '' !== i) {
                            self.namespaces[i].packet({
                                type: 'connect'
                            });
                        }
                    }
                    self.publish('reconnect', self.transport.name, self.reconnectionAttempts);
                }

                clearTimeout(self.reconnectionTimer);

                self.removeListener('connect_failed', maybeReconnect);
                self.removeListener('connect', maybeReconnect);

                self.reconnecting = false;

                delete self.reconnectionAttempts;
                delete self.reconnectionDelay;
                delete self.reconnectionTimer;
                delete self.redoTransports;

                self.options['try multiple transports'] = tryMultiple;
            };

            function maybeReconnect() {
                if (!self.reconnecting) {
                    return;
                }

                if (self.connected) {
                    return reset();
                };

                if (self.connecting && self.reconnecting) {
                    return self.reconnectionTimer = setTimeout(maybeReconnect, 1000);
                }

                if (self.reconnectionAttempts++ >= maxAttempts) {
                    if (!self.redoTransports) {
                        self.on('connect_failed', maybeReconnect);
                        self.options['try multiple transports'] = true;
                        self.transports = self.origTransports;
                        self.transport = self.getTransport();
                        self.redoTransports = true;
                        self.connect();
                    } else {
                        self.publish('reconnect_failed');
                        reset();
                    }
                } else {
                    if (self.reconnectionDelay < limit) {
                        self.reconnectionDelay *= 2; // exponential back off
                    }

                    self.connect();
                    self.publish('reconnecting', self.reconnectionDelay, self.reconnectionAttempts);
                    self.reconnectionTimer = setTimeout(maybeReconnect, self.reconnectionDelay);
                }
            };

            this.options['try multiple transports'] = false;
            this.reconnectionTimer = setTimeout(maybeReconnect, this.reconnectionDelay);

            this.on('connect', maybeReconnect);
        };

    })(
        'undefined' != typeof io ? io : module.exports, 'undefined' != typeof io ? io : module.parent.exports, this
    );

    (function(exports, io) {

        /**
         * Expose constructor.
         */

        exports.SocketNamespace = SocketNamespace;

        /**
         * Socket namespace constructor.
         *
         * @constructor
         * @api public
         */

        function SocketNamespace(socket, name) {
            this.socket = socket;
            this.name = name || '';
            this.flags = {};
            this.json = new Flag(this, 'json');
            this.ackPackets = 0;
            this.acks = {};
        };

        /**
         * Apply EventEmitter mixin.
         */

        io.util.mixin(SocketNamespace, io.EventEmitter);

        /**
         * Copies emit since we override it
         *
         * @api private
         */

        SocketNamespace.prototype.$emit = io.EventEmitter.prototype.emit;

        /**
         * Creates a new namespace, by proxying the request to the socket. This
         * allows us to use the synax as we do on the server.
         *
         * @api public
         */

        SocketNamespace.prototype.of = function() {
            return this.socket.of.apply(this.socket, arguments);
        };

        /**
         * Sends a packet.
         *
         * @api private
         */

        SocketNamespace.prototype.packet = function(packet) {
            packet.endpoint = this.name;
            this.socket.packet(packet);
            this.flags = {};
            return this;
        };

        /**
         * Sends a message
         *
         * @api public
         */

        SocketNamespace.prototype.send = function(data, fn) {
            var packet = {
                type: this.flags.json ? 'json' : 'message',
                data: data
            };

            if ('function' == typeof fn) {
                packet.id = ++this.ackPackets;
                packet.ack = true;
                this.acks[packet.id] = fn;
            }

            return this.packet(packet);
        };

        /**
         * Emits an event
         *
         * @api public
         */

        SocketNamespace.prototype.emit = function(name) {
            var args = Array.prototype.slice.call(arguments, 1),
                lastArg = args[args.length - 1],
                packet = {
                    type: 'event',
                    name: name
                };

            if ('function' == typeof lastArg) {
                packet.id = ++this.ackPackets;
                packet.ack = 'data';
                this.acks[packet.id] = lastArg;
                args = args.slice(0, args.length - 1);
            }

            packet.args = args;

            return this.packet(packet);
        };

        /**
         * Disconnects the namespace
         *
         * @api private
         */

        SocketNamespace.prototype.disconnect = function() {
            if (this.name === '') {
                this.socket.disconnect();
            } else {
                this.packet({
                    type: 'disconnect'
                });
                this.$emit('disconnect');
            }

            return this;
        };

        /**
         * Handles a packet
         *
         * @api private
         */

        SocketNamespace.prototype.onPacket = function(packet) {
            var self = this;

            function ack() {
                self.packet({
                    type: 'ack',
                    args: io.util.toArray(arguments),
                    ackId: packet.id
                });
            };

            switch (packet.type) {
                case 'connect':
                    this.$emit('connect');
                    break;

                case 'disconnect':
                    if (this.name === '') {
                        this.socket.onDisconnect(packet.reason || 'booted');
                    } else {
                        this.$emit('disconnect', packet.reason);
                    }
                    break;

                case 'message':
                case 'json':
                    var params = ['message', packet.data];

                    if (packet.ack == 'data') {
                        params.push(ack);
                    } else if (packet.ack) {
                        this.packet({
                            type: 'ack',
                            ackId: packet.id
                        });
                    }

                    this.$emit.apply(this, params);
                    break;

                case 'event':
                    var params = [packet.name].concat(packet.args);

                    if (packet.ack == 'data')
                        params.push(ack);

                    this.$emit.apply(this, params);
                    break;

                case 'ack':
                    if (this.acks[packet.ackId]) {
                        this.acks[packet.ackId].apply(this, packet.args);
                        delete this.acks[packet.ackId];
                    }
                    break;

                case 'error':
                    if (packet.advice) {
                        this.socket.onError(packet);
                    } else {
                        if (packet.reason == 'unauthorized') {
                            this.$emit('connect_failed', packet.reason);
                        } else {
                            this.$emit('error', packet.reason);
                        }
                    }
                    break;
            }
        };

        /**
         * Flag interface.
         *
         * @api private
         */

        function Flag(nsp, name) {
            this.namespace = nsp;
            this.name = name;
        };

        /**
         * Send a message
         *
         * @api public
         */

        Flag.prototype.send = function() {
            this.namespace.flags[this.name] = true;
            this.namespace.send.apply(this.namespace, arguments);
        };

        /**
         * Emit an event
         *
         * @api public
         */

        Flag.prototype.emit = function() {
            this.namespace.flags[this.name] = true;
            this.namespace.emit.apply(this.namespace, arguments);
        };

    })(
        'undefined' != typeof io ? io : module.exports, 'undefined' != typeof io ? io : module.parent.exports
    );

    (function(exports, io, global) {

        /**
         * Expose constructor.
         */

        exports.websocket = WS;

        /**
         * The WebSocket transport uses the HTML5 WebSocket API to establish an
         * persistent connection with the Socket.IO server. This transport will also
         * be inherited by the FlashSocket fallback as it provides a API compatible
         * polyfill for the WebSockets.
         *
         * @constructor
         * @extends {io.Transport}
         * @api public
         */

        function WS() {
            io.Transport.apply(this, arguments);
        };

        /**
         * Inherits from Transport.
         */

        io.util.inherit(WS, io.Transport);

        /**
         * Transport name
         *
         * @api public
         */

        WS.prototype.name = 'websocket';

        /**
         * Initializes a new `WebSocket` connection with the Socket.IO server. We attach
         * all the appropriate listeners to handle the responses from the server.
         *
         * @returns {Transport}
         * @api public
         */

        WS.prototype.open = function() {
            var query = io.util.query(this.socket.options.query),
                self = this,
                Socket


            if (!Socket) {
                Socket = global.MozWebSocket || global.WebSocket;
            }

            this.websocket = new Socket(this.prepareUrl() + query);

            this.websocket.onopen = function() {
                self.onOpen();
                self.socket.setBuffer(false);
            };
            this.websocket.onmessage = function(ev) {
                self.onData(ev.data);
            };
            this.websocket.onclose = function() {
                self.onClose();
                self.socket.setBuffer(true);
            };
            this.websocket.onerror = function(e) {
                self.onError(e);
            };

            return this;
        };

        /**
         * Send a message to the Socket.IO server. The message will automatically be
         * encoded in the correct message format.
         *
         * @returns {Transport}
         * @api public
         */

        // Do to a bug in the current IDevices browser, we need to wrap the send in a 
        // setTimeout, when they resume from sleeping the browser will crash if 
        // we don't allow the browser time to detect the socket has been closed
        if (io.util.ua.iDevice) {
            WS.prototype.send = function(data) {
                var self = this;
                setTimeout(function() {
                    self.websocket.send(data);
                }, 0);
                return this;
            };
        } else {
            WS.prototype.send = function(data) {
                this.websocket.send(data);
                return this;
            };
        }

        /**
         * Payload
         *
         * @api private
         */

        WS.prototype.payload = function(arr) {
            for (var i = 0, l = arr.length; i < l; i++) {
                this.packet(arr[i]);
            }
            return this;
        };

        /**
         * Disconnect the established `WebSocket` connection.
         *
         * @returns {Transport}
         * @api public
         */

        WS.prototype.close = function() {
            this.websocket.close();
            return this;
        };

        /**
         * Handle the errors that `WebSocket` might be giving when we
         * are attempting to connect or send messages.
         *
         * @param {Error} e The error.
         * @api private
         */

        WS.prototype.onError = function(e) {
            this.socket.onError(e);
        };

        /**
         * Returns the appropriate scheme for the URI generation.
         *
         * @api private
         */
        WS.prototype.scheme = function() {
            return this.socket.options.secure ? 'wss' : 'ws';
        };

        /**
         * Checks if the browser has support for native `WebSockets` and that
         * it's not the polyfill created for the FlashSocket transport.
         *
         * @return {Boolean}
         * @api public
         */

        WS.check = function() {
            return ('WebSocket' in global && !('__addTask' in WebSocket)) || 'MozWebSocket' in global;
        };

        /**
         * Check if the `WebSocket` transport support cross domain communications.
         *
         * @returns {Boolean}
         * @api public
         */

        WS.xdomainCheck = function() {
            return true;
        };

        /**
         * Add the transport to your public io.transports array.
         *
         * @api private
         */

        io.transports.push('websocket');

    })(
        'undefined' != typeof io ? io.Transport : module.exports, 'undefined' != typeof io ? io : module.parent.exports, this
    );


    (function(exports, io, global) {

        /**
         * Expose constructor.
         *
         * @api public
         */

        exports.XHR = XHR;

        /**
         * XHR constructor
         *
         * @costructor
         * @api public
         */

        function XHR(socket) {
            if (!socket) return;

            io.Transport.apply(this, arguments);
            this.sendBuffer = [];
        };

        /**
         * Inherits from Transport.
         */

        io.util.inherit(XHR, io.Transport);

        /**
         * Establish a connection
         *
         * @returns {Transport}
         * @api public
         */

        XHR.prototype.open = function() {
            this.socket.setBuffer(false);
            this.onOpen();
            this.get();

            // we need to make sure the request succeeds since we have no indication
            // whether the request opened or not until it succeeded.
            this.setCloseTimeout();

            return this;
        };

        /**
         * Check if we need to send data to the Socket.IO server, if we have data in our
         * buffer we encode it and forward it to the `post` method.
         *
         * @api private
         */

        XHR.prototype.payload = function(payload) {
            var msgs = [];

            for (var i = 0, l = payload.length; i < l; i++) {
                msgs.push(io.parser.encodePacket(payload[i]));
            }

            this.send(io.parser.encodePayload(msgs));
        };

        /**
         * Send data to the Socket.IO server.
         *
         * @param data The message
         * @returns {Transport}
         * @api public
         */

        XHR.prototype.send = function(data) {
            this.post(data);
            return this;
        };

        /**
         * Posts a encoded message to the Socket.IO server.
         *
         * @param {String} data A encoded message.
         * @api private
         */

        function empty() {};

        XHR.prototype.post = function(data) {
            var self = this;
            this.socket.setBuffer(true);

            function stateChange() {
                if (this.readyState == 4) {
                    this.onreadystatechange = empty;
                    self.posting = false;

                    if (this.status == 200) {
                        self.socket.setBuffer(false);
                    } else {
                        self.onClose();
                    }
                }
            }

            function onload() {
                this.onload = empty;
                self.socket.setBuffer(false);
            };

            this.sendXHR = this.request('POST');

            if (global.XDomainRequest && this.sendXHR instanceof XDomainRequest) {
                this.sendXHR.onload = this.sendXHR.onerror = onload;
            } else {
                this.sendXHR.onreadystatechange = stateChange;
            }

            this.sendXHR.send(data);
        };

        /**
         * Disconnects the established `XHR` connection.
         *
         * @returns {Transport}
         * @api public
         */

        XHR.prototype.close = function() {
            this.onClose();
            return this;
        };

        /**
         * Generates a configured XHR request
         *
         * @param {String} url The url that needs to be requested.
         * @param {String} method The method the request should use.
         * @returns {XMLHttpRequest}
         * @api private
         */

        XHR.prototype.request = function(method) {
            var req = io.util.request(this.socket.isXDomain()),
                query = io.util.query(this.socket.options.query, 't=' + +new Date);

            req.open(method || 'GET', this.prepareUrl() + query, true);

            if (method == 'POST') {
                try {
                    if (req.setRequestHeader) {
                        req.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
                    } else {
                        // XDomainRequest
                        req.contentType = 'text/plain';
                    }
                } catch (e) {}
            }

            return req;
        };

        /**
         * Returns the scheme to use for the transport URLs.
         *
         * @api private
         */

        XHR.prototype.scheme = function() {
            return this.socket.options.secure ? 'https' : 'http';
        };

        /**
         * Check if the XHR transports are supported
         *
         * @param {Boolean} xdomain Check if we support cross domain requests.
         * @returns {Boolean}
         * @api public
         */

        XHR.check = function(socket, xdomain) {
            try {
                var request = io.util.request(xdomain),
                    usesXDomReq = (global.XDomainRequest && request instanceof XDomainRequest),
                    socketProtocol = (socket && socket.options && socket.options.secure ? 'https:' : 'http:'),
                    isXProtocol = (global.location && socketProtocol != global.location.protocol);
                if (request && !(usesXDomReq && isXProtocol)) {
                    return true;
                }
            } catch (e) {}

            return false;
        };

        /**
         * Check if the XHR transport supports cross domain requests.
         *
         * @returns {Boolean}
         * @api public
         */

        XHR.xdomainCheck = function(socket) {
            return XHR.check(socket, true);
        };

    })(
        'undefined' != typeof io ? io.Transport : module.exports, 'undefined' != typeof io ? io : module.parent.exports, this
    );

    (function(exports, io) {

        /**
         * Expose constructor.
         */

        exports.htmlfile = HTMLFile;

        /**
         * The HTMLFile transport creates a `forever iframe` based transport
         * for Internet Explorer. Regular forever iframe implementations will
         * continuously trigger the browsers buzy indicators. If the forever iframe
         * is created inside a `htmlfile` these indicators will not be trigged.
         *
         * @constructor
         * @extends {io.Transport.XHR}
         * @api public
         */

        function HTMLFile() {
            io.Transport.XHR.apply(this, arguments);
        };

        /**
         * Inherits from XHR transport.
         */

        io.util.inherit(HTMLFile, io.Transport.XHR);

        /**
         * Transport name
         *
         * @api public
         */

        HTMLFile.prototype.name = 'htmlfile';

        /**
         * Creates a new Ac...eX `htmlfile` with a forever loading iframe
         * that can be used to listen to messages. Inside the generated
         * `htmlfile` a reference will be made to the HTMLFile transport.
         *
         * @api private
         */

        HTMLFile.prototype.get = function() {
            this.doc = new window[(['Active'].concat('Object').join('X'))]('htmlfile');
            this.doc.open();
            this.doc.write('<html></html>');
            this.doc.close();
            this.doc.parentWindow.s = this;

            var iframeC = this.doc.createElement('div');
            iframeC.className = 'socketio';

            this.doc.body.appendChild(iframeC);
            this.iframe = this.doc.createElement('iframe');

            iframeC.appendChild(this.iframe);

            var self = this,
                query = io.util.query(this.socket.options.query, 't=' + +new Date);

            this.iframe.src = this.prepareUrl() + query;

            io.util.on(window, 'unload', function() {
                self.destroy();
            });
        };

        /**
         * The Socket.IO server will write script tags inside the forever
         * iframe, this function will be used as callback for the incoming
         * information.
         *
         * @param {String} data The message
         * @param {document} doc Reference to the context
         * @api private
         */

        HTMLFile.prototype._ = function(data, doc) {
            // unescape all forward slashes. see GH-1251
            data = data.replace(/\\\//g, '/');
            this.onData(data);
            try {
                var script = doc.getElementsByTagName('script')[0];
                script.parentNode.removeChild(script);
            } catch (e) {}
        };

        /**
         * Destroy the established connection, iframe and `htmlfile`.
         * And calls the `CollectGarbage` function of Internet Explorer
         * to release the memory.
         *
         * @api private
         */

        HTMLFile.prototype.destroy = function() {
            if (this.iframe) {
                try {
                    this.iframe.src = 'about:blank';
                } catch (e) {}

                this.doc = null;
                this.iframe.parentNode.removeChild(this.iframe);
                this.iframe = null;

                CollectGarbage();
            }
        };

        /**
         * Disconnects the established connection.
         *
         * @returns {Transport} Chaining.
         * @api public
         */

        HTMLFile.prototype.close = function() {
            this.destroy();
            return io.Transport.XHR.prototype.close.call(this);
        };

        /**
         * Checks if the browser supports this transport. The browser
         * must have an `Ac...eXObject` implementation.
         *
         * @return {Boolean}
         * @api public
         */

        HTMLFile.check = function(socket) {
            if (typeof window != "undefined" && (['Active'].concat('Object').join('X')) in window) {
                try {
                    var a = new window[(['Active'].concat('Object').join('X'))]('htmlfile');
                    return a && io.Transport.XHR.check(socket);
                } catch (e) {}
            }
            return false;
        };

        /**
         * Check if cross domain requests are supported.
         *
         * @returns {Boolean}
         * @api public
         */

        HTMLFile.xdomainCheck = function() {
            // we can probably do handling for sub-domains, we should
            // test that it's cross domain but a subdomain here
            return false;
        };

        /**
         * Add the transport to your public io.transports array.
         *
         * @api private
         */

        io.transports.push('htmlfile');

    })(
        'undefined' != typeof io ? io.Transport : module.exports, 'undefined' != typeof io ? io : module.parent.exports
    );


    (function(exports, io, global) {

        /**
         * Expose constructor.
         */

        exports['xhr-polling'] = XHRPolling;

        /**
         * The XHR-polling transport uses long polling XHR requests to create a
         * "persistent" connection with the server.
         *
         * @constructor
         * @api public
         */

        function XHRPolling() {
            io.Transport.XHR.apply(this, arguments);
        };

        /**
         * Inherits from XHR transport.
         */

        io.util.inherit(XHRPolling, io.Transport.XHR);

        /**
         * Merge the properties from XHR transport
         */

        io.util.merge(XHRPolling, io.Transport.XHR);

        /**
         * Transport name
         *
         * @api public
         */

        XHRPolling.prototype.name = 'xhr-polling';

        /**
         * Indicates whether heartbeats is enabled for this transport
         *
         * @api private
         */

        XHRPolling.prototype.heartbeats = function() {
            return false;
        };

        /** 
         * Establish a connection, for iPhone and Android this will be done once the page
         * is loaded.
         *
         * @returns {Transport} Chaining.
         * @api public
         */

        XHRPolling.prototype.open = function() {
            var self = this;

            io.Transport.XHR.prototype.open.call(self);
            return false;
        };

        /**
         * Starts a XHR request to wait for incoming messages.
         *
         * @api private
         */

        function empty() {};

        XHRPolling.prototype.get = function() {
            if (!this.isOpen) return;

            var self = this;

            function stateChange() {
                if (this.readyState == 4) {
                    this.onreadystatechange = empty;

                    if (this.status == 200) {
                        self.onData(this.responseText);
                        self.get();
                    } else {
                        self.onClose();
                    }
                }
            };

            function onload() {
                this.onload = empty;
                this.onerror = empty;
                self.retryCounter = 1;
                self.onData(this.responseText);
                self.get();
            };

            function onerror() {
                self.retryCounter++;
                if (!self.retryCounter || self.retryCounter > 3) {
                    self.onClose();
                } else {
                    self.get();
                }
            };

            this.xhr = this.request();

            if (global.XDomainRequest && this.xhr instanceof XDomainRequest) {
                this.xhr.onload = onload;
                this.xhr.onerror = onerror;
            } else {
                this.xhr.onreadystatechange = stateChange;
            }

            this.xhr.send(null);
        };

        /**
         * Handle the unclean close behavior.
         *
         * @api private
         */

        XHRPolling.prototype.onClose = function() {
            io.Transport.XHR.prototype.onClose.call(this);

            if (this.xhr) {
                this.xhr.onreadystatechange = this.xhr.onload = this.xhr.onerror = empty;
                try {
                    this.xhr.abort();
                } catch (e) {}
                this.xhr = null;
            }
        };

        /**
         * Webkit based browsers show a infinit spinner when you start a XHR request
         * before the browsers onload event is called so we need to defer opening of
         * the transport until the onload event is called. Wrapping the cb in our
         * defer method solve this.
         *
         * @param {Socket} socket The socket instance that needs a transport
         * @param {Function} fn The callback
         * @api private
         */

        XHRPolling.prototype.ready = function(socket, fn) {
            var self = this;

            io.util.defer(function() {
                fn.call(self, socket);
            });
        };

        /**
         * Add the transport to your public io.transports array.
         *
         * @api private
         */

        io.transports.push('xhr-polling');

    })(
        'undefined' != typeof io ? io.Transport : module.exports, 'undefined' != typeof io ? io : module.parent.exports, this
    );


    (function(exports, io, global) {
        /**
         * There is a way to hide the loading indicator in Firefox. If you create and
         * remove a iframe it will stop showing the current loading indicator.
         * Unfortunately we can't feature detect that and UA sniffing is evil.
         *
         * @api private
         */

        var indicator = global.document && "MozAppearance" in
            global.document.documentElement.style;

        /**
         * Expose constructor.
         */

        exports['jsonp-polling'] = JSONPPolling;

        /**
         * The JSONP transport creates an persistent connection by dynamically
         * inserting a script tag in the page. This script tag will receive the
         * information of the Socket.IO server. When new information is received
         * it creates a new script tag for the new data stream.
         *
         * @constructor
         * @extends {io.Transport.xhr-polling}
         * @api public
         */

        function JSONPPolling() {
            io.Transport['xhr-polling'].apply(this, arguments);

            this.index = io.j.length;

            var self = this;

            io.j.push(function(msg) {
                self._(msg);
            });
        };

        /**
         * Inherits from XHR polling transport.
         */

        io.util.inherit(JSONPPolling, io.Transport['xhr-polling']);

        /**
         * Transport name
         *
         * @api public
         */

        JSONPPolling.prototype.name = 'jsonp-polling';

        /**
         * Posts a encoded message to the Socket.IO server using an iframe.
         * The iframe is used because script tags can create POST based requests.
         * The iframe is positioned outside of the view so the user does not
         * notice it's existence.
         *
         * @param {String} data A encoded message.
         * @api private
         */

        JSONPPolling.prototype.post = function(data) {
            var self = this,
                query = io.util.query(
                    this.socket.options.query, 't=' + (+new Date) + '&i=' + this.index
                );

            if (!this.form) {
                var form = document.createElement('form'),
                    area = document.createElement('textarea'),
                    id = this.iframeId = 'socketio_iframe_' + this.index,
                    iframe;

                form.className = 'socketio';
                form.style.position = 'absolute';
                form.style.top = '0px';
                form.style.left = '0px';
                form.style.display = 'none';
                form.target = id;
                form.method = 'POST';
                form.setAttribute('accept-charset', 'utf-8');
                area.name = 'd';
                form.appendChild(area);
                document.body.appendChild(form);

                this.form = form;
                this.area = area;
            }

            this.form.action = this.prepareUrl() + query;

            function complete() {
                initIframe();
                self.socket.setBuffer(false);
            };

            function initIframe() {
                if (self.iframe) {
                    self.form.removeChild(self.iframe);
                }

                try {
                    // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
                    iframe = document.createElement('<iframe name="' + self.iframeId + '">');
                } catch (e) {
                    iframe = document.createElement('iframe');
                    iframe.name = self.iframeId;
                }

                iframe.id = self.iframeId;

                self.form.appendChild(iframe);
                self.iframe = iframe;
            };

            initIframe();

            // we temporarily stringify until we figure out how to prevent
            // browsers from turning `\n` into `\r\n` in form inputs
            this.area.value = io.JSON.stringify(data);

            try {
                this.form.submit();
            } catch (e) {}

            if (this.iframe.attachEvent) {
                iframe.onreadystatechange = function() {
                    if (self.iframe.readyState == 'complete') {
                        complete();
                    }
                };
            } else {
                this.iframe.onload = complete;
            }

            this.socket.setBuffer(true);
        };

        /**
         * Creates a new JSONP poll that can be used to listen
         * for messages from the Socket.IO server.
         *
         * @api private
         */

        JSONPPolling.prototype.get = function() {
            var self = this,
                script = document.createElement('script'),
                query = io.util.query(
                    this.socket.options.query, 't=' + (+new Date) + '&i=' + this.index
                );

            if (this.script) {
                this.script.parentNode.removeChild(this.script);
                this.script = null;
            }

            script.async = true;
            script.src = this.prepareUrl() + query;
            script.onerror = function() {
                self.onClose();
            };

            var insertAt = document.getElementsByTagName('script')[0];
            insertAt.parentNode.insertBefore(script, insertAt);
            this.script = script;

            if (indicator) {
                setTimeout(function() {
                    var iframe = document.createElement('iframe');
                    document.body.appendChild(iframe);
                    document.body.removeChild(iframe);
                }, 100);
            }
        };

        /**
         * Callback function for the incoming message stream from the Socket.IO server.
         *
         * @param {String} data The message
         * @api private
         */

        JSONPPolling.prototype._ = function(msg) {
            this.onData(msg);
            if (this.isOpen) {
                this.get();
            }
            return this;
        };

        /**
         * The indicator hack only works after onload
         *
         * @param {Socket} socket The socket instance that needs a transport
         * @param {Function} fn The callback
         * @api private
         */

        JSONPPolling.prototype.ready = function(socket, fn) {
            var self = this;
            if (!indicator) return fn.call(this);

            io.util.load(function() {
                fn.call(self);
            });
        };

        /**
         * Checks if browser supports this transport.
         *
         * @return {Boolean}
         * @api public
         */

        JSONPPolling.check = function() {
            return 'document' in global;
        };

        /**
         * Check if cross domain requests are supported
         *
         * @returns {Boolean}
         * @api public
         */

        JSONPPolling.xdomainCheck = function() {
            return true;
        };

        /**
         * Add the transport to your public io.transports array.
         *
         * @api private
         */

        io.transports.push('jsonp-polling');

    })(
        'undefined' != typeof io ? io.Transport : module.exports, 'undefined' != typeof io ? io : module.parent.exports, this
    );

    if (typeof define === "function" && define.amd) {
        define('base/socket.io', [], function() {
            return io;
        });
    }
})();


define(
    'base/time', [], function() {



        var w = typeof(window) !== "undefined" ? window : {},
            performance = typeof(w.performance) !== "undefined" ? w.performance : {},
            defineProperty = Object.defineProperty,
            START_MS = Date.now(),
            START = START_MS * 0.001,
            delta = 1 / 60,
            fixedDelta = delta,
            globalFixed = delta,
            scale = 1;


        performance.now = (
            performance.now ||
            performance.webkitNow ||
            performance.mozNow ||
            performance.msNow ||
            performance.oNow ||
            function() {
                return Date.now() - START_MS;
            }
        );

        function now() {

            return performance.now() * 0.001;
        }


        function Time() {

            this.start = START;
            this.sinceStart = 0;
            this.time = 0;
            this.fps = 60;
            this.delta = delta;
            this.frameCount = 0;

            defineProperty(this, "scale", {
                get: function() {
                    return scale;
                },
                set: function(value) {
                    scale = value;
                    fixedDelta = globalFixed * value
                }
            });

            defineProperty(this, "fixedDelta", {
                get: function() {
                    return fixedDelta;
                },
                set: function(value) {
                    globalFixed = value;
                    fixedDelta = globalFixed * scale;
                }
            });
        }


        Time.prototype.now = now;


        Time.prototype.stamp = function() {

            return START + now();
        };


        return new Time;
    }
);


define('core/assets/asset', [
        "core/game/log",
        "base/class"
    ],
    function(Log, Class) {



        var defineProperty = Object.defineProperty;


        function Asset(opts) {
            opts || (opts = {});

            Class.call(this);

            this._type = this.constructor.name || "UnknownAsset";
            this._name = opts.name != undefined ? opts.name : "Asset-" + this._id;

            this.json = opts.json != undefined ? !! opts.json : true;

            this.assets = undefined;
            this.src = opts.src;
            this.raw = opts.raw;
        }

        Class.extend(Asset);

        Asset.type = "Asset";
        Asset._types = {
            Asset: Asset
        };
        Asset.prototype._onExtend = function(child) {

            Asset._types[child.type] = child;
        }

        defineProperty(Asset.prototype, "name", {
            get: function() {
                return this._name;
            },
            set: function(value) {
                var assets = this.assets,
                    hash;

                if (assets) {
                    hash = assets.hash;

                    if (hash[value]) {
                        Log.warn("Asset.set name: can't change name to " + value + " Assets already have an asset with same name");
                        return;
                    }

                    delete hash[this.name];
                    hash[value] = this;
                }

                this._name = value;
            }
        });


        Asset.prototype.clone = function() {

            return new this.constructor().copy(this);
        };


        Asset.prototype.copy = function(other) {

            this.sync = other.sync;
            this.json = other.json;

            this.name = other.name + "." + this._id;
            this.src = other.src;
            this.raw = other.raw;

            if (this.assets !== other.assets) other.assets.addAsset(this);

            return this;
        };


        Asset.prototype.ext = function() {

            return this.src ? this.src.split(".").pop() : false;
        };


        Asset.prototype.clear = function() {

            this.raw = null;
            return this;
        };


        Asset.prototype.destroy = function() {
            if (!this.assets) {
                Log.warn("Asset.destroy: can't destroy Asset if it's not added to Assets");
                return this;
            }

            this.assets.removeAsset(this);
            this.clear();

            return this;
        };


        Asset.prototype.parse = function(raw) {

            this.raw = raw;
            return this;
        };


        Asset.prototype.toJSON = function(json, pack) {
            json = Class.prototype.toJSON.call(this, json);

            json._type = this._type;

            json.name = this.name;
            if (!pack) json.src = this.src;

            return json;
        };


        Asset.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);

            this._type = json._type;

            this.name = json.name;
            this.src = json.src;

            return this;
        };


        return Asset;
    }
);


define('core/assets/assets', [
        "core/assets/asset",
        "core/game/log"
    ],
    function(Asset, Log) {



        function Assets() {

            Array.call(this);

            this.hash = {};
        }

        Assets.prototype = Object.create(Array.prototype);
        Assets.prototype.constructor = Assets;


        Assets.prototype.addAsset = function(asset) {
            var name = asset.name;

            if (this.hash[name]) {
                Log.warn("Assets.addAsset: Assets already have Asset named " + asset.name);
                return undefined;
            }

            asset.assets = this;
            this.push(asset);
            this.hash[name] = asset;

            return asset;
        };


        Assets.prototype.add = Assets.prototype.addAssets = function() {

            for (var i = arguments.length; i--;) this.addAsset(arguments[i]);
        };


        Assets.prototype.removeAsset = function(asset) {
            var name = typeof(asset) === "string" ? asset : asset.name;
            asset = this.hash[name];

            if (!asset) {
                Log.warn("Assets.removeAsset: Assets does not have an Asset named " + name);
                return undefined;
            }

            this.splice(this.indexOf(asset), 1);
            this.hash[name] = null;

            return asset;
        };


        Assets.prototype.remove = Assets.prototype.removeAssets = function() {

            for (var i = arguments.length; i--;) this.removeAsset(arguments[i]);
        };


        Assets.prototype.toJSON = function(json, pack) {
            json || (json = {});
            var jsonAssets = json.assets || (json.assets = []),
                jsonAsset,
                i = this.length;

            for (; i--;) {
                if ((jsonAsset = this[i]).json) jsonAssets[i] = jsonAsset.toJSON(jsonAssets[i], pack);
            }

            return json;
        };


        Assets.prototype.fromJSON = function(json) {
            var assetsHash = this.hash,
                jsonAssets = json.assets || (json.assets = []),
                assets, jsonAsset,
                i = jsonAssets.length;

            for (; i--;) {
                if (!(jsonAsset = jsonAssets[i])) continue;

                if ((assets = assetsHash[jsonAsset.name])) {
                    assets.fromJSON(jsonAsset);
                } else {
                    this.add(new Asset._types[jsonAsset._type]().fromJSON(jsonAsset));
                }
            }

            return this;
        };


        return new Assets;
    }
);


define('core/assets/asset_loader', [
        "base/event_emitter",
        "base/audio_ctx",
        "core/assets/asset",
        "core/assets/assets",
        "core/game/log"
    ],
    function(EventEmitter, AudioCtx, Asset, Assets, Log) {



        var FUNC = function() {};


        function AssetLoader() {

            EventEmitter.call(this);
        }

        EventEmitter.extend(AssetLoader);


        AssetLoader.prototype.load = function(callback, reload) {
            callback || (callback = FUNC);
            var self = this,
                count = Assets.length,
                i,
                fn = function(err) {
                    if (err) Log.warn(err.message);

                    count--;
                    if (count === 0) {
                        self.emit("load");
                        callback();
                    }
                };

            for (i = count; i--;) this.loadAsset(Assets[i], fn, reload);
        };


        AssetLoader.prototype.loadAsset = function(asset, callback, reload) {
            var self = this,
                ext;

            if (asset.raw && !reload) {
                callback()
                return;
            };

            if ((ext = asset.ext())) {
                if (!this[ext]) {
                    callback(new Error("AssetLoader.load: has no loader named " + ext))
                    return;
                }

                this[ext](asset.src, function(err, raw) {
                    if (err) {
                        callback(new Error("AssetLoader.load: " + err.message));
                        return;
                    }

                    asset.parse(raw);
                    self.emit("loadAsset", asset);
                    callback();
                });
            }
        };


        AssetLoader.prototype.gif = AssetLoader.prototype.jpg = AssetLoader.prototype.jpeg = AssetLoader.prototype.png = function(src, callback) {
            var image = new Image;

            image.addEventListener("load", function() {
                callback && callback(null, image);
            }, false);
            image.addEventListener("error", function() {
                callback && callback(e);
            }, false);

            image.src = src;
        };


        AssetLoader.prototype.json = function(src, callback) {
            var request = new XMLHttpRequest;

            request.addEventListener("readystatechange", function() {

                if (this.readyState == 1) {
                    this.send(null);
                } else if (this.readyState == 4) {
                    var status = this.status,
                        json;

                    if ((status > 199 && status < 301) || status == 304) {
                        try {
                            json = JSON.parse(this.responseText);
                        } catch (err) {
                            callback && callback(err);
                            return;
                        }

                        callback && callback(null, json);
                    } else {
                        callback && callback(new Error(status));
                    }
                }
            }, false);

            request.open("GET", src, true);
        };


        AssetLoader.prototype.ogg = AssetLoader.prototype.wav = AssetLoader.prototype.mp3 = AssetLoader.prototype.aac = function(src, callback) {
            var request = new XMLHttpRequest;

            request.addEventListener("readystatechange", function() {

                if (this.readyState == 1) {
                    this.send(null);
                } else if (this.readyState == 4) {
                    var status = this.status;

                    if ((status > 199 && status < 301) || status == 304) {
                        callback && callback(null, this.response);
                    } else {
                        callback && callback(new Error(status));
                    }
                }
            }, false);

            request.responseType = "arraybuffer";
            request.open("GET", src, true);
        };


        return new AssetLoader;
    }
);


define('core/assets/audio_clip', [
        "base/audio_ctx",
        "core/assets/asset"
    ],
    function(AudioCtx, Asset) {



        var defineProperty = Object.defineProperty,
            fromCharCode = String.fromCharCode;


        function AudioClip(opts) {
            opts || (opts = {});

            Asset.call(this, opts);

            this.buffer = undefined;
        }

        AudioClip.type = "AudioClip";
        Asset.extend(AudioClip);


        defineProperty(AudioClip.prototype, "length", {
            get: function() {
                return this.buffer ? this.buffer.duration : 0;
            }
        });


        defineProperty(AudioClip.prototype, "samples", {
            get: function() {
                return this.buffer ? this.buffer.length : 0;
            }
        });


        defineProperty(AudioClip.prototype, "frequency", {
            get: function() {
                return this.buffer ? this.buffer.sampleRate : 44100;
            }
        });


        defineProperty(AudioClip.prototype, "channels", {
            get: function() {
                return this.buffer ? this.buffer.numberOfChannels : 0;
            }
        });


        AudioClip.prototype.getData = function(array, offset) {
            array || (array = []);

            return this.buffer ? this.buffer.getChannelData(array, offset) : array;
        };


        AudioClip.prototype.parse = function(raw) {
            Asset.prototype.parse.call(this, raw);

            this.buffer = AudioCtx.createBuffer(raw, false);
            return this;
        };


        AudioClip.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json, pack);

            if ((pack || !this.src) && this.raw) json.raw = arrayBufferToString(this.raw);

            return json;
        };


        AudioClip.prototype.fromJSON = function(json, pack) {
            Asset.prototype.fromJSON.call(this, json, pack);

            if ((pack || !this.src) && this.raw) this.raw = stringToArrayBuffer(json.raw);

            return this;
        };


        function arrayBufferToString(arrayBuffer) {
            return fromCharCode.apply(null, new Uint16Array(arrayBuffer));
        }


        function stringToArrayBuffer(str) {
            var len = str.length,
                arrayBuffer = new ArrayBuffer(len * 2),
                array = new Uint16Array(arrayBuffer),
                i = len;

            for (; i--;) array[i] = str.charCodeAt(i);
            return arrayBuffer;
        }


        return AudioClip;
    }
);


define('core/assets/sprite_sheet', [
        "core/assets/asset",
        "core/game/log"
    ],
    function(Asset, Log) {



        function SpriteSheet(opts) {
            opts || (opts = {});

            Asset.call(this, opts);
        }

        SpriteSheet.type = "SpriteSheet";
        Asset.extend(SpriteSheet);


        SpriteSheet.prototype.parse = function(raw) {

            Asset.prototype.parse.call(this, raw);

            for (var key in raw) {
                if (!this[key]) {
                    this[key] = raw[key];
                } else {
                    Log.warn("SpriteSheet.parse: bad name " + key + " in file " + this.src);
                }
            }

            return this;
        };


        SpriteSheet.prototype.clear = function() {

            for (var key in this.raw) this[key] = null;
            Asset.prototype.clear.call(this);

            return this;
        };


        SpriteSheet.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json);

            if ((pack || !this.src) && this.raw) json.raw = JSON.stringify(this.raw);

            return json;
        };


        SpriteSheet.prototype.fromJSON = function(json) {
            Asset.prototype.fromJSON.call(this, json);

            if (!json.src && json.raw) this.raw = JSON.parse(json.raw);
            this.parse(this.raw);

            return this;
        };


        return SpriteSheet;
    }
);


define('core/assets/texture', [
        "core/assets/asset"
    ],
    function(Asset) {



        function Texture(opts) {
            opts || (opts = {});

            Asset.call(this, opts);

            this.anisotropy = opts.anisotropy != undefined ? opts.anisotropy : 1;

            this.minFilter = opts.minFilter != undefined ? opts.minFilter : "LINEAR";
            this.magFilter = opts.magFilter != undefined ? opts.magFilter : "LINEAR";

            this.format = opts.format !== undefined ? opts.format : "RGBA";

            this._needsUpdate = true;
        }

        Texture.type = "Texture";
        Asset.extend(Texture);


        Texture.prototype.setAnisotropy = function(value) {

            this.anisotropy = value;
            this._needsUpdate = true;
        };


        Texture.prototype.setMinFilter = function(value) {

            this.minFilter = value;
            this._needsUpdate = true;
        };


        Texture.prototype.setMagFilter = function(value) {

            this.magFilter = value;
            this._needsUpdate = true;
        };


        Texture.prototype.setFormat = function(value) {

            this.format = value;
            this._needsUpdate = true;
        };


        var CANVAS, CTX;
        Texture.prototype.toJSON = function(json, pack) {
            json = Asset.prototype.toJSON.call(this, json);

            if ((pack || !this.src) && this.raw) {
                if (typeof(window) === "undefined") {
                    json.raw = this.raw;
                } else {
                    var raw = this.raw,
                        canvas = CANVAS || (CANVAS = document.createElement("canvas")),
                        ctx = CTX || (CTX = CANVAS.getContext("2d"));

                    canvas.width = raw.width;
                    canvas.height = raw.height;

                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(raw, 0, 0);

                    json.raw = canvas.toDataURL();
                }
            }

            json.anisotropy = this.anisotropy;
            json.minFilter = this.minFilter;
            json.magFilter = this.magFilter;
            json.format = this.format;

            return json;
        };


        Texture.prototype.fromJSON = function(json) {
            Asset.prototype.fromJSON.call(this, json);

            if (!json.src && json.raw) {
                if (typeof(window) === "undefined") {
                    this.raw = json.raw;
                } else {
                    var image = new Image;
                    image.src = json.raw;
                    this.raw = image;
                }
            }

            this.anisotropy = json.anisotropy;
            this.minFilter = json.minFilter;
            this.magFilter = json.magFilter;
            this.format = json.format;

            return this;
        };


        return Texture;
    }
);


define(
    'math/mathf', [], function() {



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
        Mathf.prototype.sign = function(x) {

            return x ? x < 0 ? -1 : 1 : 0;
        };

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


define(
    'math/vec2', [], function() {



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
         * @method fromArray
         * @memberof Vec2
         * @brief sets values from Array object
         * @param Array array
         * @return this
         */
        Vec2.prototype.fromArray = function(array) {

            this.x = array[0];
            this.y = array[1];

            return this;
        };

        /**
         * @method toArray
         * @memberof Vec2
         * @brief returns array object of this
         * @return Array
         */
        Vec2.prototype.toArray = function(array) {
            array || (array = []);

            array[0] = this.x;
            array[1] = this.y;

            return array;
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


define(
    'math/vec3', [], function() {



        var sqrt = Math.sqrt;

        /**
         * @class Vec3
         * @brief 3d vector
         * @param Number x
         * @param Number y
         * @param Number z
         */
        function Vec3(x, y, z) {

            /**
             * @property Number x
             * @memberof Vec3
             */
            this.x = x || 0;

            /**
             * @property Number y
             * @memberof Vec3
             */
            this.y = y || 0;

            /**
             * @property Number z
             * @memberof Vec3
             */
            this.z = z || 0;
        }

        /**
         * @method clone
         * @memberof Vec3
         * @brief returns new instance of this
         * @return Vec3
         */
        Vec3.prototype.clone = function() {

            return new Vec3(this.x, this.y, this.z);
        };

        /**
         * @method copy
         * @memberof Vec3
         * @brief copies other
         * @param Vec3 other
         * @return this
         */
        Vec3.prototype.copy = function(other) {

            this.x = other.x;
            this.y = other.y;
            this.z = other.z;

            return this;
        };

        /**
         * @method set
         * @memberof Vec3
         * @brief sets values of this
         * @param Number x
         * @param Number y
         * @param Number z
         * @return this
         */
        Vec3.prototype.set = function(x, y, z) {

            this.x = x;
            this.y = y;
            this.z = z;

            return this;
        };

        /**
         * @method add
         * @memberof Vec3
         * @brief adds other's values to this
         * @param Vec3 other
         * @return this
         */
        Vec3.prototype.add = function(other) {

            this.x += other.x;
            this.y += other.y;
            this.z += other.z;

            return this;
        };

        /**
         * @method vadd
         * @memberof Vec3
         * @brief adds a and b together saves it in this
         * @param Vec3 a
         * @param Vec3 b
         * @return this
         */
        Vec3.prototype.vadd = function(a, b) {

            this.x = a.x + b.x;
            this.y = a.y + b.y;
            this.z = a.z + b.z;

            return this;
        };

        /**
         * @method sadd
         * @memberof Vec3
         * @brief adds scalar value to this
         * @param Number s
         * @return this
         */
        Vec3.prototype.sadd = function(s) {

            this.x += s;
            this.y += s;
            this.z += s;

            return this;
        };

        /**
         * @method sub
         * @memberof Vec3
         * @brief subtracts other's values from this
         * @param Vec3 other
         * @return this
         */
        Vec3.prototype.sub = function(other) {

            this.x -= other.x;
            this.y -= other.y;
            this.z -= other.z;

            return this;
        };

        /**
         * @method vsub
         * @memberof Vec3
         * @brief subtracts b from a saves it in this
         * @param Vec3 a
         * @param Vec3 b
         * @return this
         */
        Vec3.prototype.vsub = function(a, b) {

            this.x = a.x - b.x;
            this.y = a.y - b.y;
            this.z = a.z - b.z;

            return this;
        };

        /**
         * @method ssub
         * @memberof Vec3
         * @brief subtracts this by a scalar value
         * @param Number s
         * @return this
         */
        Vec3.prototype.ssub = function(s) {

            this.x -= s;
            this.y -= s;
            this.z -= s;

            return this;
        };

        /**
         * @method mul
         * @memberof Vec3
         * @brief muliples this's values by other's
         * @param Vec3 other
         * @return this
         */
        Vec3.prototype.mul = function(other) {

            this.x *= other.x;
            this.y *= other.y;
            this.z *= other.z;

            return this;
        };

        /**
         * @method vmul
         * @memberof Vec3
         * @brief muliples a and b saves it in this
         * @param Vec3 a
         * @param Vec3 b
         * @return this
         */
        Vec3.prototype.vmul = function(a, b) {

            this.x = a.x * b.x;
            this.y = a.y * b.y;
            this.z = a.z * b.z;

            return this;
        };

        /**
         * @method smul
         * @memberof Vec3
         * @brief muliples this by a scalar value
         * @param Number s
         * @return this
         */
        Vec3.prototype.smul = function(s) {

            this.x *= s;
            this.y *= s;
            this.z *= s;

            return this;
        };

        /**
         * @method div
         * @memberof Vec3
         * @brief divides this's values by other's
         * @param Vec3 other
         * @return this
         */
        Vec3.prototype.div = function(other) {
            var x = other.x,
                y = other.y,
                z = other.z;

            this.x *= x !== 0 ? 1 / x : 0;
            this.y *= y !== 0 ? 1 / y : 0;
            this.z *= z !== 0 ? 1 / z : 0;

            return this;
        };

        /**
         * @method vdiv
         * @memberof Vec3
         * @brief divides b from a saves it in this
         * @param Vec3 a
         * @param Vec3 b
         * @return this
         */
        Vec3.prototype.vdiv = function(a, b) {
            var x = b.x,
                y = b.y,
                z = b.z;

            this.x = x !== 0 ? a.x / x : 0;
            this.y = y !== 0 ? a.y / y : 0;
            this.z = z !== 0 ? a.z / z : 0;

            return this;
        };

        /**
         * @method sdiv
         * @memberof Vec3
         * @brief divides this by scalar value
         * @param Number s
         * @return this
         */
        Vec3.prototype.sdiv = function(s) {
            s = s === 0 ? 0 : 1 / s;

            this.x *= s;
            this.y *= s;
            this.z *= s;

            return this;
        };

        /**
         * @method length
         * @memberof Vec3
         * @brief returns the length of this
         * @return Number
         */
        Vec3.prototype.length = function() {
            var x = this.x,
                y = this.y,
                z = this.z,
                lsq = x * x + y * y + z * z;

            if (lsq === 1) return 1;

            return lsq === 0 ? 0 : sqrt(lsq);
        };

        /**
         * @method lengthSq
         * @memberof Vec3
         * @brief returns the squared length of this
         * @return Number
         */
        Vec3.prototype.lengthSq = function() {
            var x = this.x,
                y = this.y,
                z = this.z;

            return x * x + y * y + z * z;
        };

        /**
         * @method setLength
         * @memberof Vec3
         * @brief sets this so its magnitude is equal to length
         * @param Number length
         * @return Vec3
         */
        Vec3.prototype.setLength = function(length) {
            var x = this.x,
                y = this.y,
                z = this.z,
                l = x * x + y * y + z * z;

            if (l === 1) {
                this.x *= length;
                this.y *= length;
                this.z *= length;

                return this;
            }

            l = l > 0 ? 1 / sqrt(l) : 0;

            this.x *= l * length;
            this.y *= l * length;
            this.z *= l * length;

            return this;
        };

        /**
         * @method normalize
         * @memberof Vec3
         * @brief returns this with a length of 1
         * @return this
         */
        Vec3.prototype.normalize = function() {
            var x = this.x,
                y = this.y,
                z = this.z,
                l = x * x + y * y + z * z;

            if (l === 1) return this;

            l = l > 0 ? 1 / sqrt(l) : 0;

            this.x *= l;
            this.y *= l;
            this.z *= l;

            return this;
        };

        /**
         * @method inverse
         * @memberof Vec3
         * @brief returns the inverse of this
         * @return this
         */
        Vec3.prototype.inverse = function() {

            this.x *= -1;
            this.y *= -1;
            this.z *= -1;

            return this;
        };

        /**
         * @method inverseVec
         * @memberof Vec3
         * @brief returns the inverse of other
         * @param Vec3 other
         * @return this
         */
        Vec3.prototype.inverseVec = function(other) {

            this.x = -other.x;
            this.y = -other.y;
            this.z = -other.z;

            return this;
        };

        /**
         * @method lerp
         * @memberof Vec3
         * @brief linear interpolation between this and other by x
         * @param Vec3 other
         * @param Number x
         * @return Vec3
         */
        Vec3.prototype.lerp = function(other, x) {

            this.x += (other.x - this.x) * x;
            this.y += (other.y - this.y) * x;
            this.z += (other.z - this.z) * x;

            return this;
        };

        /**
         * @method vlerp
         * @memberof Vec3
         * @brief linear interpolation between a and b by x
         * @param Vec3 a
         * @param Vec3 b
         * @param Number x
         * @return Vec3
         */
        Vec3.prototype.vlerp = function(a, b, x) {
            var ax = a.x,
                ay = a.y,
                az = a.z;

            this.x = ax + (b.x - ax) * x;
            this.y = ay + (b.y - ay) * x;
            this.z = az + (b.z - az) * x;

            return this;
        };

        /**
         * @method vdot
         * @memberof Vec3
         * @brief dot product of two vectors, can be called as a static function Vec3.vdot( a, b )
         * @param Vec3 a
         * @param Vec3 b
         * @return Number
         */
        Vec3.vdot = Vec3.prototype.vdot = function(a, b) {

            return a.x * b.x + a.y * b.y + a.z * b.z;
        };

        /**
         * @method dot
         * @memberof Vec3
         * @brief dot product of this and other vector
         * @param Vec3 other
         * @return Number
         */
        Vec3.prototype.dot = function(other) {

            return this.x * other.x + this.y * other.y + this.z * other.z;
        };

        /**
         * @method vcross
         * @memberof Vec3
         * @brief cross product between a vector and b vector, can be called as a static function Vec3.vcross( a, b )
         * @param Vec3 a
         * @param Vec3 b
         * @return Number
         */
        Vec3.vcross = Vec3.prototype.vcross = function(a, b) {
            var ax = a.x,
                ay = a.y,
                az = a.z,
                bx = b.x,
                by = b.y,
                bz = b.z;

            this.x = ay * bz - az * by;
            this.y = az * bx - ax * bz;
            this.z = ax * by - ay * bx;

            return this;
        };

        /**
         * @method cross
         * @memberof Vec3
         * @brief cross product between this vector and other
         * @param Vec3 other
         * @return Number
         */
        Vec3.prototype.cross = function(other) {
            var ax = this.x,
                ay = this.y,
                az = this.z,
                bx = other.x,
                by = other.y,
                bz = other.z;

            this.x = ay * bz - az * by;
            this.y = az * bx - ax * bz;
            this.z = ax * by - ay * bx;

            return this;
        };

        /**
         * @method min
         * @memberof Vec3
         * @brief returns min values from this and other vector
         * @param Vec3 other
         * @return this
         */
        Vec3.prototype.min = function(other) {
            var ax = this.x,
                ay = this.y,
                az = this.z,
                bx = other.x,
                by = other.y,
                bz = other.z;

            this.x = bx < ax ? bx : ax;
            this.y = by < ay ? by : ay;
            this.z = bz < az ? bz : az;

            return this;
        };

        /**
         * @method max
         * @memberof Vec3
         * @brief returns max values from this and other vector
         * @param Vec3 other
         * @return this
         */
        Vec3.prototype.max = function(other) {
            var ax = this.x,
                ay = this.y,
                az = this.z,
                bx = other.x,
                by = other.y,
                bz = other.z;

            this.x = bx > ax ? bx : ax;
            this.y = by > ay ? by : ay;
            this.z = bz > az ? bz : az;

            return this;
        };

        /**
         * @method clamp
         * @memberof Vec3
         * @brief clamp values between min and max's values
         * @param Vec3 min
         * @param Vec3 max
         * @return this
         */
        Vec3.prototype.clamp = function(min, max) {
            var x = this.x,
                y = this.y,
                z = this.z,
                minx = min.x,
                miny = min.y,
                minz = min.z,
                maxx = max.x,
                maxy = max.y,
                maxz = max.z;

            this.x = x < minx ? minx : x > maxx ? maxx : x;
            this.y = y < miny ? miny : y > maxy ? maxy : y;
            this.z = z < minz ? minz : z > maxz ? maxz : z;

            return this;
        };

        /**
         * @method transformMat3
         * @memberof Vec3
         * @brief transforms this with Mat3
         * @param Mat3 m
         * @return this
         */
        Vec3.prototype.transformMat3 = function(m) {
            var me = m.elements,
                x = this.x,
                y = this.y,
                z = this.z;

            this.x = x * me[0] + y * me[3] + z * me[6];
            this.y = x * me[1] + y * me[4] + z * me[7];
            this.z = x * me[2] + y * me[5] + z * me[8];

            return this;
        };

        /**
         * @method transformMat4
         * @memberof Vec3
         * @brief transforms this with Mat4
         * @param Mat4 m
         * @return this
         */
        Vec3.prototype.transformMat4 = function(m) {
            var me = m.elements,
                x = this.x,
                y = this.y,
                z = this.z;

            this.x = x * me[0] + y * me[4] + z * me[8] + me[12];
            this.y = x * me[1] + y * me[5] + z * me[9] + me[13];
            this.z = x * me[2] + y * me[6] + z * me[10] + me[14];

            return this;
        };

        /**
         * @method transformQuat
         * @memberof Vec3
         * @brief transforms this with Quat
         * @param Quat q
         * @return this
         */
        Vec3.prototype.transformQuat = function(q) {
            var x = this.x,
                y = this.y,
                z = this.z,
                qx = q.x,
                qy = q.y,
                qz = q.z,
                qw = q.w,

                ix = qw * x + qy * z - qz * y,
                iy = qw * y + qz * x - qx * z,
                iz = qw * z + qx * y - qy * x,
                iw = -qx * x - qy * y - qz * z;

            this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

            return this;
        };

        /**
         * @method fromVec2
         * @memberof Vec3
         * @brief sets values from Vec2
         * @param Vec2 v
         * @return this
         */
        Vec3.prototype.fromVec2 = function(v) {

            this.x = v.x;
            this.y = v.y;
            this.z = 0;

            return this;
        };

        /**
         * @method fromVec4
         * @memberof Vec3
         * @brief sets position from Vec4
         * @param Vec4 v
         * @return this
         */
        Vec3.prototype.fromVec4 = function(v) {

            this.x = v.x;
            this.y = v.y;
            this.z = v.z;

            return this;
        };

        /**
         * @method positionFromMat4
         * @memberof Vec3
         * @brief sets position from Mat4
         * @param Mat4 m
         * @return this
         */
        Vec3.prototype.positionFromMat4 = function(m) {
            var me = m.elements;

            this.x = me[12];
            this.y = me[13];
            this.z = me[14];

            return this;
        };

        /**
         * @method scaleFromMat3
         * @memberof Vec3
         * @brief sets this from Mat3 scale
         * @param Mat3 m
         * @return this
         */
        Vec3.prototype.scaleFromMat3 = function(m) {
            var me = m.elements,
                x = this.set(me[0], me[3], me[6]).length(),
                y = this.set(me[1], me[4], me[7]).length(),
                z = this.set(me[2], me[5], me[8]).length();

            this.x = x;
            this.y = y;
            this.z = z;

            return this;
        };

        /**
         * @method scaleFromMat4
         * @memberof Vec3
         * @brief sets this from Mat4 scale
         * @param Mat4 m
         * @return this
         */
        Vec3.prototype.scaleFromMat4 = function(m) {
            var me = m.elements,
                x = this.set(me[0], me[4], me[8]).length(),
                y = this.set(me[1], me[5], me[9]).length(),
                z = this.set(me[2], me[6], me[10]).length();

            this.x = x;
            this.y = y;
            this.z = z;

            return this;
        };

        /**
         * @method fromJSON
         * @memberof Vec3
         * @brief sets values from JSON object
         * @param Object json
         * @return this
         */
        Vec3.prototype.fromJSON = function(json) {

            this.x = json.x;
            this.y = json.y;
            this.z = json.z;

            return this;
        };

        /**
         * @method toJSON
         * @memberof Vec3
         * @brief returns json object of this
         * @return Object
         */
        Vec3.prototype.toJSON = function(json) {
            json || (json = {});

            json.x = this.x;
            json.y = this.y;
            json.z = this.z;

            return json;
        };

        /**
         * @method fromArray
         * @memberof Vec3
         * @brief sets values from Array object
         * @param Array array
         * @return this
         */
        Vec3.prototype.fromArray = function(array) {

            this.x = array[0];
            this.y = array[1];
            this.z = array[2];

            return this;
        };

        /**
         * @method toArray
         * @memberof Vec3
         * @brief returns array object of this
         * @return Array
         */
        Vec3.prototype.toArray = function(array) {
            array || (array = []);

            array[0] = this.x;
            array[1] = this.y;
            array[2] = this.z;

            return array;
        };

        /**
         * @method toString
         * @memberof Vec3
         * @brief returns string of this
         * @return String
         */
        Vec3.prototype.toString = function() {

            return "Vec3( " + this.x + ", " + this.y + ", " + this.z + " )";
        };


        return Vec3;
    }
);


define('core/components/component', [
        "base/class",
        "core/game/log"
    ],
    function(Class, Log) {



        function Component(type, sync, json) {

            Class.call(this);

            this._type = type || "UnknownComponent";
            this._name = (this._type).toLowerCase();

            this.sync = sync != undefined ? !! sync : true;
            this.json = json != undefined ? !! json : true;

            this.gameObject = undefined;
        }

        Class.extend(Component);

        Component.type = "Component";
        Component._types = {};
        Component.prototype._onExtend = function(child) {

            Component._types[child.type] = child;
        }


        Component.prototype.init = function() {

        };


        Component.prototype.update = function() {

        };


        Component.prototype.clear = function() {

        };


        Component.prototype.destroy = function() {
            if (!this.gameObject) {
                Log.warn("Component.destroy: can't destroy Component if it's not added to a GameObject");
                return this;
            }

            this.gameObject.removeComponent(this);
            this.emit("destroy");

            this.clear();

            return this;
        };


        Component.prototype.sort = function(a, b) {

            return a === b ? -1 : 1;
        };


        Component.prototype.toSYNC = function(json) {
            json = Class.prototype.toSYNC.call(this, json);

            return json;
        };


        Component.prototype.fromSYNC = function() {

            return this;
        };


        Component.prototype.toJSON = function(json) {
            json = Class.prototype.toJSON.call(this, json);

            json._type = this._type;
            json._name = this._name;

            json.sync = this.sync;
            json.json = this.json;

            return json;
        };


        Component.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);

            this._type = json._type;
            this._name = json._name;

            this.sync = json.sync;
            this.json = json.json;

            return this;
        };


        return Component;
    }
);


define('core/components/audio_source', [
        "base/audio_ctx",
        "base/time",
        "math/mathf",
        "math/vec2",
        "math/vec3",
        "core/components/component"
    ],
    function(AudioCtx, Time, Mathf, Vec2, Vec3, Component) {



        var now = Time.now,
            clamp01 = Mathf.clamp01,
            defineProperty = Object.defineProperty;


        function AudioSource(opts) {
            opts || (opts = {});

            Component.call(this, "AudioSource", !! opts.sync, opts.json);

            this.clip = opts.clip;

            this._source = undefined;
            this._gain = undefined;
            this._panner = undefined;

            this.dopplerLevel = opts.dopplerLevel != undefined ? opts.dopplerLevel : 1;
            this._loop = opts.loop != undefined ? !! opts.loop : false;

            this.maxDistance = opts.maxDistance != undefined ? opts.maxDistance : 15;
            this.minDistance = opts.minDistance != undefined ? opts.minDistance : 1;

            this.offset = opts.offset != undefined ? opts.offset : new Vec3;

            this.pitch = opts.pitch != undefined ? opts.pitch : 0;

            this.playOnInit = opts.playOnInit != undefined ? !! opts.playOnInit : false;

            this.spread = opts.spread != undefined ? opts.spread : 0;

            this.time = opts.time != undefined ? opts.time : 0;
            this._volume = opts.volume != undefined ? opts.volume : 1;

            this.isPlaying = false;

            this._startTime = 0;

            var self = this;
            this._onended = function() {

                self.isPlaying = false;
                self.time = 0;
            };
        }

        AudioSource.type = "AudioSource";
        Component.extend(AudioSource);


        defineProperty(AudioSource.prototype, "volume", {
            get: function() {
                return this._volume;
            },
            set: function(value) {
                this._volume = clamp01(value);
                if (this._gain) this._gain.gain.value = this._volume;
            }
        });


        defineProperty(AudioSource.prototype, "loop", {
            get: function() {
                return this._loop;
            },
            set: function(value) {
                this._loop = !! value;
                if (this._source) this._source.loop = this._loop;
            }
        });


        AudioSource.prototype.init = function() {

            if (this.playOnInit) this.play();
        };


        var VEC2 = new Vec2,
            VEC3 = new Vec3;
        AudioSource.prototype.update = function() {
            if (this.dopplerLevel === 0 || !this.isPlaying) return;
            var transform2d, transform, camera, cameraTransform, panner;

            if (!(camera = this.gameObject.scene.game.camera)) return;
            if (!(panner = this._panner)) return;

            transform = this.transform;
            transform2d = this.transform2d;

            cameraTransform = camera.transform || camera.transform2d;

            if (transform2d) {
                VEC2.vadd(transform2d.position, this.offset);
                VEC2.sub(cameraTransform.position);
                VEC2.smul(this.dopplerLevel);

                panner.setPosition(VEC2.x, VEC2.y, camera.orthographicSize);
            } else {
                VEC3.vadd(transform.position, this.offset);
                VEC3.sub(cameraTransform.position);
                VEC3.smul(this.dopplerLevel);

                panner.setPosition(VEC3.x, VEC3.y, VEC3.z || 0);
            }
        };


        AudioSource.prototype.clear = function() {

            if (this.isPlaying) this.stop();

            this._source = undefined;
            this._gain = undefined;
            this._panner = undefined;
        };


        AudioSource.prototype.play = function(delay, offset) {
            if (!AudioCtx) return this;
            delay || (delay = 0);
            offset || (offset = 0);

            this.refresh();

            this.isPlaying = true;
            this._startTime = now();

            this.time = offset;
            this._source.start(delay, this.time);

            return this;
        };


        AudioSource.prototype.pause = function() {
            if (!AudioCtx) return this;

            this.isPlaying = false;
            this.time = now() - this._startTime;

            this._source.stop(this.time);

            return this;
        };


        AudioSource.prototype.stop = function() {
            if (!AudioCtx) return this;

            this.time = 0;
            this.isPlaying = false;

            this._source.stop(this.time);

            return this;
        };


        AudioSource.prototype.refresh = function() {
            var source = this._source = AudioCtx.createBufferSource(),
                gain = this._gain = AudioCtx.createGain(),
                panner = this._panner = AudioCtx.createPanner();

            gain.connect(AudioCtx.destination);
            panner.connect(gain);
            source.connect(panner);

            source.buffer = this.clip.buffer;
            source.onended = this._onended;

            gain.gain.value = this.volume;
            source.loop = this.loop;

            return this;
        };


        AudioSource.prototype.toSYNC = function(json) {
            json = Component.prototype.toSYNC.call(this, json);

            return json;
        };


        AudioSource.prototype.fromSYNC = function(json) {
            Component.prototype.fromSYNC.call(this, json);

            return this;
        };


        AudioSource.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.clip = this.clip ? this.clip.name : undefined;

            json.dopplerLevel = this.dopplerLevel;
            json.loop = this.loop;

            json.maxDistance = this.maxDistance;
            json.minDistance = this.minDistance;

            json.offset = this.offset.toJSON(json.offset);
            json.panLevel = this.panLevel;

            json.pitch = this.pitch;

            json.playOnInit = this.playOnInit;

            json.spread = this.spread;

            json.time = this.time;
            json.volume = this.volume;

            json.isPlaying = this.isPlaying;

            return json;
        };


        AudioSource.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.clip = json.clip ? Assets.hash[json.clip] : undefined;

            this.dopplerLevel = json.dopplerLevel;
            this.loop = json.loop;

            this.maxDistance = json.maxDistance;
            this.minDistance = json.minDistance;

            this.offset.fromJSON(json.offset);
            this.panLevel = json.panLevel;

            this.pitch = json.pitch;

            this.playOnInit = json.playOnInit;

            this.spread = json.spread;

            this.time = json.time;
            this.volume = json.volume;

            this.isPlaying = json.isPlaying;

            return this;
        };


        return AudioSource;
    }
);


define('math/color', [
        "math/mathf"
    ],
    function(Mathf) {



        var sqrt = Math.sqrt,
            floor = Math.floor,
            clamp01 = Mathf.clamp01;

        /**
         * @class Color
         * @brief rgb color, values 0 - 1
         * @param Number r
         * @param Number g
         * @param Number b
         */
        function Color(r, g, b) {

            /**
             * @property Number r
             * @memberof Color
             */
            this.r = 0;

            /**
             * @property Number g
             * @memberof Color
             */
            this.g = 0;

            /**
             * @property Number b
             * @memberof Color
             */
            this.b = 0;

            this._r = 0;
            this._g = 0;
            this._b = 0;
            this._hex = "#000000";
            this._rgb = "rgb(0,0,0)";

            this.set(r, g, b);
        }

        /**
         * @method clone
         * @memberof Color
         * @brief returns new instance of this
         * @return Color
         */
        Color.prototype.clone = function() {

            return new Color(this.r, this.g, this.b);
        };

        /**
         * @method copy
         * @memberof Color
         * @brief copies other
         * @param Color other
         * @return this
         */
        Color.prototype.copy = function(other) {

            this.r = other.r;
            this.g = other.g;
            this.b = other.b;

            return this;
        };

        /**
         * @method set
         * @memberof Color
         * @brief sets values of this
         * @param Number r
         * @param Number g
         * @param Number b
         * @return this
         */
        Color.prototype.set = function(r, g, b) {
            var type = typeof(r);

            if (type === "number") {
                this.r = r;
                this.g = g;
                this.b = b;
            } else if (type === "string") {
                this.setStyle(r);
            } else if (r instanceof Color) {
                this.r = r.r;
                this.g = r.g;
                this.b = r.b;
            }

            return this;
        };

        /**
         * @method setRGB
         * @memberof Color
         * @brief sets rgb values of this
         * @param Number r
         * @param Number g
         * @param Number b
         * @return this
         */
        Color.prototype.setRGB = function(r, g, b) {

            this.r = r;
            this.g = g;
            this.b = b;

            return this;
        };

        /**
         * @method setStyle
         * @memberof Color
         * @brief sets values of this from string
         * @param String style
         * @return this
         */
        Color.prototype.setStyle = function() {
            var rgb0255 = /^rgb\((\d+),(\d+),(\d+)\)$/i,
                rgb0100 = /^rgb\((\d+)\%,(\d+)\%,(\d+)\%\)$/i,
                hex6 = /^\#([0-9a-f]{6})$/i,
                hex3 = /^\#([0-9a-f])([0-9a-f])([0-9a-f])$/i,
                hex3to6 = /#(.)(.)(.)/,
                hex3to6String = "#$1$1$2$2$3$3",
                colorName = /^(\w+)$/i,
                inv255 = 1 / 255,
                inv100 = 1 / 100;

            return function(style) {

                if (rgb0255.test(style)) {
                    var color = rgb0255.exec(style);

                    this.r = min(255, Number(color[1])) * inv255;
                    this.g = min(255, Number(color[2])) * inv255;
                    this.b = min(255, Number(color[3])) * inv255;

                    return this;
                }

                if (rgb0100.test(style)) {
                    var color = rgb0100.exec(style);

                    this.r = min(100, Number(color[1])) * inv100;
                    this.g = min(100, Number(color[2])) * inv100;
                    this.b = min(100, Number(color[3])) * inv100;

                    return this;
                }

                if (hex6.test(style)) {

                    this.r = parseInt(style.substr(1, 2), 16) * inv255;
                    this.g = parseInt(style.substr(3, 2), 16) * inv255;
                    this.b = parseInt(style.substr(5, 2), 16) * inv255;

                    return this;
                }

                if (hex3.test(style)) {
                    style = style.replace(hex3to6, hex3to6String);

                    this.r = parseInt(style.substr(1, 2), 16) * inv255;
                    this.g = parseInt(style.substr(3, 2), 16) * inv255;
                    this.b = parseInt(style.substr(5, 2), 16) * inv255;

                    return this;
                }

                if (colorName.test(style)) {
                    style = colorNames[style];

                    this.r = parseInt(style.substr(1, 2), 16) * inv255;
                    this.g = parseInt(style.substr(3, 2), 16) * inv255;
                    this.b = parseInt(style.substr(5, 2), 16) * inv255;

                    return this;
                }

                return this;
            };
        }();

        /**
         * @method toHEX
         * @memberof Color
         * @brief returns this color in HEX format
         * @return Color
         */
        Color.prototype.toHEX = function() {

            if (this.r !== this._r || this.g !== this._g || this.b !== this._b) {
                var hexR = singleToHEX(this.r),
                    hexG = singleToHEX(this.g),
                    hexB = singleToHEX(this.b);

                this._r = this.r;
                this._g = this.g;
                this._b = this.b;
                this._hex = "#" + hexR + hexG + hexB;
            }

            return this._hex;
        };

        /**
         * @method toRGB
         * @memberof Color
         * @brief returns this color in RGB format
         * @return Color
         */
        Color.prototype.toRGB = function() {

            if (this.r !== this._r || this.g !== this._g || this.b !== this._b) {
                var r = floor(clamp01(this.r) * 256),
                    g = floor(clamp01(this.g) * 256),
                    b = floor(clamp01(this.b) * 256);

                this._r = this.r;
                this._g = this.g;
                this._b = this.b;
                this._rgb = "rgb(" + r + "," + g + "," + b + ")";
            }

            return this._rgb;
        };

        /**
         * @method add
         * @memberof Color
         * @brief adds other's values to this
         * @param Color other
         * @return this
         */
        Color.prototype.add = function(other) {

            this.r += other.r;
            this.g += other.g;
            this.b += other.b;

            return this;
        };

        /**
         * @method cadd
         * @memberof Color
         * @brief adds a and b together saves it in this
         * @param Color a
         * @param Color b
         * @return this
         */
        Color.prototype.cadd = function(a, b) {

            this.r = a.r + b.r;
            this.g = a.g + b.g;
            this.b = a.b + b.b;

            return this;
        };

        /**
         * @method sadd
         * @memberof Color
         * @brief adds scalar value to this
         * @param Number s
         * @return this
         */
        Color.prototype.sadd = function(s) {

            this.r += s;
            this.g += s;
            this.b += s;

            return this;
        };

        /**
         * @method sub
         * @memberof Color
         * @brief subtracts other's values from this
         * @param Color other
         * @return this
         */
        Color.prototype.sub = function(other) {

            this.r -= other.r;
            this.g -= other.g;
            this.b -= other.b;

            return this;
        };

        /**
         * @method csub
         * @memberof Color
         * @brief subtracts b from a saves it in this
         * @param Color a
         * @param Color b
         * @return this
         */
        Color.prototype.csub = function(a, b) {

            this.r = a.r - b.r;
            this.g = a.g - b.g;
            this.b = a.b - b.b;

            return this;
        };

        /**
         * @method ssub
         * @memberof Color
         * @brief subtracts this by a scalar value
         * @param Number s
         * @return this
         */
        Color.prototype.ssub = function(s) {

            this.r -= s;
            this.g -= s;
            this.b -= s;

            return this;
        };

        /**
         * @method mul
         * @memberof Color
         * @brief muliples this's values by other's
         * @param Color other
         * @return this
         */
        Color.prototype.mul = function(other) {

            this.r *= other.r;
            this.g *= other.g;
            this.b *= other.b;

            return this;
        };

        /**
         * @method cmul
         * @memberof Color
         * @brief muliples a and b saves it in this
         * @param Color a
         * @param Color b
         * @return this
         */
        Color.prototype.cmul = function(a, b) {

            this.r = a.r * b.r;
            this.g = a.g * b.g;
            this.b = a.b * b.b;

            return this;
        };

        /**
         * @method smul
         * @memberof Color
         * @brief muliples this by a scalar value
         * @param Number s
         * @return this
         */
        Color.prototype.smul = function(s) {

            this.r *= s;
            this.g *= s;
            this.b *= s;

            return this;
        };

        /**
         * @method div
         * @memberof Color
         * @brief divides this's values by other's
         * @param Color other
         * @return this
         */
        Color.prototype.div = function(other) {
            var x = other.r,
                y = other.g,
                z = other.b;

            this.r *= x !== 0 ? 1 / x : 0;
            this.g *= y !== 0 ? 1 / y : 0;
            this.b *= z !== 0 ? 1 / z : 0;

            return this;
        };

        /**
         * @method cdiv
         * @memberof Color
         * @brief divides b from a saves it in this
         * @param Color a
         * @param Color b
         * @return this
         */
        Color.prototype.cdiv = function(a, b) {
            var x = b.r,
                y = b.g,
                z = b.b;

            this.r = x !== 0 ? a.r / x : 0;
            this.g = y !== 0 ? a.g / y : 0;
            this.b = z !== 0 ? a.b / z : 0;

            return this;
        };

        /**
         * @method sdiv
         * @memberof Color
         * @brief divides this by scalar value
         * @param Number s
         * @return this
         */
        Color.prototype.sdiv = function(s) {
            s = s === 0 ? 0 : 1 / s;

            this.r *= s;
            this.g *= s;
            this.b *= s;

            return this;
        };

        /**
         * @method length
         * @memberof Color
         * @brief returns length of this
         * @return this
         */
        Color.prototype.length = function() {
            var r = this.r,
                g = this.g,
                b = this.b,
                l = r * r + g * g + b * b;

            return l > 0 ? 1 / sqrt(l) : 0;
        };

        /**
         * @method lengthSq
         * @memberof Color
         * @brief returns length squared of this
         * @return this
         */
        Color.prototype.lengthSq = function() {
            var r = this.r,
                g = this.g,
                b = this.b;

            return r * r + g * g + b * b;
        };

        /**
         * @method normalize
         * @memberof Color
         * @brief returns this with a length of 1
         * @return this
         */
        Color.prototype.normalize = function() {
            var r = this.r,
                g = this.g,
                b = this.b,
                l = r * r + g * g + b * b;

            l = l > 0 ? 1 / sqrt(l) : 0;

            this.r *= l;
            this.g *= l;
            this.b *= l;

            return this;
        };

        /**
         * @method check
         * @memberof Color
         * @brief ensures that each value is no larger than 1
         * @return this
         */
        Color.prototype.check = function() {
            var r = this.r,
                g = this.g,
                b = this.b;

            this.r = r > 1 ? 1 : r;
            this.g = g > 1 ? 1 : g;
            this.b = b > 1 ? 1 : b;

            return this;
        };

        /**
         * @method lerp
         * @memberof Color
         * @brief linear interpolation between this and other by x
         * @param Color other
         * @param Number x
         * @return Color
         */
        Color.prototype.lerp = function(other, x) {

            this.r += (other.r - this.r) * x;
            this.g += (other.g - this.g) * x;
            this.b += (other.b - this.b) * x;

            return this;
        };

        /**
         * @method clerp
         * @memberof Color
         * @brief linear interpolation between a and b by x
         * @param Color a
         * @param Color b
         * @param Number x
         * @return Color
         */
        Color.prototype.clerp = function(a, b, x) {
            var ax = a.r,
                ay = a.g,
                az = a.b;

            this.r = ax + (b.r - ax) * x;
            this.g = ay + (b.g - ay) * x;
            this.b = az + (b.b - az) * x;

            return this;
        };

        /**
         * @method min
         * @memberof Color
         * @brief returns min values from this and other vector
         * @param Color other
         * @return Color
         */
        Color.prototype.min = function(other) {
            var ar = this.r,
                ag = this.g,
                ab = this.b,
                br = other.r,
                bg = other.g,
                bb = other.b;

            this.r = br < ar ? br : ar;
            this.g = bg < ag ? bg : ag;
            this.b = bb < ab ? bb : ab;

            return this;
        };

        /**
         * @method max
         * @memberof Color
         * @brief returns max values from this and other vector
         * @param Color other
         * @return Color
         */
        Color.prototype.max = function(other) {
            var ar = this.r,
                ag = this.g,
                ab = this.b,
                br = other.r,
                bg = other.g,
                bb = other.b;

            this.r = br > ar ? br : ar;
            this.g = bg > ag ? bg : ag;
            this.b = bb > ab ? bb : ab;

            return this;
        };

        /**
         * @method fromVec2
         * @memberof Color
         * @brief sets values from Vec2
         * @param Vec2 v
         * @return this
         */
        Color.prototype.fromVec2 = function(v) {

            this.r = v.x;
            this.g = v.y;
            this.b = 0;

            return this;
        };

        /**
         * @method fromVec3
         * @memberof Color
         * @brief sets values from Vec3
         * @param Vec3 v
         * @return this
         */
        Color.prototype.fromVec3 = function(v) {

            this.r = v.x;
            this.g = v.y;
            this.b = v.z;

            return this;
        };

        /**
         * @method fromVec4
         * @memberof Color
         * @brief sets values from Vec4
         * @param Vec4 v
         * @return this
         */
        Color.prototype.fromVec4 = Color.prototype.fromVec3;

        /**
         * @method fromJSON
         * @memberof Color
         * @brief sets values from JSON object
         * @param Object json
         * @return this
         */
        Color.prototype.fromJSON = function(json) {

            this.r = json.r;
            this.g = json.g;
            this.b = json.b;

            return this;
        };

        /**
         * @method toJSON
         * @memberof Color
         * @brief returns json object of this
         * @return Object
         */
        Color.prototype.toJSON = function(json) {
            json || (json = {});

            json.r = this.r;
            json.g = this.g;
            json.b = this.b;

            return json;
        };

        /**
         * @method fromArray
         * @memberof Color
         * @brief sets values from Array object
         * @param Array array
         * @return this
         */
        Color.prototype.fromArray = function(array) {

            this.r = array[0];
            this.g = array[1];
            this.b = array[2];

            return this;
        };

        /**
         * @method toArray
         * @memberof Color
         * @brief returns array object of this
         * @return Array
         */
        Color.prototype.toArray = function(array) {
            array || (array = []);

            array[0] = this.r;
            array[1] = this.g;
            array[2] = this.b;

            return array;
        };

        /**
         * @method toString
         * @memberof Color
         * @brief returns string of this
         * @return String
         */
        Color.prototype.toString = function() {

            return "Color( " + this.r + ", " + this.g + ", " + this.b + " )";
        };


        function singleToHEX(value) {
            var str = (~~(clamp01(value) * 255)).toString(16);
            return str.length === 1 ? "0" + str : str;
        }


        var colorNames = Color.colorNames = {
            aliceblue: "#f0f8ff",
            antiquewhite: "#faebd7",
            aqua: "#00ffff",
            aquamarine: "#7fffd4",
            azure: "#f0ffff",
            beige: "#f5f5dc",
            bisque: "#ffe4c4",
            black: "#000000",
            blanchedalmond: "#ffebcd",
            blue: "#0000ff",
            blueviolet: "#8a2be2",
            brown: "#a52a2a",
            burlywood: "#deb887",
            cadetblue: "#5f9ea0",
            chartreuse: "#7fff00",
            chocolate: "#d2691e",
            coral: "#ff7f50",
            cornflowerblue: "#6495ed",
            cornsilk: "#fff8dc",
            crimson: "#dc143c",
            cyan: "#00ffff",
            darkblue: "#00008b",
            darkcyan: "#008b8b",
            darkgoldenrod: "#b8860b",
            darkgray: "#a9a9a9",
            darkgreen: "#006400",
            darkkhaki: "#bdb76b",
            darkmagenta: "#8b008b",
            darkolivegreen: "#556b2f",
            darkorange: "#ff8c00",
            darkorchid: "#9932cc",
            darkred: "#8b0000",
            darksalmon: "#e9967a",
            darkseagreen: "#8fbc8f",
            darkslateblue: "#483d8b",
            darkslategray: "#2f4f4f",
            darkturquoise: "#00ced1",
            darkviolet: "#9400d3",
            deeppink: "#ff1493",
            deepskyblue: "#00bfff",
            dimgray: "#696969",
            dodgerblue: "#1e90ff",
            firebrick: "#b22222",
            floralwhite: "#fffaf0",
            forestgreen: "#228b22",
            fuchsia: "#ff00ff",
            gainsboro: "#dcdcdc",
            ghostwhite: "#f8f8ff",
            gold: "#ffd700",
            goldenrod: "#daa520",
            gray: "#808080",
            green: "#008000",
            greenyellow: "#adff2f",
            grey: "#808080",
            honeydew: "#f0fff0",
            hotpink: "#ff69b4",
            indianred: "#cd5c5c",
            indigo: "#4b0082",
            ivory: "#fffff0",
            khaki: "#f0e68c",
            lavender: "#e6e6fa",
            lavenderblush: "#fff0f5",
            lawngreen: "#7cfc00",
            lemonchiffon: "#fffacd",
            lightblue: "#add8e6",
            lightcoral: "#f08080",
            lightcyan: "#e0ffff",
            lightgoldenrodyellow: "#fafad2",
            lightgrey: "#d3d3d3",
            lightgreen: "#90ee90",
            lightpink: "#ffb6c1",
            lightsalmon: "#ffa07a",
            lightseagreen: "#20b2aa",
            lightskyblue: "#87cefa",
            lightslategray: "#778899",
            lightsteelblue: "#b0c4de",
            lightyellow: "#ffffe0",
            lime: "#00ff00",
            limegreen: "#32cd32",
            linen: "#faf0e6",
            magenta: "#ff00ff",
            maroon: "#800000",
            mediumaquamarine: "#66cdaa",
            mediumblue: "#0000cd",
            mediumorchid: "#ba55d3",
            mediumpurple: "#9370d8",
            mediumseagreen: "#3cb371",
            mediumslateblue: "#7b68ee",
            mediumspringgreen: "#00fa9a",
            mediumturquoise: "#48d1cc",
            mediumvioletred: "#c71585",
            midnightblue: "#191970",
            mintcream: "#f5fffa",
            mistyrose: "#ffe4e1",
            moccasin: "#ffe4b5",
            navajowhite: "#ffdead",
            navy: "#000080",
            oldlace: "#fdf5e6",
            olive: "#808000",
            olivedrab: "#6b8e23",
            orange: "#ffa500",
            orangered: "#ff4500",
            orchid: "#da70d6",
            palegoldenrod: "#eee8aa",
            palegreen: "#98fb98",
            paleturquoise: "#afeeee",
            palevioletred: "#d87093",
            papayawhip: "#ffefd5",
            peachpuff: "#ffdab9",
            peru: "#cd853f",
            pink: "#ffc0cb",
            plum: "#dda0dd",
            powderblue: "#b0e0e6",
            purple: "#800080",
            red: "#ff0000",
            rosybrown: "#bc8f8f",
            royalblue: "#4169e1",
            saddlebrown: "#8b4513",
            salmon: "#fa8072",
            sandybrown: "#f4a460",
            seagreen: "#2e8b57",
            seashell: "#fff5ee",
            sienna: "#a0522d",
            silver: "#c0c0c0",
            skyblue: "#87ceeb",
            slateblue: "#6a5acd",
            slategray: "#708090",
            snow: "#fffafa",
            springgreen: "#00ff7f",
            steelblue: "#4682b4",
            tan: "#d2b48c",
            teal: "#008080",
            thistle: "#d8bfd8",
            tomato: "#ff6347",
            turquoise: "#40e0d0",
            violet: "#ee82ee",
            wheat: "#f5deb3",
            white: "#ffffff",
            whitesmoke: "#f5f5f5",
            yellow: "#ffff00",
            yellowgreen: "#9acd32"
        };


        return Color;
    }
);


define('math/mat4', [
        "math/mathf",
        "math/vec3"
    ],
    function(Mathf, Vec3) {



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
            var m11 = ae[0],
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
        Mat4.prototype.extractRotationScale = function(other) {
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


define('core/components/camera', [
        "math/mathf",
        "math/color",
        "math/vec3",
        "math/mat4",
        "core/components/component"
    ],
    function(Mathf, Color, Vec3, Mat4, Component) {



        var degsToRads = Mathf.degsToRads;


        function Camera(opts) {
            opts || (opts = {});

            Component.call(this, "Camera", !! opts.sync, opts.json);

            this.backgroundColor = opts.backgroundColor !== undefined ? opts.backgroundColor : new Color(0.5, 0.5, 0.5);

            this.width = 960;
            this.height = 640;

            this.aspect = this.width / this.height;
            this.fov = opts.fov !== undefined ? opts.fov : 35;

            this.near = opts.near !== undefined ? opts.near : 0.1;
            this.far = opts.far !== undefined ? opts.far : 512;

            this.orthographic = opts.orthographic !== undefined ? !! opts.orthographic : false;
            this.orthographicSize = opts.orthographicSize !== undefined ? opts.orthographicSize : 2;

            this.minOrthographicSize = opts.minOrthographicSize !== undefined ? opts.minOrthographicSize : 0.01;
            this.maxOrthographicSize = opts.maxOrthographicSize !== undefined ? opts.maxOrthographicSize : 1024;

            this.projection = new Mat4;
            this.view = new Mat4;

            this._needsUpdate = true;
            this._active = false;
        }

        Camera.type = "Camera";
        Component.extend(Camera);


        Camera.prototype.copy = function(other) {

            this.backgroundColor.copy(other.backgroundColor);
            this.width = other.width;
            this.height = other.height;
            this.aspect = other.aspect;

            this.far = other.far;
            this.near = other.near;
            this.fov = other.fov;

            this.orthographic = other.orthographic;
            this.orthographicSize = other.orthographicSize;
            this.minOrthographicSize = other.minOrthographicSize;
            this.maxOrthographicSize = other.maxOrthographicSize;

            this._needsUpdate = true;

            return this;
        };


        Camera.prototype.set = function(width, height) {

            this.width = width;
            this.height = height;
            this.aspect = width / height;
            this._needsUpdate = true;
        };


        Camera.prototype.setWidth = function(width) {

            this.width = width;
            this.aspect = width / this.height;
            this._needsUpdate = true;
        };


        Camera.prototype.setHeight = function(height) {

            this.height = height;
            this.aspect = this.width / height;
            this._needsUpdate = true;
        };


        Camera.prototype.setFov = function(value) {

            this.fov = value;
            this._needsUpdate = true;
        };


        Camera.prototype.setNear = function(value) {

            this.near = value;
            this._needsUpdate = true;
        };


        Camera.prototype.setFar = function(value) {

            this.far = value;
            this._needsUpdate = true;
        };


        Camera.prototype.setOrthographic = function(value) {

            this.orthographic = !! value;
            this._needsUpdate = true;
        };


        Camera.prototype.toggleOrthographic = function() {

            this.orthographic = !this.orthographic;
            this._needsUpdate = true;
        };


        Camera.prototype.setOrthographicSize = function(size) {

            this.orthographicSize = clamp(size, this.minOrthographicSize, this.maxOrthographicSize);
            this._needsUpdate = true;
        };


        var MAT4 = new Mat4,
            VEC3 = new Vec3;

        Camera.prototype.toWorld = function(v, out) {
            out || (out = new Vec3);

            out.x = 2 * v.x / this.width - 1;
            out.y = -2 * v.y / this.height + 1;
            out.transformMat4(MAT4.mmul(this.projection, this.view).inverse());
            out.z = this.near;

            return out;
        };


        Camera.prototype.toScreen = function(v, out) {
            out || (out = new Vec2);

            VEC3.copy(v);
            VEC3.transformMat4(MAT4.mmul(this.projection, this.view));

            out.x = ((VEC3.x + 1) * 0.5) * this.width;
            out.y = ((1 - VEC3.y) * 0.5) * this.height;

            return v;
        };


        Camera.prototype.update = function() {
            if (!this._active) return;

            if (this._needsUpdate) {

                if (!this.orthographic) {

                    this.projection.perspective(degsToRads(this.fov), this.aspect, this.near, this.far);
                } else {
                    this.orthographicSize = clamp(this.orthographicSize, this.minOrthographicSize, this.maxOrthographicSize);

                    var orthographicSize = this.orthographicSize,
                        right = orthographicSize * this.aspect,
                        left = -right,
                        top = orthographicSize,
                        bottom = -top;

                    this.projection.orthographic(left, right, bottom, top, this.near, this.far);
                }

                this._needsUpdate = false;
            }

            this.view.inverseMat(this.transform.matrixWorld);
        };


        Camera.prototype.sort = function(a, b) {

            return a._active ? -1 : b._active ? 1 : -1;
        };


        Camera.prototype.toSYNC = function(json) {
            json = Component.prototype.toSYNC.call(this, json);

            json.backgroundColor = this.backgroundColor.toJSON(json.backgroundColor);
            json.width = this.width;
            json.height = this.height;
            json.aspect = this.aspect;

            json.far = this.far;
            json.near = this.near;
            json.fov = this.fov;

            json.orthographic = this.orthographic;
            json.orthographicSize = this.orthographicSize;
            json.minOrthographicSize = this.minOrthographicSize;
            json.maxOrthographicSize = this.maxOrthographicSize;

            return json;
        };


        Camera.prototype.fromSYNC = function(json) {
            Component.prototype.fromSYNC.call(this, json);
            if (json.width !== this.width || json.height !== this.height) this._needsUpdate = true;

            this.backgroundColor.fromJSON(json.backgroundColor);
            this.width = json.width;
            this.height = json.height;
            this.aspect = json.aspect;

            this.far = json.far;
            this.near = json.near;
            this.fov = json.fov;

            this.orthographic = json.orthographic;
            this.orthographicSize = json.orthographicSize;
            this.minOrthographicSize = json.minOrthographicSize;
            this.maxOrthographicSize = json.maxOrthographicSize;

            return this;
        };


        Camera.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.backgroundColor = this.backgroundColor.toJSON(json.backgroundColor);
            json.width = this.width;
            json.height = this.height;
            json.aspect = this.aspect;

            json.far = this.far;
            json.near = this.near;
            json.fov = this.fov;

            json.orthographic = this.orthographic;
            json.orthographicSize = this.orthographicSize;
            json.minOrthographicSize = this.minOrthographicSize;
            json.maxOrthographicSize = this.maxOrthographicSize;

            return json;
        };


        Camera.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.backgroundColor.fromJSON(json.backgroundColor);
            this.width = json.width;
            this.height = json.height;
            this.aspect = json.aspect;

            this.far = json.far;
            this.near = json.near;
            this.fov = json.fov;

            this.orthographic = json.orthographic;
            this.orthographicSize = json.orthographicSize;
            this.minOrthographicSize = json.minOrthographicSize;
            this.maxOrthographicSize = json.maxOrthographicSize;

            this._needsUpdate = true;

            return this;
        };


        return Camera;
    }
);


define(
    'math/mat32', [], function() {



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
        Mat32.prototype.toJSON = function(json) {
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


define('core/components/camera_2d', [
        "math/mathf",
        "math/color",
        "math/vec2",
        "math/mat32",
        "math/mat4",
        "core/components/component"
    ],
    function(Mathf, Color, Vec2, Mat32, Mat4, Component) {



        var clamp = Mathf.clamp;


        function Camera2D(opts) {
            opts || (opts = {});

            Component.call(this, "Camera2D", !! opts.sync, opts.json);

            this.backgroundColor = opts.backgroundColor !== undefined ? opts.backgroundColor : new Color(0.5, 0.5, 0.5);

            this.width = 960;
            this.height = 640;

            this.aspect = this.width / this.height;

            this.orthographicSize = opts.orthographicSize !== undefined ? opts.orthographicSize : 2;

            this.minOrthographicSize = opts.minOrthographicSize !== undefined ? opts.minOrthographicSize : 0.01;
            this.maxOrthographicSize = opts.maxOrthographicSize !== undefined ? opts.maxOrthographicSize : 1024;

            this.projection = new Mat32;
            this.view = new Mat32;

            this._needsUpdate = true;
            this._active = false;
        }

        Camera2D.type = "Camera2D";
        Component.extend(Camera2D);


        Camera2D.prototype.copy = function(other) {

            this.backgroundColor.copy(other.backgroundColor);
            this.width = other.width;
            this.height = other.height;

            this.orthographicSize = other.orthographicSize;
            this.minOrthographicSize = other.minOrthographicSize;
            this.maxOrthographicSize = other.maxOrthographicSize;

            this._needsUpdate = true;

            return this;
        };


        Camera2D.prototype.set = function(width, height) {

            this.width = width;
            this.height = height;
            this.aspect = width / height;
            this._needsUpdate = true;
        };


        Camera2D.prototype.setWidth = function(width) {

            this.width = width;
            this.aspect = width / this.height;
            this._needsUpdate = true;
        };


        Camera2D.prototype.setHeight = function(height) {

            this.height = height;
            this.aspect = this.width / height;
            this._needsUpdate = true;
        };


        Camera2D.prototype.setOrthographicSize = function(size) {

            this.orthographicSize = clamp(size, this.minOrthographicSize, this.maxOrthographicSize);
            this._needsUpdate = true;
        };


        var MAT32 = new Mat32,
            VEC2 = new Vec2;
        Camera2D.prototype.toWorld = function(v, out) {
            out || (out = new Vec3);

            out.x = 2 * v.x / this.width - 1;
            out.y = -2 * v.y / this.height + 1;
            out.transformMat32(MAT32.mmul(this.projection, this.view).inverse());

            return out;
        };


        Camera2D.prototype.toScreen = function(v, out) {
            out || (out = new Vec2);

            VEC2.copy(v).transformMat32(MAT32.mmul(this.projection, this.view));

            out.x = ((VEC2.x + 1) * 0.5) * this.width;
            out.y = ((1 - VEC2.y) * 0.5) * this.height;

            return v;
        };


        Camera2D.prototype.update = function() {
            if (!this._active) return;

            if (this._needsUpdate) {
                var orthographicSize = this.orthographicSize,
                    right = orthographicSize * this.aspect,
                    left = -right,
                    top = orthographicSize,
                    bottom = -top;

                this.projection.orthographic(left, right, bottom, top);
                this._needsUpdate = false;
            }

            this.view.inverseMat(this.transform2d.matrixWorld);
        };


        Camera2D.prototype.sort = function(a, b) {

            return a._active ? -1 : b._active ? 1 : -1;
        };


        Camera2D.prototype.toSYNC = function(json) {
            json = Component.prototype.toSYNC.call(this, json);

            json.backgroundColor = this.backgroundColor.toJSON(json.backgroundColor);
            json.width = this.width;
            json.height = this.height;

            json.orthographicSize = this.orthographicSize;
            json.minOrthographicSize = this.minOrthographicSize;
            json.maxOrthographicSize = this.maxOrthographicSize;

            return json;
        };


        Camera2D.prototype.fromSYNC = function(json) {
            Component.prototype.fromSYNC.call(this, json);
            if (json.width !== this.width || json.height !== this.height) this._needsUpdate = true;

            this.backgroundColor.fromJSON(json.backgroundColor);
            this.width = json.width;
            this.height = json.height;

            this.orthographicSize = json.orthographicSize;
            this.minOrthographicSize = json.minOrthographicSize;
            this.maxOrthographicSize = json.maxOrthographicSize;

            return this;
        };


        Camera2D.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.backgroundColor = this.backgroundColor.toJSON(json.backgroundColor);
            json.width = this.width;
            json.height = this.height;

            json.orthographicSize = this.orthographicSize;
            json.minOrthographicSize = this.minOrthographicSize;
            json.maxOrthographicSize = this.maxOrthographicSize;

            return json;
        };


        Camera2D.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.backgroundColor.fromJSON(json.backgroundColor);
            this.width = json.width;
            this.height = json.height;

            this.orthographicSize = json.orthographicSize;
            this.minOrthographicSize = json.minOrthographicSize;
            this.maxOrthographicSize = json.maxOrthographicSize;

            this._needsUpdate = true;

            return this;
        };


        return Camera2D;
    }
);

if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define('core/components/emitter_2d', [
        "base/object_pool",
        "base/time",
        "math/mathf",
        "math/vec2",
        "math/color",
        "core/components/component"
    ],
    function(ObjectPool, Time, Mathf, Vec2, Color, Component) {



        var PI = Math.PI,
            TWO_PI = PI * 2,

            random = Math.random,
            randInt = Mathf.randInt,
            randFloat = Mathf.randFloat,
            clampTop = Mathf.clampTop,

            PARTICLE_POOL = Emitter2D.PARTICLE_POOL = new ObjectPool(Particle2D);

        /**
         * @class Emitter2D
         * @extends Component
         * @brief 2d particle emitter
         * @param Object options
         */
        function Emitter2D(opts) {
            opts || (opts = {});

            Component.call(this, "Emitter2D", opts.sync, opts.json);

            /**
             * @property Boolean worldSpace
             * @memberof Emitter2D
             */
            this.worldSpace = opts.worldSpace != undefined ? opts.worldSpace : true;

            /**
             * @property Vec2 offset
             * @memberof Emitter2D
             */
            this.offset = opts.offset != undefined ? opts.offset : new Vec2;

            /**
             * @property Number minEmission
             * @memberof Emitter2D
             */
            this.minEmission = opts.minEmission != undefined ? opts.minEmission : 1;

            /**
             * @property Number maxEmission
             * @memberof Emitter2D
             */
            this.maxEmission = opts.maxEmission != undefined ? opts.maxEmission : 2;

            /**
             * @property Number minLife
             * @memberof Emitter2D
             */
            this.minLife = opts.minLife != undefined ? opts.minLife : 1;

            /**
             * @property Number maxLife
             * @memberof Emitter2D
             */
            this.maxLife = opts.maxLife != undefined ? opts.maxLife : 2;

            /**
             * @property Number minSize
             * @memberof Emitter2D
             */
            this.minSize = opts.minSize != undefined ? opts.minSize : 0.1;

            /**
             * @property Number maxSize
             * @memberof Emitter2D
             */
            this.maxSize = opts.maxSize != undefined ? opts.maxSize : 0.5;

            /**
             * @property Vec2 angularVelocity
             * @memberof Emitter2D
             */
            this.velocity = opts.velocity != undefined ? opts.velocity : new Vec2(0, 0, 0);

            /**
             * @property Vec2 randVelocity
             * @memberof Emitter2D
             */
            this.randVelocity = opts.randVelocity != undefined ? opts.randVelocity : new Vec2(1, 1, 1);

            /**
             * @property Number angularVelocity
             * @memberof Emitter2D
             */
            this.angularVelocity = opts.angularVelocity != undefined ? opts.angularVelocity : 0;

            /**
             * @property Number randAngularVelocity
             * @memberof Emitter2D
             */
            this.randAngularVelocity = opts.randAngularVelocity != undefined ? opts.randAngularVelocity : PI;

            /**
             * @property Boolean randRotation
             * @memberof Emitter2D
             */
            this.randRotation = opts.randRotation != undefined ? opts.randRotation : true;

            /**
             * @property Number emissionRate
             * @memberof Emitter2D
             */
            this.emissionRate = opts.emissionRate != undefined ? opts.emissionRate : 1 / 60;

            /**
             * @property Color color
             * @memberof Emitter2D
             */
            this.color = opts.color != undefined ? opts.color : new Color;

            /**
             * @property Color randColor
             * @memberof Emitter2D
             */
            this.randColor = opts.randColor != undefined ? opts.randColor : new Color;

            /**
             * @property Number alphaStart
             * @memberof Emitter2D
             */
            this.alphaStart = opts.alphaStart != undefined ? opts.alphaStart : 0;

            /**
             * @property Number time
             * @memberof Emitter2D
             */
            this.time = opts.time != undefined ? opts.time : 0;
            this._time = 0;

            /**
             * @property Number duration
             * @memberof Emitter2D
             */
            this.duration = opts.duration != undefined ? opts.duration : 0;

            /**
             * @property Boolean loop
             * @memberof Emitter2D
             */
            this.loop = opts.loop != undefined ? opts.loop : true;

            /**
             * @property Boolean playing
             * @memberof Emitter2D
             */
            this.playing = opts.playing != undefined ? opts.playing : true;

            /**
             * @property Array particles
             * @memberof Emitter2D
             */
            this.particles = [];

            this._OBJ = [];
        }

        Emitter2D.type = "Emitter2D";
        Component.extend(Emitter2D);


        Emitter2D.prototype.copy = function(other) {

            this.worldSpace = other.worldSpace;

            this.minEmission = other.minEmission;
            this.maxEmission = other.maxEmission;

            this.minLife = other.minLife;
            this.maxLife = other.maxLife;

            this.minSize = other.minSize;
            this.maxSize = other.maxSize;

            this.velocity.copy(other.velocity);
            this.randVelocity.copy(other.randVelocity);

            this.angularVelocity = other.angularVelocity;
            this.randAngularVelocity = other.randAngularVelocity;
            this.randRotation = other.randRotation;

            this.emissionRate = other.emissionRate;

            this.color.copy(other.color);
            this.randColor.copy(other.randColor);

            this.time = other.time;
            this._time = other._time;

            this.duration = other.duration;
            this.loop = other.loop;
            this.playing = other.playing;

            return this;
        };

        /**
         * @method play
         * @memberof Emitter2D
         */
        Emitter2D.prototype.play = function() {
            if (this.playing) return;

            this.time = 0;
            this.playing = true;
        };

        var VEC = new Vec2;
        /**
         * @method spawn
         * @memberof Emitter2D
         * @brief spawns number of particles based on properties
         * @param Number count
         */
        Emitter2D.prototype.spawn = function(count) {
            var transform = this.gameObject.transform2d || this.gameObject.transform,
                position = transform.toWorld(VEC.set(0, 0)),
                offset = this.offset,
                particles = this.particles,
                numParticle2Ds = particles.length,
                particle,
                worldSpace = this.worldSpace,
                randRotation = this.randRotation,
                color = this.color,
                randColor = this.randColor,
                useRandColor = randColor.lengthSq() > 0,
                velocity = this.velocity,
                randVelocity = this.randVelocity,
                angularVelocity = this.angularVelocity,
                randAngularVelocity = this.randAngularVelocity,
                minLife = this.minLife,
                maxLife = this.maxLife,
                minSize = this.minSize,
                maxSize = this.maxSize,
                alphaStart = this.alphaStart,
                limit = clampTop(numParticle2Ds + count, Emitter2D.MAX_PARTICLES) - numParticle2Ds,
                vel, pos, col,
                i;

            for (i = limit; i--;) {
                particle = PARTICLE_POOL.create();
                pos = particle.position;
                vel = particle.velocity;
                col = particle.color;

                col.r = color.r;
                col.g = color.g;
                col.b = color.b;

                if (useRandColor) {
                    col.r += randColor.r * random();
                    col.g += randColor.g * random();
                    col.b += randColor.b * random();
                    col.check();
                }

                if (worldSpace) {
                    pos.x = offset.x + position.x;
                    pos.y = offset.y + position.y;
                } else {
                    pos.x = offset.x;
                    pos.y = offset.y;
                }

                particle.rotation = randRotation ? random() * TWO_PI : 0;

                particle.lifeTime = 0;
                particle.life = randFloat(minLife, maxLife);
                particle.size = randFloat(minSize, maxSize);

                vel.x = velocity.x + randFloat(-randVelocity.x, randVelocity.x);
                vel.y = velocity.y + randFloat(-randVelocity.y, randVelocity.y);
                particle.angularVelocity = angularVelocity + randFloat(-randAngularVelocity, randAngularVelocity)

                particle.alpha = alphaStart;

                particles.push(particle);
            }

            this.playing = true;
        };


        Emitter2D.prototype.update = function() {
            if (this.time > this.duration && !this.loop) this.playing = false;
            if (!this.playing && this.particles.length === 0) return;

            var dt = Time.delta,
                particles = this.particles,
                particle,
                ppos, pvel,
                t, d, p,
                i;

            this.time += dt;
            this._time += dt;

            if (this.playing && this._time > this.emissionRate) {
                this._time = 0;
                this.spawn(randInt(this.minEmission, this.maxEmission));
            }

            for (i = particles.length; i--;) {
                particle = particles[i];

                t = particle.lifeTime;
                d = particle.life;
                p = t / d;

                if (p > 1) {
                    PARTICLE_POOL.removeObject(particle);
                    particles.splice(i, 1);
                    continue;
                }

                ppos = particle.position;
                pvel = particle.velocity;

                ppos.x += pvel.x * dt;
                ppos.y += pvel.y * dt;
                particle.rotation += particle.angularVelocity * dt;

                particle.lifeTime += dt;
                particle.alpha = 1 - p;
            }
        };


        Emitter2D.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.worldSpace = this.worldSpace;

            json.offset = this.offset.toJSON(json.offset);

            json.minEmission = this.minEmission;
            json.maxEmission = this.maxEmission;

            json.minLife = this.minLife;
            json.maxLife = this.maxLife;

            json.minSize = this.minSize;
            json.maxSize = this.maxSize;

            json.velocity = this.velocity.toJSON(json.velocity);
            json.randVelocity = this.randVelocity.toJSON(json.randVelocity);

            json.angularVelocity = this.angularVelocity;
            json.randAngularVelocity = this.randAngularVelocity;
            json.randRotation = this.randRotation;

            json.emissionRate = this.emissionRate;

            json.color = this.color.toJSON(json.color);
            json.randColor = this.randColor.toJSON(json.randColor);

            json.time = this.time;
            json._time = this._time;

            json.duration = this.duration;
            json.loop = this.loop;
            json.playing = this.playing;

            return json;
        };


        Emitter2D.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.worldSpace = json.worldSpace;

            this.offset.fromJSON(json.offset);

            this.minEmission = json.minEmission;
            this.maxEmission = json.maxEmission;

            this.minLife = json.minLife;
            this.maxLife = json.maxLife;

            this.minSize = json.minSize;
            this.maxSize = json.maxSize;

            this.velocity.fromJSON(json.velocity);
            this.randVelocity.fromJSON(json.randVelocity);

            this.angularVelocity = json.angularVelocity;
            this.randAngularVelocity = json.randAngularVelocity;
            this.randRotation = json.randRotation;

            this.emissionRate = json.emissionRate;

            this.color.fromJSON(json.color);
            this.randColor.fromJSON(json.randColor);

            this.time = json.time;
            this._time = json._time;

            this.duration = json.duration;
            this.loop = json.loop;
            this.playing = json.playing;

            return this;
        };


        /**
         * @class Emitter2D.Particle2D
         * @brief 2d particle
         */
        function Particle2D() {

            /**
             * @property Number alpha
             * @memberof Emitter2D.Particle2D
             */
            this.alpha = 0;

            /**
             * @property Number lifeTime
             * @memberof Emitter2D.Particle2D
             */
            this.lifeTime = 0;

            /**
             * @property Number life
             * @memberof Emitter2D.Particle2D
             */
            this.life = 1;

            /**
             * @property Number size
             * @memberof Emitter2D.Particle2D
             */
            this.size = 1;

            /**
             * @property Color color
             * @memberof Emitter2D.Particle2D
             */
            this.color = new Color;

            /**
             * @property Vec2 position
             * @memberof Emitter2D.Particle2D
             */
            this.position = new Vec2;

            /**
             * @property Vec2 velocity
             * @memberof Emitter2D.Particle2D
             */
            this.velocity = new Vec2;

            /**
             * @property Number rotation
             * @memberof Emitter2D.Particle2D
             */
            this.rotation = 0;

            /**
             * @property Number angularVelocity
             * @memberof Emitter2D.Particle2D
             */
            this.angularVelocity = 0;


            this._OBJ = {};
        }


        Emitter2D.Particle2D = Particle2D;
        Emitter2D.MAX_PARTICLES = 1024;


        return Emitter2D;
    }
);


define('core/components/sprite_2d', [
        "base/time",
        "math/vec2",
        "core/components/component",
        "core/assets/assets"
    ],
    function(Time, Vec2, Component, Assets) {



        function Sprite2D(opts) {
            opts || (opts = {});

            Component.call(this, "Sprite2D", !! opts.sync, opts.json);

            this.visible = opts.visible != undefined ? !! opts.visible : true;

            this.z = opts.z != undefined ? opts.z : 0;

            this.alpha = opts.alpha != undefined ? opts.alpha : 1;

            this.texture = opts.texture != undefined ? opts.texture : undefined;

            this.width = opts.width || 1;
            this.height = opts.height || 1;

            this.x = opts.x || 0;
            this.y = opts.y || 0;
            this.w = opts.w || 1;
            this.h = opts.h || 1;
        }

        Sprite2D.type = "Sprite2D";
        Component.extend(Sprite2D);


        Sprite2D.prototype.copy = function(other) {

            this.visible = other.visible;

            this.z = other.z;

            this.alpha = other.alpha;

            this.texture = other.texture;

            this.width = other.width;
            this.height = other.height;

            this.x = other.x;
            this.y = other.y;
            this.w = other.w;
            this.h = other.h;

            return this;
        };


        Sprite2D.prototype.toSYNC = function(json) {
            json = Component.prototype.toSYNC.call(this, json);

            json.visible = this.visible;

            json.z = this.z;

            json.alpha = this.alpha;

            json.width = this.width;
            json.height = this.height;

            json.x = this.x;
            json.y = this.y;
            json.w = this.w;
            json.h = this.h;

            return json;
        };


        Sprite2D.prototype.fromSYNC = function(json) {
            Component.prototype.fromSYNC.call(this, json);

            this.visible = json.visible;

            this.z = json.z;

            this.alpha = json.alpha;

            this.width = json.width;
            this.height = json.height;

            this.x = json.x;
            this.y = json.y;
            this.w = json.w;
            this.h = json.h;

            return this;
        };


        Sprite2D.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.visible = this.visible;

            json.z = this.z;

            json.alpha = this.alpha;

            json.texture = this.texture ? this.texture.name : undefined;

            json.width = this.width;
            json.height = this.height;

            json.x = this.x;
            json.y = this.y;
            json.w = this.w;
            json.h = this.h;

            return json;
        };


        Sprite2D.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.visible = json.visible;

            this.z = json.z;

            this.alpha = json.alpha;

            this.texture = json.texture ? Assets.hash[json.texture] : undefined;

            this.width = json.width;
            this.height = json.height;

            this.x = json.x;
            this.y = json.y;
            this.w = json.w;
            this.h = json.h;

            return this;
        };


        Sprite2D.prototype.sort = function(a, b) {

            return b.z - a.z;
        };


        return Sprite2D;
    }
);


define('math/quat', [
        "math/mathf",
        "math/vec3"
    ],
    function(Mathf, Vec3) {



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


define('core/components/transform', [
        "math/mathf",
        "math/vec3",
        "math/quat",
        "math/mat4",
        "core/components/component",
        "core/game/log"
    ],
    function(Mathf, Vec3, Quat, Mat4, Component, Log) {



        var EPSILON = Mathf.EPSILON;


        function Transform(opts) {
            opts || (opts = {});

            Component.call(this, "Transform", opts.sync, opts.json);

            this.root = this;
            this.depth = 0;

            this.parent = undefined;
            this.children = [];

            this.position = opts.position !== undefined ? opts.position : new Vec3;
            this.rotation = opts.rotation !== undefined ? opts.rotation : new Quat;
            this.scale = opts.scale !== undefined ? opts.scale : new Vec3(1, 1, 1);

            this.matrix = new Mat4;
            this.matrixWorld = new Mat4;

            this.modelView = new Mat4;
            this._modelViewNeedsUpdate = false;
        }

        Transform.type = "Transform";
        Component.extend(Transform);


        Transform.prototype.copy = function(other) {
            var children = other.children,
                i;

            this.position.copy(other.position);
            this.scale.copy(other.scale);
            this.rotation.copy(other.rotation);

            for (i = children.length; i--;) this.add(children[i].gameObject.clone().transform);
            if (other.parent) other.parent.add(this);

            return this;
        };


        Transform.prototype.translate = function() {
            var vec = new Vec3;

            return function(translation, relativeTo) {
                vec.copy(translation);

                if (relativeTo instanceof Transform) {
                    vec.transformQuat(relativeTo.rotation);
                } else if (relativeTo instanceof Quat) {
                    vec.transformQuat(relativeTo);
                }

                this.position.add(vec);

                return this;
            };
        }();


        Transform.prototype.rotate = function() {
            var vec = new Vec3;

            return function(rotation, relativeTo) {
                vec.copy(rotation);

                if (relativeTo instanceof Transform) {
                    vec.transformQuat(relativeTo.rotation);
                } else if (relativeTo instanceof Quat) {
                    vec.transformQuat(relativeTo);
                }

                this.rotation.rotate(vec.x, vec.y, vec.z);

                return this;
            };
        }();


        Transform.prototype.lookAt = function() {
            var mat = new Mat4,
                vec = new Vec3,
                dup = new Vec3(0, 0, 1);

            return function(target, up) {
                up = up || dup;

                if (target instanceof Transform) {
                    vec.copy(target.position);
                } else {
                    vec.copy(target);
                }

                mat.lookAt(this.position, vec, up);
                this.rotation.fromMat4(mat);

                return this;
            };
        }();


        Transform.prototype.follow = function() {
            var target = new Vec3,
                position = new Vec3,
                delta = new Vec3;

            return function(transform, speed) {
                position.set(0, 0, 0).transformMat4(this.matrixWorld);
                target.set(0, 0, 0).transformMat4(transform.matrixWorld);

                delta.vsub(target, position);

                if (delta.lengthSq() > EPSILON) this.position.add(delta.smul(speed));

                return this;
            };
        }();


        Transform.prototype.addChild = function(child) {
            if (!(child instanceof Transform)) {
                Log.warn("Transform.add: can\'t add passed argument, it is not instance of Transform");
                return this;
            }
            var children = this.children,
                index = children.indexOf(child),
                root, depth;

            if (index < 0) {
                if (child.parent) child.parent.remove(child);

                child.parent = this;
                children.push(child);

                root = this;
                depth = 0;

                while (root.parent) {
                    root = root.parent;
                    depth++;
                }
                child.root = root;
                this.root = root;

                updateDepth(this, depth);
            } else {
                Log.warn("Transform.add: child is not a member of this Transform");
            }

            return this;
        };


        Transform.prototype.add = Transform.prototype.addChildren = function() {

            for (var i = arguments.length; i--;) this.addChild(arguments[i]);
            return this;
        };


        Transform.prototype.removeChild = function(child) {
            var children = this.children,
                index = children.indexOf(child),
                root, depth;

            if (index > -1) {
                child.parent = undefined;
                children.splice(index, 1);

                root = this;
                depth = 0;

                while (root.parent) {
                    root = root.parent;
                    depth++;
                }
                child.root = child;
                this.root = root;

                updateDepth(this, depth);
            } else {
                Log.warn("Transform.remove: child is not a member of this Transform");
            }

            return this;
        };


        Transform.prototype.remove = Transform.prototype.removeChildren = function() {

            for (var i = arguments.length; i--;) this.removeChild(arguments[i]);
            return this;
        };


        Transform.prototype.detachChildren = function() {
            var children = this.children,
                i;

            for (i = children.length; i--;) this.removeChild(children[i]);
            return this;
        };


        Transform.prototype.toWorld = function(v) {

            return v.transformMat4(this.matrixWorld);
        };


        Transform.prototype.toLocal = function() {
            var mat = new Mat4;

            return function(v) {

                return v.transformMat4(mat.inverseMat(this.matrixWorld));
            };
        }();


        Transform.prototype.update = function() {
            var matrix = this.matrix,
                parent = this.parent;

            matrix.compose(this.position, this.scale, this.rotation);

            if (parent) {
                this.matrixWorld.mmul(parent.matrixWorld, matrix);
            } else {
                this.matrixWorld.copy(matrix);
            }

            this._modelViewNeedsUpdate = true;
        };


        Transform.prototype.updateModelView = function(viewMatrix) {
            if (!this._modelViewNeedsUpdate) return;

            this.modelView.mmul(viewMatrix, this.matrixWorld);
            this._modelViewNeedsUpdate = false;
        };


        Transform.prototype.sort = function(a, b) {

            return b.depth - a.depth;
        };


        var VEC = new Vec3;
        Transform.prototype.toSYNC = function(json) {
            json = Component.prototype.toSYNC.call(this, json);

            if (this.parent) {
                json.position = this.toWorld(VEC.copy(this.position)).toJSON(json.position);
                json.scale = this.toWorld(VEC.copy(this.scale)).toJSON(json.scale);
                json.rotation = this.toWorld(VEC.copy(this.rotation)).toJSON(json.rotation);
            } else {
                json.position = this.position.toJSON(json.position);
                json.scale = this.scale.toJSON(json.scale);
                json.rotation = this.rotation.toJSON(json.rotation);
            }

            return json;
        };


        Transform.prototype.fromSYNC = function(json) {

            this.position.fromJSON(json.position);
            this.scale.fromJSON(json.scale);
            this.rotation.fromJSON(json.rotation);

            return this;
        };


        Transform.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.position = this.position.toJSON(json.position);
            json.scale = this.scale.toJSON(json.scale);
            json.rotation = this.rotation.toJSON(json.rotation);

            return json;
        };


        Transform.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.position.fromJSON(json.position);
            this.scale.fromJSON(json.scale);
            this.rotation.fromJSON(json.rotation);

            return this;
        };


        function updateDepth(transform, depth) {
            var children = transform.children,
                i;

            transform.depth = depth;

            for (i = children.length; i--;) updateDepth(children[i], depth + 1);
        }


        return Transform;
    }
);


define('core/components/transform_2d', [
        "math/mathf",
        "math/vec2",
        "math/mat32",
        "math/mat4",
        "core/components/component",
        "core/game/log"
    ],
    function(Mathf, Vec2, Mat32, Mat4, Component, Log) {



        var EPSILON = Mathf.EPSILON;


        function Transform2D(opts) {
            opts || (opts = {});

            Component.call(this, "Transform2D", opts.sync, opts.json);

            this.root = this;
            this.depth = 0;

            this.parent = undefined;
            this.children = [];

            this.position = opts.position != undefined ? opts.position : new Vec2;
            this.rotation = opts.rotation != undefined ? opts.rotation : 0;
            this.scale = opts.scale != undefined ? opts.scale : new Vec2(1, 1);

            this.matrix = new Mat32;
            this.matrixWorld = new Mat32;

            this.modelView = new Mat32;
            this._modelViewNeedsUpdate = false;
        }

        Transform2D.type = "Transform2D";
        Component.extend(Transform2D);


        Transform2D.prototype.copy = function(other) {
            var children = other.children,
                i;

            this.position.copy(other.position);
            this.scale.copy(other.scale);
            this.rotation = other.rotation;

            for (i = children.length; i--;) this.add(children[i].gameObject.clone().transform);
            if (other.parent) other.parent.add(this);

            return this;
        };


        Transform2D.prototype.translate = function() {
            var vec = new Vec2;

            return function(translation, relativeTo) {
                vec.copy(translation);

                if (relativeTo instanceof Transform2D) {
                    vec.transformAngle(relativeTo.rotation);
                } else if (relativeTo) {
                    vec.transformAngle(relativeTo);
                }

                this.position.add(vec);

                return this;
            };
        }();


        Transform2D.prototype.rotate = function() {
            var vec = new Vec2;

            return function(rotation, relativeTo) {
                vec.copy(rotation);

                if (relativeTo instanceof Transform2D) {
                    vec.transformAngle(relativeTo.rotation);
                } else if (relativeTo) {
                    vec.transformAngle(relativeTo);
                }

                this.rotation.rotate(vec.x, vec.y, vec.z);

                return this;
            };
        }();


        Transform2D.prototype.lookAt = function() {
            var mat = new Mat32,
                vec = new Vec2;

            return function(target, up) {
                up = up || dup;

                if (target instanceof Transform2D) {
                    vec.copy(target.position);
                } else {
                    vec.copy(target);
                }

                mat.lookAt(this.position, vec);
                this.rotation = mat.getRotation();

                return this;
            };
        }();


        Transform2D.prototype.follow = function() {
            var target = new Vec2,
                position = new Vec2,
                delta = new Vec2;

            return function(transform, speed) {
                position.set(0, 0).transformMat32(this.matrixWorld);
                target.set(0, 0).transformMat32(transform.matrixWorld);

                delta.vsub(target, position);

                if (delta.lengthSq() > EPSILON) this.position.add(delta.smul(speed));

                return this;
            };
        }();


        Transform2D.prototype.addChild = function(child) {
            if (!(child instanceof Transform2D)) {
                Log.warn("Transform2D.add: can\'t add passed argument, it is not instance of Transform2D");
                return this;
            }
            var children = this.children,
                index = children.indexOf(child),
                root, depth;

            if (index < 0) {
                if (child.parent) child.parent.remove(child);

                child.parent = this;
                children.push(child);

                root = this;
                depth = 0;

                while (root.parent) {
                    root = root.parent;
                    depth++;
                }
                child.root = root;
                this.root = root;

                updateDepth(this, depth);
            } else {
                Log.warn("Transform2D.add: child is not a member of this Transform2D");
            }

            return this;
        };


        Transform2D.prototype.add = Transform2D.prototype.addChildren = function() {

            for (var i = arguments.length; i--;) this.addChild(arguments[i]);
            return this;
        };


        Transform2D.prototype.removeChild = function(child) {
            var children = this.children,
                index = children.indexOf(child),
                root, depth;

            if (index > -1) {
                child.parent = undefined;
                children.splice(index, 1);

                root = this;
                depth = 0;

                while (root.parent) {
                    root = root.parent;
                    depth++;
                }
                child.root = child;
                this.root = root;

                updateDepth(this, depth);
            } else {
                Log.warn("Transform2D.remove: child is not a member of this Transform2D");
            }

            return this;
        };


        Transform2D.prototype.remove = Transform2D.prototype.removeChildren = function() {

            for (var i = arguments.length; i--;) this.removeChild(arguments[i]);
            return this;
        };


        Transform2D.prototype.detachChildren = function() {
            var children = this.children,
                i;

            for (i = children.length; i--;) this.removeChild(children[i]);
            return this;
        };


        Transform2D.prototype.toWorld = function(v) {

            return v.transformMat32(this.matrixWorld);
        };


        Transform2D.prototype.toLocal = function() {
            var mat = new Mat32;

            return function(v) {

                return v.transformMat32(mat.inverseMat(this.matrixWorld));
            };
        }();


        Transform2D.prototype.update = function() {
            var matrix = this.matrix,
                parent = this.parent;

            matrix.compose(this.position, this.scale, this.rotation);

            if (parent) {
                this.matrixWorld.mmul(parent.matrixWorld, matrix);
            } else {
                this.matrixWorld.copy(matrix);
            }

            this._modelViewNeedsUpdate = true;
        };


        Transform2D.prototype.updateModelView = function(viewMatrix) {
            if (!this._modelViewNeedsUpdate) return;

            this.modelView.mmul(viewMatrix, this.matrixWorld);
            this._modelViewNeedsUpdate = false;
        };


        Transform2D.prototype.sort = function(a, b) {

            return b.depth - a.depth;
        };


        var VEC = new Vec2;
        Transform2D.prototype.toSYNC = function(json) {
            json = Component.prototype.toSYNC.call(this, json);

            if (this.parent) {
                json.position = this.toWorld(VEC.copy(this.position)).toJSON(json.position);
                json.scale = this.toWorld(VEC.copy(this.scale)).toJSON(json.scale);
                json.rotation = this.rotation - this.parent.rotation;
            } else {
                json.position = this.position.toJSON(json.position);
                json.scale = this.scale.toJSON(json.scale);
                json.rotation = this.rotation;
            }

            return json;
        };


        Transform2D.prototype.fromSYNC = function(json) {

            this.position.fromJSON(json.position);
            this.scale.fromJSON(json.scale);
            this.rotation = json.rotation;

            return this;
        };


        Transform2D.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.position = this.position.toJSON(json.position);
            json.scale = this.scale.toJSON(json.scale);
            json.rotation = this.rotation

            return json;
        };


        Transform2D.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.position.fromJSON(json.position);
            this.scale.fromJSON(json.scale);
            this.rotation = json.rotation;

            return this;
        };


        function updateDepth(transform, depth) {
            var children = transform.children,
                i;

            transform.depth = depth;
            for (i = children.length; i--;) updateDepth(children[i], depth + 1);
        }


        return Transform2D;
    }
);


define('core/game/loop', [
        "base/request_animation_frame",
        "core/game/log"
    ],
    function(requestAnimationFrame, Log) {



        function Loop(callback, ctx) {
            ctx || (ctx = this);

            this._loopState = L_PAUSED;
            this._runState = R_PAUSED;

            this.callback = callback;
            this.ctx = ctx || this;

            var self = this;
            this._run = function(ms) {

                self._runState = R_RUNNING;

                if (callback) {
                    callback.call(ctx, ms);

                    if (self._loopState === L_RUNNING) {
                        self._pump();
                    } else {
                        self.pause();
                    }
                }

                self._runState = R_PAUSED;
            }
        }


        Loop.prototype.init = Loop.prototype.resume = function() {
            if (!this.callback) {
                Log.warn("Loop.resume: can't run loop without callback");
                return;
            }

            this._loopState = L_RUNNING;

            if (this._runState === R_PAUSED) this._pump();
        };


        Loop.prototype.pause = function() {

            this._loopState = L_PAUSED;
        };


        Loop.prototype.isRunning = function() {

            return this._loopState === L_RUNNING;
        };


        Loop.prototype.isPaused = function() {

            return this._loopState === L_PAUSED;
        };


        Loop.prototype._pump = function() {

            requestAnimationFrame(this._run);
        };


        var L_RUNNING = Loop.L_RUNNING = 1,
            L_PAUSED = Loop.L_PAUSED = 2,

            R_RUNNING = Loop.R_RUNNING = 1,
            R_PAUSED = Loop.R_PAUSED = 2;


        return Loop;
    }
);


define('core/game_object', [
        "base/class",
        "core/components/component",
        "core/game/log"
    ],
    function(Class, Component, Log) {



        /**
         * @class GameObject
         * @extends Class
         * @brief base class for entities in scenes
         * @param Object options
         */

        function GameObject(opts) {
            opts || (opts = {});

            Class.call(this);

            this.sync = opts.sync != undefined ? !! opts.sync : true;
            this.json = opts.json != undefined ? !! opts.json : true;

            this.scene = undefined;

            this.tags = [];

            this.components = [];
            this._componentHash = {};
            this._componentHashServer = {};

            if (opts.tags) this.addTags.apply(this, opts.tags);
            if (opts.components) this.addComponents.apply(this, opts.components);
        }

        Class.extend(GameObject);


        GameObject.prototype.copy = function(other) {
            var components = other.components,
                tags = other.tags,
                i;

            this.clear();

            for (i = components.length; i--;) this.addComponent(components[i].clone());
            for (i = tags.length; i--;) this.addTag(tags[i]);

            if (other.scene) other.scene.addGameObject(this);

            return this;
        };


        GameObject.prototype.clear = function() {
            var components = this.components,
                tags = this.tags,
                i;

            for (i = tags.length; i--;) this.removeTag(tags[i]);
            for (i = components.length; i--;) this.removeComponent(components[i]);

            return this;
        };


        GameObject.prototype.destroy = function() {
            if (!this.scene) {
                Log.warn("GameObject.destroy: can't destroy GameObject if it's not added to a Scene");
                return this;
            }

            this.scene.removeGameObject(this);
            this.emit("destroy");

            this.clear();

            return this;
        };


        GameObject.prototype.addTag = function(tag) {
            var tags = this.tags,
                index = tags.indexOf(tag);

            if (index === -1) tags.push(tag);

            return this;
        };


        GameObject.prototype.addTags = function() {

            for (var i = arguments.length; i--;) this.addTag(arguments[i]);
            return this;
        };


        GameObject.prototype.removeTag = function(tag) {
            var tags = this.tags,
                index = tags.indexOf(tag);

            if (index !== -1) tags.splice(index, 1);

            return this;
        };


        GameObject.prototype.removeTags = function() {

            for (var i = arguments.length; i--;) this.removeTag(arguments[i]);
            return this;
        };


        GameObject.prototype.hasTag = function(tag) {

            return this.tags.indexOf(tag) !== -1;
        };


        GameObject.prototype.addComponent = function(component, others) {
            if (typeof(component) === "string") component = new Component._types[component];
            if (!(component instanceof Component)) {
                Log.warn("GameObject.addComponent: can't add passed argument, it is not instance of Component");
                return this;
            }
            var name = component._name,
                components = this.components,
                index = components.indexOf(component),
                comp, i, j;

            if (index === -1) {
                if (component.gameObject) component = component.clone();

                components.push(component);
                this._componentHash[component._id] = component;
                if (component._serverId !== -1) this._componentHashServer[component._serverId] = component;

                component.gameObject = this;
                this[name] = component;

                if (!others) {
                    for (i = components.length; i--;) {
                        comp = components[i];
                        if (!comp) continue;

                        for (j = components.length; j--;) {
                            name = components[j]._name;
                            comp[name] = components[j];
                        }
                    }
                }

                this.emit("add" + component._type, component);
                this.emit("addComponent", component);

                if (this.scene) this.scene._addComponent(component);
            } else {
                Log.warn("GameObject.addComponent: GameObject already has a(n) " + type + " Component");
            }

            return this;
        };


        GameObject.prototype.add = GameObject.prototype.addComponents = function() {
            var length = arguments.length,
                components = this.components,
                component, name,
                i, j;

            for (i = length; i--;) this.addComponent(arguments[i], true);

            for (i = components.length; i--;) {
                component = components[i];
                if (!component) continue;

                for (j = components.length; j--;) {
                    name = components[j]._name;
                    component[name] = components[j];
                }
            }

            return this;
        };


        GameObject.prototype.removeComponent = function(component, others) {
            if (typeof(component) === "string") component = this.getComponent(component);
            if (!(component instanceof Component)) {
                Log.warn("GameObject.removeComponent: can't remove passed argument, it is not instance of Component");
                return this;
            }
            var name = component._name,
                components = this.components,
                index = components.indexOf(component),
                comp, i, j;

            if (index !== -1) {

                if (!others) {
                    for (i = components.length; i--;) {
                        comp = components[i];
                        if (!comp) continue;

                        for (j = components.length; j--;) {
                            if (name === components[j]._name) comp[name] = undefined;
                        }
                    }
                }

                components.splice(index, 1);
                this._componentHash[component._id] = undefined;
                if (component._serverId !== -1) this._componentHashServer[component._serverId] = undefined;

                component.gameObject = undefined;
                this[name] = undefined;

                this.emit("remove" + component._type, component);
                this.emit("removeComponent", component);

                if (this.scene) this.scene._removeComponent(component);
            } else {
                Log.warn("GameObject.removeComponent: GameObject does not have a(n) " + type + " Component");
            }

            return this;
        };


        GameObject.prototype.remove = GameObject.prototype.removeComponents = function() {
            var length = arguments.length,
                components = this.components,
                toRemove = arguments,
                component, name,
                i, j;

            for (i = length; i--;) this.removeComponent(arguments[i], true);

            for (i = components.length; i--;) {
                component = components[i];
                if (!component) continue;

                name = component._name;
                for (j = toRemove.length; j--;) {

                    if (name === toRemove[i]._name) component[name] = undefined;
                }
            }

            return this;
        };


        GameObject.prototype.getComponent = function(type) {

            return this._componentHash[type] || this[type] || this[type.toLowerCase()];
        };


        GameObject.prototype.hasComponent = function(type) {
            var components = this.components,
                i;

            for (i = components.length; i--;)
                if (components[i]._type === type) return true;
            return false;
        };


        GameObject.prototype.findComponentById = function(id) {

            return this._componentHash[id];
        };


        GameObject.prototype.findComponentByServerId = function(id) {

            return this._componentHashServer[id];
        };


        GameObject.prototype.toSYNC = function(json) {
            json = Class.prototype.toSYNC.call(this, json);
            var components = this.components,
                jsonComponents = json.components || (json.components = []),
                component,
                i;

            for (i = components.length; i--;)
                if ((component = components[i]).sync) jsonComponents[i] = component.toSYNC(jsonComponents[i]);
            return json;
        };


        GameObject.prototype.fromSYNC = function(json, alpha) {
            Class.prototype.fromSYNC.call(this, json);
            var jsonComponents = json.components || (json.components = []),
                component, jsonComponent, type,
                i;

            for (i = jsonComponents.length; i--;) {
                if (!(jsonComponent = jsonComponents[i])) continue;

                if ((component = this.findComponentByServerId(jsonComponent._id))) {
                    component.fromSYNC(jsonComponent, alpha);
                } else {
                    if (!(type = Component._types[jsonComponent._type])) continue;
                    this.addComponent(new type().fromSYNC(jsonComponent, alpha));
                }
            }

            return this;
        };


        GameObject.prototype.toJSON = function(json) {
            json = Class.prototype.toJSON.call(this, json);
            var components = this.components,
                jsonComponents = json.components || (json.components = []),
                tags = this.tags,
                jsonTags = json.tags || (json.tags = []),
                component,
                i;

            for (i = components.length; i--;)
                if ((component = components[i]).json) jsonComponents[i] = component.toJSON(jsonComponents[i]);
            for (i = tags.length; i--;) jsonTags[i] = tags[i];

            return json;
        };


        GameObject.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);
            var jsonComponents = json.components || (json.components = []),
                component, jsonComponent, type,
                tags = this.tags,
                jsonTags = json.tags || (json.tags = []),
                i;

            for (i = jsonComponents.length; i--;) {
                if (!(jsonComponent = jsonComponents[i])) continue;
                if (!(type = Component._types[jsonComponent._type])) continue;

                if ((component = this.findComponentByServerId(jsonComponent._id))) {
                    component.fromJSON(jsonComponent);
                } else {
                    this.addComponent(new type().fromJSON(jsonComponent));
                }
            }
            for (i = jsonTags.length; i--;)
                if (!this.hasTag(jsonTags[i])) tags.push(jsonTags[i]);

            return this;
        };


        return GameObject;
    }
);


define('core/scene', [
        "base/class",
        "core/game_object",
        "core/game/log"
    ],
    function(Class, GameObject, Log) {



        function Scene(opts) {
            opts || (opts = {});

            Class.call(this);

            this.game = undefined;
            this._needsSync = true;

            this.name = opts.name != undefined ? opts.name : "Scene-" + this._id;

            this.gameObjects = [];
            this._gameObjectHash = {};
            this._gameObjectServerHash = {};

            this.components = {};
            this._componentTypes = [];
            this._componentHash = {};
            this._componentHashServer = {};

            if (opts.gameObjects) this.addGameObjects.apply(this, opts.gameObjects);
        }

        Class.extend(Scene);


        Scene.prototype.init = function() {
            var types = this._componentTypes,
                gameObjects = this.gameObjects,
                components, i, j;

            for (i = types.length; i--;) {
                components = types[i];

                for (j = components.length; j--;) components[j].init();
            }

            for (i = gameObjects.length; i--;) gameObjects[i].emit("init");
        };


        Scene.prototype.update = function() {
            var types = this._componentTypes,
                gameObjects = this.gameObjects,
                components, i, j;

            for (i = types.length; i--;) {
                components = types[i];
                for (j = components.length; j--;) components[j].update();
            }

            for (i = gameObjects.length; i--;) gameObjects[i].emit("update");
            this._needsSync = true;
        };


        Scene.prototype.clear = function() {
            var gameObjects = this.gameObjects,
                i;

            for (i = gameObjects.length; i--;) this.removeGameObject(gameObjects[i]);
            return this;
        };


        Scene.prototype.destroy = function() {
            if (!this.game) {
                Log.warn("Scene.destroy: can't destroy Scene if it's not added to a Game");
                return this;
            }

            this.game.removeScene(this);
            this.emit("destroy");

            this.clear();

            return this;
        };


        Scene.prototype.addGameObject = function(gameObject) {
            if (!(gameObject instanceof GameObject)) {
                Log.warn("Scene.addGameObject: can't add argument to Scene, it's not an instance of GameObject");
                return this;
            }
            var gameObjects = this.gameObjects,
                index = gameObjects.indexOf(gameObject),
                components,
                i;

            if (index === -1) {
                if (gameObject.scene) gameObject.scene.removeGameObject(gameObject);

                gameObjects.push(gameObject);
                this._gameObjectHash[gameObject._id] = gameObject;
                if (gameObject._serverId !== -1) this._gameObjectServerHash[gameObject._serverId] = gameObject;

                gameObject.scene = this;

                components = gameObject.components;
                for (i = components.length; i--;) this._addComponent(components[i]);

                if (this.game) gameObject.emit("init");

                this.emit("addGameObject", gameObject);
            } else {
                Log.warn("Scene.addGameObject: GameObject is already a member of Scene");
            }

            return this;
        };


        Scene.prototype.add = Scene.prototype.addGameObjects = function() {

            for (var i = arguments.length; i--;) this.addGameObject(arguments[i]);
            return this;
        };


        Scene.prototype._addComponent = function(component) {
            if (!component) return;
            var type = component._type,
                components = this.components,
                isNew = !components[type],
                types = (components[type] = components[type] || []);

            this._componentHash[component._id] = component;
            if (component._serverId !== -1) this._componentHashServer[component._serverId] = component;

            types.push(component);
            types.sort(component.sort);

            if (isNew) this._componentTypes.push(types);

            if (this.game) component.init();
            this.emit("add" + type, component);
            this.emit("addComponent", component);
        };


        Scene.prototype.removeGameObject = function(gameObject) {
            if (!(gameObject instanceof GameObject)) {
                Log.warn("Scene.removeGameObject: can't remove argument from Scene, it's not an instance of GameObject");
                return this;
            }
            var gameObjects = this.gameObjects,
                index = gameObjects.indexOf(gameObject),
                components,
                i;

            if (index !== -1) {
                gameObjects.splice(index, 1);
                this._gameObjectHash[gameObject._id] = undefined;
                if (gameObject._serverId !== -1) this._gameObjectServerHash[gameObject._serverId] = undefined;

                gameObject.scene = undefined;

                components = gameObject.components;
                for (i = components.length; i--;) this._removeComponent(components[i]);

                this.emit("removeGameObject", gameObject);
            } else {
                Log.warn("Scene.removeGameObject: GameObject is not a member of Scene");
            }

            return this;
        };


        Scene.prototype.remove = Scene.prototype.removeGameObjects = function() {

            for (var i = arguments.length; i--;) this.removeGameObject(arguments[i]);
            return this;
        };


        Scene.prototype._removeComponent = function(component) {
            if (!component) return;
            var type = component._type,
                components = this.components,
                types = components[type],
                index = types.indexOf(component);

            this._componentHash[component._id] = undefined;
            if (component._serverId !== -1) this._componentHashServer[component._serverId] = undefined;

            types.splice(index, 1);
            types.sort(component.sort);

            this.emit("remove" + type, component);
            this.emit("removeComponent", component);

            component.clear();
        };


        Scene.prototype.findById = function(id) {

            return this._gameObjectHash[id];
        };


        Scene.prototype.findByServerId = function(id) {

            return this._gameObjectServerHash[id];
        };


        Scene.prototype.findComponentById = function(id) {

            return this._componentHash[id];
        };


        Scene.prototype.findComponentByServerId = function(id) {

            return this._componentHashServer[id];
        };


        Scene.prototype.toSYNC = function(json) {
            if (!this._needsSync) {
                console.log("optimize");
                return this._SYNC;
            }
            json = Class.prototype.toSYNC.call(this, json);
            var gameObjects = this.gameObjects,
                jsonGameObjects = json.gameObjects || (json.gameObjects = []),
                gameObject,
                i;

            for (i = gameObjects.length; i--;) {
                if ((gameObject = gameObjects[i]).sync) jsonGameObjects[i] = gameObject.toSYNC(jsonGameObjects[i]);
            }

            this._needsSync = false;

            return json;
        };


        Scene.prototype.fromSYNC = function(json, alpha) {
            Class.prototype.fromSYNC.call(this, json);
            var jsonGameObjects = json.gameObjects,
                gameObject, jsonGameObject,
                i;

            for (i = jsonGameObjects.length; i--;) {
                if (!(jsonGameObject = jsonGameObjects[i])) continue;
                if ((gameObject = this.findByServerId(jsonGameObject._id))) gameObject.fromSYNC(jsonGameObject, alpha);
            }

            return this;
        };


        Scene.prototype.toJSON = function(json) {
            json = Class.prototype.toJSON.call(this, json);
            var gameObjects = this.gameObjects,
                jsonGameObjects = json.gameObjects || (json.gameObjects = []),
                gameObject,
                i;

            json.name = this.name;

            for (i = gameObjects.length; i--;) {
                if ((gameObject = gameObjects[i]).json) jsonGameObjects[i] = gameObject.toJSON(jsonGameObjects[i]);
            }

            return json;
        };


        Scene.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);
            var jsonGameObjects = json.gameObjects,
                gameObject, jsonGameObject,
                i;

            this.name = json.name;

            for (i = jsonGameObjects.length; i--;) {
                if (!(jsonGameObject = jsonGameObjects[i])) continue;

                if ((gameObject = this.findByServerId(jsonGameObject._id))) {
                    gameObject.fromJSON(jsonGameObject);
                } else {
                    this.addGameObject(new GameObject().fromJSON(jsonGameObject));
                }
            }

            return this;
        };


        return Scene;
    }
);


define('core/game/game', [
        "base/class",
        "core/game/loop",
        "core/scene",
        "core/game/log"
    ],
    function(Class, Loop, Scene, Log) {



        function Game(opts) {
            opts || (opts = {});

            Class.call(this);

            this._loop = new Loop(this.loop, this);

            this.scenes = [];
            this._sceneHash = {};
            this._sceneServerHash = {};
        }

        Class.extend(Game);


        Game.prototype.addScene = function(scene) {
            if (!(scene instanceof Scene)) {
                Log.warn("Game.addScene: can't add argument to Game, it's not an instance of Scene");
                return this;
            }
            var scenes = this.scenes,
                index = scenes.indexOf(scene);

            if (index === -1) {
                if (scene.game) scene.game.removeScene(scene);

                scenes.push(scene);
                this._sceneHash[scene._id] = scene;
                if (scene._serverId !== -1) this._sceneServerHash[scene._serverId] = scene;

                scene.game = this;

                this.emit("addScene", scene);
            } else {
                Log.warn("Game.addScene: Scene is already a member of Game");
            }

            return this;
        };


        Game.prototype.add = Game.prototype.addScenes = function() {

            for (var i = arguments.length; i--;) this.addScene(arguments[i]);
            return this;
        };


        Game.prototype.removeScene = function(scene) {
            if (!(scene instanceof Scene)) {
                Log.warn("Game.removeScene: can't remove argument from Game, it's not an instance of Scene");
                return this;
            }
            var scenes = this.scenes,
                index = scenes.indexOf(scene);

            if (index !== -1) {

                scenes.splice(index, 1);
                this._sceneHash[scene._id] = undefined;
                if (scene._serverId !== -1) this._sceneServerHash[scene._serverId] = undefined;

                scene.game = undefined;

                this.emit("removeScene", scene);
            } else {
                Log.warn("Game.removeScene: Scene not a member of Game");
            }

            return this;
        };


        Game.prototype.remove = Game.prototype.removeScenes = function() {

            for (var i = arguments.length; i--;) this.removeScene(arguments[i]);
            return this;
        };


        Game.prototype.findById = function(id) {

            return this._sceneHash[id];
        };


        Game.prototype.findByServerId = function(id) {

            return this._sceneServerHash[id];
        };


        Game.prototype.pause = function() {

            this._loop.pause();
            return this;
        };


        Game.prototype.resume = function() {

            this._loop.resume();
            return this;
        };


        Game.prototype.loop = function(ms) {

            this.emit("update", ms);
        };


        Game.prototype.toSYNC = function(json) {
            json || (json = this._SYNC);
            var scenes = this.scenes,
                jsonScenes = json.jsonScenes || (json.jsonScenes = []),
                i;

            for (i = scenes.length; i--;) jsonScenes[i] = scenes[i].toSYNC(jsonScenes[i]);

            return json;
        };


        Game.prototype.fromSYNC = function(json) {
            var jsonScenes = json.scenes,
                scene, jsonScene,
                i;

            for (i = jsonScenes.length; i--;) {
                jsonScene = jsonScenes[i];

                if ((scene = this.findByServerId(jsonScene._serverId))) scene.fromSYNC(jsonScene);
            }

            return this;
        };


        Game.prototype.toJSON = function(json) {
            json || (json = {});
            Class.prototype.toJSON.call(this, json);
            var scenes = this.scenes,
                jsonScenes = json.scenes || (json.scenes = []),
                i;

            for (i = scenes.length; i--;) jsonScenes[i] = scenes[i].toJSON(jsonScenes[i]);

            return json;
        };


        Game.prototype.fromJSON = function(json) {
            Class.prototype.fromJSON.call(this, json);
            var jsonScenes = json.scenes,
                scene, jsonScene,
                i;

            for (i = jsonScenes.length; i--;) {
                jsonScene = jsonScenes[i];

                if ((scene = this.findByServerId(jsonScene._id))) {
                    scene.fromJSON(jsonScene);
                } else {
                    this.addScene(new Scene().fromJSON(jsonScene));
                }
            }

            return this;
        };


        return Game;
    }
);


define('core/rendering/canvas', [
        "base/event_emitter",
        "base/device",
        "base/dom",
        "core/game/config"
    ],
    function(EventEmitter, Device, Dom, Config) {



        var addEvent = Dom.addEvent,
            removeEvent = Dom.removeEvent,
            addMeta = Dom.addMeta,
            floor = Math.floor,

            SCALE_REG = /-scale\s *=\s*[.0-9]+/g,
            VIEWPORT = "viewport",
            VIEWPORT_WIDTH = "viewport-width",
            VIEWPORT_HEIGHT = "viewport-height",
            CANVAS_STYLE = [
                "background: #000000;",
                "position: absolute;",
                "top: 50%;",
                "left: 50%;",
                "padding:0px;",
                "margin: 0px;"
            ].join("\n");

        addMeta(VIEWPORT, "viewport", "initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no");
        addMeta(VIEWPORT_WIDTH, "viewport", "width=device-width");
        addMeta(VIEWPORT_HEIGHT, "viewport", "height=device-height");

        /**
         * @class Canvas
         * @extends EventEmitter
         * @brief canvas helper
         * @param Number width
         * @param Number height
         */

        function Canvas(width, height) {

            EventEmitter.call(this);

            /**
             * @property Boolean fullScreen
             * @memberof Canvas
             */
            this.fullScreen = (width === undefined && height === undefined) ? true : false;

            /**
             * @property Number width
             * @memberof Canvas
             */
            this.width = width !== undefined ? width : window.innerWidth;

            /**
             * @property Number height
             * @memberof Canvas
             */
            this.height = height !== undefined ? height : window.innerHeight;

            /**
             * @property Number aspect
             * @memberof Canvas
             */
            this.aspect = this.width / this.height;

            /**
             * @property Number pixelWidth
             * @memberof Canvas
             */
            this.pixelWidth = this.width;

            /**
             * @property Number pixelHeight
             * @memberof Canvas
             */
            this.pixelHeight = this.height;

            /**
             * @property HTMLCanvasElement element
             * @memberof Canvas
             */
            this.element = undefined;
        }

        EventEmitter.extend(Canvas);


        Canvas.prototype.init = function() {
            if (this.element) this.destroy();
            var element = document.createElement("canvas");

            element.style.cssText = CANVAS_STYLE;
            document.body.appendChild(element);

            if (!Config.debug) {
                element.oncontextmenu = function() {
                    return false;
                };
            }
            addEvent(window, "resize orientationchange", this.handleResize, this);

            this.element = element;
            this.handleResize();
        };


        Canvas.prototype.destroy = function() {
            if (!this.element) return this;

            removeEvent(window, "resize orientationchange", this.handleResize, this);
            document.body.removeChild(this.element);
            this.element = undefined;

            return this;
        };

        /**
         * @method setFullscreen
         * @memberof Canvas
         * @brief sets fullScreen boolean
         * @param Number width
         */
        Canvas.prototype.setFullscreen = function(value) {
            if (!this.element || this.fullScreen === value) return this;

            this.fullScreen = !! value;
            this.handleResize();

            return this;
        };

        /**
         * @method setWidth
         * @memberof Canvas
         * @brief sets width and updates aspect
         * @param Number width
         */
        Canvas.prototype.setWidth = function(width) {
            if (!this.element || this.width === width) return this;

            this.width = width;
            this.fullScreen = false;
            this.aspect = this.width / this.height;

            this.handleResize();

            return this;
        };

        /**
         * @method setHeight
         * @memberof Canvas
         * @brief sets height and updates aspect
         * @param Number height
         */
        Canvas.prototype.setHeight = function(height) {
            if (!this.element || this.height === height) return this;

            this.height = height;
            this.fullScreen = false;
            this.aspect = this.width / this.height;

            this.handleResize();

            return this;
        };

        /**
         * @method style
         * @memberof Canvas
         * @brief sets style of html element
         * @param Number height
         */
        Canvas.prototype.style = function(key, value) {
            if (!this.element) return this;

            this.element.style[key] = value;
            return this;
        };

        /**
         * @method setBackgroundColor
         * @memberof Canvas
         * @brief sets html background color
         * @param Number height
         */
        Canvas.prototype.setBackgroundColor = function(color) {
            if (!this.element) return this;

            this.element.style.background = color;
            return this;
        };


        Canvas.prototype.handleResize = function() {
            var viewportScale = document.getElementById(VIEWPORT).getAttribute("content"),
                w = window.innerWidth,
                h = window.innerHeight,
                aspect = w / h,
                element = this.element,
                style = element.style,
                width, height;

            if (this.fullScreen) {
                width = w;
                height = h;
            } else {
                if (aspect > this.aspect) {
                    width = h * this.aspect;
                    height = h;
                } else {
                    width = w;
                    height = w / this.aspect;
                }
            }

            this.pixelWidth = floor(width);
            this.pixelHeight = floor(height);

            element.width = width;
            element.height = height;

            style.marginLeft = -floor(width * 0.5) - 1 + "px";
            style.marginTop = -floor(height * 0.5) - 1 + "px";

            style.width = floor(width) + "px";
            style.height = floor(height) + "px";

            document.getElementById(VIEWPORT).setAttribute("content", viewportScale.replace(SCALE_REG, "-scale=" + Device.invPixelRatio));
            document.getElementById(VIEWPORT_WIDTH).setAttribute("content", "width=" + w);
            document.getElementById(VIEWPORT_HEIGHT).setAttribute("content", "height=" + h);
            window.scrollTo(1, 1);

            this.emit("resize");
        };


        return Canvas;
    }
);


define('core/rendering/canvas_renderer_2d', [
        "base/event_emitter",
        "base/device",
        "base/dom",
        "math/mathf",
        "math/vec2",
        "math/mat32",
        "math/color"
    ],
    function(EventEmitter, Device, Dom, Mathf, Vec2, Mat32, Color) {



        var EMPTY_ARRAY = [],
            DEFAULT_IMAGE = new Image;

        DEFAULT_IMAGE.src = "data:image/gif;base64,R0lGODlhAQABAIAAAP7//wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";

        function CanvasRenderer2D(opts) {
            opts || (opts = {});

            EventEmitter.call(this);

            this.canvas = undefined;
            this.context = undefined;
            this._context = false;

            this._lastCamera = undefined;
            this._lastResizeFn = undefined;
            this._lastBackground = new Color;
        }

        EventEmitter.extend(CanvasRenderer2D);


        CanvasRenderer2D.prototype.init = function(canvas) {
            if (this.canvas) this.clear();

            this.canvas = canvas;

            try {
                this.context = canvas.element.getContext("2d");
            } catch (e) {
                return this;
            }
            this._context = true;

            this._lastCamera = undefined;
            this._lastResizeFn = undefined;
            this._lastBackground.set(0, 0, 0);

            return this;
        };


        CanvasRenderer2D.prototype.clear = function() {

            this.canvas = undefined;
            this.context = undefined;
            this._context = false;

            this._lastCamera = undefined;
            this._lastResizeFn = undefined;
            this._lastBackground.set(0, 0, 0);

            return this;
        };


        CanvasRenderer2D.prototype.render = function(scene, camera) {
            if (!this._context) return;
            var ctx = this.context,
                lastBackground = this._lastBackground,
                background = camera.backgroundColor,
                components = scene.components,
                sprite2ds = components.Sprite2D || EMPTY_ARRAY,
                emitter2ds = components.Emitter2D || EMPTY_ARRAY,
                sprite2d, emitter2d, transform2d,
                i;

            if (lastBackground.r !== background.r || lastBackground.g !== background.g || lastBackground.b !== background.b) {
                lastBackground.copy(background);
                ctx.fillStyle = background.toRGB();
            }
            if (this._lastCamera !== camera) {
                var canvas = this.canvas,
                    w = canvas.pixelWidth,
                    h = canvas.pixelHeight,
                    hw = w * 0.5,
                    hh = h * 0.5;

                camera.set(w, h);

                ctx.translate(hw, hh);
                ctx.scale(hw, -hh);
                ctx.fillStyle = background.toRGB();

                if (this._lastResizeFn) canvas.off("resize", this._lastResizeFn);

                this._lastResizeFn = function() {
                    var w = this.pixelWidth,
                        h = this.pixelHeight,
                        hw = w * 0.5,
                        hh = h * 0.5;

                    camera.set(w, h);

                    ctx.translate(hw, hh);
                    ctx.scale(hw, -hh);
                    ctx.fillStyle = background.toRGB();
                };

                canvas.on("resize", this._lastResizeFn);
                this._lastCamera = camera;
            }

            ctx.fillRect(-1, -1, 2, 2);

            for (i = sprite2ds.length; i--;) {
                sprite2d = sprite2ds[i];
                transform2d = sprite2d.transform2d;

                if (!transform2d) continue;

                transform2d.updateModelView(camera.view);
                this.renderSprite2D(camera, transform2d, sprite2d);
            }

            for (i = emitter2ds.length; i--;) {
                emitter2d = emitter2ds[i];
                transform2d = emitter2d.transform2d;

                if (!transform2d) continue;

                transform2d.updateModelView(camera.view);
                this.renderEmitter2D(camera, transform2d, emitter2d);
            }
        };


        var MAT = new Mat32;
        CanvasRenderer2D.prototype.renderSprite2D = function(camera, transform2d, sprite2d) {
            var ctx = this.context,
                texture = sprite2d.texture,
                mvp = MAT.elements;

            MAT.mmul(camera.projection, transform2d.modelView);

            if (texture) {
                texture = texture.raw;
            } else {
                texture = DEFAULT_IMAGE;
            }

            ctx.save();

            ctx.transform(mvp[0], -mvp[2], -mvp[1], mvp[3], mvp[4], mvp[5]);
            ctx.scale(1, -1);
            if (sprite2d.alpha !== 1) ctx.globalAlpha = sprite2d.alpha;

            ctx.drawImage(
                texture,
                sprite2d.x, sprite2d.y,
                sprite2d.w, sprite2d.h,
                sprite2d.width * -0.5,
                sprite2d.height * -0.5,
                sprite2d.width,
                sprite2d.height
            );

            ctx.restore();
        };


        CanvasRenderer2D.prototype.renderEmitter2D = function(camera, transform2d, emitter2d) {
            var ctx = this.context,
                particles = emitter2d.particles,
                particle,
                view = emitter2d.worldSpace ? camera.view : transform2d.modelView,
                mvp = MAT.elements,
                pos, size,
                i = particles.length;

            if (!i) return;

            ctx.save();

            MAT.mmul(camera.projection, view);
            ctx.transform(mvp[0], -mvp[2], -mvp[1], mvp[3], mvp[4], mvp[5]);

            for (; i--;) {
                particle = particles[i];
                pos = particle.position;
                size = particle.size;

                ctx.save();

                ctx.fillStyle = particle.color.toRGB();
                ctx.globalAlpha = particle.alpha;

                ctx.translate(pos.x, pos.y);
                ctx.rotate(particle.rotation);
                ctx.fillRect(-size * 0.5, -size * 0.5, size, size);

                ctx.restore();
            }

            ctx.restore();
        };


        return CanvasRenderer2D;
    }
);


define('core/rendering/webgl_renderer_2d', [
        "base/event_emitter",
        "base/device",
        "base/dom",
        "core/game/log",
        "math/mathf",
        "math/vec2",
        "math/mat32",
        "math/mat4",
        "math/color"
    ],
    function(EventEmitter, Device, Dom, Log, Mathf, Vec2, Mat32, Mat4, Color) {



        var getWebGLContext = Dom.getWebGLContext,
            createProgram = Dom.createProgram,
            parseUniformsAttributes = Dom.parseUniformsAttributes,

            addEvent = Dom.addEvent,
            removeEvent = Dom.removeEvent,

            clamp = Mathf.clamp,
            isPowerOfTwo = Mathf.isPowerOfTwo,

            WHITE_TEXTURE = new Uint8Array([255, 255, 255, 255]),
            ENUM_WHITE_TEXTURE = -1,

            SPRITE_VERTICES = [
                new Vec2(0.5, 0.5),
                new Vec2(-0.5, 0.5),
                new Vec2(0.5, -0.5),
                new Vec2(-0.5, -0.5)
            ],
            SPRITE_UVS = [
                new Vec2(1, 1),
                new Vec2(0, 1),
                new Vec2(1, 0),
                new Vec2(0, 0)
            ],
            ENUM_SPRITE_BUFFER = -1,

            ENUM_SPRITE_SHADER = -1,
            ENUM_BASIC_SHADER = -2,
            ENUM_PARTICLE_SHADER = -3,

            EMPTY_ARRAY = [];


        /**
         * @class WebGLRenderer2D
         * @extends EventEmitter
         * @brief 2d webgl renderer
         * @param Object options
         */

        function WebGLRenderer2D(opts) {
            opts || (opts = {});

            EventEmitter.call(this);

            this.canvas = undefined;
            this.context = undefined;
            this._context = false;

            this.attributes = merge(opts.attributes || {}, {
                alpha: true,
                antialias: true,
                depth: true,
                premulipliedAlpha: true,
                preserveDrawingBuffer: false,
                stencil: true
            });

            this._webgl = {
                gpu: {
                    precision: "highp",
                    maxAnisotropy: 16,
                    maxTextures: 16,
                    maxTextureSize: 16384,
                    maxCubeTextureSize: 16384,
                    maxRenderBufferSize: 16384
                },
                ext: {
                    textureFilterAnisotropic: undefined,
                    textureFloat: undefined,
                    standardDerivatives: undefined,
                    compressedTextureS3TC: undefined
                },

                textures: {},
                shaders: {},
                buffers: {},

                lastTexture: undefined,
                lastShader: undefined,
                lastBuffer: undefined
            };

            this._clearBytes = 17664;
            this._lastCamera = undefined;
            this._lastResizeFn = undefined;
            this._lastBackground = new Color;

            this._lastBlending = undefined;
        }

        EventEmitter.extend(WebGLRenderer2D);


        WebGLRenderer2D.prototype.init = function(canvas) {
            if (this.canvas) this.clear();
            var element = canvas.element;

            this.canvas = canvas;
            this.context = getWebGLContext(element, this.attributes);

            if (!this.context) return this;
            this._context = true;

            addEvent(element, "webglcontextlost", this._handleWebGLContextLost, this);
            addEvent(element, "webglcontextrestored", this._handleWebGLContextRestored, this);

            this.setDefaults();

            return this;
        };


        WebGLRenderer2D.prototype.clear = function() {
            if (!this.canvas) return this;
            var canvas = this.canvas,
                element = canvas.element,
                webgl = this._webgl,
                ext = webgl.ext;

            this.canvas = undefined;
            this.context = undefined;
            this._context = false;

            removeEvent(element, "webglcontextlost", this._handleWebGLContextLost, this);
            removeEvent(element, "webglcontextrestored", this._handleWebGLContextRestored, this);

            this._clearBytes = 17664;
            this._lastCamera = undefined;
            this._lastBackground.setRGB(0, 0, 0);
            this._lastBlending = undefined;

            ext.compressedTextureS3TC = ext.standardDerivatives = ext.textureFilterAnisotropic = ext.textureFloat = undefined;
            webgl.lastBuffer = webgl.lastShader = webgl.lastTexture = undefined;
            clear(webgl.textures);
            clear(webgl.buffers);
            clear(webgl.shaders);

            return this;
        };

        /**
         * @method setDefaults
         * @memberof WebGLRenderer2D
         * @brief sets renderers defaults settings
         */
        WebGLRenderer2D.prototype.setDefaults = function() {
            var gl = this.context,
                webgl = this._webgl,
                ext = webgl.ext,
                gpu = webgl.gpu,

                textureFilterAnisotropic = gl.getExtension("EXT_texture_filter_anisotropic") ||
                    gl.getExtension("MOZ_EXT_texture_filter_anisotropic") ||
                    gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic"),

                compressedTextureS3TC = gl.getExtension("WEBGL_compressed_texture_s3tc") ||
                    gl.getExtension("MOZ_WEBGL_compressed_texture_s3tc") ||
                    gl.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc"),

                standardDerivatives = gl.getExtension("OES_standard_derivatives"),

                textureFloat = gl.getExtension("OES_texture_float");

            ext.textureFilterAnisotropic = textureFilterAnisotropic;
            ext.standardDerivatives = standardDerivatives;
            ext.textureFloat = textureFloat;
            ext.compressedTextureS3TC = compressedTextureS3TC;

            var VERTEX_SHADER = gl.VERTEX_SHADER,
                FRAGMENT_SHADER = gl.FRAGMENT_SHADER,
                HIGH_FLOAT = gl.HIGH_FLOAT,
                MEDIUM_FLOAT = gl.MEDIUM_FLOAT,

                shaderPrecision = typeof(gl.getShaderPrecisionFormat) !== "undefined",

                maxAnisotropy = ext.textureFilterAnisotropic ? gl.getParameter(ext.textureFilterAnisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1,

                maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),

                maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE),

                maxCubeTextureSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),

                maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),

                vsHighpFloat = shaderPrecision ? gl.getShaderPrecisionFormat(VERTEX_SHADER, HIGH_FLOAT) : 0,
                vsMediumpFloat = shaderPrecision ? gl.getShaderPrecisionFormat(VERTEX_SHADER, MEDIUM_FLOAT) : 1,

                fsHighpFloat = shaderPrecision ? gl.getShaderPrecisionFormat(FRAGMENT_SHADER, HIGH_FLOAT) : 0,
                fsMediumpFloat = shaderPrecision ? gl.getShaderPrecisionFormat(FRAGMENT_SHADER, MEDIUM_FLOAT) : 1,

                highpAvailable = vsHighpFloat.precision > 0 && fsHighpFloat.precision > 0,
                mediumpAvailable = vsMediumpFloat.precision > 0 && fsMediumpFloat.precision > 0,

                precision = "highp";

            if (!highpAvailable || Device.mobile) {
                if (mediumpAvailable) {
                    precision = "mediump";
                } else {
                    precision = "lowp";
                }
            }

            gpu.precision = precision;
            gpu.maxAnisotropy = maxAnisotropy;
            gpu.maxTextures = maxTextures;
            gpu.maxTextureSize = maxTextureSize;
            gpu.maxCubeTextureSize = maxCubeTextureSize;
            gpu.maxRenderBufferSize = maxRenderBufferSize;

            gl.clearColor(0, 0, 0, 1);
            gl.clearDepth(1);
            gl.clearStencil(0);

            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);

            gl.frontFace(gl.CCW);
            gl.cullFace(gl.BACK);
            gl.enable(gl.CULL_FACE);

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

            gl.enable(gl.BLEND);
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, WHITE_TEXTURE);
            gl.bindTexture(gl.TEXTURE_2D, null);
            webgl.textures[ENUM_WHITE_TEXTURE] = texture;

            buildBuffer(this, {
                _id: ENUM_SPRITE_BUFFER,
                vertices: SPRITE_VERTICES,
                uvs: SPRITE_UVS

            });
            buildShader(this, {
                _id: ENUM_SPRITE_SHADER,
                vertexShader: spriteVertexShader(precision),
                fragmentShader: spriteFragmentShader(precision)
            });
            buildShader(this, {
                _id: ENUM_BASIC_SHADER,
                vertexShader: basicVertexShader(precision),
                fragmentShader: basicFragmentShader(precision)
            });
            buildShader(this, {
                _id: ENUM_PARTICLE_SHADER,
                vertexShader: particleVertexShader(precision),
                fragmentShader: basicFragmentShader(precision)
            });

            this._clearBytes = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT;

            return this;
        };

        /**
         * @method setBlending
         * @memberof WebGLRenderer2D
         * @brief sets blending mode (empty - default, 0 - none, 1 - additive, 2 - subtractive, or 3 - muliply )
         * @param Number blending
         */
        WebGLRenderer2D.prototype.setBlending = function(blending) {
            var gl = this.context;

            if (blending !== this._lastBlending) {

                switch (blending) {
                    case 0:
                        gl.disable(gl.BLEND);
                        break;

                    case 1:
                        gl.enable(gl.BLEND);
                        gl.blendEquation(gl.FUNC_ADD);
                        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                        break;

                    case 2:
                        gl.enable(gl.BLEND);
                        gl.blendEquation(gl.FUNC_ADD);
                        gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
                        break;

                    case 3:
                        gl.enable(gl.BLEND);
                        gl.blendEquation(gl.FUNC_ADD);
                        gl.blendFunc(gl.ZERO, gl.SRC_COLOR);
                        break;

                    default:
                        gl.enable(gl.BLEND);
                        gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
                        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                        break;
                }

                this._lastBlending = blending;
            }
        };


        /**
         * @method render
         * @memberof WebGLRenderer2D
         * @brief renderers scene from camera's perspective
         * @param Scene scene
         * @param Camera camera
         */
        WebGLRenderer2D.prototype.render = function(scene, camera) {
            if (!this._context) return;
            var gl = this.context,
                lastBackground = this._lastBackground,
                background = camera.backgroundColor,
                components = scene.components,
                sprite2ds = components.Sprite2D || EMPTY_ARRAY,
                emitter2ds = components.Emitter2D || EMPTY_ARRAY,
                sprite2d, emitter2d, transform2d,
                i;

            if (lastBackground.r !== background.r || lastBackground.g !== background.g || lastBackground.b !== background.b) {
                lastBackground.copy(background);
                gl.clearColor(background.r, background.g, background.b, 1);
            }
            if (this._lastCamera !== camera) {
                var canvas = this.canvas,
                    w = canvas.pixelWidth,
                    h = canvas.pixelHeight;

                camera.set(w, h);
                gl.viewport(0, 0, w, h);

                if (this._lastResizeFn) canvas.off("resize", this._lastResizeFn);

                this._lastResizeFn = function() {
                    var w = this.pixelWidth,
                        h = this.pixelHeight;

                    camera.set(w, h);
                    gl.viewport(0, 0, w, h);
                };

                canvas.on("resize", this._lastResizeFn);
                this._lastCamera = camera;
            }

            gl.clear(this._clearBytes);

            for (i = sprite2ds.length; i--;) {
                sprite2d = sprite2ds[i];
                transform2d = sprite2d.transform2d;

                if (!transform2d) continue;

                transform2d.updateModelView(camera.view);
                this.renderSprite2D(camera, transform2d, sprite2d);
            }

            for (i = emitter2ds.length; i--;) {
                emitter2d = emitter2ds[i];
                transform2d = emitter2d.transform2d;

                if (!transform2d) continue;

                transform2d.updateModelView(camera.view);
                this.renderEmitter2D(camera, transform2d, emitter2d);
            }
        };


        var MAT = new Mat32,
            MAT4 = new Mat4;
        WebGLRenderer2D.prototype.renderSprite2D = function(camera, transform2d, sprite2d) {
            var gl = this.context,
                webgl = this._webgl,
                texture = sprite2d.texture,

                glShader = webgl.shaders[ENUM_SPRITE_SHADER],
                glBuffer = webgl.buffers[ENUM_SPRITE_BUFFER],
                glTexture = buildTexture(this, texture),
                uniforms = glShader.uniforms,
                raw = texture.raw,
                w, h;

            MAT.mmul(camera.projection, transform2d.modelView);
            MAT4.fromMat32(MAT);

            if (texture && raw) {
                w = 1 / raw.width;
                h = 1 / raw.height;
            } else {
                return;
            }

            if (webgl.lastShader !== glShader) {
                gl.useProgram(glShader.program);
                webgl.lastShader = glShader;
            }
            if (webgl.lastBuffer !== glBuffer) {
                bindBuffers(gl, glShader, glBuffer);
                webgl.lastBuffer = glBuffer;
            }
            gl.uniformMatrix4fv(uniforms.uMatrix, false, MAT4.elements);
            gl.uniform4f(uniforms.uCrop, sprite2d.x * w, sprite2d.y * h, sprite2d.w * w, sprite2d.h * h);
            gl.uniform2f(uniforms.uSize, sprite2d.width, sprite2d.height);
            gl.uniform1f(uniforms.uAlpha, sprite2d.alpha);

            if (webgl.lastTexture !== glTexture) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, glTexture);
                gl.uniform1i(uniforms.uTexture, 0);

                webgl.lastTexture = glTexture;
            }

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, glBuffer.vertices);
        };


        WebGLRenderer2D.prototype.renderEmitter2D = function(camera, transform2d, emitter2d) {
            var gl = this.context,
                webgl = this._webgl,

                glShader = webgl.shaders[ENUM_PARTICLE_SHADER],
                glBuffer = webgl.buffers[ENUM_SPRITE_BUFFER],

                vertices = glBuffer.vertices,
                TRIANGLE_STRIP = gl.TRIANGLE_STRIP,

                uniforms = glShader.uniforms,
                uMatrix = uniforms.uMatrix,
                uPos = uniforms.uPos,
                uAngle = uniforms.uAngle,
                uSize = uniforms.uSize,
                uColor = uniforms.uColor,
                uAlpha = uniforms.uAlpha,

                particles = emitter2d.particles,
                view = emitter2d.worldSpace ? camera.view : transform2d.modelView,
                particle, pos, color, i = particles.length,
                elements = MAT4.elements;

            if (!i) return;

            if (webgl.lastShader !== glShader) {
                gl.useProgram(glShader.program);
                webgl.lastShader = glShader;
            }
            if (webgl.lastBuffer !== glBuffer) {
                bindBuffers(gl, glShader, glBuffer);
                webgl.lastBuffer = glBuffer;
            }

            MAT.mmul(camera.projection, view);
            MAT4.fromMat32(MAT);
            gl.uniformMatrix4fv(uMatrix, false, elements);

            for (; i--;) {
                particle = particles[i];
                pos = particle.position;
                color = particle.color;

                gl.uniform2f(uPos, pos.x, pos.y);
                gl.uniform1f(uAngle, particle.rotation);
                gl.uniform1f(uSize, particle.size);
                gl.uniform3f(uColor, color.r, color.g, color.b);
                gl.uniform1f(uAlpha, particle.alpha);

                gl.drawArrays(TRIANGLE_STRIP, 0, vertices);
            }
        };


        WebGLRenderer2D.prototype._handleWebGLContextLost = function(e) {
            e.preventDefault();
            Log.warn("WebGLRenderer2D: webgl context was lost");

            this._context = false;
            this.emit("webglcontextlost", e);
        };


        WebGLRenderer2D.prototype._handleWebGLContextRestored = function(e) {
            Log.log("WebGLRenderer2D: webgl context was restored");

            this.setDefaults();

            this._context = true;
            this.emit("webglcontextrestored", e);
        };


        function bindBuffers(gl, glShader, glBuffer) {
            var attributes = glShader.attributes,
                FLOAT = gl.FLOAT,
                ARRAY_BUFFER = gl.ARRAY_BUFFER;

            if (glBuffer.vertex && attributes.aVertexPosition > -1) {
                gl.bindBuffer(ARRAY_BUFFER, glBuffer.vertex);
                gl.enableVertexAttribArray(attributes.aVertexPosition);
                gl.vertexAttribPointer(attributes.aVertexPosition, 2, FLOAT, false, 0, 0);
            }

            if (glBuffer.color && attributes.aVertexColor > -1) {
                gl.bindBuffer(ARRAY_BUFFER, glBuffer.color);
                gl.enableVertexAttribArray(attributes.aVertexColor);
                gl.vertexAttribPointer(attributes.aVertexColor, 2, FLOAT, false, 0, 0);
            }

            if (glBuffer.uv && attributes.aVertexUv > -1) {
                gl.bindBuffer(ARRAY_BUFFER, glBuffer.uv);
                gl.enableVertexAttribArray(attributes.aVertexUv);
                gl.vertexAttribPointer(attributes.aVertexUv, 2, FLOAT, false, 0, 0);
            }

            if (glBuffer.index) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glBuffer.index);
        }


        var COMPILE_ARRAY = [];

        function buildBuffer(renderer, buffer) {
            if (!buffer) return undefined;
            var gl = renderer.context,
                webgl = renderer._webgl,
                buffers = webgl.buffers,
                glBuffer = buffers[buffer._id];

            if (glBuffer && !buffer._needsUpdate) return glBuffer;
            glBuffer = glBuffer || (buffers[buffer._id] = {});

            var compileArray = COMPILE_ARRAY,
                DRAW = buffer.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW,
                ARRAY_BUFFER = gl.ARRAY_BUFFER,
                ELEMENT_ARRAY_BUFFER = gl.ELEMENT_ARRAY_BUFFER,
                items, item,
                i, il;

            items = buffer.vertices;
            if (items && items.length) {
                compileArray.length = 0;

                for (i = 0, il = items.length; i < il; i++) {
                    item = items[i];
                    compileArray.push(item.x, item.y);
                }
                if (compileArray.length) {
                    glBuffer.vertex = glBuffer.vertex || gl.createBuffer();
                    gl.bindBuffer(ARRAY_BUFFER, glBuffer.vertex);
                    gl.bufferData(ARRAY_BUFFER, new Float32Array(compileArray), DRAW);
                }

                glBuffer.vertices = items.length;
            }

            items = buffer.uvs;
            if (items && items.length) {
                compileArray.length = 0;

                for (i = 0, il = items.length; i < il; i++) {
                    item = items[i];
                    compileArray.push(item.x, item.y);
                }
                if (compileArray.length) {
                    glBuffer.uv = glBuffer.uv || gl.createBuffer();
                    gl.bindBuffer(ARRAY_BUFFER, glBuffer.uv);
                    gl.bufferData(ARRAY_BUFFER, new Float32Array(compileArray), DRAW);
                }
            }

            items = buffer.indices || buffer.faces;
            if (items && items.length) {
                glBuffer.index = glBuffer.index || gl.createBuffer();
                gl.bindBuffer(ELEMENT_ARRAY_BUFFER, glBuffer.index);
                gl.bufferData(ELEMENT_ARRAY_BUFFER, new Int16Array(items), DRAW);

                glBuffer.indices = items.length;
            }

            return glBuffer;
        }


        function buildShader(renderer, shader) {
            var gl = renderer.context,
                webgl = renderer._webgl,
                shaders = webgl.shaders,
                glShader = shaders[shader._id],
                vertex, fragment;

            if (glShader && !shader._needsUpdate) return glShader;

            glShader = glShader || (shaders[shader._id] = {});
            vertex = shader.vertex || shader.vertexShader;
            fragment = shader.fragment || shader.fragmentShader;

            var program = glShader.program = createProgram(gl, vertex, fragment);

            glShader.vertex = vertex;
            glShader.fragment = fragment;

            parseUniformsAttributes(gl, program, vertex, fragment,
                glShader.attributes || (glShader.attributes = {}),
                glShader.uniforms || (glShader.uniforms = {})
            );

            return glShader;
        }


        function buildTexture(renderer, texture) {
            if (!texture || !texture.raw) return renderer._webgl.textures[ENUM_WHITE_TEXTURE];

            var gl = renderer.context,
                webgl = renderer._webgl,
                textures = webgl.textures,
                glTexture = textures[texture._id],
                raw = texture.raw;

            if (glTexture && !texture._needsUpdate) return glTexture;
            glTexture = glTexture || (textures[texture._id] = gl.createTexture());

            var ext = webgl.ext,
                gpu = webgl.gpu,
                TFA = ext.textureFilterAnisotropic,

                isPOT = isPowerOfTwo(raw.width) && isPowerOfTwo(raw.height),
                anisotropy = clamp(texture.anisotropy, 1, gpu.maxAnisotropy),

                TEXTURE_2D = gl.TEXTURE_2D,
                WRAP = isPOT ? gl.REPEAT : gl.CLAMP_TO_EDGE,
                MAG_FILTER = gl[texture.magFilter] || gl.LINEAR,
                MIN_FILTER = gl[texture.minFilter] || gl.LINEAR,
                FORMAT = gl[texture.format];

            FORMAT = FORMAT ? FORMAT : gl.RGBA;

            if (isPOT) {
                MIN_FILTER = MIN_FILTER === gl.NEAREST || MIN_FILTER === gl.LINEAR ? gl.LINEAR_MIPMAP_NEAREST : MIN_FILTER;
            } else {
                MIN_FILTER = MIN_FILTER === gl.NEAREST ? gl.NEAREST : gl.LINEAR;
            }

            gl.bindTexture(TEXTURE_2D, glTexture);

            gl.texImage2D(TEXTURE_2D, 0, FORMAT, FORMAT, gl.UNSIGNED_BYTE, raw);

            gl.texParameteri(TEXTURE_2D, gl.TEXTURE_MAG_FILTER, MAG_FILTER);
            gl.texParameteri(TEXTURE_2D, gl.TEXTURE_MIN_FILTER, MIN_FILTER);

            gl.texParameteri(TEXTURE_2D, gl.TEXTURE_WRAP_S, WRAP);
            gl.texParameteri(TEXTURE_2D, gl.TEXTURE_WRAP_T, WRAP);

            if (TFA) gl.texParameterf(TEXTURE_2D, TFA.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);
            if (isPOT) gl.generateMipmap(TEXTURE_2D);

            webgl.lastTexture = glTexture;
            texture._needsUpdate = false;

            return glTexture;
        }


        function particleVertexShader(precision) {

            return [
                "precision " + precision + " float;",

                "uniform mat4 uMatrix;",
                "uniform vec2 uPos;",
                "uniform float uAngle;",
                "uniform float uSize;",

                "attribute vec2 aVertexPosition;",

                "void main() {",
                "	float c, s, vx, vy, x, y;",

                "	c = cos(uAngle);",
                "	s = sin(uAngle);",
                "	vx = (aVertexPosition.x * uSize) - (uSize * 0.5);",
                "	vy = (aVertexPosition.y * uSize) - (uSize * 0.5);",

                "	x = vx * c - vy * s;",
                "	y = vx * s + vy * c;",

                "	gl_Position = uMatrix * vec4(uPos.x + x, uPos.y + y, 0.0, 1.0);",
                "}"
            ].join("\n");
        }


        function basicVertexShader(precision) {

            return [
                "precision " + precision + " float;",

                "uniform mat4 uMatrix;",

                "attribute vec2 aVertexPosition;",

                "void main() {",

                "	gl_Position = uMatrix * vec4(aVertexPosition, 0.0, 1.0);",
                "}"
            ].join("\n");
        }


        function basicFragmentShader(precision) {

            return [
                "precision " + precision + " float;",

                "uniform float uAlpha;",
                "uniform vec3 uColor;",

                "void main() {",
                "	gl_FragColor = vec4(uColor, uAlpha);",
                "}"
            ].join("\n");
        }


        function spriteVertexShader(precision) {

            return [
                "precision " + precision + " float;",

                "uniform mat4 uMatrix;",
                "uniform vec4 uCrop;",
                "uniform vec2 uSize;",

                "attribute vec2 aVertexPosition;",
                "attribute vec2 aVertexUv;",

                "varying vec2 vUvPosition;",

                "void main() {",

                "	vUvPosition = vec2(aVertexUv.x * uCrop.z, aVertexUv.y * uCrop.w) + uCrop.xy;",
                "	gl_Position = uMatrix * vec4(aVertexPosition * uSize, 0.0, 1.0);",
                "}"
            ].join("\n");
        }


        function spriteFragmentShader(precision) {

            return [
                "precision " + precision + " float;",

                "uniform float uAlpha;",
                "uniform sampler2D uTexture;",

                "varying vec2 vUvPosition;",

                "void main() {",
                "	vec4 finalColor = texture2D(uTexture, vUvPosition);",
                "	finalColor.w *= uAlpha;",

                "	gl_FragColor = finalColor;",
                "}"
            ].join("\n");
        }


        function merge(obj, add) {
            var key;

            for (key in add)
                if (obj[key] == undefined) obj[key] = add[key];

            return obj;
        }

        function clear(obj) {
            var key;

            for (key in obj) delete obj[key];

            return obj;
        }


        return WebGLRenderer2D;
    }
);


define(
    'core/input/button', [], function() {



        function Button(name) {
            this.name = name;

            this.timeDown = -1;
            this.timeUp = -1;

            this.frameDown = -1;
            this.frameUp = -1;

            this.value = false;
            this._first = true;

            this._SYNC = {};
        };


        Button.prototype.toSYNC = function(json) {
            json || (json = this._SYNC);

            json.name = this.name;
            json.timeDown = this.timeDown;
            json.timeUp = this.timeUp;
            json.frameDown = this.frameDown;
            json.frameUp = this.frameUp;
            json.value = this.value;

            return json;
        };


        Button.prototype.fromSYNC = function(json) {

            this.name = json.name;
            this.timeDown = json.timeDown;
            this.timeUp = json.timeUp;
            this.frameDown = json.frameDown;
            this.frameUp = json.frameUp;
            this.value = json.value;

            return this;
        };


        Button.prototype.toJSON = function(json) {
            json || (json = {});

            json.name = this.name;
            json.timeDown = this.timeDown;
            json.timeUp = this.timeUp;
            json.frameDown = this.frameDown;
            json.frameUp = this.frameUp;
            json.value = this.value;

            return json;
        };


        Button.prototype.fromJSON = function(json) {

            this.name = json.name;
            this.timeDown = json.timeDown;
            this.timeUp = json.timeUp;
            this.frameDown = json.frameDown;
            this.frameUp = json.frameUp;
            this.value = json.value;

            return this;
        };


        return Button;
    }
);


define('core/input/buttons', [
        "base/time",
        "core/input/button",
        "core/game/log"
    ],
    function(Time, Button, Log) {



        function Buttons() {

            Array.call(this);

            this.hash = {};
            this._SYNC = {};

            this.add("mouse0");
            this.add("mouse1");
            this.add("mouse2");
        }

        Buttons.prototype = Object.create(Array.prototype);
        Buttons.prototype.constructor = Buttons;


        Buttons.prototype.add = function(name) {
            if (this.hash[name]) {
                Log.warn("Buttons.add: Buttons already have Button name " + name);
                return undefined;
            }
            var button = new Button(name);

            this.push(button);
            this.hash[name] = button;

            return button;
        };


        Buttons.prototype.get = function(name) {

            return this.hash[name];
        };


        Buttons.prototype.on = function(name) {
            var button = this.hash[name] || this.add(name);

            if (button._first) {
                button.frameDown = Time.frameCount + 1;
                button.timeDown = Time.stamp();
                button._first = false;
            }
            button.value = true;
        };


        Buttons.prototype.off = function(name) {
            var button = this.hash[name] || this.add(name);

            button.frameUp = Time.frameCount + 1;
            button.timeUp = Time.stamp();
            button.value = false;
            button._first = true;
        };


        Buttons.prototype.toSYNC = function(json) {
            json || (json = this._SYNC);
            var jsonButtons = json.buttons || (json.buttons = []),
                i;

            for (i = this.length; i--;) jsonButtons[i] = this[i].toSYNC(jsonButtons[i]);
            return json;
        };


        Buttons.prototype.fromSYNC = function(json) {
            var buttonHash = this.hash,
                jsonButtons = json.buttons || (json.buttons = []),
                button, jsonButton,
                i;

            for (i = jsonButtons.length; i--;) {
                jsonButton = jsonButtons[i];

                if ((button = buttonHash[jsonButton.name])) {
                    button.fromSYNC(jsonButton);
                } else {
                    this.add(jsonButton.name).fromJSON(jsonButton);
                }
            }

            return this;
        };


        Buttons.prototype.toJSON = function(json) {
            json || (json = {});
            var jsonButtons = json.buttons || (json.buttons = []),
                i;

            for (i = this.length; i--;) jsonButtons[i] = this[i].toJSON(jsonButtons[key]);
            return json;
        };


        Buttons.prototype.fromJSON = function(json) {
            var buttonHash = this.hash,
                jsonButtons = json.buttons || (json.buttons = []),
                button, jsonButton,
                i;

            for (i = jsonButtons.length; i--;) {
                jsonButton = jsonButtons[i];

                if ((button = buttonHash[jsonButton.name])) {
                    button.fromJSON(jsonButton);
                } else {
                    this.add(jsonButton.name).fromJSON(jsonButton);
                }
            }

            return this;
        };


        return Buttons;
    }
);


define(
    'core/input/axis', [], function() {



        function Axis(opts) {
            opts || (opts = {});

            this.name = opts.name != undefined ? opts.name : "unknown";

            this.negButton = opts.negButton != undefined ? opts.negButton : "";
            this.posButton = opts.posButton != undefined ? opts.posButton : "";

            this.altNegButton = opts.altNegButton != undefined ? opts.altNegButton : "";
            this.altPosButton = opts.altPosButton != undefined ? opts.altPosButton : "";

            this.gravity = opts.gravity != undefined ? opts.gravity : 3;
            this.sensitivity = opts.sensitivity != undefined ? opts.sensitivity : 3;

            this.dead = opts.dead != undefined ? opts.dead : 0.001;

            this.type = opts.type != undefined ? opts.type : Axis.BUTTON;
            this.axis = opts.axis != undefined ? opts.axis : "x";
            this.index = opts.index != undefined ? opts.index : 0;

            this.joyNum = opts.joyNum != undefined ? opts.joyNum : 0;

            this.value = 0;

            this._SYNC = {};
        };


        Axis.prototype.toSYNC = function(json) {
            json || (json = this._SYNC);

            json.name = this.name;
            json.value = this.value;

            return json;
        };


        Axis.prototype.fromSYNC = function(json) {

            this.name = json.name;
            this.value = json.value;

            return this;
        };


        Axis.prototype.toJSON = function(json) {
            json || (json = {});

            json.name = this.name;

            json.negButton = this.negButton;
            json.posButton = this.posButton;

            json.altNegButton = this.altNegButton;
            json.altPosButton = this.altPosButton;

            json.gravity = this.gravity;
            json.sensitivity = this.sensitivity;

            json.dead = this.dead;

            json.type = this.type;
            json.axis = this.axis;
            json.index = this.index;

            json.joyNum = this.joyNum;

            json.value = this.value;

            return json;
        };


        Axis.prototype.fromJSON = function(json) {

            this.name = json.name;

            this.negButton = json.negButton;
            this.posButton = json.posButton;

            this.altNegButton = json.altNegButton;
            this.altPosButton = json.altPosButton;

            this.gravity = json.gravity;
            this.sensitivity = json.sensitivity;

            this.dead = json.dead;

            this.type = json.type;
            this.axis = json.axis;
            this.index = json.index;

            this.joyNum = json.joyNum;

            this.value = json.value;

            return this;
        };


        Axis.BUTTON = 1;
        Axis.MOUSE = 2;
        Axis.TOUCH = 3;
        Axis.MOUSE_WHEEL = 4;
        Axis.JOYSTICK = 5;


        return Axis;
    }
);


define('core/input/axes', [
        "core/input/axis",
        "core/game/log"
    ],
    function(Axis, Log) {



        var BUTTON = Axis.BUTTON,
            MOUSE = Axis.MOUSE,
            TOUCH = Axis.TOUCH,
            MOUSE_WHEEL = Axis.MOUSE_WHEEL;


        function Axes() {

            Array.call(this);

            this.hash = {};
            this._SYNC = {};

            this.add({
                name: "horizontal",
                posButton: "right",
                negButton: "left",
                altPosButton: "d",
                altNegButton: "a",
                type: BUTTON
            });

            this.add({
                name: "vertical",
                posButton: "up",
                negButton: "down",
                altPosButton: "w",
                altNegButton: "s",
                type: BUTTON
            });

            this.add({
                name: "fire",
                posButton: "ctrl",
                negButton: "",
                altPosButton: "mouse0",
                altNegButton: "",
                type: BUTTON
            });

            this.add({
                name: "jump",
                posButton: "space",
                negButton: "",
                altPosButton: "mouse2",
                altNegButton: "",
                type: BUTTON
            });

            this.add({
                name: "mouseX",
                type: MOUSE,
                axis: "x"
            });

            this.add({
                name: "mouseY",
                type: MOUSE,
                axis: "y"
            });

            this.add({
                name: "touchX",
                type: TOUCH,
                axis: "x"
            });

            this.add({
                name: "touchY",
                type: TOUCH,
                axis: "y"
            });

            this.add({
                name: "mouseWheel",
                type: MOUSE_WHEEL
            });
        }

        Axes.prototype = Object.create(Array.prototype);
        Axes.prototype.constructor = Axes;


        Axes.prototype.add = function(name, opts) {
            if (typeof(name) === "object") {
                opts = name;
                name = opts.name;
            }
            if (this.hash[name]) {
                Log.warn("Axes.add: Axes already have Axis named " + name);
                return undefined;
            }
            opts || (opts = {});
            opts.name = name;
            var axis = new Axis(opts);

            this.push(axis);
            this.hash[name] = axis;

            return axis;
        };


        Axes.prototype.get = function(name) {

            return this.hash[name];
        };


        Axes.prototype.toSYNC = function(json) {
            json || (json = this._SYNC);
            var jsonAxes = json.axes || (json.axes = []),
                i;

            for (i = this.length; i--;) jsonAxes[i] = this[i].toSYNC(jsonAxes[i]);
            return json;
        };


        Axes.prototype.fromSYNC = function(json) {
            var axisHash = this.hash,
                jsonAxes = json.axes || (json.axes = []),
                axis, jsonAxis,
                i;

            for (i = jsonAxes.length; i--;) {
                jsonAxis = jsonAxes[i];

                if ((axis = axisHash[jsonAxis.name])) {
                    axis.fromSYNC(jsonAxis);
                } else {
                    this.add(jsonAxis.name).fromJSON(jsonAxis);
                }
            }

            return this;
        };


        Axes.prototype.toJSON = function(json) {
            json || (json = {});
            var jsonAxes = json.axes || (json.axes = []),
                i;

            for (i = this.length; i--;) jsonAxes[i] = this[i].toJSON(jsonAxes[i]);
            return json;
        };


        Axes.prototype.fromJSON = function(json) {
            var axisHash = this.hash,
                jsonAxes = json.axes || (json.axes = []),
                axis, jsonAxis,
                i;

            for (i = jsonAxes.length; i--;) {
                jsonAxis = jsonAxes[i];

                if ((axis = axisHash[jsonAxis.name])) {
                    axis.fromJSON(jsonAxis);
                } else {
                    this.add(jsonAxis.name).fromJSON(jsonAxis);
                }
            }

            return this;
        };


        return Axes;
    }
);


define('core/input/touch', [
        "math/vec2"
    ],
    function(Vec2) {



        function Touch() {

            this.id = -1;

            this.delta = new Vec2;
            this.position = new Vec2;

            this._last = new Vec2;
            this._first = false;

            this._SYNC = {};
        };


        Touch.prototype.clear = function() {

            this.id = -1;

            this.position.set(0, 0);
            this.delta.set(0, 0);
            this._last.set(0, 0);

            this._first = false;

            return this;
        };


        Touch.prototype.fromEvent = function(e) {
            var position = this.position,
                delta = this.delta,
                last = this._last,
                first = this._first,
                element = e.target || e.srcElement,
                offsetX = element.offsetLeft,
                offsetY = element.offsetTop,
                x = (e.pageX || e.clientX) - offsetX,
                y = (e.pageY || e.clientY) - offsetY;

            last.x = first ? position.x : x;
            last.y = first ? position.y : y;

            position.x = x;
            position.y = y;

            delta.x = position.x - last.x;
            delta.y = position.y - last.y;

            this._first = true;

            return this;
        };


        Touch.prototype.toSYNC = function(json) {
            json || (json = this._SYNC);

            json.id = this.id;

            json.delta = this.delta.toJSON(json.delta);
            json.position = this.position.toJSON(json.position);

            json._last = this._last.toJSON(json._last);
            json._first = this._first;

            return json;
        };


        Touch.prototype.fromSYNC = function(json) {

            this.id = json.id;

            this.delta.fromJSON(json.delta);
            this.position.fromJSON(json.position);

            this._last.fromJSON(json._last);
            this._first = json._first;

            return this;
        };


        Touch.prototype.toJSON = function(json) {
            json || (json = {});

            json.id = this.id;

            json.delta = this.delta.toJSON(json.delta);
            json.position = this.position.toJSON(json.position);

            json._last = this._last.toJSON(json._last);
            json._first = this._first;

            return json;
        };


        Touch.prototype.fromJSON = function(json) {
            this.id = json.id;

            this.delta.fromJSON(json.delta);
            this.position.fromJSON(json.position);

            this._last.fromJSON(json._last);
            this._first = json._first;

            return this;
        };


        return Touch;
    }
);


define('core/input/touches', [
        "base/object_pool",
        "core/input/touch"
    ],
    function(ObjectPool, Touch) {



        var TOUCH_POOL = new ObjectPool(Touch),
            OBJECT_POOL = new ObjectPool(Object);


        function Touches() {

            Array.call(this);
            this._SYNC = {};
        }

        Touches.prototype = Object.create(Array.prototype);
        Touches.prototype.constructor = Touches;
        Touches.TOUCH_POOL = TOUCH_POOL;

        Touches.prototype.start = function(evtTouch) {
            var touch = TOUCH_POOL.create();

            touch.clear();
            touch.id = evtTouch.identifier;
            touch.fromEvent(evtTouch);

            this.push(touch);

            return touch;
        };


        Touches.prototype.end = function(i) {
            var touch = this[i];

            TOUCH_POOL.removeObject(touch);
            this.splice(i, 1);

            return touch;
        };


        Touches.prototype.cancel = function() {

            TOUCH_POOL.clear();
            this.length = 0;

            return this;
        };


        Touches.prototype.move = function(i, evtTouch) {
            var touch = this[i];

            touch.fromEvent(evtTouch);

            return touch;
        };


        Touches.prototype.toSYNC = function(json) {
            json || (json = this._SYNC);
            var jsonTouches = json.touches || (json.touches = []),
                i = this.length;

            jsonTouches.length = 0;
            OBJECT_POOL.clear();

            for (; i--;) jsonTouches[i] = this[i].toSYNC(OBJECT_POOL.create());

            return json;
        };


        Touches.prototype.fromSYNC = function(json) {
            var jsonTouches = json.touches,
                i = jsonTouches.length;

            this.length = 0;
            TOUCH_POOL.clear();

            for (; i--;) this[i] = TOUCH_POOL.create().fromSYNC(jsonTouches[i]);

            return this;
        };


        Touches.prototype.toJSON = function(json) {
            json || (json = {});
            var jsonTouches = json.touches || (json.touches = []),
                i;

            for (i = this.length; i--;) jsonTouches[i] = this[i].toJSON(jsonTouches[i]);
            return json;
        };


        Touches.prototype.fromJSON = function(json) {
            var jsonTouches = json.touches,
                touch, i, j, tl;

            for (i = jsonTouches.length, tl = this.length, j = tl; i--;) {
                if (i < tl) {
                    this.splice(j--, 1);
                    TOUCH_POOL.removeObject(this[j]);
                }

                if ((touch = this[i])) {
                    touch.fromJSON(jsonTouches[i]);
                } else {
                    this[i] = TOUCH_POOL.create().fromJSON(jsonTouches[i]);
                }
            }

            return this;
        };


        return Touches;
    }
);


define('core/input/input', [
        "base/event_emitter",
        "base/object_pool",
        "base/time",
        "math/mathf",
        "math/vec2",
        "math/vec3",
        "core/input/buttons",
        "core/input/button",
        "core/input/axes",
        "core/input/axis",
        "core/input/touches"
    ],
    function(EventEmitter, ObjectPool, Time, Mathf, Vec2, Vec3, Buttons, Button, Axes, Axis, Touches) {



        var abs = Math.abs,
            sign = Mathf.sign,
            clamp = Mathf.clamp,
            BUTTON = Axis.BUTTON,
            MOUSE = Axis.MOUSE,
            TOUCH = Axis.TOUCH,
            MOUSE_WHEEL = Axis.MOUSE_WHEEL,
            JOYSTICK = Axis.JOYSTICK,

            MOUSE_BUTTONS = {
                "0": "mouse0",
                "1": "mouse1",
                "2": "mouse2"
            }


            function Input() {

                EventEmitter.call(this);

                this.axes = new Axes;
                this.buttons = new Buttons;

                this.mouseWheel = 0;
                this.mousePosition = new Vec2;
                this.mouseDelta = new Vec2;
                this.mouseMoveNeedsUpdate = false;

                this.touches = new Touches;
                this.touchesMoveNeedsUpdate = false;
                this.acceleration = new Vec3;

                this.frameCount = 0;
                this._frameCount = undefined;

                this.time = 0;
                this._time = undefined;

                this._SYNC = {};
            }

        EventEmitter.extend(Input);


        Input.prototype.update = function() {
            var axes = this.axes,
                buttons = this.buttons.hash,
                button, altButton,
                axis, value, sensitivity, pos, neg, tmp, dt = Time.delta,
                i;

            this.frameCount = this._frameCount ? this._frameCount : Time.frameCount;
            this.time = this._time ? this._time : Time.stamp();

            this.mouseMoveNeedsUpdate = true;
            this.touchesMoveNeedsUpdate = true;

            for (i = axes.length; i--;) {
                axis = axes[i];
                value = axis.value;
                sensitivity = axis.sensitivity;

                switch (axis.type) {

                    case BUTTON:

                        button = buttons[axis.negButton];
                        altButton = buttons[axis.altNegButton];
                        neg = button && button.value || altButton && altButton.value;

                        button = buttons[axis.posButton];
                        altButton = buttons[axis.altPosButton];
                        pos = button && button.value || altButton && altButton.value;

                        break;

                    case MOUSE:

                        axis.value = this.mouseDelta[axis.axis];
                        continue;

                    case TOUCH:

                        var touch = this.touches[axis.index];
                        axis.value = touch ? touch.delta[axis.axis] : 0;
                        continue;

                    case MOUSE_WHEEL:

                        value += this.mouseWheel;
                        break;

                    case JOYSTICK:

                        break;
                }

                if (neg) value -= sensitivity * dt;
                if (pos) value += sensitivity * dt;

                if (!pos && !neg && value !== 0) {
                    tmp = abs(value);
                    value -= clamp(sign(value) * axis.gravity * dt, -tmp, tmp);
                }

                value = clamp(value, -1, 1);
                if (abs(value) <= axis.dead) value = 0;

                axis.value = value;
            }

            this.mouseWheel = 0;
        };


        Input.prototype.axis = function(name) {
            var axis = this.axes.hash[name];
            return axis ? axis.value : 0;
        };


        Input.prototype.mouseButton = function(id) {
            var button = this.buttons.hash[MOUSE_BUTTONS[id]];

            return button && button.value;
        };


        Input.prototype.mouseButtonDown = function(id) {
            var button = this.buttons.hash[MOUSE_BUTTONS[id]];

            return button && button.value && (button.frameDown >= this.frameCount);
        };


        Input.prototype.mouseButtonUp = function(id) {
            var button = this.buttons.hash[MOUSE_BUTTONS[id]];

            return button && (button.frameUp >= this.frameCount)
        };


        Input.prototype.anyKey = function() {
            var buttons = this.buttons,
                i;

            for (i = buttons.length; i--;)
                if (buttons[i].value) return true;
            return false;
        };


        Input.prototype.anyKeyDown = function() {
            var buttons = this.buttons,
                button,
                i;

            for (i = buttons.length; i--;)
                if ((button = buttons[i]).value && (button.frameDown >= this.frameCount)) return true;
            return false;
        };


        Input.prototype.key = function(name) {
            var button = this.buttons.hash[name];

            return button && button.value;
        };


        Input.prototype.keyDown = function(name) {
            var button = this.buttons.hash[name];

            return button && button.value && (button.frameDown >= this.frameCount);
        };


        Input.prototype.keyUp = function(name) {
            var button = this.buttons.hash[name];

            return button && (button.frameUp >= this.frameCount);
        };


        Input.prototype.toSYNC = function(json) {
            json || (json = this._SYNC);

            json._frameCount = Time.frameCount;
            json._time = Time.stamp();

            json.buttons = this.buttons.toSYNC(json.buttons);

            json.mousePosition = this.mousePosition.toJSON(json.mousePosition);
            json.mouseDelta = this.mouseDelta.toJSON(json.mouseDelta);

            json.acceleration = this.acceleration.toJSON(json.acceleration);
            json.touches = this.touches.toSYNC(json.touches);

            return json;
        };


        Input.prototype.fromSYNC = function(json) {

            this._frameCount = json._frameCount;
            this._time = json._time;

            this.buttons.fromSYNC(json.buttons);

            this.mousePosition.fromJSON(json.mousePosition);
            this.mouseDelta.fromJSON(json.mouseDelta);

            this.acceleration.fromJSON(json.acceleration);
            this.touches.fromSYNC(json.touches);

            return this;
        };


        Input.prototype.toJSON = function(json) {
            json || (json = {});

            json.buttons = this.buttons.toJSON(json.buttons);
            json.axes = this.axes.toJSON(json.axes);

            json.mousePosition = this.mousePosition.toJSON(json.mousePosition);
            json.mouseDelta = this.mouseDelta.toJSON(json.mouseDelta);

            json.acceleration = this.acceleration.toJSON(json.acceleration);
            json.touches = this.touches.toJSON(json.touches);

            return json;
        };


        Input.prototype.fromJSON = function(json) {

            this.buttons.fromJSON(json.buttons);
            this.axes.fromJSON(json.axes);

            this.mousePosition.fromJSON(json.mousePosition);
            this.mouseDelta.fromJSON(json.mouseDelta);

            this.acceleration.fromJSON(json.acceleration);
            this.touches.fromJSON(json.touches);

            return this;
        };


        return new Input;
    }
);


define('core/input/handler', [
        "base/event_emitter",
        "base/dom",
        "base/object_pool",
        "math/vec2",
        "core/input/input"
    ],
    function(EventEmitter, Dom, ObjectPool, Vec2, Input) {



        var min = Math.min,
            max = Math.max,

            addEvent = Dom.addEvent,
            removeEvent = Dom.removeEvent;


        function Handler() {

            EventEmitter.call(this);

            this.element = undefined;
        }

        EventEmitter.extend(Handler);


        Handler.prototype.setElement = function(element) {
            if (this.element) this.removeElement();

            this.element = element;

            addEvent(element, "mousedown mouseup mousemove mouseout mousewheel DOMMouseScroll", handleMouse, Input);
            addEvent(top, "keydown keyup", handleKeys, Input);

            addEvent(element, "touchstart touchmove touchend touchcancel", handleTouches, Input);
            addEvent(window, "devicemotion", handleDevicemotion, Input);
        };


        Handler.prototype.removeElement = function() {
            if (!this.element) return;
            var element = this.element;

            removeEvent(element, "mousedown mouseup mousemove mouseout mousewheel DOMMouseScroll", handleMouse, Input);
            removeEvent(top, "keydown keyup", handleKeys, Input);

            removeEvent(element, "touchstart touchmove touchend touchcancel", handleTouches, Input);
            removeEvent(window, "devicemotion", handleDevicemotion, Input);

            this.element = undefined;
        };


        function handleDevicemotion(e) {
            var acc = e.accelerationIncludingGravity,
                acceleration;

            if (acc) {
                acceleration = this.acceleration;

                acceleration.x = acc.x;
                acceleration.y = acc.y;
                acceleration.z = acc.z;

                this.emit("acceleration");
            }
        }


        function handleTouches(e) {
            e.preventDefault();
            var touches = this.touches,
                evtTouches = e.touches,
                changedTouches = e.changedTouches,
                i;

            switch (e.type) {

                case "touchstart":

                    for (i = evtTouches.length; i--;) this.emit("touchstart", touches.start(evtTouches[i]));
                    break;

                case "touchend":

                    for (i = changedTouches.length; i--;) this.emit("touchend", touches.end(i));
                    break;

                case "touchcancel":

                    touches.cancel();
                    this.emit("touchcancel");

                    break;

                case "touchmove":

                    if (this.touchesMoveNeedsUpdate) {

                        for (i = changedTouches.length; i--;) this.emit("touchmove", touches.move(i, changedTouches[i]));
                        this.touchesMoveNeedsUpdate = false;
                    }

                    break;
            }
        }


        var mouseFirst = false,
            mouseLast = new Vec2,
            mouseWheel = 0;

        function handleMouse(e) {
            e.preventDefault();

            switch (e.type) {

                case "mousedown":

                    this.buttons.on(MOUSE_BUTTONS[e.button]);
                    updateMousePosition(this, e);
                    this.emit("mousedown");
                    break;

                case "mouseup":

                    this.buttons.off(MOUSE_BUTTONS[e.button]);
                    updateMousePosition(this, e);
                    this.emit("mouseup");
                    break;

                case "mouseout":

                    this.buttons.off(MOUSE_BUTTONS[e.button]);
                    updateMousePosition(this, e);
                    this.emit("mouseout");
                    break;

                case "mousewheel":
                case "DOMMouseScroll":

                    mouseWheel = max(-1, min(1, (e.wheelDelta || -e.detail)));
                    this.mouseWheel = mouseWheel;
                    this.emit("mousewheel", mouseWheel);

                    break;

                case "mousemove":

                    if (this.mouseMoveNeedsUpdate) {

                        updateMousePosition(this, e);
                        this.mouseMoveNeedsUpdate = false;
                    }
                    this.emit("mousemove");

                    break;
            }
        }


        function updateMousePosition(input, e) {
            var position = input.mousePosition,
                delta = input.mouseDelta,
                element = e.target || e.srcElement,
                offsetX = element.offsetLeft || 0,
                offsetY = element.offsetTop || 0,
                x = (e.pageX || e.clientX) - offsetX,
                y = (e.pageY || e.clientY) - offsetY;

            mouseLast.x = mouseFirst ? position.x : x;
            mouseLast.y = mouseFirst ? position.y : y;

            position.x = x;
            position.y = y;

            delta.x = position.x - mouseLast.x;
            delta.y = position.y - mouseLast.y;

            mouseFirst = true;
        }


        function handleKeys(e) {
            e.preventDefault();

            switch (e.type) {

                case "keydown":

                    this.buttons.on(KEY_CODES[e.keyCode]);
                    this.emit("keydown");
                    break;

                case "keyup":

                    this.buttons.off(KEY_CODES[e.keyCode]);
                    this.emit("keyup");
                    break;
            }
        }

        var MOUSE_BUTTONS = {
            "0": "mouse0",
            "1": "mouse1",
            "2": "mouse2"
        }

        var KEY_CODES = {
            8: "backspace",
            9: "tab",
            13: "enter",
            16: "shift",
            17: "ctrl",
            18: "alt",
            19: "pause",
            20: "capslock",
            27: "escape",
            32: "space",
            33: "pageup",
            34: "pagedown",
            35: "end",
            37: "left",
            38: "up",
            39: "right",
            40: "down",
            45: "insert",
            46: "delete",
            112: "f1",
            113: "f2",
            114: "f3",
            115: "f4",
            116: "f5",
            117: "f6",
            118: "f7",
            119: "f8",
            120: "f9",
            121: "f10",
            122: "f11",
            123: "f12",
            144: "numlock",
            145: "scrolllock",
            186: "semicolon",
            187: "equal",
            188: "comma",
            189: "dash",
            190: "period",
            191: "slash",
            192: "graveaccent",
            219: "openbracket",
            220: "backslash",
            221: "closebraket",
            222: "singlequote"
        };

        for (var i = 48; i <= 90; i++) KEY_CODES[i] = String.fromCharCode(i).toLowerCase();


        return new Handler;
    }
);


define('core/game/client_game', [
        "base/device",
        "base/socket.io",
        "base/time",
        "core/game/config",
        "core/game/game",
        "core/game/log",
        "core/rendering/canvas",
        "core/rendering/canvas_renderer_2d",
        "core/rendering/webgl_renderer_2d",
        "core/game_object",
        "core/components/component",
        "core/scene",
        "core/input/input",
        "core/input/handler",
        "core/assets/assets",
        "core/assets/asset_loader"
    ],
    function(Device, io, Time, Config, Game, Log, Canvas, CanvasRenderer2D, WebGLRenderer2D, GameObject, Component, Scene, Input, Handler, Assets, AssetLoader) {



        var now = Time.now;


        function ClientGame(opts) {
            opts || (opts = {});
            Config.fromJSON(opts);

            Game.call(this, opts);

            this.io = undefined;
            this._sessionid = undefined;

            this._handler = Handler;
            this.input = Input;

            this.scene = undefined;
            this.camera = undefined;

            this.canvas = new Canvas(opts.width, opts.height);

            this.CanvasRenderer2D = undefined;
            this.WebGLRenderer2D = undefined;

            this._optsCanvasRenderer2D = opts.CanvasRenderer2D;
            this._optsWebGLRenderer2D = opts.WebGLRenderer2D;

            this.renderer = undefined;
        }

        Game.extend(ClientGame);


        ClientGame.prototype.init = function() {
            this.canvas.init();

            this._loop.init();
            this.emit("init");

            return this;
        };


        ClientGame.prototype.connect = function(handler) {
            var self = this,
                socket = this.io = io.connect();


            socket.on("connect", function() {
                if (!self._sessionid) self._sessionid = this.socket.sessionid;
                if (self._sessionid !== this.socket.sessionid) location.reload();

                socket.emit("client_device", Device);
            });

            socket.on("server_ready", function(game, assets) {

                Assets.fromJSON(assets);

                AssetLoader.load(function() {
                    self.fromJSON(game);

                    socket.emit("client_ready");

                    self.emit("connect", socket);
                    if (handler) handler.call(self, socket);
                });
            });

            socket.on("server_sync_input", function() {

                socket.emit("client_sync_input", Input.toSYNC());
            });

            socket.on("server_sync_scene", function(jsonScene) {
                var scene = self.scene;
                if (!scene) return;

                scene.fromSYNC(jsonScene);
            });

            socket.on("server_setScene", function(scene_id) {
                var scene = self.findByServerId(scene_id);

                self.setScene(scene);
            });


            var canvasOnResize;
            socket.on("server_setCamera", function(camera_id) {
                if (!self.scene) {
                    Log.warn("Socket:server_setCamera: can't set camera without an active scene, use ServerGame.setScene first");
                    return;
                }
                var camera = self.scene.findByServerId(camera_id),
                    canvas = self.canvas;

                if (!camera) {
                    Log.warn("Socket:server_setCamera: can't find camera in active scene");
                    return;
                }

                self.setCamera(camera);

                if (canvasOnResize) canvas.off("resize", canvasOnResize);
                canvas.on("resize", (canvasOnResize = function() {

                    socket.emit("client_resize", this.pixelWidth, this.pixelHeight);
                }));
                socket.emit("client_resize", canvas.pixelWidth, canvas.pixelHeight);
            });

            socket.on("server_addScene", function(scene) {

                self.addScene(new Scene().fromJSON(scene));
            });

            socket.on("server_addGameObject", function(scene_id, gameObject) {
                var scene = self.findByServerId(scene_id);
                if (!scene) return;

                scene.addGameObject(new GameObject().fromJSON(gameObject));
            });

            socket.on("server_addComponent", function(scene_id, gameObject_id, component) {
                var scene = self.findByServerId(scene_id);
                if (!scene) return;

                var gameObject = scene.findByServerId(gameObject_id);
                if (!gameObject) return;

                gameObject.addComponent(new Component._types[component._type].fromJSON(component));
            });


            socket.on("server_removeScene", function(scene_id) {

                self.removeScene(self.findByServerId(scene_id));
            });

            socket.on("server_removeGameObject", function(scene_id, gameObject_id) {
                var scene = self.findByServerId(scene_id);
                if (!scene) return;

                scene.removeGameObject(scene.findByServerId(gameObject_id));
            });

            socket.on("server_removeComponent", function(scene_id, gameObject_id, component_type) {
                var scene = self.findByServerId(scene_id);
                if (!scene) return;

                var gameObject = scene.findByServerId(gameObject_id);
                if (!gameObject) return;

                gameObject.removeComponent(gameObject.getComponent(component_type));
            });

            return this;
        };


        ClientGame.prototype.disconnect = function() {
            var socket = this.io;

            socket.disconnect();
            socket.removeAllListeners();
            this._sessionid = undefined;

            return this;
        };


        ClientGame.prototype.setScene = function(scene) {
            if (!(scene instanceof Scene)) {
                Log.warn("ClientGame.setScene: can't add passed argument, it is not instance of Scene");
                return this;
            }
            var scenes = this.scenes,
                index = scenes.indexOf(scene);

            if (index !== -1) {
                this.scene = scene;
                this.emit("setScene", scene);
            } else {
                Log.warn("ClientGame.setScene: Scene is not a member of Game");
            }

            return this;
        };


        ClientGame.prototype.setCamera = function(gameObject) {
            if (!(gameObject instanceof GameObject)) {
                Log.warn("Scene.addGameObject: can't add argument to Scene, it's not an instance of GameObject");
                return this;
            }
            var scene = this.scene,
                lastCamera = this.camera,
                index;

            if (!scene) {
                Log.warn("ClientGame.setCamera: can't set camera without an active scene, use ClientGame.setScene first");
                return this;
            }

            index = scene.gameObjects.indexOf(gameObject);
            if (index === -1) {
                Log.warn("ClientGame.setCamera: GameObject is not a member of the active Scene, adding it...");
                scene.addGameObject(gameObject);
            }

            this.camera = gameObject.camera || gameObject.camera2d;

            if (this.camera) {
                this.camera._active = true;
                if (lastCamera) lastCamera._active = false;

                this.updateRenderer();
                this.emit("setCamera", this.camera);
            } else {
                Log.warn("ClientGame.setCamera: GameObject does't have a Camera or a Camera2D Component");
            }

            return this;
        };


        ClientGame.prototype.updateRenderer = function() {
            var camera = this.camera,
                lastRenderer = this.renderer,
                canvas = this.canvas,
                gameObject;

            if (!camera) return;
            gameObject = camera.gameObject;

            if (Config.renderer && this[Config.renderer]) {
                this.renderer = this[Config.renderer];
                Log.log("Game: setting up " + Config.renderer);
            } else {
                if (gameObject.camera) {
                    Log.warn("Game.updateRenderer: no renderer for camera component yet");
                } else if (gameObject.camera2d) {
                    if (!Config.forceCanvas && Device.webgl) {
                        this.renderer = this.WebGLRenderer2D || (this.WebGLRenderer2D = new WebGLRenderer2D(this._optsWebGLRenderer2D));
                        Log.log("Game: setting up WebGLRenderer2D");
                    } else if (Device.canvas) {
                        this.renderer = this.CanvasRenderer2D || (this.CanvasRenderer2D = new CanvasRenderer2D(this._optsCanvasRenderer2D));
                        Log.log("Game: setting up CanvasRenderer2D");
                    } else {
                        Log.error("Game.updateRenderer: Could not get a renderer for this device");
                    }
                }
            }

            if (lastRenderer === this.renderer) return;
            if (lastRenderer) lastRenderer.destroy();

            this.renderer.init(canvas);
            Handler.setElement(canvas.element);
        };


        var frameCount = 0,
            last = -1 / 60,
            time = 0,
            delta = 1 / 60,
            fpsFrame = 0,
            fpsLast = 0,
            fpsTime = 0;

        ClientGame.prototype.loop = function() {
            var camera = this.camera,
                scene = this.scene,
                MIN_DELTA = Config.MIN_DELTA,
                MAX_DELTA = Config.MAX_DELTA;

            Time.frameCount = frameCount++;

            last = time;
            time = now();
            Time.sinceStart = time;

            fpsTime = time;
            fpsFrame++;

            if (fpsLast + 1 < fpsTime) {
                Time.fps = fpsFrame / (fpsTime - fpsLast);

                fpsLast = fpsTime;
                fpsFrame = 0;
            }

            delta = (time - last) * Time.scale;
            Time.delta = delta < MIN_DELTA ? MIN_DELTA : delta > MAX_DELTA ? MAX_DELTA : delta;

            Time.time = time * Time.scale;

            Input.update();

            if (scene) {
                scene.update();
                if (camera) this.renderer.render(scene, camera);
            }

            this.emit("update", time);
        }


        return ClientGame;
    }
);


define('math/aabb2', [
        "math/mathf",
        "math/vec2"
    ],
    function(Mathf, Vec2) {



        /**
         * @class AABB2
         * @brief 2d axis aligned bounding box
         * @param Vec2 min
         * @param Vec2 max
         */
        function AABB2(min, max) {

            /**
             * @property Vec2 min
             * @memberof AABB2
             */
            this.min = min || new Vec2(Infinity, Infinity);

            /**
             * @property Vec2 max
             * @memberof AABB2
             */
            this.max = max || new Vec2(-Infinity, -Infinity);
        }

        /**
         * @method clone
         * @memberof AABB2
         * @brief returns new copy of this
         * @return AABB2
         */
        AABB2.prototype.clone = function() {

            return new AABB2(this.min.clone(), this.max.clone());
        };

        /**
         * @method copy
         * @memberof AABB2
         * @brief copies other AABB
         * @param AABB2 other
         * @return this
         */
        AABB2.prototype.copy = function(other) {

            this.min.copy(other.min);
            this.max.copy(other.max);

            return this;
        };

        /**
         * @method set
         * @memberof AABB2
         * @brief set min and max vectors
         * @param Vec2 min
         * @param Vec2 max
         * @return this
         */
        AABB2.prototype.set = function(min, max) {

            this.min.copy(min);
            this.max.copy(max);

            return this;
        };

        /**
         * @method expandPoint
         * @memberof AABB2
         * @param Vec2 v
         * @return this
         */
        AABB2.prototype.expandPoint = function(v) {

            this.min.min(v);
            this.max.max(v);

            return this;
        };

        /**
         * @method expandVec
         * @memberof AABB2
         * @param Vec2 v
         * @return this
         */
        AABB2.prototype.expandVec = function(v) {

            this.min.sub(v);
            this.max.add(v);

            return this;
        };

        /**
         * @method expandScalar
         * @memberof AABB2
         * @param Number s
         * @return this
         */
        AABB2.prototype.expandScalar = function(s) {

            this.min.ssub(s);
            this.max.sadd(s);

            return this;
        };

        /**
         * @method union
         * @memberof AABB2
         * @brief joins this and another aabb
         * @param AABB2 aabb
         * @return this
         */
        AABB2.prototype.union = function(other) {

            this.min.min(other.min);
            this.max.max(other.max);

            return this;
        };

        /**
         * @method clear
         * @memberof AABB2
         * @brief clears aabb
         * @return this
         */
        AABB2.prototype.clear = function() {

            this.min.set(Infinity, Infinity);
            this.max.set(-Infinity, -Infinity);

            return this;
        };

        /**
         * @method contains
         * @memberof AABB2
         * @brief checks if AABB contains point
         * @param Vec2 point
         * @return Boolean
         */
        AABB2.prototype.contains = function(point) {
            var min = this.min,
                max = this.max,
                px = point.x,
                py = point.y;

            return !(
                px < min.x || px > max.x ||
                py < min.y || py > max.y
            );
        };

        /**
         * @method intersects
         * @memberof AABB2
         * @brief checks if AABB intersects AABB
         * @param AABB2 other
         * @return Boolean
         */
        AABB2.prototype.intersects = function(other) {
            var aMin = this.min,
                aMax = this.max,
                bMin = other.min,
                bMax = other.max;

            return !(
                bMax.x < aMin.x || bMin.x > aMax.x ||
                bMax.y < aMin.y || bMin.y > aMax.y
            );
        };

        /**
         * @method fromPoints
         * @memberof AABB2
         * @brief set min and max from array of vectors
         * @param Array points
         * @return this
         */
        AABB2.prototype.fromPoints = function(points) {
            var v, i = points.length,
                minx = Infinity,
                miny = Infinity,
                maxx = -Infinity,
                maxy = -Infinity,
                min = this.min,
                max = this.max,
                x, y;

            while (i--) {
                v = points[i];
                x = v.x;
                y = v.y;

                minx = minx > x ? x : minx;
                miny = miny > y ? y : miny;

                maxx = maxx < x ? x : maxx;
                maxy = maxy < y ? y : maxy;
            }

            min.x = minx;
            min.y = miny;
            max.x = maxx;
            max.y = maxy;

            return this;
        };

        /**
         * @method fromCenterSize
         * @memberof AABB2
         * @brief sets this from a center point and a size vector
         * @param Vec2 center
         * @param Vec2 size
         * @return this
         */
        AABB2.prototype.fromCenterSize = function(center, size) {
            var min = this.min,
                max = this.max,
                x = center.x,
                y = center.y,
                hx = size.x * 0.5,
                hy = size.y * 0.5;

            min.x = x - hx;
            min.y = y - hy;

            max.x = x + hx;
            max.y = y + hy;

            return this;
        };

        /**
         * @method fromJSON
         * @memberof AABB2
         * @brief sets values from json object
         * @param Object json
         * @return this
         */
        AABB2.prototype.fromJSON = function(json) {

            this.min.fromJSON(json.min);
            this.max.fromJSON(json.max);

            return this;
        };

        /**
         * @method toJSON
         * @memberof AABB2
         * @brief returns json object
         * @return Object
         */
        AABB2.prototype.toJSON = function(json) {
            json || (json = {});

            json.min = this.min.toJSON(json.min);
            json.max = this.max.toJSON(json.max);

            return json;
        };

        /**
         * @method toString
         * @memberof AABB2
         * @brief converts AABB to string "AABB2( min: Vec2( -1, -1 ), max: Vec2( 1, 1 ) )"
         * @return String
         */
        AABB2.prototype.toString = function() {
            var min = this.min,
                max = this.max;

            return "AABB2( min: " + min + ", max: " + max + " )";
        };


        return AABB2;
    }
);


define('math/aabb3', [
        "math/mathf",
        "math/vec3"
    ],
    function(Mathf, Vec3) {



        /**
         * @class AABB3
         * @brief 2d axis aligned bounding box
         * @param Vec3 min
         * @param Vec3 max
         */
        function AABB3(min, max) {

            /**
             * @property Vec3 min
             * @memberof AABB3
             */
            this.min = min || new Vec3(Infinity, Infinity, Infinity);

            /**
             * @property Vec3 max
             * @memberof AABB3
             */
            this.max = max || new Vec3(-Infinity, -Infinity, -Infinity);
        }

        /**
         * @method clone
         * @memberof AABB3
         * @brief returns new copy of this
         * @return AABB3
         */
        AABB3.prototype.clone = function() {

            return new AABB3(this.min.clone(), this.max.clone());
        };

        /**
         * @method copy
         * @memberof AABB3
         * @brief copies other AABB
         * @param AABB3 other
         * @return this
         */
        AABB3.prototype.copy = function(other) {

            this.min.copy(other.min);
            this.max.copy(other.max);

            return this;
        };

        /**
         * @method set
         * @memberof AABB3
         * @brief set min and max vectors
         * @param Vec3 min
         * @param Vec3 max
         * @return this
         */
        AABB3.prototype.set = function(min, max) {

            this.min.copy(min);
            this.max.copy(max);

            return this;
        };

        /**
         * @method expandPoint
         * @memberof AABB3
         * @param Vec3 v
         * @return this
         */
        AABB3.prototype.expandPoint = function(v) {

            this.min.min(v);
            this.max.max(v);

            return this;
        };

        /**
         * @method expandVec
         * @memberof AABB3
         * @param Vec3 v
         * @return this
         */
        AABB3.prototype.expandVec = function(v) {

            this.min.sub(v);
            this.max.add(v);

            return this;
        };

        /**
         * @method expandScalar
         * @memberof AABB3
         * @param Number s
         * @return this
         */
        AABB3.prototype.expandScalar = function(s) {

            this.min.ssub(s);
            this.max.sadd(s);

            return this;
        };

        /**
         * @method union
         * @memberof AABB3
         * @brief joins this and another aabb
         * @param AABB3 aabb
         * @return this
         */
        AABB3.prototype.union = function(other) {

            this.min.min(other.min);
            this.max.max(other.max);

            return this;
        };

        /**
         * @method clear
         * @memberof AABB3
         * @brief clears aabb
         * @return this
         */
        AABB3.prototype.clear = function() {

            this.min.set(Infinity, Infinity, Infinity);
            this.max.set(-Infinity, -Infinity, -Infinity);

            return this;
        };

        /**
         * @method contains
         * @memberof AABB3
         * @brief checks if AABB contains point
         * @param Vec3 point
         * @return Boolean
         */
        AABB3.prototype.contains = function(point) {
            var min = this.min,
                max = this.max,
                px = point.x,
                py = point.y,
                pz = point.z;

            return !(
                px < min.x || px > max.x ||
                py < min.y || py > max.y ||
                pz < min.z || pz > max.z
            );
        };

        /**
         * @method intersects
         * @memberof AABB3
         * @brief checks if AABB intersects AABB
         * @param AABB3 other
         * @return Boolean
         */
        AABB3.prototype.intersects = function(other) {
            var aMin = this.min,
                aMax = this.max,
                bMin = other.min,
                bMax = other.max;

            return !(
                bMax.x < aMin.x || bMin.x > aMax.x ||
                bMax.y < aMin.y || bMin.y > aMax.y ||
                bMax.z < aMin.z || bMin.z > aMax.z
            );
        };

        /**
         * @method fromPoints
         * @memberof AABB3
         * @brief set min and max from array of vectors
         * @param Array points
         * @return this
         */
        AABB3.prototype.fromPoints = function(points) {
            var v, i = points.length,
                minx = Infinity,
                miny = Infinity,
                minz = Infinity,
                maxx = -Infinity,
                maxy = -Infinity,
                maxz = -Infinity,
                min = this.min,
                max = this.max,
                x, y, z;

            while (i--) {
                v = points[i];
                x = v.x;
                y = v.y;
                z = v.z;

                minx = minx > x ? x : minx;
                miny = miny > y ? y : miny;
                minz = minz > z ? z : minz;

                maxx = maxx < x ? x : maxx;
                maxy = maxy < y ? y : maxy;
                maxz = maxz < z ? z : maxz;
            }

            min.x = minx;
            min.y = miny;
            min.z = minz;
            max.x = maxx;
            max.y = maxy;
            max.z = maxz;

            return this;
        };

        /**
         * @method fromCenterSize
         * @memberof AABB3
         * @brief sets this from a center point and a size vector
         * @param Vec3 center
         * @param Vec3 size
         * @return this
         */
        AABB3.prototype.fromCenterSize = function(center, size) {
            var min = this.min,
                max = this.max,
                x = center.x,
                y = center.y,
                z = center.z,
                hx = size.x * 0.5,
                hy = size.y * 0.5,
                hz = size.z * 0.5;

            min.x = x - hx;
            min.y = y - hy;
            min.z = z - hz;

            max.x = x + hx;
            max.y = y + hy;
            max.z = z + hz;

            return this;
        };

        /**
         * @method fromJSON
         * @memberof AABB3
         * @brief sets values from json object
         * @param Object json
         * @return this
         */
        AABB3.prototype.fromJSON = function(json) {

            this.min.fromJSON(json.min);
            this.max.fromJSON(json.max);

            return this;
        };

        /**
         * @method toJSON
         * @memberof AABB3
         * @brief returns json object
         * @return Object
         */
        AABB3.prototype.toJSON = function(json) {
            json || (json = {});

            json.min = this.min.toJSON(json.min);
            json.max = this.max.toJSON(json.max);

            return json;
        };

        /**
         * @method toString
         * @memberof AABB3
         * @brief converts AABB to string "AABB3( min: Vec3( -1, -1 ), max: Vec3( 1, 1 ) )"
         * @return String
         */
        AABB3.prototype.toString = function() {
            var min = this.min,
                max = this.max;

            return "AABB3( min: " + min + ", max: " + max + " )";
        };


        return AABB3;
    }
);


define(
    'math/mat2', [], function() {



        var cos = Math.cos,
            sin = Math.sin,
            atan2 = Math.atan2;

        /**
         * @class Mat2
         * @brief 2x2 matrix
         * @param Number m11
         * @param Number m12
         * @param Number m21
         * @param Number m22
         */
        function Mat2(m11, m12, m21, m22) {
            var te = new Float32Array(4);

            /**
             * @property Float32Array elements
             * @memberof Mat2
             */
            this.elements = te;

            te[0] = m11 !== undefined ? m11 : 1;
            te[2] = m12 || 0;
            te[1] = m21 || 0;
            te[3] = m22 !== undefined ? m22 : 1;
        }

        /**
         * @method clone
         * @memberof Mat2
         * @brief returns new instance of this
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
         * @memberof Mat2
         * @brief copies other
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
         * @memberof Mat2
         * @brief sets values of this
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
         * @memberof Mat2
         * @brief muliples this's values by other's
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
         * @memberof Mat2
         * @brief muliples a and b saves it in this
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
         * @memberof Mat2
         * @brief muliples this by a scalar value
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
         * @memberof Mat2
         * @brief divides this by scalar value
         * @param Number s
         * @return this
         */
        Mat2.prototype.sdiv = function(s) {
            var te = this.elements;

            s = s !== 0 ? 1 / s : 1;

            te[0] *= s;
            te[1] *= s;
            te[2] *= s;
            te[3] *= s;

            return this;
        };

        /**
         * @method identity
         * @memberof Mat2
         * @brief identity matrix
         * @return this
         */
        Mat2.prototype.identity = function() {
            var te = this.elements;

            te[0] = 1;
            te[1] = 0;
            te[2] = 0;
            te[3] = 1;

            return this;
        };

        /**
         * @method zero
         * @memberof Mat2
         * @brief zero matrix
         * @return this
         */
        Mat2.prototype.zero = function() {
            var te = this.elements;

            te[0] = 0;
            te[1] = 0;
            te[2] = 0;
            te[3] = 0;

            return this;
        };

        /**
         * @method determinant
         * @memberof Mat2
         * @brief returns the determinant of this
         * @return this
         */
        Mat2.prototype.determinant = function() {
            var te = this.elements;

            return te[0] * te[3] - te[2] * te[1];
        };

        /**
         * @method inverse
         * @memberof Mat2
         * @brief returns the inverse of this
         * @return this
         */
        Mat2.prototype.inverse = function() {
            var te = this.elements,

                m11 = te[0],
                m12 = te[2],
                m21 = te[1],
                m22 = te[3],

                det = m11 * m22 - m12 * m21;

            det = det !== 0 ? 1 / det : 0;

            te[0] = m22 * det;
            te[1] = -m12 * det;
            te[2] = -m21 * det;
            te[3] = m11 * det;

            return this;
        };

        /**
         * @method inverseMat
         * @memberof Mat2
         * @brief returns the inverse of other
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

            det = det !== 0 ? 1 / det : 0;

            te[0] = m22 * det;
            te[1] = -m12 * det;
            te[2] = -m21 * det;
            te[3] = m11 * det;

            return this;
        };

        /**
         * @method transpose
         * @memberof Mat2
         * @brief transposes this matrix
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
         * @memberof Mat2
         * @brief sets the diagonal of matrix
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
         * @memberof Mat2
         * @brief sets the rotation in radians this
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
         * @memberof Mat2
         * @brief returns the rotation in radians of this
         * @return Number
         */
        Mat2.prototype.getRotation = function() {
            var te = this.elements;

            return atan2(te[1], te[0]);
        };

        /**
         * @method rotate
         * @memberof Mat2
         * @brief rotates this by angle in radians
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
         * @memberof Mat2
         * @brief sets this from Mat3
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
         * @memberof Mat2
         * @brief sets this from Mat4
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
         * @method fromJSON
         * @memberof Mat2
         * @brief sets values from JSON object
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
         * @memberof Mat2
         * @brief returns json object of this
         * @return Object
         */
        Mat2.prototype.toJSON = function(json) {
            json || (json = {});
            var te = this.elements,
                je = json.elements || (json.elements = []);

            je[0] = te[0];
            je[1] = te[1];
            je[2] = te[2];
            je[3] = te[3];

            return json;
        };

        /**
         * @method toString
         * @memberof Mat2
         * @brief returns string of this
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


define(
    'math/mat3', [], function() {



        var cos = Math.cos,
            sin = Math.sin;

        /**
         * @class Mat3
         * @brief 3x3 matrix
         * @param Number m11
         * @param Number m12
         * @param Number m13
         * @param Number m21
         * @param Number m22
         * @param Number m23
         * @param Number m31
         * @param Number m32
         * @param Number m33
         */
        function Mat3(m11, m12, m13, m21, m22, m23, m31, m32, m33) {
            var te = new Float32Array(9);

            /**
             * @property Float32Array elements
             * @memberof Mat3
             */
            this.elements = te;

            te[0] = m11 !== undefined ? m11 : 1;
            te[3] = m12 || 0;
            te[6] = m13 || 0;
            te[1] = m21 || 0;
            te[4] = m22 !== undefined ? m22 : 1;
            te[7] = m23 || 0;
            te[2] = m31 || 0;
            te[5] = m32 || 0;
            te[8] = m33 !== undefined ? m33 : 1;
        }

        /**
         * @method clone
         * @memberof Mat3
         * @brief returns new instance of this
         * @return Mat3
         */
        Mat3.prototype.clone = function() {
            var te = this.elements;

            return new Mat3(
                te[0], te[3], te[6],
                te[1], te[4], te[7],
                te[2], te[5], te[8]
            );
        };

        /**
         * @method copy
         * @memberof Mat3
         * @brief copies other
         * @param Mat3 other
         * @return this
         */
        Mat3.prototype.copy = function(other) {
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

            return this;
        };

        /**
         * @method set
         * @memberof Mat3
         * @brief sets values of this
         * @param Number m11
         * @param Number m12
         * @param Number m13
         * @param Number m21
         * @param Number m22
         * @param Number m23
         * @param Number m31
         * @param Number m32
         * @param Number m33
         * @return this
         */
        Mat3.prototype.set = function(m11, m12, m13, m21, m22, m23, m31, m32, m33) {
            var te = this.elements;

            te[0] = m11;
            te[3] = m12;
            te[6] = m13;
            te[1] = m21;
            te[4] = m22;
            te[7] = m23;
            te[2] = m31;
            te[5] = m32;
            te[8] = m33;

            return this;
        };

        /**
         * @method mul
         * @memberof Mat3
         * @brief muliples this's values by other's
         * @param Mat3 other
         * @return this
         */
        Mat3.prototype.mul = function(other) {
            var ae = this.elements,
                be = other.elements,

                a11 = ae[0],
                a12 = ae[3],
                a13 = ae[6],
                a21 = ae[1],
                a22 = ae[4],
                a23 = ae[7],
                a31 = ae[2],
                a32 = ae[5],
                a33 = ae[8],

                b11 = be[0],
                b12 = be[3],
                b13 = be[6],
                b21 = be[1],
                b22 = be[4],
                b23 = be[7],
                b31 = be[2],
                b32 = be[5],
                b33 = be[8];

            ae[0] = a11 * b11 + a21 * b12 + a31 * b13;
            ae[3] = a12 * b11 + a22 * b12 + a32 * b13;
            ae[6] = a13 * b11 + a23 * b12 + a33 * b13;

            ae[1] = a11 * b21 + a21 * b22 + a31 * b23;
            ae[4] = a12 * b21 + a22 * b22 + a32 * b23;
            ae[7] = a13 * b21 + a23 * b22 + a33 * b23;

            ae[2] = a11 * b31 + a21 * b32 + a31 * b33;
            ae[5] = a12 * b31 + a22 * b32 + a32 * b33;
            ae[8] = a13 * b31 + a23 * b32 + a33 * b33;

            return this;
        };

        /**
         * @method mmul
         * @memberof Mat3
         * @brief muliples a and b saves it in this
         * @param Mat3 a
         * @param Mat3 b
         * @return this
         */
        Mat3.prototype.mmul = function(a, b) {
            var te = this.elements,
                ae = a.elements,
                be = b.elements,

                a11 = ae[0],
                a12 = ae[3],
                a13 = ae[6],
                a21 = ae[1],
                a22 = ae[4],
                a23 = ae[7],
                a31 = ae[2],
                a32 = ae[5],
                a33 = ae[8],

                b11 = be[0],
                b12 = be[3],
                b13 = be[6],
                b21 = be[1],
                b22 = be[4],
                b23 = be[7],
                b31 = be[2],
                b32 = be[5],
                b33 = be[8];

            te[0] = a11 * b11 + a21 * b12 + a31 * b13;
            te[3] = a12 * b11 + a22 * b12 + a32 * b13;
            te[6] = a13 * b11 + a23 * b12 + a33 * b13;

            te[1] = a11 * b21 + a21 * b22 + a31 * b23;
            te[4] = a12 * b21 + a22 * b22 + a32 * b23;
            te[7] = a13 * b21 + a23 * b22 + a33 * b23;

            te[2] = a11 * b31 + a21 * b32 + a31 * b33;
            te[5] = a12 * b31 + a22 * b32 + a32 * b33;
            te[8] = a13 * b31 + a23 * b32 + a33 * b33;

            return this;
        };

        /**
         * @method smul
         * @memberof Mat3
         * @brief muliples this by a scalar value
         * @param Number s
         * @return this
         */
        Mat3.prototype.smul = function(s) {
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

            return this;
        };

        /**
         * @method sdiv
         * @memberof Mat3
         * @brief divides this by scalar value
         * @param Number s
         * @return this
         */
        Mat3.prototype.sdiv = function(s) {
            var te = this.elements;

            s = s === 0 ? 0 : 1 / s;

            te[0] *= s;
            te[1] *= s;
            te[2] *= s;
            te[3] *= s;
            te[4] *= s;
            te[5] *= s;
            te[6] *= s;
            te[7] *= s;
            te[8] *= s;

            return this;
        };

        /**
         * @method identity
         * @memberof Mat3
         * @brief identity matrix
         * @return this
         */
        Mat3.prototype.identity = function() {
            var te = this.elements;

            te[0] = 1;
            te[1] = 0;
            te[2] = 0;
            te[3] = 0;
            te[4] = 1;
            te[5] = 0;
            te[6] = 0;
            te[7] = 0;
            te[8] = 1;

            return this;
        };

        /**
         * @method zero
         * @memberof Mat3
         * @brief zero matrix
         * @return this
         */
        Mat3.prototype.zero = function() {
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

            return this;
        };

        /**
         * @method determinant
         * @memberof Mat3
         * @brief returns the determinant of this
         * @return this
         */
        Mat3.prototype.determinant = function() {
            var te = this.elements,

                a = te[0],
                b = te[1],
                c = te[2],
                d = te[3],
                e = te[4],
                f = te[5],
                g = te[6],
                h = te[7],
                i = te[8];

            return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;
        };

        /**
         * @method inverse
         * @memberof Mat3
         * @brief returns the inverse of this
         * @return this
         */
        Mat3.prototype.inverse = function() {
            var te = this.elements,
                m11 = te[0],
                m12 = te[3],
                m13 = te[6],
                m21 = te[1],
                m22 = te[4],
                m23 = te[7],
                m31 = te[2],
                m32 = te[5],
                m33 = te[8],

                m0 = m22 * m33 - m23 * m32,
                m3 = m13 * m32 - m12 * m33,
                m6 = m12 * m23 - m13 * m22,

                det = m11 * m0 + m21 * m3 + m31 * m6;

            det = det !== 0 ? 1 / det : 1;

            te[0] = m0 * det;
            te[1] = (m23 * m31 - m21 * m33) * det;
            te[2] = (m21 * m32 - m22 * m31) * det;

            te[3] = m3 * det;
            te[4] = (m11 * m33 - m13 * m31) * det;
            te[5] = (m12 * m31 - m11 * m32) * det;

            te[6] = m6 * det;
            te[7] = (m13 * m21 - m11 * m23) * det;
            te[8] = (m11 * m22 - m12 * m21) * det;

            return this;
        };

        /**
         * @method inverseMat
         * @memberof Mat3
         * @brief returns the inverse of other
         * @param Mat3 other
         * @return this
         */
        Mat3.prototype.inverseMat = function(other) {
            var te = this.elements,
                me = other.elements,
                m11 = me[0],
                m12 = me[3],
                m13 = me[6],
                m21 = me[1],
                m22 = me[4],
                m23 = me[7],
                m31 = me[2],
                m32 = me[5],
                m33 = me[8],

                m0 = m22 * m33 - m23 * m32,
                m3 = m13 * m32 - m12 * m33,
                m6 = m12 * m23 - m13 * m22,

                det = m11 * m0 + m21 * m3 + m31 * m6;

            det = det !== 0 ? 1 / det : 0;

            te[0] = m0 * det;
            te[1] = (m23 * m31 - m21 * m33) * det;
            te[2] = (m21 * m32 - m22 * m31) * det;

            te[3] = m3 * det;
            te[4] = (m11 * m33 - m13 * m31) * det;
            te[5] = (m12 * m31 - m11 * m32) * det;

            te[6] = m6 * det;
            te[7] = (m13 * m21 - m11 * m23) * det;
            te[8] = (m11 * m22 - m12 * m21) * det;

            return this;
        };

        /**
         * @method inverseMat4
         * @memberof Mat3
         * @brief returns the inverse of a Mat4
         * @param Mat4 other
         * @return this
         */
        Mat3.prototype.inverseMat4 = function(other) {
            var te = this.elements,
                me = other.elements,
                m11 = me[0],
                m12 = me[4],
                m13 = me[8],
                m21 = me[1],
                m22 = me[5],
                m23 = me[9],
                m31 = me[2],
                m32 = me[6],
                m33 = me[10],

                m0 = m33 * m22 - m32 * m23,
                m3 = -m33 * m12 + m32 * m13,
                m6 = m23 * m12 - m22 * m13,

                det = m11 * m0 + m21 * m3 + m31 * m6;

            det = det !== 0 ? 1 / det : 0;

            te[0] = m0 * det;
            te[1] = (-m33 * m21 + m31 * m23) * det;
            te[2] = (m32 * m21 - m31 * m22) * det;
            te[3] = m3 * det;
            te[4] = (m33 * m11 - m31 * m13) * det;
            te[5] = (-m32 * m11 + m31 * m12) * det;
            te[6] = m6 * det;
            te[7] = (-m23 * m11 + m21 * m13) * det;
            te[8] = (m22 * m11 - m21 * m12) * det;

            return this;
        };

        /**
         * @method transpose
         * @memberof Mat3
         * @brief transposes this matrix
         * @return this
         */
        Mat3.prototype.transpose = function() {
            var te = this.elements,
                tmp;

            tmp = te[1];
            te[1] = te[3];
            te[3] = tmp;
            tmp = te[2];
            te[2] = te[6];
            te[6] = tmp;
            tmp = te[5];
            te[5] = te[7];
            te[7] = tmp;

            return this;
        };

        /**
         * @method setTrace
         * @memberof Mat3
         * @brief sets the diagonal of matrix
         * @param Vec3 v
         * @return this
         */
        Mat3.prototype.setTrace = function(v) {
            var te = this.elements;

            te[0] = v.x;
            te[4] = v.y;
            te[8] = v.z;

            return this;
        };

        /**
         * @method scale
         * @memberof Mat3
         * @brief scales this by vector
         * @param Vec3 v
         * @return this
         */
        Mat3.prototype.scale = function(v) {
            var te = this.elements,
                x = v.x,
                y = v.y,
                z = v.z;

            te[0] *= x;
            te[3] *= y;
            te[6] *= z;
            te[1] *= x;
            te[4] *= y;
            te[7] *= z;
            te[2] *= x;
            te[5] *= y;
            te[8] *= z;

            return this;
        };

        /**
         * @method makeScale
         * @memberof Mat3
         * @brief makes this a scale matrix
         * @param Number x
         * @param Number y
         * @param Number z
         * @return this
         */
        Mat3.prototype.makeScale = function(x, y, z) {

            return this.set(
                x, 0, 0,
                0, y, 0,
                0, 0, z
            );
        };

        /**
         * @method makeRotationX
         * @memberof Mat3
         * @brief makes this a rotation matrix along x axis
         * @param Number angle
         * @return this
         */
        Mat3.prototype.makeRotationX = function(angle) {
            var c = cos(angle),
                s = sin(angle);

            return this.set(
                1, 0, 0,
                0, c, -s,
                0, s, c
            );
        };

        /**
         * @method makeRotationY
         * @memberof Mat3
         * @brief makes this a rotation matrix along y axis
         * @param Number angle
         * @return this
         */
        Mat3.prototype.makeRotationY = function(angle) {
            var c = cos(angle),
                s = sin(angle);

            return this.set(
                c, 0, s,
                0, 1, 0, -s, 0, c
            );
        };

        /**
         * @method makeRotationZ
         * @memberof Mat3
         * @brief makes this a rotation matrix along z axis
         * @param Number angle
         * @return this
         */
        Mat3.prototype.makeRotationZ = function(angle) {
            var c = cos(angle),
                s = sin(angle);

            return this.set(
                c, -s, 0,
                s, c, 0,
                0, 0, 1
            );
        };

        /**
         * @method fromMat2
         * @memberof Mat3
         * @brief sets this from Mat2
         * @param Mat2 m
         * @return this
         */
        Mat3.prototype.fromMat2 = function(m) {
            var te = this.elements,
                me = m.elements;

            te[0] = me[0];
            te[1] = me[1];
            te[2] = 0;
            te[3] = me[2];
            te[4] = me[3];
            te[5] = 0;
            te[6] = 0;
            te[7] = 0;
            te[8] = 1;

            return this;
        };

        /**
         * @method fromMat4
         * @memberof Mat3
         * @brief sets this from Mat4
         * @param Mat2 m
         * @return this
         */
        Mat3.prototype.fromMat4 = function(m) {
            var te = this.elements,
                me = m.elements;

            te[0] = me[0];
            te[1] = me[1];
            te[2] = me[2];
            te[3] = me[4];
            te[4] = me[5];
            te[5] = me[6];
            te[6] = me[8];
            te[7] = me[9];
            te[8] = me[10];

            return this;
        };

        /**
         * @method fromQuat
         * @memberof Mat3
         * @brief sets rotation of this from quaterian
         * @param Quat q
         * @return this
         */
        Mat3.prototype.fromQuat = function(q) {
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
            te[1] = xy + wz;
            te[2] = xz - wy;

            te[3] = xy - wz;
            te[4] = 1 - (xx + zz);
            te[5] = yz + wx;

            te[6] = xz + wy;
            te[7] = yz - wx;
            te[8] = 1 - (xx + yy);

            return this;
        };

        /**
         * @method fromJSON
         * @memberof Mat3
         * @brief sets values from JSON object
         * @param Object json
         * @return this
         */
        Mat3.prototype.fromJSON = function(json) {
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

            return this;
        };

        /**
         * @method toJSON
         * @memberof Mat3
         * @brief returns json object of this
         * @param Array array
         * @return Object
         */
        Mat3.prototype.toJSON = function(json) {
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
         * @memberof Mat3
         * @brief returns string of this
         * @return String
         */
        Mat3.prototype.toString = function() {
            var te = this.elements;

            return (
                "Mat3[" + te[0] + ", " + te[3] + ", " + te[6] + "]\n" +
                "     [" + te[1] + ", " + te[4] + ", " + te[7] + "]\n" +
                "     [" + te[2] + ", " + te[5] + ", " + te[8] + "]"
            );
        };


        return Mat3;
    }
);


define(
    'math/vec4', [], function() {



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


define(
    'odin', ['require', 'base/audio_ctx', 'base/class', 'base/device', 'base/dom', 'base/event_emitter', 'base/object_pool', 'base/request_animation_frame', 'base/socket.io', 'base/time', 'core/assets/asset', 'core/assets/asset_loader', 'core/assets/assets', 'core/assets/audio_clip', 'core/assets/sprite_sheet', 'core/assets/texture', 'core/components/audio_source', 'core/components/camera', 'core/components/camera_2d', 'core/components/component', 'core/components/emitter_2d', 'core/components/sprite_2d', 'core/components/transform', 'core/components/transform_2d', 'core/game/game', 'core/game/client_game', 'core/game/log', 'core/input/handler', 'core/input/input', 'core/rendering/canvas_renderer_2d', 'core/rendering/webgl_renderer_2d', 'core/game_object', 'core/scene', 'math/aabb2', 'math/aabb3', 'math/color', 'math/mat2', 'math/mat3', 'math/mat32', 'math/mat4', 'math/mathf', 'math/quat', 'math/vec2', 'math/vec3', 'math/vec4'], function(require) {



        var IS_SERVER = !(typeof(window) !== "undefined" && window.document),
            IS_CLIENT = !IS_SERVER,

            defineProperty = Object.defineProperty;


        function Odin() {

            this.AudioCtx = require("base/audio_ctx");
            this.Class = require("base/class");
            this.Device = require("base/device");
            this.Dom = require("base/dom");
            this.EventEmitter = require("base/event_emitter");
            this.ObjectPool = require("base/object_pool");
            this.requestAnimationFrame = require("base/request_animation_frame");
            this.io = require("base/socket.io");
            this.Time = require("base/time");

            this.Asset = require("core/assets/asset");
            this.AssetLoader = require("core/assets/asset_loader");
            this.Assets = require("core/assets/assets");
            this.AudioClip = require("core/assets/audio_clip");
            this.SpriteSheet = require("core/assets/sprite_sheet");
            this.Texture = require("core/assets/texture");

            this.AudioSource = require("core/components/audio_source");
            this.Camera = require("core/components/camera");
            this.Camera2D = require("core/components/camera_2d");
            this.Component = require("core/components/component");
            this.Emitter2D = require("core/components/emitter_2d");
            this.Sprite2D = require("core/components/sprite_2d");
            this.Transform = require("core/components/transform");
            this.Transform2D = require("core/components/transform_2d");

            this.Game = require("core/game/game");
            this.ClientGame = require("core/game/client_game");
            this.Log = require("core/game/log");

            this.Handler = require("core/input/handler");
            this.Input = require("core/input/input");

            this.CanvasRenderer2D = require("core/rendering/canvas_renderer_2d");
            this.WebGLRenderer2D = require("core/rendering/webgl_renderer_2d");

            this.GameObject = require("core/game_object");
            this.Scene = require("core/scene");

            this.AABB2 = require("math/aabb2");
            this.AABB3 = require("math/aabb3");
            this.Color = require("math/color");
            this.Mat2 = require("math/mat2");
            this.Mat3 = require("math/mat3");
            this.Mat32 = require("math/mat32");
            this.Mat4 = require("math/mat4");
            this.Mathf = require("math/mathf");
            this.Quat = require("math/quat");
            this.Vec2 = require("math/vec2");
            this.Vec3 = require("math/vec3");
            this.Vec4 = require("math/vec4");

            if (this.Device.mobile) {
                window.onerror = function(message, page, line) {
                    alert("line: " + line + ", page: " + page + "\nmessage: " + message);
                };
            }
        }


        defineProperty(Odin.prototype, "isServer", {
            get: function() {
                return IS_SERVER;
            }
        });


        defineProperty(Odin.prototype, "isClient", {
            get: function() {
                return IS_CLIENT;
            }
        });


        Odin.prototype.globalize = function() {

            for (var key in this) window[key] = this[key];
            window.Odin = this;
        };


        return new Odin;
    }
);
