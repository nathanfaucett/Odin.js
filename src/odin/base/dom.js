define(
    function() {
        "use strict";


        var splitter = /[ \,]+/,
		
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
			}
        
		
        function Dom() {
			
			this.audioContext = (
				window.audioContext ||
				window.webkitAudioContext ||
				window.mozAudioContext ||
				window.oAudioContext ||
				window.msAudioContext
			);
		}

		
        Dom.prototype.addEvent = function(obj, name, callback, ctx) {
            var names = name.split(splitter),
                i,
                scope = ctx || obj,
                afn = function(e) {
                    e = e || window.event;
                    if (callback) callback.call(scope, e);
                };

            for (i = names.length; i--;) {
                name = names[i];

                if (obj.attachEvent) {
                    obj.attachEvent("on"+ name, afn);
                } else {
                    obj.addEventListener(name, afn, false);
                }
            }
        };

		
        Dom.prototype.removeEvent = function(obj, name, callback, ctx) {
            var names = name.split(splitter),
                i, il,
                scope = ctx || obj,
                afn = function(e) {
                    e = e || window.event;
                    if (callback) callback.call(scope, e);
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
			var key, error, gl, i;
			
			attributes || (attributes = {});
			for (key in WEBGL_ATTRIBUTES) if (attributes[key] != undefined) attributes[key] = WEBGL_ATTRIBUTES[key];

			for (i = WEBGL_NAMES.length; i--;) {
				
				try{
					gl = canvas.getContext(WEBGL_NAMES[i], attributes);
				} catch(e) {
					error = e;
				}
				if (gl) break;
			}
			
			if (error) console.warn("Dom.getWebGLContext: could not get a WebGL Context "+ error.message || "");
			
			return gl;
		};

		
        var createShader = Dom.prototype.createShader = function(gl, source, type) {
            var shader = gl.createShader(type);

            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.warn("Dom.createShader: problem compiling shader " + gl.getShaderInfoLog(shader));
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
                console.warn("Dom.createProgram: problem compiling Program " + gl.getProgramInfoLog(program));
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