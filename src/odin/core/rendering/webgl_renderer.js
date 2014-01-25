if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/event_emitter",
        "odin/base/device",
        "odin/base/dom",
        "odin/math/mathf",
        "odin/math/vec2",
        "odin/math/vec3",
        "odin/math/mat32",
        "odin/math/mat4",
        "odin/math/color",
        "odin/core/game/log",
        "odin/core/enums"
    ],
    function(EventEmitter, Device, Dom, Mathf, Vec2, Vec3, Mat32, Mat4, Color, Log, Enums) {
        "use strict";


        var Blending = Enums.Blending,

            getWebGLContext = Dom.getWebGLContext,
            createProgram = Dom.createProgram,
            parseUniformsAttributes = Dom.parseUniformsAttributes,

            addEvent = Dom.addEvent,
            removeEvent = Dom.removeEvent,

            clamp = Mathf.clamp,
            isPowerOfTwo = Mathf.isPowerOfTwo,

            WHITE_TEXTURE = new Uint8Array([255, 255, 255, 255]),
            ENUM_WHITE_TEXTURE = -1,

            SPRITE_VERTICES = [
                new Vec3(-0.5, 0.5, 0),
                new Vec3(-0.5, -0.5, 0),
                new Vec3(0.5, 0.5, 0),
                new Vec3(0.5, -0.5, 0)
            ],
            SPRITE_UVS = [
                new Vec2(0, 0),
                new Vec2(0, 1),
                new Vec2(1, 0),
                new Vec2(1, 1)
            ],
            ENUM_SPRITE_BUFFER = -1,

            ENUM_PARTICLE_SHADER = -1,
            ENUM_BASIC_SHADER = -2,

            EMPTY_ARRAY = [];


        /**
         * @class WebGLRenderer
         * @extends EventEmitter
         * @brief 2d webgl renderer
         * @param Object options
         */

        function WebGLRenderer(opts) {
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

        EventEmitter.extend(WebGLRenderer);


        WebGLRenderer.prototype.init = function(canvas) {
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


        WebGLRenderer.prototype.clear = function() {
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
         * @memberof WebGLRenderer
         * @brief sets renderers defaults settings
         */
        WebGLRenderer.prototype.setDefaults = function() {
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

            this.setBlending(Blending.Default);

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, WHITE_TEXTURE);
            gl.bindTexture(gl.TEXTURE_2D, null);
            webgl.textures[ENUM_WHITE_TEXTURE] = texture;

            this._clearBytes = gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT;

            return this;
        };

        /**
         * @method setBlending
         * @memberof WebGLRenderer
         * @param Number blending
         */
        WebGLRenderer.prototype.setBlending = function(blending) {
            var gl = this.context;

            if (blending !== this._lastBlending) {

                switch (blending) {
                    case Blending.None:
                        gl.disable(gl.BLEND);
                        break;

                    case Blending.Additive:
                        gl.enable(gl.BLEND);
                        gl.blendEquation(gl.FUNC_ADD);
                        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                        break;

                    case Blending.Subtractive:
                        gl.enable(gl.BLEND);
                        gl.blendEquation(gl.FUNC_ADD);
                        gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
                        break;

                    case Blending.Muliply:
                        gl.enable(gl.BLEND);
                        gl.blendEquation(gl.FUNC_ADD);
                        gl.blendFunc(gl.ZERO, gl.SRC_COLOR);
                        break;

                    case Blending.Default:
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
         * @memberof WebGLRenderer
         * @brief renderers scene from camera's perspective
         * @param Scene scene
         * @param Camera camera
         */
        WebGLRenderer.prototype.render = function(scene, camera) {
            if (!this._context) return;
            var gl = this.context,
                lastBackground = this._lastBackground,
                background = scene.world.background,
                components = scene.components,
                meshFilters = components.MeshFilter || EMPTY_ARRAY,
                particleSystems = components.ParticleSystem || EMPTY_ARRAY,
                meshFilter, particleSystem, transform,
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

            for (i = meshFilters.length; i--;) {
                meshFilter = meshFilters[i];
                transform = meshFilter.transform;

                if (!transform) continue;

                transform.updateModelView(camera.view);
                this.renderMeshFilter(camera, transform, meshFilter);
            }

            for (i = particleSystems.length; i--;) {
                particleSystem = particleSystems[i];
                transform = particleSystem.transform;

                if (!transform) continue;

                transform.updateModelView(camera.view);
                this.renderParticleSystem(camera, transform, particleSystem);
            }
        };


        WebGLRenderer.prototype.renderMeshFilter = function(camera, transform, meshFilter) {
            var gl = this.context,
                webgl = this._webgl,

				material = meshFilter.material,
                glShader = buildShader(this, material),
                glBuffer = buildBuffer(this, meshFilter.mesh),
                uniforms;

			if (!glShader || !glBuffer) return;
			
            uniforms = glShader.uniforms;
            material.matrix.mmul(camera.projection, transform.modelView);

            if (webgl.lastShader !== glShader) {
                gl.useProgram(glShader.program);
                webgl.lastShader = glShader;
            }
            if (webgl.lastBuffer !== glBuffer) {
                bindBuffers(gl, glShader, glBuffer);
                webgl.lastBuffer = glBuffer;
            }

			bindShader(this, glShader, material);

            if (glBuffer.index) {
                gl.drawElements(gl.TRIANGLES, glBuffer.indices, gl.UNSIGNED_SHORT, 0);
            } else {
                gl.drawArrays(gl.TRIANGLES, 0, glBuffer.vertices);
            }
        };


        WebGLRenderer.prototype._handleWebGLContextLost = function(e) {
            e.preventDefault();
            Log.warn("WebGLRenderer: webgl context was lost");

            this._context = false;
            this.emit("webglcontextlost", e);
        };


        WebGLRenderer.prototype._handleWebGLContextRestored = function(e) {
            Log.log("WebGLRenderer: webgl context was restored");

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
                gl.vertexAttribPointer(attributes.aVertexPosition, 3, FLOAT, false, 0, 0);
            }

            if (glBuffer.normal && attributes.aVertexNormal > -1) {
                gl.bindBuffer(ARRAY_BUFFER, glBuffer.normal);
                gl.enableVertexAttribArray(attributes.aVertexNormal);
                gl.vertexAttribPointer(attributes.aVertexNormal, 3, FLOAT, false, 0, 0);
            }

            if (glBuffer.tangent && attributes.aVertexTangent > -1) {
                gl.bindBuffer(ARRAY_BUFFER, glBuffer.tangent);
                gl.enableVertexAttribArray(attributes.aVertexTangent);
                gl.vertexAttribPointer(attributes.aVertexTangent, 4, FLOAT, false, 0, 0);
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

            if (glBuffer.boneWeight && attributes.aBoneWeight > -1) {
                gl.bindBuffer(ARRAY_BUFFER, glBuffer.boneWeight);
                gl.enableVertexAttribArray(attributes.aBoneWeight);
                gl.vertexAttribPointer(attributes.aBoneWeight, 3, FLOAT, false, 0, 0);
            }

            if (glBuffer.boneIndex && attributes.aBoneIndex > -1) {
                gl.bindBuffer(ARRAY_BUFFER, glBuffer.boneIndex);
                gl.enableVertexAttribArray(attributes.aBoneIndex);
                gl.vertexAttribPointer(attributes.aBoneIndex, 3, FLOAT, false, 0, 0);
            }

            if (glBuffer.index) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glBuffer.index);
        }
		
		
		function bindShader(renderer, glShader, material) {
            var gl = renderer.context,
				webgl = renderer._webgl,
				uniforms = glShader.uniforms,
				uniformValue, value, key,
				glTexture, index = 0;
			
			for (key in uniforms) {
				uniformValue = uniforms[key];
				value = material[key];
				if (!value) continue;
				
				switch(uniformValue.type) {
					case "float":
						gl.uniform1f(uniformValue.location, value);
						break;
					
					case "vec2":
						gl.uniform2f(uniformValue.location, value.x, value.y);
						break;
					case "vec3":
						gl.uniform3f(uniformValue.location, value.x, value.y, value.z);
						break;
					case "vec4":
						gl.uniform3f(uniformValue.location, value.x, value.y, value.z, value.w);
						break;
					
					case "mat2":
						gl.uniformMatrix2fv(uniformValue.location, false, value.elements);
						break;
					case "mat3":
						gl.uniformMatrix3fv(uniformValue.location, false, value.elements);
						break;
					case "mat4":
						gl.uniformMatrix4fv(uniformValue.location, false, value.elements);
						break;
					
					case "sampler2D":
						glTexture = buildTexture(renderer, value);
						index++;
						
						if (webgl.lastTexture !== glTexture) {
							gl.activeTexture(gl.TEXTURE0 + index);
							gl.bindTexture(gl.TEXTURE_2D, glTexture);
							gl.uniform1i(uniformValue.location, index);
		
							webgl.lastTexture = glTexture;
						}
						break;
				}
			}
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


            items = buffer.vertices || EMPTY_ARRAY;
            if (items.length) {

                compileArray.length = 0;
                for (i = 0, il = items.length; i < il; i++) {
                    item = items[i];
                    compileArray.push(item.x, item.y, item.z);
                }

                if (compileArray.length) {
                    glBuffer.vertex = glBuffer.vertexBuffer || gl.createBuffer();
                    gl.bindBuffer(ARRAY_BUFFER, glBuffer.vertex);
                    gl.bufferData(ARRAY_BUFFER, new Float32Array(compileArray), DRAW);
                }

                glBuffer.vertices = items.length;
            }

            items = buffer.normals || EMPTY_ARRAY;
            if (items.length) {

                compileArray.length = 0;
                for (i = 0, il = items.length; i < il; i++) {
                    item = items[i];
                    compileArray.push(item.x, item.y, item.z);
                }

                if (compileArray.length) {
                    glBuffer.normal = glBuffer.normalBuffer || gl.createBuffer();
                    gl.bindBuffer(ARRAY_BUFFER, glBuffer.normal);
                    gl.bufferData(ARRAY_BUFFER, new Float32Array(compileArray), DRAW);
                }
            }

            items = buffer.tangents || EMPTY_ARRAY;
            if (items.length) {

                compileArray.length = 0;
                for (i = 0, il = items.length; i < il; i++) {
                    item = items[i];
                    compileArray.push(item.x, item.y, item.z, item.w);
                }

                if (compileArray.length) {
                    glBuffer.tangent = glBuffer.tangentBuffer || gl.createBuffer();
                    gl.bindBuffer(ARRAY_BUFFER, glBuffer.tangent);
                    gl.bufferData(ARRAY_BUFFER, new Float32Array(compileArray), DRAW);
                }
            }

            items = buffer.colors || EMPTY_ARRAY;
            if (items.length) {

                compileArray.length = 0;
                for (i = 0, il = items.length; i < il; i++) {
                    item = items[i];
                    compileArray.push(item.r, item.g, item.b);
                }

                if (compileArray.length) {
                    glBuffer.color = glBuffer.colorBuffer || gl.createBuffer();
                    gl.bindBuffer(ARRAY_BUFFER, glBuffer.color);
                    gl.bufferData(ARRAY_BUFFER, new Float32Array(compileArray), DRAW);
                }
            }

            items = buffer.uvs || EMPTY_ARRAY;
            if (items.length) {

                compileArray.length = 0;
                for (i = 0, il = items.length; i < il; i++) {
                    item = items[i];
                    compileArray.push(item.x, item.y);
                }

                if (compileArray.length) {
                    glBuffer.uv = glBuffer.uvBuffer || gl.createBuffer();
                    gl.bindBuffer(ARRAY_BUFFER, glBuffer.uv);
                    gl.bufferData(ARRAY_BUFFER, new Float32Array(compileArray), DRAW);
                }
            }

            items = buffer.boneIndices || EMPTY_ARRAY;
            if (items.length) {

                glBuffer.boneIndex = glBuffer.boneIndexBuffer || gl.createBuffer();
                gl.bindBuffer(ARRAY_BUFFER, glBuffer.boneIndex);
                gl.bufferData(ARRAY_BUFFER, new Float32Array(items), DRAW);
            }

            items = buffer.boneWeights || EMPTY_ARRAY;
            if (items.length) {

                glBuffer.boneWeight = glBuffer.boneWeightBuffer || gl.createBuffer();
                gl.bindBuffer(ARRAY_BUFFER, glBuffer.boneWeight);
                gl.bufferData(ARRAY_BUFFER, new Float32Array(items), DRAW);
            }

            items = buffer.indices || buffer.faces || EMPTY_ARRAY;
            if (items && items.length) {
                glBuffer.index = glBuffer.index || gl.createBuffer();
                gl.bindBuffer(ELEMENT_ARRAY_BUFFER, glBuffer.index);
                gl.bufferData(ELEMENT_ARRAY_BUFFER, new Int16Array(items), DRAW);

                glBuffer.indices = items.length;
            }

            buffer._needsUpdate = false;

            return glBuffer;
        }

        function buildShader(renderer, material) {
            var gl = renderer.context,
                webgl = renderer._webgl,
				gpu = webgl.gpu,
                shaders = webgl.shaders,
                glShader = shaders[material._id],
                precision, program, vertex, fragment;

            if (glShader && !material._needsUpdate) return glShader;

            glShader = glShader || (shaders[material._id] = {});
			
			precision = gpu.precision;
            vertex = "precision " + precision + " float;\n" + material.vertex;
            fragment = "precision " + precision + " float;\n" + material.fragment;

            program = glShader.program = createProgram(gl, vertex, fragment);
			
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
                "uniform vec3 uPos;",
                "uniform float uAngle;",
                "uniform float uSize;",

                "attribute vec3 aVertexPosition;",
                "attribute vec2 aVertexUv;",

                "varying vec2 vVertexUv;",

                "void main() {",
                "	float c, s, vx, vy, x, y;",

                "	c = cos(uAngle);",
                "	s = sin(uAngle);",
                "	vx = aVertexPosition.x;",
                "	vy = aVertexPosition.y;",

                "	x = vx * c - vy * s;",
                "	y = vx * s + vy * c;",

                "	vVertexUv = aVertexUv;",
                "	gl_Position = uMatrix * vec4(uPos.x + x * uSize, uPos.y + y * uSize, 0.0, 1.0);",
                "}"
            ].join("\n");
        }


        function particleFragmentShader(precision) {

            return [
                "precision " + precision + " float;",

                "uniform float uAlpha;",
                "uniform vec3 uColor;",
                "uniform sampler2D uTexture;",

                "varying vec2 vVertexUv;",

                "void main() {",
                "	vec4 finalColor = texture2D(uTexture, vVertexUv);",
                "	finalColor.xyz *= uColor;",
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


        return WebGLRenderer;
    }
);
