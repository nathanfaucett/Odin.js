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

            max = Math.max,
            floor = Math.floor,
            clamp = Mathf.clamp,
            isPowerOfTwo = Mathf.isPowerOfTwo;


        function Renderer(opts) {
            opts || (opts = {});

            EventEmitter.call(this);

            var _this = this,
                _gl,
                _gpu,
                _extensions,
                _supports,
                _canvas,
                _element,
                _context = false,
                _programs = [];


            this.attributes = merge(opts.attributes || {}, {
                alpha: true,
                antialias: true,
                depth: true,
                premulipliedAlpha: true,
                preserveDrawingBuffer: false,
                stencil: true
            });

            this.autoClear = opts.autoClear != undefined ? opts.autoClear : true;
            this.autoClearColor = opts.autoClearColor != undefined ? opts.autoClearColor : true;
            this.autoClearDepth = opts.autoClearDepth != undefined ? opts.autoClearDepth : true;
            this.autoClearStencil = opts.autoClearStencil != undefined ? opts.autoClearStencil : true;


            this.init = function(canvas) {
                if (_canvas) this.clear();

                _canvas = canvas;
                _element = canvas.element;

                initGL();
                _context = true;
                setDefaultGLState();

                addEvent(_element, "webglcontextlost", handleWebGLContextLost, this);
                addEvent(_element, "webglcontextrestored", handleWebGLContextRestored, this);

                if (_gl.getShaderPrecisionFormat === undefined) {
                    _gl.getShaderPrecisionFormat = function() {
                        return {
                            rangeMin: 1,
                            rangeMax: 1,
                            precision: 1
                        };
                    }
                }

                return this;
            };


            this.clear = function() {
                if (!_canvas) return this;

                removeEvent(element, "webglcontextlost", handleWebGLContextLost, this);
                removeEvent(element, "webglcontextrestored", handleWebGLContextRestored, this);

                _canvas = undefined;
                _element = undefined;
                _context = false;
                _programs.length = 0;

                _extensions = undefined;
                _gpu = undefined;
                _supports = undefined;

                return this;
            };


            this.getGPU = function() {

                return _gpu;
            };


            this.getExtensions = function() {

                return _extensions;
            };


            this.getSupports = function() {

                return _supports;
            };


            var _viewportX = 0,
                _viewportY = 0,
                _viewportWidth = 1,
                _viewportHeight = 1;

            function setViewport(x, y, width, height) {
                x || (x = 0);
                y || (y = 0);
                width || (width = _canvas.pixelWidth);
                height || (height = _canvas.pixelHeight);

                if (_viewportX !== x || _viewportY !== y || _viewportWidth !== width || _viewportHeight !== height) {
                    _viewportX = x;
                    _viewportY = y;
                    _viewportWidth = width;
                    _viewportHeight = height;

                    _gl.viewport(x, y, width, height);
                }
            }
            this.setViewport = setViewport;


            var _lastDepthTest = -1;

            function setDepthTest(depthTest) {

                if (_lastDepthTest !== depthTest) {

                    if (depthTest) {
                        _gl.enable(_gl.DEPTH_TEST);
                    } else {
                        _gl.disable(_gl.DEPTH_TEST);
                    }

                    _lastDepthTest = depthTest;
                }
            }
            this.setDepthTest = setDepthTest;


            var _lastDepthWrite = -1;

            function setDepthWrite(depthWrite) {

                if (_lastDepthWrite !== depthWrite) {

                    _gl.depthMask(depthWrite);
                    _lastDepthWrite = depthWrite;
                }
            }
            this.setDepthWrite = setDepthWrite;


            var _lastLineWidth = 1;

            function setLineWidth(width) {

                if (_lastLineWidth !== width) {

                    _gl.lineWidth(width);
                    _lastLineWidth = width;
                }
            }
            this.setLineWidth = setLineWidth;


            var _lastCullFace = -1,
                _cullFaceDisabled = true;

            function setCullFace(cullFace) {

                if (_lastCullFace !== cullFace) {
                    if (!_lastCullFace || _lastCullFace === CullFace.None) _cullFaceDisabled = true;

                    if (cullFace === CullFace.Front) {
                        if (_cullFaceDisabled) _gl.enable(_gl.CULL_FACE);
                        _gl.cullFace(_gl.FRONT);
                    } else if (cullFace === CullFace.Back) {
                        if (_cullFaceDisabled) _gl.enable(_gl.CULL_FACE);
                        _gl.cullFace(_gl.BACK);
                    } else if (cullFace === CullFace.FrontBack) {
                        if (_cullFaceDisabled) _gl.enable(_gl.CULL_FACE);
                        _gl.cullFace(_gl.FRONT_AND_BACK);
                    } else {
                        _gl.disable(_gl.CULL_FACE);
                        _lastCullFace = CullFace.None;
                        return;
                    }

                    _lastCullFace = cullFace;
                }
            }
            this.setCullFace = setCullFace;


            var _lastBlending = -1;

            function setBlending(blending) {

                if (blending !== _lastBlending) {

                    if (blending === Blending.None) {
                        _gl.disable(_gl.BLEND);
                    } else if (blending === Blending.Additive) {
                        _gl.enable(_gl.BLEND);
                        _gl.blendEquation(_gl.FUNC_ADD);
                        _gl.blendFunc(_gl.SRC_ALPHA, _gl.ONE);
                    } else if (blending === Blending.Subtractive) {
                        _gl.enable(_gl.BLEND);
                        _gl.blendEquation(_gl.FUNC_ADD);
                        _gl.blendFunc(_gl.ZERO, _gl.ONE_MINUS_SRC_COLOR);
                    } else if (blending === Blending.Muliply) {
                        _gl.enable(_gl.BLEND);
                        _gl.blendEquation(_gl.FUNC_ADD);
                        _gl.blendFunc(_gl.ZERO, _gl.SRC_COLOR);
                    } else if (blending === Blending.Default) {
                        _gl.enable(_gl.BLEND);
                        _gl.blendEquationSeparate(_gl.FUNC_ADD, _gl.FUNC_ADD);
                        _gl.blendFuncSeparate(_gl.SRC_ALPHA, _gl.ONE_MINUS_SRC_ALPHA, _gl.ONE, _gl.ONE_MINUS_SRC_ALPHA);
                        _lastBlending = Blending.Default;
                        return;
                    }

                    _lastBlending = blending;
                }
            }
            this.setBlending = setBlending;


            function setScissor(x, y, width, height) {

                _gl.scissor(x, y, width, height);
            };
            this.setScissor = setScissor;


            var _clearColor = new Color,
                _clearAlpha = 1;

            function setClearColor(color, alpha) {
                alpha || (alpha = 1);

                if (!_clearColor.equals(color) || alpha !== _clearAlpha) {

                    _clearColor.copy(color);
                    _clearAlpha = alpha;

                    this.context.clearColor(_clearColor.r, _clearColor.g, _clearColor.b, _clearAlpha);
                }
            }
            this.setClearColor = setClearColor;


            function clearCanvas(color, depth, stencil) {
                var bits = 0;

                if (color === undefined || color) bits |= _gl.COLOR_BUFFER_BIT;
                if (depth === undefined || depth) bits |= _gl.DEPTH_BUFFER_BIT;
                if (stencil === undefined || stencil) bits |= _gl.STENCIL_BUFFER_BIT;

                _gl.clear(bits);
            }
            this.clearCanvas = clearCanvas;


            function clearColor() {

                _gl.clear(_gl.COLOR_BUFFER_BIT);
            }
            this.clearColor = clearColor;


            function clearDepth() {

                _gl.clear(_gl.DEPTH_BUFFER_BIT);
            }
            this.clearDepth = clearDepth;


            function clearStencil() {

                _gl.clear(_gl.STENCIL_BUFFER_BIT);
            }
            this.clearStencil = clearStencil;


            var _lastUniforms = {};

            function setUniform(location, value, key, type, isArray, index) {
                var lastUniforms = _lastUniforms,
                    state;

                if (isArray) {
                    lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                    key = index;
                }
                state = lastUniforms[key];

                if (type === "int") {
                    if (state !== value) {
                        _gl.uniform1i(location, value);
                        lastUniforms[key] = value;
                    }
                } else if (type === "float") {
                    if (state !== value) {
                        _gl.uniform1f(location, value);
                        lastUniforms[key] = value;
                    }
                } else if (type === "vec2") {
                    if (!state || (state.x !== value.x || state.y !== value.y)) {
                        _gl.uniform2f(location, value.x, value.y);
                        state || (lastUniforms[key] = state = value.clone());
                        state.x = value.x;
                        state.y = value.y;
                    }
                } else if (type === "vec3") {
                    if (!state || (state.x !== value.x || state.y !== value.y || state.z !== value.z)) {
                        _gl.uniform3f(location, value.x, value.y, value.z);
                        state || (lastUniforms[key] = state = value.clone());
                        state.x = value.x;
                        state.y = value.y;
                        state.z = value.z;
                    }
                } else if (type === "vec4") {
                    if (!state || (state.x !== value.x || state.y !== value.y || state.z !== value.z || state.w !== value.w)) {
                        _gl.uniform3f(location, value.x, value.y, value.z, value.w);
                        state || (lastUniforms[key] = state = value.clone());
                        state.x = value.x;
                        state.y = value.y;
                        state.z = value.z;
                        state.w = value.w;
                    }
                } else if (type === "mat2") {
                    if (!state || !state.equals(value)) {
                        _gl.uniformMatrix2fv(location, false, value.elements);
                        (state || (lastUniforms[key] = state = value.clone())).copy(value);
                    }
                } else if (type === "mat3") {
                    if (!state || !state.equals(value)) {
                        _gl.uniformMatrix3fv(location, false, value.elements);
                        (state || (lastUniforms[key] = state = value.clone())).copy(value);
                    }
                } else if (type === "mat4") {
                    if (!state || !state.equals(value)) {
                        _gl.uniformMatrix4fv(location, false, value.elements);
                        (state || (lastUniforms[key] = state = value.clone())).copy(value);
                    }
                } else if (type === "sampler2D") {
                    setTexture(location, value, key);
                } else if (type === "samplerCube") {
                    setTextureCube(location, value, key);
                }
            }


            function setUniform1i(location, value, key, isArray, index) {
                var lastUniforms = _lastUniforms,
                    state;

                if (isArray) {
                    lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                    key = index;
                }
                state = lastUniforms[key];

                if (state !== value) {
                    _gl.uniform1i(location, value);
                    lastUniforms[key] = value;
                }
            }


            function setUniform1f(location, value, key, isArray, index) {
                var lastUniforms = _lastUniforms,
                    state;

                if (isArray) {
                    lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                    key = index;
                }
                state = lastUniforms[key];

                if (state !== value) {
                    _gl.uniform1f(location, value);
                    lastUniforms[key] = value;
                }
            }


            function setUniform2f(location, value, key, isArray, index) {
                var lastUniforms = _lastUniforms,
                    state;

                if (isArray) {
                    lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                    key = index;
                }
                state = lastUniforms[key];

                if (!state || (state.x !== value.x || state.y !== value.y)) {
                    _gl.uniform2f(location, value.x, value.y);
                    state || (lastUniforms[key] = state = value.clone());
                    state.x = value.x;
                    state.y = value.y;
                }
            }


            function setUniform3f(location, value, key, isArray, index) {
                var lastUniforms = _lastUniforms,
                    state;

                if (isArray) {
                    lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                    key = index;
                }
                state = lastUniforms[key];

                if (!state || (state.x !== value.x || state.y !== value.y || state.z !== value.z)) {
                    _gl.uniform3f(location, value.x, value.y, value.z);
                    state || (lastUniforms[key] = state = value.clone());
                    state.x = value.x;
                    state.y = value.y;
                    state.z = value.z;
                }
            }


            function setUniform4f(location, value, key, isArray, index) {
                var lastUniforms = _lastUniforms,
                    state;

                if (isArray) {
                    lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                    key = index;
                }
                state = lastUniforms[key];

                if (!state || (state.x !== value.x || state.y !== value.y || state.z !== value.z || state.w !== value.w)) {
                    _gl.uniform4f(location, value.x, value.y, value.z, value.w);
                    state || (lastUniforms[key] = state = value.clone());
                    state.x = value.x;
                    state.y = value.y;
                    state.z = value.z;
                    state.w = value.w;
                }
            }


            function setUniformMatrix2fv(location, value, key, isArray, index) {
                var lastUniforms = _lastUniforms,
                    state;

                if (isArray) {
                    lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                    key = index;
                }
                state = lastUniforms[key];

                if (!state || !state.equals(value)) {
                    _gl.uniformMatrix2fv(location, false, value.elements);
                    (state || (lastUniforms[key] = state = value.clone())).copy(value);
                }
            }


            function setUniformMatrix3fv(location, value, key, isArray, index) {
                var lastUniforms = _lastUniforms,
                    state;

                if (isArray) {
                    lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                    key = index;
                }
                state = lastUniforms[key];

                if (!state || !state.equals(value)) {
                    _gl.uniformMatrix3fv(location, false, value.elements);
                    (state || (lastUniforms[key] = state = value.clone())).copy(value);
                }
            }


            function setUniformMatrix4fv(location, value, key, isArray, index) {
                var lastUniforms = _lastUniforms,
                    state;

                if (isArray) {
                    lastUniforms = lastUniforms[key] || (lastUniforms[key] = []);
                    key = index;
                }
                state = lastUniforms[key];

                if (!state || !state.equals(value)) {
                    _gl.uniformMatrix4fv(location, false, value.elements);
                    (state || (lastUniforms[key] = state = value.clone())).copy(value);
                }
            }


            var _textureIndex = 0;

            function setTexture(location, texture, key) {
                if (!texture || !texture.raw) return;
                var index, glTexture;

                if (!texture.needsUpdate && (glTexture = texture._webgl)) {
                    index = _textureIndex++;

                    _gl.activeTexture(_gl.TEXTURE0 + index);
                    _gl.bindTexture(_gl.TEXTURE_2D, glTexture);
					setUniform1i(location, index, key);

                    return;
                }

                glTexture = texture._webgl || (texture._webgl = _gl.createTexture());
                index = _textureIndex++;

                var raw = texture.raw,
                    maxAnisotropy = _gpu.maxAnisotropy,
                    maxTextureSize = _gpu.maxTextureSize,
                    TFA = _extensions.EXT_texture_filter_anisotropic,

                    isPOT = isPowerOfTwo(raw.width) && isPowerOfTwo(raw.height),
                    anisotropy = clamp(texture.anisotropy || 1, 1, maxAnisotropy),

                    TEXTURE_2D = _gl.TEXTURE_2D,
                    filter = texture.filter,
                    format = texture.format,
                    wrap = texture.wrap,
                    WRAP, MAG_FILTER, MIN_FILTER, FORMAT;

                if (filter === FilterMode.None) {
                    MAG_FILTER = _gl.NEAREST;
                    if (isPOT) {
                        MIN_FILTER = _gl.LINEAR_MIPMAP_NEAREST;
                    } else {
                        MIN_FILTER = _gl.NEAREST;
                    }
                } else { //FilterMode.Linear
                    MAG_FILTER = _gl.LINEAR;
                    if (isPOT) {
                        MIN_FILTER = _gl.LINEAR_MIPMAP_LINEAR;
                    } else {
                        MIN_FILTER = _gl.LINEAR;
                    }
                }

                if (format === TextureFormat.RGB) {
                    FORMAT = _gl.RGB;
                } else if (format === TextureFormat.RGBA) {
                    FORMAT = _gl.RGBA;
                } else if (format === TextureFormat.LuminanceAlpha) {
                    FORMAT = _gl.LUMINANCE_ALPHA;
                } else if (format === TextureFormat.Luminance) {
                    FORMAT = _gl.LUMINANCE;
                } else if (format === TextureFormat.Alpha) {
                    FORMAT = _gl.ALPHA;
                }

                if (wrap === TextureWrap.Clamp) {
                    WRAP = _gl.CLAMP_TO_EDGE;
                } else if (wrap === TextureWrap.MirrorRepeat) {
                    WRAP = isPOT ? _gl.MIRRORED_REPEAT : _gl.CLAMP_TO_EDGE;
                } else { //TextureWrap.Repeat
                    WRAP = isPOT ? _gl.REPEAT : _gl.CLAMP_TO_EDGE;
                }

                _gl.activeTexture(_gl.TEXTURE0 + index);
                _gl.bindTexture(TEXTURE_2D, glTexture);
                _gl.uniform1i(location, index);

                _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, texture.flipY ? 1 : 0);
                _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.premultiplyAlpha ? 1 : 0);

                _gl.texImage2D(TEXTURE_2D, 0, FORMAT, FORMAT, _gl.UNSIGNED_BYTE, clampToMaxSize(raw, maxTextureSize));

                _gl.texParameteri(TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, MAG_FILTER);
                _gl.texParameteri(TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, MIN_FILTER);

                _gl.texParameteri(TEXTURE_2D, _gl.TEXTURE_WRAP_S, WRAP);
                _gl.texParameteri(TEXTURE_2D, _gl.TEXTURE_WRAP_T, WRAP);

                if (TFA) _gl.texParameterf(TEXTURE_2D, TFA.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);
                if (isPOT) _gl.generateMipmap(TEXTURE_2D);

                texture.needsUpdate = false;
            }


            function setTextureCube(location, cubeTexture, key) {
                if (!cubeTexture || !cubeTexture.raw) return;
                var glTexture = cubeTexture._webgl,
                    index;

                if (!cubeTexture.needsUpdate && glTexture) {
                    index = _textureIndex++;

                    _gl.activeTexture(_gl.TEXTURE0 + index);
                    _gl.bindTexture(_gl.TEXTURE_CUBE_MAP, glTexture);
					setUniform1i(location, index, key);

                    return;
                }
				
                glTexture = cubeTexture._webgl || (cubeTexture._webgl = _gl.createTexture());
                index = _textureIndex++;

                var raw = cubeTexture.raw,
                    maxAnisotropy = _gpu.maxAnisotropy,
                    maxCubeTextureSize = _gpu.maxCubeTextureSize,
                    TFA = _gpu.EXT_texture_filter_anisotropic,

                    first = raw[0],
                    isPOT = isPowerOfTwo(first.width) && isPowerOfTwo(first.height),
                    anisotropy = clamp(cubeTexture.anisotropy || 1, 1, maxAnisotropy),

                    TEXTURE_CUBE_MAP = _gl.TEXTURE_CUBE_MAP,
                    TEXTURE_CUBE_MAP_POSITIVE_X = _gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                    UNSIGNED_BYTE = _gl.UNSIGNED_BYTE,

                    filter = cubeTexture.filter,
                    format = cubeTexture.format,
                    wrap = cubeTexture.wrap,
                    WRAP, MAG_FILTER, MIN_FILTER, FORMAT,
                    current, i;

                if (filter === FilterMode.None) {
                    MAG_FILTER = _gl.NEAREST;
                    if (isPOT) {
                        MIN_FILTER = _gl.LINEAR_MIPMAP_NEAREST;
                    } else {
                        MIN_FILTER = _gl.NEAREST;
                    }
                } else { //FilterMode.Linear
                    MAG_FILTER = _gl.LINEAR;
                    if (isPOT) {
                        MIN_FILTER = _gl.LINEAR_MIPMAP_LINEAR;
                    } else {
                        MIN_FILTER = _gl.LINEAR;
                    }
                }

                if (format === TextureFormat.RGB) {
                    FORMAT = _gl.RGB;
                } else if (format === TextureFormat.RGBA) {
                    FORMAT = _gl.RGBA;
                } else if (format === TextureFormat.LuminanceAlpha) {
                    FORMAT = _gl.LUMINANCE_ALPHA;
                } else if (format === TextureFormat.Luminance) {
                    FORMAT = _gl.LUMINANCE;
                } else if (format === TextureFormat.Alpha) {
                    FORMAT = _gl.ALPHA;
                }

                if (wrap === TextureWrap.Clamp) {
                    WRAP = _gl.CLAMP_TO_EDGE;
                } else { //TextureWrap.Repeat
                    WRAP = isPOT ? _gl.REPEAT : _gl.CLAMP_TO_EDGE;
                }

                _gl.activeTexture(_gl.TEXTURE0 + index);
                _gl.bindTexture(TEXTURE_CUBE_MAP, glTexture);
                _gl.uniform1i(location, index);

                _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, cubeTexture.flipY ? 1 : 0);
                _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, cubeTexture.premultiplyAlpha ? 1 : 0);

                _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[0], maxCubeTextureSize));
                _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[1], maxCubeTextureSize));
                _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[2], maxCubeTextureSize));
                _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[3], maxCubeTextureSize));
                _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[4], maxCubeTextureSize));
                _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[5], maxCubeTextureSize));

                _gl.texParameteri(TEXTURE_CUBE_MAP, _gl.TEXTURE_MAG_FILTER, MAG_FILTER);
                _gl.texParameteri(TEXTURE_CUBE_MAP, _gl.TEXTURE_MIN_FILTER, MIN_FILTER);

                _gl.texParameteri(TEXTURE_CUBE_MAP, _gl.TEXTURE_WRAP_S, WRAP);
                _gl.texParameteri(TEXTURE_CUBE_MAP, _gl.TEXTURE_WRAP_T, WRAP);

                if (TFA) _gl.texParameterf(TEXTURE_CUBE_MAP, TFA.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);
                if (isPOT) _gl.generateMipmap(TEXTURE_CUBE_MAP);

                cubeTexture.needsUpdate = false;
            }


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

                Log.once("Renderer clampToMaxSize: image height larger than machines max cube texture size (max = " + maxSize + ")");

                return canvas;
            }


            function initMeshBuffers(mesh) {
                if (!mesh.dynamic && mesh._webgl.inittedBuffers) return mesh._webgl;
                var webgl = mesh._webgl,
                    DRAW = mesh.dynamic ? _gl.DYNAMIC_DRAW : _gl.STATIC_DRAW,
                    ARRAY_BUFFER = _gl.ARRAY_BUFFER,
                    ELEMENT_ARRAY_BUFFER = _gl.ELEMENT_ARRAY_BUFFER,
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

                    webgl.vertexBuffer = webgl.vertexBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ARRAY_BUFFER, webgl.vertexBuffer);
                    _gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

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

                    webgl.normalBuffer = webgl.normalBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ARRAY_BUFFER, webgl.normalBuffer);
                    _gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

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

                    webgl.tangentBuffer = webgl.tangentBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ARRAY_BUFFER, webgl.tangentBuffer);
                    _gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

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

                    webgl.indexBuffer = webgl.indexBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ELEMENT_ARRAY_BUFFER, webgl.indexBuffer);
                    _gl.bufferData(ELEMENT_ARRAY_BUFFER, bufferArray, DRAW);

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

                    webgl.lineBuffer = webgl.lineBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ELEMENT_ARRAY_BUFFER, webgl.lineBuffer);
                    _gl.bufferData(ELEMENT_ARRAY_BUFFER, bufferArray, DRAW);

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

                    webgl.colorBuffer = webgl.colorBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ARRAY_BUFFER, webgl.colorBuffer);
                    _gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

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

                    webgl.uvBuffer = webgl.uvBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ARRAY_BUFFER, webgl.uvBuffer);
                    _gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                    mesh.uvsNeedUpdate = false;
                }

                items = mesh.boneIndices || EMPTY_ARRAY;
                len = items.length;
                if (len && mesh.boneIndicesNeedUpdate) {
                    bufferArray = webgl.boneIndexArray;
                    if (!bufferArray || bufferArray.length !== len) bufferArray = webgl.boneIndexArray = new Uint16Array(len);

                    for (i = 0; i < len; i++) bufferArray[i] = items[i];

                    webgl.boneIndexBuffer = webgl.boneIndexBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ARRAY_BUFFER, webgl.boneIndexBuffer);
                    _gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                    mesh.boneIndicesNeedUpdate = false;
                }

                items = mesh.boneWeights || EMPTY_ARRAY;
                len = items.length;
                if (len && mesh.boneWeightsNeedUpdate) {
                    bufferArray = webgl.boneWeightArray;
                    if (!bufferArray || bufferArray.length !== len) bufferArray = webgl.boneWeightArray = new Float32Array(len);

                    for (i = 0; i < len; i++) bufferArray[i] = items[i];

                    webgl.boneWeightBuffer = webgl.boneWeightBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ARRAY_BUFFER, webgl.boneWeightBuffer);
                    _gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                    mesh.boneWeightsNeedUpdate = false;
                }

                webgl.inittedBuffers = true;

                return webgl;
            }


            function initMaterial(material, mesh, lights) {
                if (!material.needsUpdate && material._webgl) return material._webgl;

                var shader = material.shader,
                    uniforms = material.uniforms,
                    OES_standard_derivatives = !! _extensions.OES_standard_derivatives,
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

                parameters.OES_standard_derivatives = OES_standard_derivatives && shader.OES_standard_derivatives;

                allocateLights(lights, parameters);
                allocateShadows(lights, parameters);

                material._webgl = initProgram(shader.vertex, shader.fragment, parameters);
                material.needsUpdate = false;

                return material._webgl;
            }


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

            function initProgram(vertexShader, fragmentShader, parameters) {
                var chunks = [],
                    key, program, webglProgram, programInfo, code, i;

                chunks.push(fragmentShader, vertexShader);
                for (key in parameters) chunks.push(key, parameters[key]);

                code = chunks.join();

                for (i = _programs.length; i--;) {
                    programInfo = _programs[i];

                    if (programInfo.code === code) {
                        programInfo.used++;
                        return programInfo.program;
                    }
                }

                var precision = _gpu.precision,

                    mobile = parameters.mobile,
                    useLights = parameters.useLights,
                    useShadows = parameters.useShadows,
                    useFog = parameters.useFog,
                    useBones = parameters.useBones,
                    useVertexLit = parameters.useVertexLit,
                    useSpecular = parameters.useSpecular,
                    OES_standard_derivatives = parameters.OES_standard_derivatives,

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
                        OES_standard_derivatives ? "#extension GL_OES_standard_derivatives : enable" : "",
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

                if (OES_standard_derivatives) {
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

                webglProgram = createProgram(_gl, glVertexShader, glFragmentShader);
                program = {
                    program: webglProgram,
                    uniforms: {},
                    attributes: {},
                    customUniforms: [],
                    customAttributes: [],
                    parameters: parameters
                }

                getUniformsAttributes(vertexShader, fragmentShader, program.customAttributes, program.customUniforms);
                parseUniformsAttributes(_gl, webglProgram, glVertexShader, glFragmentShader, program.attributes, program.uniforms);

                _programs.push({
                    used: 1,
                    code: code,
                    program: program
                });

                return program;
            }


            var _lastBuffer = undefined;

            function bindMesh(mesh, material) {
                if (_lastBuffer === mesh._webgl) return;
                var webgl = mesh._webgl,
                    ARRAY_BUFFER = _gl.ARRAY_BUFFER,
                    FLOAT = _gl.FLOAT,
                    attributes = material._webgl.attributes;

                if (webgl.vertexBuffer && attributes.position > -1) {
                    _gl.bindBuffer(ARRAY_BUFFER, webgl.vertexBuffer);
                    _gl.enableVertexAttribArray(attributes.position);
                    _gl.vertexAttribPointer(attributes.position, 3, FLOAT, false, 0, 0);
                }
                if (webgl.normalBuffer && attributes.normal > -1) {
                    _gl.bindBuffer(ARRAY_BUFFER, webgl.normalBuffer);
                    _gl.enableVertexAttribArray(attributes.normal);
                    _gl.vertexAttribPointer(attributes.normal, 3, FLOAT, false, 0, 0);
                }
                if (webgl.tangentBuffer && attributes.tangent > -1) {
                    _gl.bindBuffer(ARRAY_BUFFER, webgl.tangentBuffer);
                    _gl.enableVertexAttribArray(attributes.tangent);
                    _gl.vertexAttribPointer(attributes.tangent, 4, FLOAT, false, 0, 0);
                }
                if (webgl.colorBuffer && attributes.color > -1) {
                    _gl.bindBuffer(ARRAY_BUFFER, webgl.colorBuffer);
                    _gl.enableVertexAttribArray(attributes.color);
                    _gl.vertexAttribPointer(attributes.color, 3, FLOAT, false, 0, 0);
                }
                if (webgl.uvBuffer && attributes.uv > -1) {
                    _gl.bindBuffer(ARRAY_BUFFER, webgl.uvBuffer);
                    _gl.enableVertexAttribArray(attributes.uv);
                    _gl.vertexAttribPointer(attributes.uv, 2, FLOAT, false, 0, 0);
                }
                if (webgl.boneIndexBuffer && attributes.boneIndex > -1) {
                    _gl.bindBuffer(ARRAY_BUFFER, webgl.boneIndexBuffer);
                    _gl.enableVertexAttribArray(attributes.boneIndex);
                    _gl.vertexAttribPointer(attributes.boneIndex, 1, FLOAT, false, 0, 0);
                }
                if (webgl.boneWeightBuffer && attributes.boneWeight > -1) {
                    _gl.bindBuffer(ARRAY_BUFFER, webgl.boneWeightBuffer);
                    _gl.enableVertexAttribArray(attributes.boneWeight);
                    _gl.vertexAttribPointer(attributes.boneWeight, 3, FLOAT, false, 0, 0);
                }

                if (material.wireframe) {
                    if (webgl.lineBuffer) _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, webgl.lineBuffer);
                } else {
                    if (webgl.indexBuffer) _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, webgl.indexBuffer);
                }

                _lastBuffer = mesh._webgl;
            }


            var _lastProgram = undefined,
                VEC3 = new Vec3,
                VEC3_2 = new Vec3,
                COLOR = new Color;

            function bindMaterial(material, transform, camera, lights, ambient) {
                var program = material._webgl,
                    webglProgram = material._webgl.program,
                    parameters = program.parameters,
                    uniforms = program.uniforms,
                    state, i, length;

                if (_lastProgram !== webglProgram) {
                    _gl.useProgram(webglProgram);
                    _lastProgram = webglProgram;
                }

                if (uniforms.modelMatrix) setUniformMatrix4fv(uniforms.modelMatrix.location, transform.matrixWorld, "matrixWorld");
                if (uniforms.modelViewMatrix) setUniformMatrix4fv(uniforms.modelViewMatrix.location, transform.modelView, "modelView");
                if (uniforms.projectionMatrix) setUniformMatrix4fv(uniforms.projectionMatrix.location, camera.projection, "projectionMatrix");
                if (uniforms.viewMatrix) setUniformMatrix4fv(uniforms.viewMatrix.location, camera.view, "viewMatrix");
                if (uniforms.normalMatrix) setUniformMatrix3fv(uniforms.normalMatrix.location, transform.normalMatrix, "normalMatrix");
                if (uniforms.cameraPosition) setUniform3f(uniforms.cameraPosition.location, VEC3.positionFromMat4(camera.transform.matrixWorld), "cameraPosition");
                if (uniforms.ambient) setUniform3f(uniforms.ambient.location, ambient, "ambient");

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

                            setUniform3f(pointLightColor[pointLights], COLOR, "pointLightColor", true, pointLights);
                            setUniform3f(pointLightPosition[pointLights], VEC3, "pointLightPosition", true, pointLights);
                            setUniform1f(pointLightDistance[pointLights], light.distance, "pointLightDistance", true, pointLights);
                            pointLights++;
                        } else if (directionalLightColor.length && type === LightType.Directional) {
                            if (directionalLights >= maxDirectionalLights) continue;

                            VEC3.positionFromMat4(light.transform.matrixWorld).sub(light.target).normalize();
                            if (VEC3.lengthSq() === 0) continue;

                            setUniform3f(directionalLightColor[directionalLights], COLOR, "directionalLightColor", true, directionalLights);
                            setUniform3f(directionalLightDirection[directionalLights], VEC3, "directionalLightDirection", true, directionalLights);
                            directionalLights++;

                        } else if (spotLightColor.length && type === LightType.Spot) {
                            if (spotLights >= maxSpotLights) continue;

                            VEC3.positionFromMat4(light.transform.matrixWorld);
                            if (VEC3.lengthSq() === 0) continue;

                            VEC3_2.copy(VEC3).sub(light.target).normalize();
                            if (VEC3_2.lengthSq() === 0) continue;

                            setUniform3f(spotLightColor[spotLights], COLOR, "spotLightColor", true, spotLights);
                            setUniform3f(spotLightPosition[spotLights], VEC3, "spotLightPosition", true, spotLights);
                            setUniform3f(spotLightDirection[spotLights], VEC3_2, "spotLightDirection", true, spotLights);
                            setUniform1f(spotLightDistance[spotLights], light.distance, "spotLightDistance", true, spotLights);
                            setUniform1f(spotLightAngleCos[spotLights], light._angleCos, "spotLightAngleCos", true, spotLights);
                            setUniform1f(spotLightExponent[spotLights], light.exponent, "spotLightExponent", true, spotLights);
                            spotLights++;

                        } else if (hemiLightColor.length && type === LightType.Hemi) {
                            if (hemiLights >= maxHemiLights) continue;

                            VEC3.positionFromMat4(light.transform.matrixWorld).sub(light.target).normalize();
                            if (VEC3.lengthSq() === 0) continue;

                            setUniform3f(hemiLightColor[hemiLights], COLOR, "hemiLightColor", true, hemiLights);
                            setUniform3f(hemiLightDirection[hemiLights], VEC3, "hemiLightDirection", true, hemiLights);
                            hemiLights++;
                        }
                    }
                }

                bindCustomUniforms(program.customUniforms, uniforms, material.name, material.uniforms);
                _textureIndex = 0;
            };


            function bindCustomUniforms(customUniforms, uniforms, materialName, materialUniforms) {
                var i = customUniforms.length,
                    customUniform, uniformValue, location, name, type, value;

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

                        for (i = location.length; i--;) setUniform(location[i], value[i], name, type, true, i);
                    } else {
                        setUniform(uniformValue.location, value, name, uniformValue.type);
                    }
                }
            }


            var _lastCamera = undefined,
                _lastResizeFn = undefined,
                _lastScene = undefined;
            this.preRender = function(gui, scene, camera) {
                if (!_context) return;
                var background = camera.background;

                if (_clearColor.r !== background.r || _clearColor.g !== background.g || _clearColor.b !== background.b) {
                    _clearColor.copy(background);
                    _gl.clearColor(background.r, background.g, background.b, 1);
                    if (!this.autoClear) clearCanvas(this.autoClearColor, this.autoClearDepth, this.autoClearStencil);
                }
                if (_lastCamera !== camera) {
                    var w = _canvas.pixelWidth,
                        h = _canvas.pixelHeight;

                    camera.set(w, h);
                    this.setViewport(0, 0, w, h);

                    if (_lastResizeFn) _canvas.off("resize", _lastResizeFn);

                    _lastResizeFn = function() {
                        var w = this.pixelWidth,
                            h = this.pixelHeight;

                        camera.set(w, h);
                        _this.setViewport(0, 0, w, h);
                    };

                    _canvas.on("resize", _lastResizeFn);
                    _lastCamera = camera;
                }
                if (scene && _lastScene !== scene) {

                    _lastScene = scene;
                }

                if (this.autoClear) clearCanvas(this.autoClearColor, this.autoClearDepth, this.autoClearStencil);
            };


            this.renderGUI = function(gui, camera) {
                if (!_context) return;
                var components = gui.components,
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
            this.render = function(scene, camera) {
                if (!_context) return;
                var lineWidth = _lastLineWidth,
                    blending = _lastBlending,
                    cullFace = _lastCullFace,

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
                    renderMeshFilter(camera, lights, ambient, transform, meshFilter);
                }

                setCullFace(cullFace);
                setBlending(blending);
                setLineWidth(lineWidth);
            };


            function renderMeshFilter(camera, lights, ambient, transform, meshFilter) {
                var mesh = meshFilter.mesh,
                    material = meshFilter.material,
                    side = material.side,

                    buffers = initMeshBuffers(mesh),
                    program = initMaterial(material, mesh, lights);

                bindMaterial(material, transform, camera, lights, ambient);
                bindMesh(mesh, material);

                setBlending(material.blending);

                if (side === Side.Front) {
                    setCullFace(CullFace.Back);
                } else if (side === Side.Back) {
                    setCullFace(CullFace.Front);
                } else if (side === Side.Both) {
                    setCullFace();
                }

                if (material.wireframe) {
                    setLineWidth(material.wireframeLineWidth);
                    _gl.drawElements(_gl.LINES, buffers.lineCount, _gl.UNSIGNED_SHORT, 0);
                } else {
                    _gl.drawElements(_gl.TRIANGLES, buffers.indexCount, _gl.UNSIGNED_SHORT, 0);
                }
            };


            function initGL() {
                try {
                    _gl = getWebGLContext(_element, _this.attributes);
                    if (_gl === null) throw "Error creating WebGL context";
                } catch (e) {
                    console.error(e);
                }

                getExtensions();
                getGPUInfo();
                getSupports();
            }


            function setDefaultGLState() {

                _gl.clearColor(0, 0, 0, 1);
                _gl.clearDepth(1);
                _gl.clearStencil(0);

                setDepthTest(true);
                _gl.depthFunc(_gl.LEQUAL);

                _gl.frontFace(_gl.CCW);

                setCullFace(CullFace.Back);
                setBlending(Blending.Default);

                setViewport();
            }


            function handleWebGLContextLost(e) {
                e.preventDefault();
                Log.warn("Renderer: webgl context was lost");

                _context = false;
                this.emit("webglcontextlost", e);
            }


            function handleWebGLContextRestored(e) {
                Log.log("Renderer: webgl context was restored");

                initGL();
                setDefaultGLState();

                _context = true;
                this.emit("webglcontextrestored", e);
            }


            function getGPUInfo() {
                var VERTEX_SHADER = _gl.VERTEX_SHADER,
                    FRAGMENT_SHADER = _gl.FRAGMENT_SHADER,
                    HIGH_FLOAT = _gl.HIGH_FLOAT,
                    MEDIUM_FLOAT = _gl.MEDIUM_FLOAT,

                    EXT_texture_filter_anisotropic = _extensions.EXT_texture_filter_anisotropic,

                    vsHighpFloat = _gl.getShaderPrecisionFormat(VERTEX_SHADER, HIGH_FLOAT),
                    vsMediumpFloat = _gl.getShaderPrecisionFormat(VERTEX_SHADER, MEDIUM_FLOAT),

                    fsHighpFloat = _gl.getShaderPrecisionFormat(FRAGMENT_SHADER, HIGH_FLOAT),
                    fsMediumpFloat = _gl.getShaderPrecisionFormat(FRAGMENT_SHADER, MEDIUM_FLOAT),

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

                _gpu = {};

                _gpu.precision = precision;
                _gpu.maxAnisotropy = EXT_texture_filter_anisotropic ? _gl.getParameter(EXT_texture_filter_anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1;
                _gpu.maxTextures = _gl.getParameter(_gl.MAX_TEXTURE_IMAGE_UNITS);
                _gpu.maxVertexTextures = _gl.getParameter(_gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
                _gpu.maxTextureSize = _gl.getParameter(_gl.MAX_TEXTURE_SIZE);
                _gpu.maxCubeTextureSize = _gl.getParameter(_gl.MAX_CUBE_MAP_TEXTURE_SIZE);
                _gpu.maxRenderBufferSize = _gl.getParameter(_gl.MAX_RENDERBUFFER_SIZE);

                _gpu.maxUniforms = _gl.getParameter(_gl.MAX_VERTEX_UNIFORM_VECTORS) * 4;
                _gpu.maxAttributes = _gl.getParameter(_gl.MAX_VERTEX_ATTRIBS);
            }


            function getExtensions() {
                _extensions = {};

                _extensions.EXT_texture_filter_anisotropic = getExtension("EXT_texture_filter_anisotropic");

                _extensions.WEBGL_compressed_texture_s3tc = getExtension("WEBGL_compressed_texture_s3tc");
                _extensions.WEBGL_compressed_texture_s3tc_formats = _extensions.WEBGL_compressed_texture_s3tc ? _gl.getParameter(_gl.COMPRESSED_TEXTURE_FORMATS) : null;

                _extensions.OES_standard_derivatives = getExtension("OES_standard_derivatives");

                _extensions.OES_texture_float = getExtension("OES_texture_float");
                _extensions.OES_texture_float_linear = getExtension("OES_texture_float_linear");
            }


            var getExtension_prefixes = ["WEBKIT", "MOZ", "O", "MS", "webkit", "moz", "o", "ms"],
                getExtension_length = getExtension_prefixes.length;

            function getExtension(name) {
                var extension = _extensions[name] || (_extensions[name] = _gl.getExtension(name));

                if (extension == undefined) {
                    var i = getExtension_length;

                    while (i--) {
                        if ((extension = _gl.getExtension(getExtension_prefixes[i] + "_" + name))) return (_extensions[name] = extension);
                    }
                }

                return extension;
            }
            this.getExtension = getExtension;


            function getSupports() {
                _supports = {};

                _supports.vertexTextures = _gpu.maxVertexTextures > 0;
                _supports.boneTextures = _supports.vertexTextures && !! _extensions.OES_texture_float;

                _supports.EXT_texture_filter_anisotropic = !! _extensions.EXT_texture_filter_anisotropic;
                _supports.WEBGL_compressed_texture_s3tc = !! _extensions.WEBGL_compressed_texture_s3tc;
                _supports.OES_standard_derivatives = !! _extensions.OES_standard_derivatives;
                _supports.OES_texture_float = !! _extensions.OES_texture_float;
                _supports.OES_texture_float_linear = !! _extensions.OES_texture_float_linear;
            }
        }

        EventEmitter.extend(Renderer);


        return Renderer;
    }
);
