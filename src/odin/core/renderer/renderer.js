if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/event_emitter",
        "odin/base/device",
        "odin/base/dom",
        "odin/base/util",
        "odin/math/mathf",
        "odin/math/color",
        "odin/math/vec3",
        "odin/math/mat4",
        "odin/core/enums",
        "odin/core/game/log",
        "odin/core/assets/texture_cube",
        "odin/core/renderer/shader_chunks",
        "odin/core/renderer/canvas"
    ],
    function(EventEmitter, Device, Dom, util, Mathf, Color, Vec3, Mat4, Enums, Log, TextureCube, ShaderChunks, Canvas) {
        "use strict";


        var Blending = Enums.Blending,
            ShadowMapType = Enums.ShadowMapType,
            CullFace = Enums.CullFace,
            Side = Enums.Side,

            LightType = Enums.LightType,
            Shading = Enums.Shading,

            FilterMode = Enums.FilterMode,
            TextureFormat = Enums.TextureFormat,
            TextureWrap = Enums.TextureWrap,

            getWebGLContext = Dom.getWebGLContext,
            addEvent = Dom.addEvent,
            removeEvent = Dom.removeEvent,

            createProgram = Dom.createProgram,
            parseUniformsAttributes = Dom.parseUniformsAttributes,
            getUniformsAttributes = Dom.getUniformsAttributes,

            merge = util.merge,
            copy = util.copy,

            cos = Math.cos,
            max = Math.max,
            floor = Math.floor,
            clamp = Mathf.clamp,
            isPowerOfTwo = Mathf.isPowerOfTwo,

            EMPTY_ARRAY = [];

        /**
         * Renderer
         * @class Odin.Renderer
         * @extends Odin.EventEmitter
         * @param {object} options
         */
        function Renderer(opts) {
            opts || (opts = {});

            EventEmitter.call(this);

            this.autoClear = opts.autoClear != undefined ? opts.autoClear : true;
            this.autoClearColor = opts.autoClearColor != undefined ? opts.autoClearColor : true;
            this.autoClearDepth = opts.autoClearDepth != undefined ? opts.autoClearDepth : true;
            this.autoClearStencil = opts.autoClearStencil != undefined ? opts.autoClearStencil : true;

            this.attributes = merge(opts.attributes || {}, {
                alpha: true,
                antialias: true,
                depth: true,
                premulipliedAlpha: true,
                preserveDrawingBuffer: false,
                stencil: true
            });

            this.canvas = undefined;
            this.context = undefined;
            this._context = false;

            this.gpu = undefined;
            this.extensions = undefined;
            this.supports = undefined;

            this._viewportX = 0;
            this._viewportY = 0;
            this._viewportWidth = 1;
            this._viewportHeight = 1;

            this._lastProgram = undefined;
            this._lastFramebuffer = undefined;

            this._lastUniforms = {};
            this._textureIndex = 0;

            this._lastBuffer = undefined;

            this._lastCamera = undefined;
            this._lastScene = undefined;
            this._lastResizeFn = undefined;

            this._clearColor = new Color;
            this._clearAlpha = 1;

            this._lastDepthTest = -1;
            this._lastDepthWrite = -1;

            this._lastLineWidth = undefined;
            this._lastBlending = undefined;

            this._programs = [];
        };

        EventEmitter.extend(Renderer);


        Renderer.prototype.init = function(canvas) {
            if (this.canvas) this.clear();
            var element = canvas.element,
                gl = getWebGLContext(element, this.attributes);

            this.canvas = canvas;
            this.context = gl;

            if (!this.context) return this;
            this._context = true;

            addEvent(element, "webglcontextlost", handleWebGLContextLost, this);
            addEvent(element, "webglcontextrestored", handleWebGLContextRestored, this);

            if (gl.getShaderPrecisionFormat === undefined) {
                gl.getShaderPrecisionFormat = function() {
                    return {
                        rangeMin: 1,
                        rangeMax: 1,
                        precision: 1
                    };
                }
            }

            this.extensions = getExtensions(gl);
            this.gpu = getGPUInfo(gl, this.extensions);
            this.supports = getSupports(gl, this.gpu, this.extensions);

            this.setDefaultGLState();

            return this;
        };


        Renderer.prototype.clear = function() {
            if (!this.canvas) return this;
            var canvas = this.canvas,
                element = canvas.element;

            removeEvent(element, "webglcontextlost", handleWebGLContextLost, this);
            removeEvent(element, "webglcontextrestored", handleWebGLContextRestored, this);

            this.canvas = undefined;
            this.context = undefined;
            this._context = false;

            this.gpu = undefined;
            this.extensions = undefined;
            this.supports = undefined;

            this._viewportX = 0;
            this._viewportY = 0;
            this._viewportWidth = 1;
            this._viewportHeight = 1;

            this._lastProgram = undefined;
            this._lastFramebuffer = undefined;

            this._lastUniforms = {};
            this._textureIndex = 0;

            this._lastBuffer = undefined;

            this._lastCamera = undefined;
            this._lastScene = undefined;
            this._lastResizeFn = undefined;

            this._clearColor.set(0, 0, 0);
            this._clearAlpha = 1;

            this._lastDepthTest = -1;
            this._lastDepthWrite = -1;

            this._lastLineWidth = undefined;
            this._lastBlending = undefined;

            this._programs.length = 0;

            return this;
        };


        Renderer.prototype.setDefaultGLState = function() {
            var gl = this.context;

            gl.clearColor(0, 0, 0, 1);
            gl.clearDepth(1);
            gl.clearStencil(0);

            this.setDepthTest(true);
            gl.depthFunc(gl.LEQUAL);

            gl.frontFace(gl.CCW);

            this.setCullFace(CullFace.Back);
            this.setBlending(Blending.Default);

            this.setViewport();

            return this;
        };


        Renderer.prototype.setViewport = function(x, y, width, height) {
            var canvas = this.canvas;

            x || (x = 0);
            y || (y = 0);
            width || (width = canvas.pixelWidth);
            height || (height = canvas.pixelHeight);

            if (this._viewportX !== x || this._viewportY !== y || this._viewportWidth !== width || this._viewportHeight !== height) {
                this._viewportX = x;
                this._viewportY = y;
                this._viewportWidth = width;
                this._viewportHeight = height;

                this.context.viewport(x, y, width, height);
            }
        };


        Renderer.prototype.setDepthTest = function(depthTest) {

            if (this._lastDepthTest !== depthTest) {
                var gl = this.context;

                if (depthTest) {
                    gl.enable(gl.DEPTH_TEST);
                } else {
                    gl.disable(gl.DEPTH_TEST);
                }

                this._lastDepthTest = depthTest;
            }
        };


        Renderer.prototype.setDepthWrite = function(depthWrite) {

            if (this._lastDepthWrite !== depthWrite) {

                this.context.depthMask(depthWrite);
                this._lastDepthWrite = depthWrite;
            }
        };


        Renderer.prototype.setLineWidth = function(width) {

            if (this._lastLineWidth !== width) {

                this.context.lineWidth(width);
                this._lastLineWidth = width;
            }
        };


        Renderer.prototype.setCullFace = function(cullFace) {

            if (this._lastCullFace !== cullFace) {
                var gl = this.context,
                    disabled = false;

                if (!this._lastCullFace || this._lastCullFace === CullFace.None) disabled = true;

                if (cullFace === CullFace.Front) {
                    if (disabled) gl.enable(gl.CULL_FACE);
                    gl.cullFace(gl.FRONT);
                } else if (cullFace === CullFace.Back) {
                    if (disabled) gl.enable(gl.CULL_FACE);
                    gl.cullFace(gl.BACK);
                } else if (cullFace === CullFace.FrontBack) {
                    if (disabled) gl.enable(gl.CULL_FACE);
                    gl.cullFace(gl.FRONT_AND_BACK);
                } else {
                    gl.disable(gl.CULL_FACE);
                    this._lastCullFace = CullFace.None;
                    return;
                }

                this._lastCullFace = cullFace;
            }
        };


        Renderer.prototype.setBlending = function(blending) {

            if (blending !== this._lastBlending) {
                var gl = this.context;

                if (blending === Blending.None) {
                    gl.disable(gl.BLEND);
                } else if (blending === Blending.Additive) {
                    gl.enable(gl.BLEND);
                    gl.blendEquation(gl.FUNC_ADD);
                    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                } else if (blending === Blending.Subtractive) {
                    gl.enable(gl.BLEND);
                    gl.blendEquation(gl.FUNC_ADD);
                    gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
                } else if (blending === Blending.Muliply) {
                    gl.enable(gl.BLEND);
                    gl.blendEquation(gl.FUNC_ADD);
                    gl.blendFunc(gl.ZERO, gl.SRC_COLOR);
                } else if (blending === Blending.Default) {
                    gl.enable(gl.BLEND);
                    gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
                    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                    this._lastBlending = Blending.Default;
                    return;
                }

                this._lastBlending = blending;
            }
        };


        Renderer.prototype.setScissor = function(x, y, width, height) {

            this.context.scissor(x, y, width, height);
        };


        Renderer.prototype.setClearColor = function(color, alpha) {
            var clearColor = this._clearColor;
            alpha || (alpha = 1);

            if (!clearColor.equals(color) || alpha !== this._clearAlpha) {

                clearColor.copy(color);
                this._clearAlpha = alpha;

                this.context.clearColor(clearColor.r, clearColor.g, clearColor.b, alpha);
            }
        };


        Renderer.prototype.setUniform = function(location, value, key, type, isArray, index) {
            var lastUniforms = this._lastUniforms,
                state;

            if (isArray) {
                lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                key = index;
            }
            state = lastUniforms[key];

            if (type === "int") {
                if (state !== value) {
                    this.context.uniform1i(location, value);
                    lastUniforms[key] = value;
                }
            } else if (type === "float") {
                if (state !== value) {
                    this.context.uniform1f(location, value);
                    lastUniforms[key] = value;
                }
            } else if (type === "vec2") {
                if (!state || (state.x !== value.x || state.y !== value.y)) {
                    this.context.uniform2f(location, value.x, value.y);
                    state || (lastUniforms[key] = state = value.clone());
                    state.x = value.x;
                    state.y = value.y;
                }
            } else if (type === "vec3") {
                if (!state || (state.x !== value.x || state.y !== value.y || state.z !== value.z)) {
                    this.context.uniform3f(location, value.x, value.y, value.z);
                    state || (lastUniforms[key] = state = value.clone());
                    state.x = value.x;
                    state.y = value.y;
                    state.z = value.z;
                }
            } else if (type === "vec4") {
                if (!state || (state.x !== value.x || state.y !== value.y || state.z !== value.z || state.w !== value.w)) {
                    this.context.uniform3f(location, value.x, value.y, value.z, value.w);
                    state || (lastUniforms[key] = state = value.clone());
                    state.x = value.x;
                    state.y = value.y;
                    state.z = value.z;
                    state.w = value.w;
                }
            } else if (type === "mat2") {
                if (!state || !state.equals(value)) {
                    this.context.uniformMatrix2fv(location, false, value.elements);
                    (state || (lastUniforms[key] = state = value.clone())).copy(value);
                }
            } else if (type === "mat3") {
                if (!state || !state.equals(value)) {
                    this.context.uniformMatrix3fv(location, false, value.elements);
                    (state || (lastUniforms[key] = state = value.clone())).copy(value);
                }
            } else if (type === "mat4") {
                if (!state || !state.equals(value)) {
                    this.context.uniformMatrix4fv(location, false, value.elements);
                    (state || (lastUniforms[key] = state = value.clone())).copy(value);
                }
            } else if (type === "sampler2D") {
                this.setTexture(location, value, key);
            } else if (type === "samplerCube") {
                this.setTextureCube(location, value, key);
            }
        };


        Renderer.prototype.setUniform1i = function(location, value, key, isArray, index) {
            var lastUniforms = this._lastUniforms,
                state;

            if (isArray) {
                lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                key = index;
            }
            state = lastUniforms[key];

            if (state !== value) {
                this.context.uniform1i(location, value);
                lastUniforms[key] = value;
            }
        };


        Renderer.prototype.setUniform1f = function(location, value, key, isArray, index) {
            var lastUniforms = this._lastUniforms,
                state;

            if (isArray) {
                lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                key = index;
            }
            state = lastUniforms[key];

            if (state !== value) {
                this.context.uniform1f(location, value);
                lastUniforms[key] = value;
            }
        };


        Renderer.prototype.setUniform2f = function(location, value, key, isArray, index) {
            var lastUniforms = this._lastUniforms,
                state;

            if (isArray) {
                lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                key = index;
            }
            state = lastUniforms[key];

            if (!state || (state.x !== value.x || state.y !== value.y)) {
                this.context.uniform2f(location, value.x, value.y);
                state || (lastUniforms[key] = state = value.clone());
                state.x = value.x;
                state.y = value.y;
            }
        };


        Renderer.prototype.setUniform3f = function(location, value, key, isArray, index) {
            var lastUniforms = this._lastUniforms,
                state;

            if (isArray) {
                lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                key = index;
            }
            state = lastUniforms[key];

            if (!state || (state.x !== value.x || state.y !== value.y || state.z !== value.z)) {
                this.context.uniform3f(location, value.x, value.y, value.z);
                state || (lastUniforms[key] = state = value.clone());
                state.x = value.x;
                state.y = value.y;
                state.z = value.z;
            }
        };


        Renderer.prototype.setUniform4f = function(location, value, key, isArray, index) {
            var lastUniforms = this._lastUniforms,
                state;

            if (isArray) {
                lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                key = index;
            }
            state = lastUniforms[key];

            if (!state || (state.x !== value.x || state.y !== value.y || state.z !== value.z || state.w !== value.w)) {
                this.context.uniform4f(location, value.x, value.y, value.z, value.w);
                state || (lastUniforms[key] = state = value.clone());
                state.x = value.x;
                state.y = value.y;
                state.z = value.z;
                state.w = value.w;
            }
        };


        Renderer.prototype.setUniformMatrix2fv = function(location, value, key, isArray, index) {
            var lastUniforms = this._lastUniforms,
                state;

            if (isArray) {
                lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                key = index;
            }
            state = lastUniforms[key];

            if (!state || !state.equals(value)) {
                this.context.uniformMatrix2fv(location, false, value.elements);
                (state || (lastUniforms[key] = state = value.clone())).copy(value);
            }
        };


        Renderer.prototype.setUniformMatrix3fv = function(location, value, key, isArray, index) {
            var lastUniforms = this._lastUniforms,
                state;

            if (isArray) {
                lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                key = index;
            }
            state = lastUniforms[key];

            if (!state || !state.equals(value)) {
                this.context.uniformMatrix3fv(location, false, value.elements);
                (state || (lastUniforms[key] = state = value.clone())).copy(value);
            }
        };


        Renderer.prototype.setUniformMatrix4fv = function(location, value, key, isArray, index) {
            var lastUniforms = this._lastUniforms,
                state;

            if (isArray) {
                lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                key = index;
            }
            state = lastUniforms[key];

            if (!state || !state.equals(value)) {
                this.context.uniformMatrix4fv(location, false, value.elements);
                (state || (lastUniforms[key] = state = value.clone())).copy(value);
            }
        };


        Renderer.prototype.setTexture = function(location, texture, key) {
            if (!texture || !texture.raw) return;
            var gl = this.context,
                index, glTexture;

            if (!texture.needsUpdate && (glTexture = texture._webgl)) {
                index = this._textureIndex++;

                gl.activeTexture(gl.TEXTURE0 + index);
                gl.bindTexture(gl.TEXTURE_2D, glTexture);
                this.setUniform1i(location, index, key);

                return;
            }

            glTexture = texture._webgl || (texture._webgl = gl.createTexture());
            index = this._textureIndex++;

            var raw = texture.raw,
                gpu = this.gpu,
                extensions = this.extensions,
                maxAnisotropy = gpu.maxAnisotropy,
                maxTextureSize = gpu.maxTextureSize,
                TFA = extensions.glExtensionTextureFilterAnisotropic,

                isPOT = isPowerOfTwo(raw.width) && isPowerOfTwo(raw.height),
                anisotropy = clamp(texture.anisotropy || 1, 1, maxAnisotropy),

                TEXTURE_2D = gl.TEXTURE_2D,
                filter = texture.filter,
                format = texture.format,
                wrap = texture.wrap,
                WRAP, MAG_FILTER, MIN_FILTER, FORMAT;

            if (filter === FilterMode.None) {
                MAG_FILTER = gl.NEAREST;
                if (isPOT) {
                    MIN_FILTER = gl.LINEAR_MIPMAP_NEAREST;
                } else {
                    MIN_FILTER = gl.NEAREST;
                }
            } else { //FilterMode.Linear
                MAG_FILTER = gl.LINEAR;
                if (isPOT) {
                    MIN_FILTER = gl.LINEAR_MIPMAP_LINEAR;
                } else {
                    MIN_FILTER = gl.LINEAR;
                }
            }

            if (format === TextureFormat.RGB) {
                FORMAT = gl.RGB;
            } else if (format === TextureFormat.RGBA) {
                FORMAT = gl.RGBA;
            } else if (format === TextureFormat.LuminanceAlpha) {
                FORMAT = gl.LUMINANCE_ALPHA;
            } else if (format === TextureFormat.Luminance) {
                FORMAT = gl.LUMINANCE;
            } else if (format === TextureFormat.Alpha) {
                FORMAT = gl.ALPHA;
            }

            if (wrap === TextureWrap.Clamp) {
                WRAP = gl.CLAMP_TO_EDGE;
            } else if (wrap === TextureWrap.MirrorRepeat) {
                WRAP = isPOT ? gl.MIRRORED_REPEAT : gl.CLAMP_TO_EDGE;
            } else { //TextureWrap.Repeat
                WRAP = isPOT ? gl.REPEAT : gl.CLAMP_TO_EDGE;
            }

            gl.activeTexture(gl.TEXTURE0 + index);
            gl.bindTexture(TEXTURE_2D, glTexture);
            this.setUniform1i(location, index, key);

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, texture.flipY ? 1 : 0);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.premultiplyAlpha ? 1 : 0);

            gl.texImage2D(TEXTURE_2D, 0, FORMAT, FORMAT, gl.UNSIGNED_BYTE, clampToMaxSize(raw, maxTextureSize));

            gl.texParameteri(TEXTURE_2D, gl.TEXTURE_MAG_FILTER, MAG_FILTER);
            gl.texParameteri(TEXTURE_2D, gl.TEXTURE_MIN_FILTER, MIN_FILTER);

            gl.texParameteri(TEXTURE_2D, gl.TEXTURE_WRAP_S, WRAP);
            gl.texParameteri(TEXTURE_2D, gl.TEXTURE_WRAP_T, WRAP);

            if (TFA) gl.texParameterf(TEXTURE_2D, TFA.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);
            if (isPOT) gl.generateMipmap(TEXTURE_2D);

            texture.needsUpdate = false;
        };


        Renderer.prototype.setTextureCube = function(location, cubeTexture, key) {
            if (!cubeTexture || !cubeTexture.raw) return;
            var gl = this.context,
                glTexture = cubeTexture._webgl,
                index;

            if (!cubeTexture.needsUpdate && glTexture) {
                index = this._textureIndex++;

                gl.activeTexture(gl.TEXTURE0 + index);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, glTexture);
                this.setUniform1i(location, index, key);

                return;
            }
            glTexture = cubeTexture._webgl || (cubeTexture._webgl = gl.createTexture());
            index = this._textureIndex++;

            var raw = cubeTexture.raw,
                gpu = this.gpu,
                extensions = this.extensions,
                maxAnisotropy = gpu.maxAnisotropy,
                maxCubeTextureSize = gpu.maxCubeTextureSize,
                TFA = this.glExtensionTextureFilterAnisotropic,

                first = raw[0],
                isPOT = isPowerOfTwo(first.width) && isPowerOfTwo(first.height),
                anisotropy = clamp(cubeTexture.anisotropy || 1, 1, maxAnisotropy),

                TEXTURE_CUBE_MAP = gl.TEXTURE_CUBE_MAP,
                TEXTURE_CUBE_MAP_POSITIVE_X = gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                UNSIGNED_BYTE = gl.UNSIGNED_BYTE,

                filter = cubeTexture.filter,
                format = cubeTexture.format,
                wrap = cubeTexture.wrap,
                WRAP, MAG_FILTER, MIN_FILTER, FORMAT,
                current, i;

            if (filter === FilterMode.None) {
                MAG_FILTER = gl.NEAREST;
                if (isPOT) {
                    MIN_FILTER = gl.LINEAR_MIPMAP_NEAREST;
                } else {
                    MIN_FILTER = gl.NEAREST;
                }
            } else { //FilterMode.Linear
                MAG_FILTER = gl.LINEAR;
                if (isPOT) {
                    MIN_FILTER = gl.LINEAR_MIPMAP_LINEAR;
                } else {
                    MIN_FILTER = gl.LINEAR;
                }
            }

            if (format === TextureFormat.RGB) {
                FORMAT = gl.RGB;
            } else if (format === TextureFormat.RGBA) {
                FORMAT = gl.RGBA;
            } else if (format === TextureFormat.LuminanceAlpha) {
                FORMAT = gl.LUMINANCE_ALPHA;
            } else if (format === TextureFormat.Luminance) {
                FORMAT = gl.LUMINANCE;
            } else if (format === TextureFormat.Alpha) {
                FORMAT = gl.ALPHA;
            }

            if (wrap === TextureWrap.Clamp) {
                WRAP = gl.CLAMP_TO_EDGE;
            } else { //TextureWrap.Repeat
                WRAP = isPOT ? gl.REPEAT : gl.CLAMP_TO_EDGE;
            }

            gl.activeTexture(gl.TEXTURE0 + index);
            gl.bindTexture(TEXTURE_CUBE_MAP, glTexture);
            this.setUniform1i(location, index, key);

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, cubeTexture.flipY ? 1 : 0);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, cubeTexture.premultiplyAlpha ? 1 : 0);

            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[0], maxCubeTextureSize));
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[1], maxCubeTextureSize));
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[2], maxCubeTextureSize));
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[3], maxCubeTextureSize));
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[4], maxCubeTextureSize));
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[5], maxCubeTextureSize));

            gl.texParameteri(TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, MAG_FILTER);
            gl.texParameteri(TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, MIN_FILTER);

            gl.texParameteri(TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, WRAP);
            gl.texParameteri(TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, WRAP);

            if (TFA) gl.texParameterf(TEXTURE_CUBE_MAP, TFA.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);
            if (isPOT) gl.generateMipmap(TEXTURE_CUBE_MAP);

            cubeTexture.needsUpdate = false;
        };


        function clampToMaxSize(image, maxSize) {
            if (image.height <= maxSize && image.width <= maxSize) return image;
            var maxDim = 1 / max(image.width, image.height),
                newWidth = floor(image.width * maxSize * maxDim),
                newHeight = floor(image.height * maxSize * maxDim),
                canvas = document.createElement("canvas"),
                ctx = canvas.getContext("2d");

            canvas.width = newWidth;
            canvas.height = newHeight;
            ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, newWidth, newHeight);

            Log.once("Renderer._initTextureCube: image height larger than machines max cube texture size (max = " + maxSize + ")");

            return canvas;
        }


        Renderer.prototype.clearCanvas = function(color, depth, stencil) {
            var gl = this.context,
                bits = 0;

            if (color === undefined || color) bits |= gl.COLOR_BUFFER_BIT;
            if (depth === undefined || depth) bits |= gl.DEPTH_BUFFER_BIT;
            if (stencil === undefined || stencil) bits |= gl.STENCIL_BUFFER_BIT;

            gl.clear(bits);
        };


        Renderer.prototype.clearColor = function() {
            var gl = this.context;

            gl.clear(gl.COLOR_BUFFER_BIT);
        };


        Renderer.prototype.clearDepth = function() {
            var gl = this.context;

            gl.clear(gl.DEPTH_BUFFER_BIT);
        };


        Renderer.prototype.clearStencil = function() {
            var gl = this.context;

            gl.clear(gl.STENCIL_BUFFER_BIT);
        };


        Renderer.prototype.getExtension = function(name) {
            if (this.extensions[name]) return this.extensions[name];
            var extensions = this.extensions,
                extension;

            if (extensions[name]) return extensions[name];

            extensions[name] = extension = getExtension(this.context, name);
            this.supports[name] = !! extension;

            return extension;
        };


        Renderer.prototype._initMeshBuffers = function(mesh) {
            if (!mesh.dynamic && mesh._webgl.inittedBuffers) return mesh._webgl;
            var gl = this.context,
                webgl = mesh._webgl,
                DRAW = mesh.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW,
                ARRAY_BUFFER = gl.ARRAY_BUFFER,
                ELEMENT_ARRAY_BUFFER = gl.ELEMENT_ARRAY_BUFFER,
                bufferArray, items, item, i, len, offset, vertexIndex;

            items = mesh.vertices || EMPTY_ARRAY;
            len = items.length;
            if (len && mesh.verticesNeedUpdate) {
                bufferArray = webgl.vertexArray;
                if (!bufferArray || bufferArray.length !== len * 3) {
                    bufferArray = webgl.vertexArray = new Float32Array(len * 3);
                    webgl.vertexCount = len;
                }

                for (i = 0; i < len; i++) {
                    item = items[i];
                    offset = i * 3;

                    bufferArray[offset] = item.x;
                    bufferArray[offset + 1] = item.y;
                    bufferArray[offset + 2] = item.z;
                }

                webgl.vertexBuffer = webgl.vertexBuffer || gl.createBuffer();
                gl.bindBuffer(ARRAY_BUFFER, webgl.vertexBuffer);
                gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                mesh.verticesNeedUpdate = false;
            }

            items = mesh.normals || EMPTY_ARRAY;
            len = items.length;
            if (len && mesh.normalsNeedUpdate) {
                bufferArray = webgl.normalArray;
                if (!bufferArray || bufferArray.length !== len * 3) bufferArray = webgl.normalArray = new Float32Array(len * 3);

                for (i = 0; i < len; i++) {
                    item = items[i];
                    offset = i * 3;

                    bufferArray[offset] = item.x;
                    bufferArray[offset + 1] = item.y;
                    bufferArray[offset + 2] = item.z;
                }

                webgl.normalBuffer = webgl.normalBuffer || gl.createBuffer();
                gl.bindBuffer(ARRAY_BUFFER, webgl.normalBuffer);
                gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                mesh.normalsNeedUpdate = false;
            }

            items = mesh.tangents || EMPTY_ARRAY;
            len = items.length;
            if (len && mesh.tangentsNeedUpdate) {
                bufferArray = webgl.tangentArray;
                if (!bufferArray || bufferArray.length !== len * 4) bufferArray = webgl.tangentArray = new Float32Array(len * 4);

                for (i = 0; i < len; i++) {
                    item = items[i];
                    offset = i * 4;

                    bufferArray[offset] = item.x;
                    bufferArray[offset + 1] = item.y;
                    bufferArray[offset + 2] = item.z;
                    bufferArray[offset + 3] = item.w;
                }

                webgl.tangentBuffer = webgl.tangentBuffer || gl.createBuffer();
                gl.bindBuffer(ARRAY_BUFFER, webgl.tangentBuffer);
                gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                mesh.tangentsNeedUpdate = false;
            }

            items = mesh.indices || EMPTY_ARRAY;
            len = items.length;
            if (len && mesh.indicesNeedUpdate) {
                bufferArray = webgl.indexArray;
                if (!bufferArray || bufferArray.length !== len) {
                    bufferArray = webgl.indexArray = new Uint16Array(len);
                    webgl.indexCount = len;
                }

                for (i = 0; i < len; i++) bufferArray[i] = items[i];

                webgl.indexBuffer = webgl.indexBuffer || gl.createBuffer();
                gl.bindBuffer(ELEMENT_ARRAY_BUFFER, webgl.indexBuffer);
                gl.bufferData(ELEMENT_ARRAY_BUFFER, bufferArray, DRAW);

                bufferArray = webgl.lineArray;
                if (!bufferArray || bufferArray.length !== len * 3) {
                    bufferArray = webgl.lineArray = new Uint16Array(len * 3);
                    webgl.lineCount = len * 3;
                }

                vertexIndex = offset = 0;
                for (i = 0; i < len; i++) {

                    bufferArray[offset] = items[vertexIndex];
                    bufferArray[offset + 1] = items[vertexIndex + 1];

                    bufferArray[offset + 2] = items[vertexIndex];
                    bufferArray[offset + 3] = items[vertexIndex + 2];

                    bufferArray[offset + 4] = items[vertexIndex + 1];
                    bufferArray[offset + 5] = items[vertexIndex + 2];

                    offset += 6;
                    vertexIndex += 3;
                }

                webgl.lineBuffer = webgl.lineBuffer || gl.createBuffer();
                gl.bindBuffer(ELEMENT_ARRAY_BUFFER, webgl.lineBuffer);
                gl.bufferData(ELEMENT_ARRAY_BUFFER, bufferArray, DRAW);

                mesh.indicesNeedUpdate = false;
            }

            items = mesh.colors || EMPTY_ARRAY;
            len = items.length;
            if (len && mesh.colorsNeedUpdate) {
                bufferArray = webgl.colorArray;
                if (!bufferArray || bufferArray.length !== len * 3) bufferArray = webgl.colorArray = new Float32Array(len * 3);

                for (i = 0; i < len; i++) {
                    item = items[i];
                    offset = i * 3;

                    bufferArray[offset] = item.x;
                    bufferArray[offset + 1] = item.y;
                    bufferArray[offset + 2] = item.z;
                }

                webgl.colorBuffer = webgl.colorBuffer || gl.createBuffer();
                gl.bindBuffer(ARRAY_BUFFER, webgl.colorBuffer);
                gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                mesh.colorsNeedUpdate = false;
            }

            items = mesh.uvs || EMPTY_ARRAY;
            len = items.length;
            if (len && mesh.uvsNeedUpdate) {
                bufferArray = webgl.uvArray;
                if (!bufferArray || bufferArray.length !== len * 2) bufferArray = webgl.uvArray = new Float32Array(len * 2);

                for (i = 0; i < len; i++) {
                    item = items[i];
                    offset = i * 2;

                    bufferArray[offset] = item.x;
                    bufferArray[offset + 1] = item.y;
                }

                webgl.uvBuffer = webgl.uvBuffer || gl.createBuffer();
                gl.bindBuffer(ARRAY_BUFFER, webgl.uvBuffer);
                gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                mesh.uvsNeedUpdate = false;
            }

            items = mesh.boneIndices || EMPTY_ARRAY;
            len = items.length;
            if (len && mesh.boneIndicesNeedUpdate) {
                bufferArray = webgl.boneIndexArray;
                if (!bufferArray || bufferArray.length !== len) bufferArray = webgl.boneIndexArray = new Uint16Array(len);

                for (i = 0; i < len; i++) bufferArray[i] = items[i];

                webgl.boneIndexBuffer = webgl.boneIndexBuffer || gl.createBuffer();
                gl.bindBuffer(ARRAY_BUFFER, webgl.boneIndexBuffer);
                gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                mesh.boneIndicesNeedUpdate = false;
            }

            items = mesh.boneWeights || EMPTY_ARRAY;
            len = items.length;
            if (len && mesh.boneWeightsNeedUpdate) {
                bufferArray = webgl.boneWeightArray;
                if (!bufferArray || bufferArray.length !== len) bufferArray = webgl.boneWeightArray = new Float32Array(len);

                for (i = 0; i < len; i++) bufferArray[i] = items[i];

                webgl.boneWeightBuffer = webgl.boneWeightBuffer || gl.createBuffer();
                gl.bindBuffer(ARRAY_BUFFER, webgl.boneWeightBuffer);
                gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                mesh.boneWeightsNeedUpdate = false;
            }

            webgl.inittedBuffers = true;

            return webgl;
        };


        Renderer.prototype._initMaterial = function(material, mesh, lights) {
            if (!material.needsUpdate && material._webgl) return material._webgl;

            var shader = material.shader,
                uniforms = material.uniforms,
                standardDerivatives = !! this.extensions.standardDerivatives,
                parameters = {};

            parameters.mobile = Device.mobile;
            parameters.useLights = shader.lights;
            parameters.useShadows = shader.shadows;
            parameters.useFog = shader.fog;
            parameters.useBones = mesh.useBones && mesh.bones.length > 0;
            parameters.useVertexLit = shader.vertexLit;
            parameters.useSpecular = shader.specular;

            parameters.useNormal = uniforms.normalMap;
            parameters.useBump = uniforms.bumpMap;

            parameters.positions = mesh.vertices.length > 0;
            parameters.normals = mesh.normals.length > 0;
            parameters.tangents = mesh.tangents.length > 0;
            parameters.uvs = mesh.uvs.length > 0;
            parameters.colors = mesh.colors.length > 0;

            parameters.standardDerivatives = standardDerivatives && shader.standardDerivatives;

            allocateLights(lights, parameters);
            allocateShadows(lights, parameters);

            material._webgl = this._initProgram(shader.vertex, shader.fragment, parameters);
            material.needsUpdate = false;

            return material._webgl;
        };


        function allocateLights(lights, parameters) {
            var maxPointLights = 0,
                maxDirectionalLights = 0,
                maxSpotLights = 0,
                maxHemiLights = 0,
                light, type,
                i = 0,
                il = lights.length;

            for (; i < il; i++) {
                light = lights[i];
                if (!light.visible || light.onlyShadow) continue;
                type = light.type;

                if (type === LightType.Point) {
                    maxPointLights++;
                } else if (type === LightType.Directional) {
                    maxDirectionalLights++;
                } else if (type === LightType.Spot) {
                    maxSpotLights++;
                } else if (type === LightType.Hemi) {
                    maxHemiLights++;
                }
            }

            parameters.maxPointLights = maxPointLights;
            parameters.maxDirectionalLights = maxDirectionalLights;
            parameters.maxSpotLights = maxSpotLights;
            parameters.maxHemiLights = maxHemiLights;
        }


        function allocateShadows(lights, parameters) {
            var maxShadows = 0,
                light, type,
                i = 0,
                il = lights.length;

            for (; i < il; i++) {
                light = lights[i];
                if (!light.visible || !light.castShadow) continue;
                type = light.type;

                if (type === LightType.Directional) {
                    maxShadows++;
                } else if (type === LightType.Spot) {
                    maxShadows++;
                }
            }

            parameters.maxShadows = maxShadows;
        }


        var MAIN_SPLITER = /void[\s]+main([\s]+)?(\((void)?\))([\s]+)?{/;
        Renderer.prototype._initProgram = function(vertexShader, fragmentShader, parameters) {
            var gl = this.context,
                chunks = [],
                programs = this._programs,
                key, program, webglProgram, programInfo, code, i;

            chunks.push(fragmentShader, vertexShader);
            for (key in parameters) chunks.push(key, parameters[key]);

            code = chunks.join();

            for (i = programs.length; i--;) {
                programInfo = programs[i];

                if (programInfo.code === code) {
                    programInfo.used++;
                    return programInfo.program;
                }
            }

            var precision = this.gpu.precision,

                mobile = parameters.mobile,
                useLights = parameters.useLights,
                useShadows = parameters.useShadows,
                useFog = parameters.useFog,
                useBones = parameters.useBones,
                useVertexLit = parameters.useVertexLit,
                useSpecular = parameters.useSpecular,
                standardDerivatives = parameters.standardDerivatives,

                definesPrefix = [
                    "precision " + precision + " float;",
                    "precision " + precision + " int;",

                    useLights ? "#define USE_LIGHTS" : "",
                    useShadows ? "#define USE_SHADOWS" : "",
                    useBones ? "#define USE_SKINNING" : "",

                    useLights ? "#define MAX_DIR_LIGHTS " + parameters.maxDirectionalLights : "",
                    useLights ? "#define MAX_POINT_LIGHTS " + parameters.maxPointLights : "",
                    useLights ? "#define MAX_SPOT_LIGHTS " + parameters.maxSpotLights : "",
                    useLights ? "#define MAX_HEMI_LIGHTS " + parameters.maxHemiLights : "",

                    useShadows ? "#define MAX_SHADOWS " + parameters.maxShadows : "",
                    ""
                ].join("\n"),

                vertexPrefix = [
                    definesPrefix,

                    "uniform mat4 modelMatrix;",
                    "uniform mat4 modelViewMatrix;",
                    "uniform mat4 projectionMatrix;",
                    "uniform mat4 viewMatrix;",
                    "uniform mat3 normalMatrix;",
                    "uniform vec3 cameraPosition;",

                    parameters.positions ? "attribute vec3 position;" : "",
                    parameters.normals ? "attribute vec3 normal;" : "",
                    parameters.tangents ? "attribute vec4 tangent;" : "",
                    parameters.uvs ? "attribute vec2 uv;" : "",
                    parameters.colors ? "attribute vec3 color;" : "",

                    useBones ? "attribute int boneIndex;" : "",
                    useBones ? "attribute vec3 boneWeight;" : "",
                    useBones ? "uniform mat4 bone[" + parameters.bones + "];" : ""
                ].join("\n"),

                fragmentPrefix = [
                    standardDerivatives ? "#extension GL_OES_standard_derivatives : enable" : "",
                    definesPrefix,

                    "uniform mat4 viewMatrix;",
                    "uniform vec3 cameraPosition;"
                ].join("\n"),

                glVertexShader = vertexPrefix + "\n" + vertexShader,
                glFragmentShader = fragmentPrefix + "\n" + fragmentShader,

                vertexSplit = glVertexShader.split(MAIN_SPLITER),
                fragmentSplit = glFragmentShader.split(MAIN_SPLITER),
                main = "void main(void) {\n",
                vertexHeader = vertexSplit[0],
                vertexMain = vertexSplit[5],
                fragmentHeader = fragmentSplit[0],
                fragmentMain = fragmentSplit[5];

            if (standardDerivatives) {
                if (parameters.useNormal) fragmentHeader += ShaderChunks.perturbNormal2Arb;
                if (parameters.useBump) fragmentHeader += ShaderChunks.dHdxy_fwd + ShaderChunks.perturbNormalArb;
            }

            if (useLights) {
                if (useVertexLit) {
                    vertexHeader += ShaderChunks.lights + ShaderChunks.VertexLight;
                } else {
                    vertexHeader += ShaderChunks.perPixelVaryingHeader;
                    vertexMain = ShaderChunks.perPixelVaryingMain + vertexMain;

                    fragmentHeader += ShaderChunks.lights + ShaderChunks.perPixelVaryingHeader;
                    if (useSpecular) {
                        fragmentHeader += ShaderChunks.PixelLight;
                    } else {
                        fragmentHeader += ShaderChunks.PixelLightNoSpec;
                    }
                }

                vertexMain = ShaderChunks.mvPosition + vertexMain;
                if (parameters.normals) vertexMain = ShaderChunks.transformedNormal + vertexMain;
                vertexMain = ShaderChunks.worldPosition + vertexMain;
            } else {
                vertexMain = ShaderChunks.mvPosition + vertexMain;
            }

            if (useBones) {
                vertexHeader += ShaderChunks.getBoneMatrix;
                if (parameters.normals) vertexMain = ShaderChunks.boneNormal + vertexMain;
                vertexMain = ShaderChunks.bone + vertexMain;
            }

            glVertexShader = vertexHeader + main + vertexMain;
            glFragmentShader = fragmentHeader + main + fragmentMain;

            webglProgram = createProgram(gl, glVertexShader, glFragmentShader);
            program = {
                program: webglProgram,
                uniforms: {},
                attributes: {},
                customUniforms: [],
                customAttributes: [],
                parameters: parameters
            }

            getUniformsAttributes(vertexShader, fragmentShader, program.customAttributes, program.customUniforms);
            parseUniformsAttributes(gl, webglProgram, glVertexShader, glFragmentShader, program.attributes, program.uniforms);

            programs.push({
                used: 1,
                code: code,
                program: program
            });

            return program;
        };


        Renderer.prototype._bindMesh = function(mesh, material) {
            if (this._lastBuffer === mesh._webgl) return;
            var gl = this.context,
                webgl = mesh._webgl,
                ARRAY_BUFFER = gl.ARRAY_BUFFER,
                FLOAT = gl.FLOAT,
                attributes = material._webgl.attributes;

            if (webgl.vertexBuffer && attributes.position > -1) {
                gl.bindBuffer(ARRAY_BUFFER, webgl.vertexBuffer);
                gl.enableVertexAttribArray(attributes.position);
                gl.vertexAttribPointer(attributes.position, 3, FLOAT, false, 0, 0);
            }
            if (webgl.normalBuffer && attributes.normal > -1) {
                gl.bindBuffer(ARRAY_BUFFER, webgl.normalBuffer);
                gl.enableVertexAttribArray(attributes.normal);
                gl.vertexAttribPointer(attributes.normal, 3, FLOAT, false, 0, 0);
            }
            if (webgl.tangentBuffer && attributes.tangent > -1) {
                gl.bindBuffer(ARRAY_BUFFER, webgl.tangentBuffer);
                gl.enableVertexAttribArray(attributes.tangent);
                gl.vertexAttribPointer(attributes.tangent, 4, FLOAT, false, 0, 0);
            }
            if (webgl.colorBuffer && attributes.color > -1) {
                gl.bindBuffer(ARRAY_BUFFER, webgl.colorBuffer);
                gl.enableVertexAttribArray(attributes.color);
                gl.vertexAttribPointer(attributes.color, 3, FLOAT, false, 0, 0);
            }
            if (webgl.uvBuffer && attributes.uv > -1) {
                gl.bindBuffer(ARRAY_BUFFER, webgl.uvBuffer);
                gl.enableVertexAttribArray(attributes.uv);
                gl.vertexAttribPointer(attributes.uv, 2, FLOAT, false, 0, 0);
            }
            if (webgl.boneIndexBuffer && attributes.boneIndex > -1) {
                gl.bindBuffer(ARRAY_BUFFER, webgl.boneIndexBuffer);
                gl.enableVertexAttribArray(attributes.boneIndex);
                gl.vertexAttribPointer(attributes.boneIndex, 1, FLOAT, false, 0, 0);
            }
            if (webgl.boneWeightBuffer && attributes.boneWeight > -1) {
                gl.bindBuffer(ARRAY_BUFFER, webgl.boneWeightBuffer);
                gl.enableVertexAttribArray(attributes.boneWeight);
                gl.vertexAttribPointer(attributes.boneWeight, 3, FLOAT, false, 0, 0);
            }

            if (material.wireframe) {
                if (webgl.lineBuffer) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webgl.lineBuffer);
            } else {
                if (webgl.indexBuffer) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webgl.indexBuffer);
            }

            this._lastBuffer = mesh._webgl;
        };


        var MAT4 = new Mat4,
            VEC3 = new Vec3,
            VEC3_2 = new Vec3,
            COLOR = new Color,
            MAT3_TYPE = "mat3",
            MAT4_TYPE = "mat4";
        Renderer.prototype._bindMaterial = function(material, transform, camera, lights, ambient) {
            var gl = this.context,
                uniformsState = this._uniformsState,
                program = material._webgl,
                webglProgram = material._webgl.program,
                parameters = program.parameters,
                uniforms = program.uniforms,
                state, i, length;

            if (this._lastProgram !== webglProgram) {
                gl.useProgram(webglProgram);
                this._lastProgram = webglProgram;
            }

            if (uniforms.modelMatrix) this.setUniformMatrix4fv(uniforms.modelMatrix.location, transform.matrixWorld, "matrixWorld");
            if (uniforms.modelViewMatrix) this.setUniformMatrix4fv(uniforms.modelViewMatrix.location, transform.modelView, "modelView");
            if (uniforms.projectionMatrix) this.setUniformMatrix4fv(uniforms.projectionMatrix.location, camera.projection, "projectionMatrix");
            if (uniforms.viewMatrix) this.setUniformMatrix4fv(uniforms.viewMatrix.location, camera.view, "viewMatrix");
            if (uniforms.normalMatrix) this.setUniformMatrix3fv(uniforms.normalMatrix.location, transform.normalMatrix, "normalMatrix");
            if (uniforms.cameraPosition) this.setUniform3f(uniforms.cameraPosition.location, VEC3.positionFromMat4(camera.transform.matrixWorld), "cameraPosition");
            if (uniforms.ambient) this.setUniform3f(uniforms.ambient.location, ambient, "ambient");

            if (parameters.useLights && (length = lights.length)) {
                var maxPointLights = parameters.maxPointLights,
                    maxDirectionalLights = parameters.maxDirectionalLights,
                    maxSpotLights = parameters.maxSpotLights,
                    maxHemiLights = parameters.maxHemiLights,

                    pointLights = 0,
                    pointLightColor = uniforms.pointLightColor ? uniforms.pointLightColor.location : undefined,
                    pointLightPosition = uniforms.pointLightPosition ? uniforms.pointLightPosition.location : undefined,
                    pointLightDistance = uniforms.pointLightDistance ? uniforms.pointLightDistance.location : undefined,

                    directionalLights = 0,
                    directionalLightColor = uniforms.directionalLightColor ? uniforms.directionalLightColor.location : undefined,
                    directionalLightDirection = uniforms.directionalLightDirection ? uniforms.directionalLightDirection.location : undefined,

                    spotLights = 0,
                    spotLightColor = uniforms.spotLightColor ? uniforms.spotLightColor.location : undefined,
                    spotLightPosition = uniforms.spotLightPosition ? uniforms.spotLightPosition.location : undefined,
                    spotLightDirection = uniforms.spotLightDirection ? uniforms.spotLightDirection.location : undefined,
                    spotLightDistance = uniforms.spotLightDistance ? uniforms.spotLightDistance.location : undefined,
                    spotLightAngleCos = uniforms.spotLightAngleCos ? uniforms.spotLightAngleCos.location : undefined,
                    spotLightExponent = uniforms.spotLightExponent ? uniforms.spotLightExponent.location : undefined,

                    hemiLights = 0,
                    hemiLightColor = uniforms.hemiLightColor ? uniforms.hemiLightColor.location : undefined,
                    hemiLightDirection = uniforms.hemiLightDirection ? uniforms.hemiLightDirection.location : undefined,

                    light, type;

                for (i = 0; i < length; i++) {
                    light = lights[i];
                    if (!light.visible) continue;

                    type = light.type;
                    COLOR.copy(light.color).smul(light.energy);

                    if (pointLightColor.length && type === LightType.Point) {
                        if (pointLights >= maxPointLights) continue;

                        VEC3.positionFromMat4(light.transform.matrixWorld);

                        this.setUniform3f(pointLightColor[pointLights], COLOR, "pointLightColor", true, pointLights);
                        this.setUniform3f(pointLightPosition[pointLights], VEC3, "pointLightPosition", true, pointLights);
                        this.setUniform1f(pointLightDistance[pointLights], light.distance, "pointLightDistance", true, pointLights);
                        pointLights++;
                    } else if (directionalLightColor.length && type === LightType.Directional) {
                        if (directionalLights >= maxDirectionalLights) continue;

                        VEC3.positionFromMat4(light.transform.matrixWorld).sub(light.target).normalize();
                        if (VEC3.lengthSq() === 0) continue;

                        this.setUniform3f(directionalLightColor[directionalLights], COLOR, "directionalLightColor", true, directionalLights);
                        this.setUniform3f(directionalLightDirection[directionalLights], VEC3, "directionalLightDirection", true, directionalLights);
                        directionalLights++;

                    } else if (spotLightColor.length && type === LightType.Spot) {
                        if (spotLights >= maxSpotLights) continue;

                        VEC3.positionFromMat4(light.transform.matrixWorld);
                        if (VEC3.lengthSq() === 0) continue;

                        VEC3_2.copy(VEC3).sub(light.target).normalize();
                        if (VEC3_2.lengthSq() === 0) continue;

                        this.setUniform3f(spotLightColor[spotLights], COLOR, "spotLightColor", true, spotLights);
                        this.setUniform3f(spotLightPosition[spotLights], VEC3, "spotLightPosition", true, spotLights);
                        this.setUniform3f(spotLightDirection[spotLights], VEC3_2, "spotLightDirection", true, spotLights);
                        this.setUniform1f(spotLightDistance[spotLights], light.distance, "spotLightDistance", true, spotLights);
                        this.setUniform1f(spotLightAngleCos[spotLights], light._angleCos, "spotLightAngleCos", true, spotLights);
                        this.setUniform1f(spotLightExponent[spotLights], light.exponent, "spotLightExponent", true, spotLights);
                        spotLights++;

                    } else if (hemiLightColor.length && type === LightType.Hemi) {
                        if (hemiLights >= maxHemiLights) continue;

                        VEC3.positionFromMat4(light.transform.matrixWorld).sub(light.target).normalize();
                        if (VEC3.lengthSq() === 0) continue;

                        this.setUniform3f(hemiLightColor[hemiLights], COLOR, "hemiLightColor", true, hemiLights);
                        this.setUniform3f(hemiLightDirection[hemiLights], VEC3, "hemiLightDirection", true, hemiLights);
                        hemiLights++;
                    }
                }
            }

            this._bindCustomUniforms(program.customUniforms, uniforms, material.name, material.uniforms);
            this._textureIndex = 0;
        };


        Renderer.prototype._bindCustomUniforms = function(customUniforms, uniforms, materialName, materialUniforms) {
            var gl = this.context,
                uniformsState = this._uniformsState,
                i = customUniforms.length,
                state, customUniform, uniformValue, location, name, type, value;

            while (i--) {
                customUniform = customUniforms[i];
                name = customUniform.name;

                uniformValue = uniforms[name];
                value = materialUniforms[name];

                if (!uniformValue) continue;
                if (!value) throw "WebGLRenderer bindShader: material " + materialName + " was not given a uniform named " + name;

                if (uniformValue.isArray) {
                    location = uniformValue.location;
                    type = uniformValue.type;

                    for (i = location.length; i--;) this.setUniform(location[i], value[i], name, type, true, i);
                } else {
                    this.setUniform(uniformValue.location, value, name, uniformValue.type);
                }
            }
        }


        Renderer.prototype.preRender = function(gui, scene, camera) {
            if (!this._context) return;
            var gl = this.context,
                clearColor = this._clearColor,
                background = camera.background;

            if (clearColor.r !== background.r || clearColor.g !== background.g || clearColor.b !== background.b) {
                clearColor.copy(background);
                gl.clearColor(background.r, background.g, background.b, 1);
                if (!this.autoClear) this.clearCanvas(this.autoClearColor, this.autoClearDepth, this.autoClearStencil);
            }
            if (this._lastCamera !== camera) {
                var self = this,
                    canvas = this.canvas,
                    w = canvas.pixelWidth,
                    h = canvas.pixelHeight;

                camera.set(w, h);
                this.setViewport(0, 0, w, h);

                if (this._lastResizeFn) canvas.off("resize", this._lastResizeFn);

                this._lastResizeFn = function() {
                    var w = this.pixelWidth,
                        h = this.pixelHeight;

                    camera.set(w, h);
                    self.setViewport(0, 0, w, h);
                };

                canvas.on("resize", this._lastResizeFn);
                this._lastCamera = camera;
            }
            if (scene && this._lastScene !== scene) {

                this._lastScene = scene;
            }

            if (this.autoClear) this.clearCanvas(this.autoClearColor, this.autoClearDepth, this.autoClearStencil);
        };


        Renderer.prototype.renderGUI = function(gui, camera) {
            if (!this._context) return;
            var gl = this.context,
                components = gui.components,
                transform,
                i;

        };


        /**
         * @method render
         * @memberof Renderer
         * @brief renderers scene from camera's perspective
         * @param Scene scene
         * @param Camera camera
         */
        Renderer.prototype.render = function(scene, camera) {
            if (!this._context) return;
            var gl = this.context,
                lineWidth = this._lastLineWidth,
                blending = this._lastBlending,
                cullFace = this._lastCullFace,

                components = scene.components,
                ambient = scene.world.ambient,
                lights = components.Light || EMPTY_ARRAY,
                meshFilters = components.MeshFilter || EMPTY_ARRAY,
                meshFilter, transform,
                i;

            for (i = meshFilters.length; i--;) {
                meshFilter = meshFilters[i];
                transform = meshFilter.transform;

                if (!transform) continue;

                transform.updateMatrices(camera.view);
                this.renderMeshFilter(camera, lights, ambient, transform, meshFilter);
            }

            this.setCullFace(cullFace);
            this.setBlending(blending);
            this.setLineWidth(lineWidth);
        };


        Renderer.prototype.renderMeshFilter = function(camera, lights, ambient, transform, meshFilter) {
            var gl = this.context,

                mesh = meshFilter.mesh,
                material = meshFilter.material,
                side = material.side,

                buffers = this._initMeshBuffers(mesh),
                program = this._initMaterial(material, mesh, lights);

            this._bindMaterial(material, transform, camera, lights, ambient);
            this._bindMesh(mesh, material);

            this.setBlending(material.blending);

            if (side === Side.Front) {
                this.setCullFace(CullFace.Back);
            } else if (side === Side.Back) {
                this.setCullFace(CullFace.Front);
            } else if (side === Side.Both) {
                this.setCullFace();
            }

            if (material.wireframe) {
                this.setLineWidth(material.wireframeLineWidth);
                gl.drawElements(gl.LINES, buffers.lineCount, gl.UNSIGNED_SHORT, 0);
            } else {
                gl.drawElements(gl.TRIANGLES, buffers.indexCount, gl.UNSIGNED_SHORT, 0);
            }
        };


        function handleWebGLContextLost(e) {
            e.preventDefault();
            Log.warn("Renderer: webgl context was lost");

            this._context = false;
            this.emit("webglcontextlost", e);
        }


        function handleWebGLContextRestored(e) {
            Log.log("Renderer: webgl context was restored");

            this.initGL();
            this.setDefaultGLState();

            this._context = true;
            this.emit("webglcontextrestored", e);
        }


        function getGPUInfo(gl, extensions) {
            var gpu = {},

                VERTEX_SHADER = gl.VERTEX_SHADER,
                FRAGMENT_SHADER = gl.FRAGMENT_SHADER,
                HIGH_FLOAT = gl.HIGH_FLOAT,
                MEDIUM_FLOAT = gl.MEDIUM_FLOAT,

                textureFilterAnisotropic = extensions.textureFilterAnisotropic,

                vsHighpFloat = gl.getShaderPrecisionFormat(VERTEX_SHADER, HIGH_FLOAT),
                vsMediumpFloat = gl.getShaderPrecisionFormat(VERTEX_SHADER, MEDIUM_FLOAT),

                fsHighpFloat = gl.getShaderPrecisionFormat(FRAGMENT_SHADER, HIGH_FLOAT),
                fsMediumpFloat = gl.getShaderPrecisionFormat(FRAGMENT_SHADER, MEDIUM_FLOAT),

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
            gpu.maxAnisotropy = textureFilterAnisotropic ? gl.getParameter(textureFilterAnisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1;
            gpu.maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
            gpu.maxVertexTextures = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
            gpu.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            gpu.maxCubeTextureSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
            gpu.maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);

            gpu.maxUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) * 4;
            gpu.maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);

            return gpu;
        }


        function getExtensions(gl) {
            var extensions = {};

            extensions.textureFilterAnisotropic = getExtension(gl, "EXT_texture_filter_anisotropic");

            extensions.compressedTextureS3TC = getExtension(gl, "WEBGL_compressed_texture_s3tc");
            extensions.compressedTextureS3TCFormats = extensions.compressedTextureS3TC ? gl.getParameter(gl.COMPRESSED_TEXTURE_FORMATS) : null;

            extensions.standardDerivatives = getExtension(gl, "OES_standard_derivatives");

            extensions.textureFloat = getExtension(gl, "OES_texture_float");
            extensions.textureFloatLinear = getExtension(gl, "OES_texture_float_linear");

            return extensions;
        }


        var getExtension_prefixes = ["WEBKIT", "MOZ", "O", "MS", "webkit", "moz", "o", "ms"],
            getExtension_length = getExtension_prefixes.length;

        function getExtension(gl, name) {
            var extension = gl.getExtension(name);

            if (extension == undefined) {
                var i = getExtension_length;

                while (i--) {
                    if ((extension = gl.getExtension(getExtension_prefixes[i] + "_" + name))) return extension;
                }
            }

            return extension;
        }


        function getSupports(gl, gpu, extensions) {
            var supports = {};

            supports.vertexTextures = gpu.maxVertexTextures > 0;
            supports.boneTextures = supports.vertexTextures && !! extensions.textureFloat;

            supports.textureFilterAnisotropic = !! extensions.textureFilterAnisotropic;
            supports.compressedTextureS3TC = !! extensions.compressedTextureS3TC;
            supports.standardDerivatives = !! extensions.standardDerivatives;
            supports.textureFloat = !! extensions.textureFloat;
            supports.textureFloatLinear = !! extensions.textureFloatLinear;

            return supports;
        }


        return Renderer;
    }
);
