if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        var SPLITER = /[ ,]+/,
            SHADER_SPLITER = /[\n;]+/,

            regAttribute = /attribute\s+([a-z]+\s+)?([A-Za-z0-9]+)\s+([a-zA-Z_0-9]+)\s*(\[\s*(.+)\s*\])?/,
            regUniform = /uniform\s+([a-z]+\s+)?([A-Za-z0-9]+)\s+([a-zA-Z_0-9]+)\s*(\[\s*(.+)\s*\])?/,
            regDefine = /#define\s+([a-zA-Z_0-9]+)?\s+([0-9]+)?/,

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
                    callback.call(scope, e || window.event);
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
            for (key in WEBGL_ATTRIBUTES) {
                if (attributes[key] == undefined) attributes[key] = WEBGL_ATTRIBUTES[key];
            }

            for (i = WEBGL_NAMES.length; i--;) {

                try {
                    gl = canvas.getContext(WEBGL_NAMES[i], attributes);
                } catch (err) {
                    console.error("Dom.getWebGLContext: could not get a WebGL Context " + (err.message || ""));
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
                console.error("Dom.createShader: problem compiling shader " + gl.getShaderInfoLog(shader));
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
                console.error("Dom.createProgram: problem compiling Program " + gl.getProgramInfoLog(program));
                gl.deleteProgram(program);
                return undefined;
            }

            return program;
        };


        Dom.prototype.getUniformsAttributes = function(vertexShader, fragmentShader, attributes, uniforms) {
            var src = vertexShader + fragmentShader,
                lines = src.split(SHADER_SPLITER),
                matchAttributes, matchUniforms,
                name, length, line,
                i, j;

            for (i = lines.length; i--;) {
                line = lines[i];
                matchAttributes = line.match(regAttribute);
                matchUniforms = line.match(regUniform);

                if (matchAttributes) {
                    attributes.push({
                        type: matchAttributes[2],
                        name: matchAttributes[3]
                    });
                } else if (matchUniforms) {
                    uniforms.push({
                        type: matchUniforms[2],
                        name: matchUniforms[3]
                    });
                }
            }
        };


        Dom.prototype.parseUniformsAttributes = function(gl, program, vertexShader, fragmentShader, attributes, uniforms) {
            var src = vertexShader + fragmentShader,
                lines = src.split(SHADER_SPLITER),
                defines = {}, matchAttributes, matchUniforms, matchDefines,
                isArray, name, location, length, line,
                i, j;

            for (i = lines.length; i--;) {
                matchDefines = lines[i].match(regDefine);
                if (matchDefines) defines[matchDefines[1]] = Number(matchDefines[2]);
            }

            for (i = lines.length; i--;) {
                line = lines[i];
                matchAttributes = line.match(regAttribute);
                matchUniforms = line.match(regUniform);

                if (matchAttributes) {
                    name = matchAttributes[3];
                    attributes[name] = gl.getAttribLocation(program, name);
                } else if (matchUniforms) {
                    name = matchUniforms[3];
                    length = matchUniforms[5];

                    if (length) {
                        length = defines[length.trim()] || length;
                        location = [];
                        isArray = true;
                        for (j = length; j--;) location[j] = gl.getUniformLocation(program, name + "[" + j + "]");
                    } else {
                        isArray = false;
                        location = gl.getUniformLocation(program, name);
                    }

                    if (location) {
                        uniforms[name] = {
                            isArray: isArray,
                            type: matchUniforms[2],
                            location: location
                        };
                    }
                }
            }
        };


        return new Dom;
    }
);
