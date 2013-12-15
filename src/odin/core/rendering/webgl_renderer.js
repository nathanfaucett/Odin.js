define([
        "base/event_emitter",
        "base/device",
        "base/dom",
        "math/mathf",
        "math/mat4",
        "math/color",
        "core/rendering/shaders/shader"
    ],
    function(EventEmitter, Device, Dom, Mathf, Mat4, Color, Shader) {
        "use strict";


        var getWebGLContext = Dom.getWebGLContext,
            createProgram = Dom.createProgram,
            parseUniformsAttributes = Dom.parseUniformsAttributes,

            addEvent = Dom.addEvent,
            removeEvent = Dom.removeEvent,

            min = Math.min,
            max = Math.max,
            clamp = Mathf.clamp,
            isPowerOfTwo = Mathf.isPowerOfTwo,

            WHITE_TEXTURE = new Uint8Array([255, 255, 255, 255]),
            ENUM_WHITE_TEXTURE = -1;

        /**
        * @class WebGLRenderer
        * @extends EventEmitter
        * @brief 2d webgl renderer
        * @param Object options
        */

        function WebGLRenderer(opts) {
            opts || (opts = {});

            EventEmitter.call(this);

            /**
            * @property Object attributes
            * @memberof WebGLRenderer
            */
            this.attributes = opts.attributes || {
                alpha: true,
                antialias: true,
                depth: true,
                premulipliedAlpha: true,
                preserveDrawingBuffer: false,
                stencil: true
            };

            /**
            * @property Canvas canvas
            * @memberof WebGLRenderer
            */
            this.canvas = undefined;

            /**
            * @property WebGLRenderingContext context
            * @memberof WebGLRenderer
            */
            this.context = undefined;
            this._context = false;

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

            this._lastCamera = undefined;
            this._lastResizeFn = undefined;
            this._lastBackground = new Color;
        }

        EventEmitter.extend(WebGLRenderer, EventEmitter);

        /**
        * @method init
        * @memberof WebGLRenderer
        * @brief inits renderer context from a canvas element
        * @param Canvas canvas
        */
        WebGLRenderer.prototype.init = function(canvas) {
            var element = canvas.element;

            this.context = getWebGLContext(element, this.attributes);
            this._context = true;

            addEvent(element, "webglcontextlost", this._handleWebGLContextLost, this);
            addEvent(element, "webglcontextrestored", this._handleWebGLContextRestored, this);

            this.canvas = canvas;
            this.setDefaults();
        };

        /**
        * @method destroy
        * @memberof WebGLRenderer
        * @brief destroys renderer context, canvas, and data using that context
        */
        WebGLRenderer.prototype.destroy = function() {
            var canvas = this.canvas,
                element = canvas.element,
                webgl = this._webgl,
                ext = webgl.ext;

            this.context = undefined;
            this._context = false;

            removeEvent(element, "webglcontextlost", this._handleWebGLContextLost, this);
            removeEvent(element, "webglcontextrestored", this._handleWebGLContextRestored, this);

            this._lastCamera = undefined;
            this._lastResizeFn = undefined;
            this._lastBackground.setRGB(0, 0, 0);

            ext.compressedTextureS3TC = ext.standardDerivatives = ext.textureFilterAnisotropic = ext.textureFloat = undefined;
            webgl.lastBuffer = webgl.lastShader = webgl.lastTexture = undefined;
            webgl.textures = {};
            webgl.buffers = {};
            webgl.shaders = {};

            this.canvas = undefined;
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

            gl.enable(gl.BLEND);
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, WHITE_TEXTURE);
            gl.bindTexture(gl.TEXTURE_2D, null);
            webgl.textures[ENUM_WHITE_TEXTURE] = texture;
        };

        /**
        * @method setBlending
        * @memberof WebGLRenderer
        * @brief sets blending mode ( empty - default, 0 - none, 1 - additive, 2 - subtractive, or 3 - muliply  )
        * @param Number blending
        */
        WebGLRenderer.prototype.setBlending = function() {
            var lastBlending;

            return function(blending) {
                var gl = this.context;

                if (blending !== lastBlending) {

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

                    lastBlending = blending;
                }
            };
        }();


        var EMPTY_ARRAY = [];
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
                webgl = this._webgl,
                lastCamera = this._lastCamera,
                lastBackground = this._lastBackground,
                background = camera.backgroundColor,
                components = scene.components,
                meshFilters = components.MeshFilter || EMPTY_ARRAY,
                meshFilter,
                transform,
                i;

            if (lastBackground.r !== background.r || lastBackground.g !== background.g || lastBackground.b !== background.b) {
                lastBackground.copy(background);
                gl.clearColor(background.r, background.g, background.b, 1);
            }
            if (lastCamera !== camera) {
                var canvas = this.canvas,
                    w = canvas.pixelWidth,
                    h = canvas.pixelHeight;

                camera.set(w, h);
                gl.viewport(0, 0, w, h);

                if (canvas.fullScreen) {
                    if (this._lastResizeFn) canvas.off("resize", this._lastResizeFn);

                    this._lastResizeFn = function() {
                        var w = this.pixelWidth,
                            h = this.pixelHeight;

                        camera.set(w, h);
                        gl.viewport(0, 0, w, h);
                    };

                    canvas.on("resize", this._lastResizeFn);
                }

                this._lastCamera = camera;
            }

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

            for (i = meshFilters.length; i--;) {
                meshFilter = meshFilters[i];
                transform = meshFilter.transform;

                if (!meshFilter.mesh || !transform) continue;

                this.renderMeshFilter(meshFilter.gameObject, camera, transform, meshFilter);
            }
        };


        WebGLRenderer.prototype.renderMeshFilter = function(gameObject, camera, transform, meshFilter) {
            var gl = this.context,
                webgl = this._webgl,
                lastBuffer = webgl.lastBuffer,
                lastShader = webgl.lastShader,
                mesh = meshFilter.mesh,

                material = meshFilter.material,
                shader = material.shader,

                glMesh = buildMesh(this, mesh),
                glShader = buildShader(this, mesh, shader);

            if (lastShader !== glShader) {
                gl.useProgram(glShader.program);
                webgl.lastShader = glShader;
            }

            if (lastBuffer !== glMesh) {
                bindBuffers(gl, glShader, glMesh);
                webgl.lastBuffer = glMesh;
            }

            bindUniforms(this, gameObject, shader, glShader, mesh, glMesh, material, transform, camera);

            if (glMesh.indexBuffer) {
                gl.drawElements(gl.TRIANGLES, glMesh.indices, gl.UNSIGNED_SHORT, 0);
            } else {
                gl.drawArrays(gl.TRIANGLES, 0, glMesh.vertices);
            }
        };


        WebGLRenderer.prototype._handleWebGLContextLost = function(e) {
            e.preventDefault();
            console.warn("WebGLRenderer: webgl context was lost");

            this._context = false;
            this.emit("webglcontextlost", e);
        };


        WebGLRenderer.prototype._handleWebGLContextRestored = function(e) {
            console.log("WebGLRenderer: webgl context was restored");

            this.setDefaults();
            
            this._context = true;
            this.emit("webglcontextrestored", e);
        };


        function bindBuffers(gl, glShader, glMesh) {
            var attributes = glShader.attributes,
                FLOAT = gl.FLOAT,
                ARRAY_BUFFER = gl.ARRAY_BUFFER;

            if (glMesh.vertexBuffer && attributes.aVertexPosition > -1) {
                gl.bindBuffer(ARRAY_BUFFER, glMesh.vertexBuffer);
                gl.enableVertexAttribArray(attributes.aVertexPosition);
                gl.vertexAttribPointer(attributes.aVertexPosition, 3, FLOAT, false, 0, 0);
            }

            if (glMesh.normalBuffer && attributes.aVertexNormal > -1) {
                gl.bindBuffer(ARRAY_BUFFER, glMesh.normalBuffer);
                gl.enableVertexAttribArray(attributes.aVertexNormal);
                gl.vertexAttribPointer(attributes.aVertexNormal, 3, FLOAT, false, 0, 0);
            }

            if (glMesh.tangentBuffer && attributes.aVertexTangent > -1) {
                gl.bindBuffer(ARRAY_BUFFER, glMesh.tangentBuffer);
                gl.enableVertexAttribArray(attributes.aVertexTangent);
                gl.vertexAttribPointer(attributes.aVertexTangent, 4, FLOAT, false, 0, 0);
            }

            if (glMesh.colorBuffer && attributes.aVertexColor > -1) {
                gl.bindBuffer(ARRAY_BUFFER, glMesh.colorBuffer);
                gl.enableVertexAttribArray(attributes.aVertexColor);
                gl.vertexAttribPointer(attributes.aVertexColor, 2, FLOAT, false, 0, 0);
            }

            if (glMesh.uvBuffer && attributes.aVertexUv > -1) {
                gl.bindBuffer(ARRAY_BUFFER, glMesh.uvBuffer);
                gl.enableVertexAttribArray(attributes.aVertexUv);
                gl.vertexAttribPointer(attributes.aVertexUv, 2, FLOAT, false, 0, 0);
            }

            if (glMesh.boneWeightBuffer && attributes.aBoneWeight > -1) {
                gl.bindBuffer(ARRAY_BUFFER, glMesh.boneWeightBuffer);
                gl.enableVertexAttribArray(attributes.aBoneWeight);
                gl.vertexAttribPointer(attributes.aBoneWeight, 3, FLOAT, false, 0, 0);
            }

            if (glMesh.boneIndexBuffer && attributes.aBoneIndex > -1) {
                gl.bindBuffer(ARRAY_BUFFER, glMesh.boneIndexBuffer);
                gl.enableVertexAttribArray(attributes.aBoneIndex);
                gl.vertexAttribPointer(attributes.aBoneIndex, 3, FLOAT, false, 0, 0);
            }

            if (glMesh.indexBuffer) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glMesh.indexBuffer);
        };
        

        function bindUniforms(renderer, gameObject, shader, glShader, mesh, glMesh, material, transform, camera) {
            var gl = renderer.context,
                webgl = renderer._webgl,
                lastTexture = webgl.lastTexture,

                options = shader.options,
                uniforms = glShader.uniforms,
                color = material.color,
                whiteTexture = webgl.textures[ENUM_WHITE_TEXTURE],

                mainTexture = material.mainTexture,
                mainTextureImage = mainTexture && mainTexture.image ? mainTexture.image.data : undefined,
                mainTextureOffset = material.mainTextureOffset,
                mainTextureScale = material.mainTextureScale,

                glTexture, index = 0,

                uBone = uniforms.uBone,
                bones = gameObject.animation ? gameObject.animation.bones : mesh.bones,

                key, i;

            if (uniforms.uModelView) {
                transform.updateModelView(camera);
                gl.uniformMatrix4fv(uniforms.uModelView, false, transform.modelView.elements);
            } else {
                gl.uniformMatrix4fv(uniforms.uModel, false, transform.matrixWorld.elements);
                gl.uniformMatrix4fv(uniforms.uView, false, camera.view.elements);
            }
            gl.uniformMatrix4fv(uniforms.uProj, false, camera.projection.elements);

            if (uBone && bones.length) {
                for (i = uBone.length; i--;) gl.uniformMatrix4fv(uBone[i], false, bones[i].matrixBone.elements);
            }

            gl.uniform4f(uniforms.uMainTextureOffset, mainTextureOffset.x, mainTextureOffset.y, mainTextureScale.x, mainTextureScale.y);

            if (mainTexture) {
                glTexture = buildTexture(renderer, mainTexture, mainTextureImage);
                gl.uniform4f(uniforms.uColor, 1, 1, 1, material.alpha);

                if (lastTexture !== glTexture) {
                    gl.activeTexture(gl.TEXTURE0 + index);
                    gl.bindTexture(gl.TEXTURE_2D, glTexture);
                    gl.uniform1i(uniforms.uMainTexture, index);

                    webgl.lastTexture = glTexture;
                }
                index++;
            } else {
                gl.uniform4f(uniforms.uColor, color.r, color.g, color.b, material.alpha);

                if (lastTexture !== whiteTexture) {
                    gl.activeTexture(gl.TEXTURE0 + index);
                    gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
                    gl.uniform1i(uniforms.uMainTexture, index);

                    webgl.lastTexture = whiteTexture;
                }
                index++;
            }
        };

        var buildMesh_COMPILE_ARRAY = [];

        function buildMesh(renderer, mesh) {
            var gl = renderer.context,
                webgl = renderer._webgl,
                buffers = webgl.buffers,
                glMesh = buffers[mesh._id];

            if (!mesh._needsUpdate) return glMesh;

            glMesh = glMesh || (buffers[mesh._id] = {});

            var compileArray = buildMesh_COMPILE_ARRAY,
                DRAW = mesh.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW,
                ARRAY_BUFFER = gl.ARRAY_BUFFER,
                ELEMENT_ARRAY_BUFFER = gl.ELEMENT_ARRAY_BUFFER,
                items, item,
                i, il;

            items = mesh.vertices;
            if (items.length) {

                compileArray.length = 0;
                for (i = 0, il = items.length; i < il; i++) {
                    item = items[i];
                    compileArray.push(item.x, item.y, item.z);
                }

                if (compileArray.length) {
                    glMesh.vertexBuffer = glMesh.vertexBuffer || gl.createBuffer();
                    gl.bindBuffer(ARRAY_BUFFER, glMesh.vertexBuffer);
                    gl.bufferData(ARRAY_BUFFER, new Float32Array(compileArray), DRAW);
                }

                glMesh.vertices = items.length;
            }

            items = mesh.normals;
            if (items.length) {

                compileArray.length = 0;
                for (i = 0, il = items.length; i < il; i++) {
                    item = items[i];
                    compileArray.push(item.x, item.y, item.z);
                }

                if (compileArray.length) {
                    glMesh.normalBuffer = glMesh.normalBuffer || gl.createBuffer();
                    gl.bindBuffer(ARRAY_BUFFER, glMesh.normalBuffer);
                    gl.bufferData(ARRAY_BUFFER, new Float32Array(compileArray), DRAW);
                }
            }

            items = mesh.tangents;
            if (items.length) {

                compileArray.length = 0;
                for (i = 0, il = items.length; i < il; i++) {
                    item = items[i];
                    compileArray.push(item.x, item.y, item.z, item.w);
                }

                if (compileArray.length) {
                    glMesh.tangentBuffer = glMesh.tangentBuffer || gl.createBuffer();
                    gl.bindBuffer(ARRAY_BUFFER, glMesh.tangentBuffer);
                    gl.bufferData(ARRAY_BUFFER, new Float32Array(compileArray), DRAW);
                }
            }

            items = mesh.colors;
            if (items.length) {

                compileArray.length = 0;
                for (i = 0, il = items.length; i < il; i++) {
                    item = items[i];
                    compileArray.push(item.r, item.g, item.b);
                }

                if (compileArray.length) {
                    glMesh.colorBuffer = glMesh.colorBuffer || gl.createBuffer();
                    gl.bindBuffer(ARRAY_BUFFER, glMesh.colorBuffer);
                    gl.bufferData(ARRAY_BUFFER, new Float32Array(compileArray), DRAW);
                }
            }

            items = mesh.uvs;
            if (items.length) {

                compileArray.length = 0;
                for (i = 0, il = items.length; i < il; i++) {
                    item = items[i];
                    compileArray.push(item.x, item.y);
                }

                if (compileArray.length) {
                    glMesh.uvBuffer = glMesh.uvBuffer || gl.createBuffer();
                    gl.bindBuffer(ARRAY_BUFFER, glMesh.uvBuffer);
                    gl.bufferData(ARRAY_BUFFER, new Float32Array(compileArray), DRAW);
                }
            }

            items = mesh.boneIndices;
            if (items.length) {

                glMesh.boneIndexBuffer = glMesh.boneIndexBuffer || gl.createBuffer();
                gl.bindBuffer(ARRAY_BUFFER, glMesh.boneIndexBuffer);
                gl.bufferData(ARRAY_BUFFER, new Float32Array(items), DRAW);
            }

            items = mesh.boneWeights;
            if (items.length) {

                glMesh.boneWeightBuffer = glMesh.boneWeightBuffer || gl.createBuffer();
                gl.bindBuffer(ARRAY_BUFFER, glMesh.boneWeightBuffer);
                gl.bufferData(ARRAY_BUFFER, new Float32Array(items), DRAW);
            }

            items = mesh.faces;
            if (items.length) {

                glMesh.indexBuffer = glMesh.indexBuffer || gl.createBuffer();
                gl.bindBuffer(ELEMENT_ARRAY_BUFFER, glMesh.indexBuffer);
                gl.bufferData(ELEMENT_ARRAY_BUFFER, new Int16Array(items), DRAW);

                glMesh.indices = items.length;
            }

            webgl.lastBuffer = glMesh;
            mesh._needsUpdate = false;

            return glMesh;
        }

        var buildShader_main = "\n void main( void ){\n",
            buildShader_footer = "\n}";

        function buildShader(renderer, mesh, shader) {
            var gl = renderer.context,
                webgl = renderer._webgl,
                shaders = webgl.shaders,
                glShader = shaders[shader._id];

            if (!shader._needsUpdate && glShader) return glShader;

            glShader = glShader || (shaders[shader._id] = {});

            var precision = webgl.gpu.precision,
                useBones = mesh.bones.length && mesh.useBones,

                header = "precision " + precision + " float;\n",
                main = buildShader_main,
                footer = buildShader_footer,
                options = shader.options,

                vertexShader = header,
                fragmentShader = header,
                other, used = false,
                key;

            vertexShader += shader.vertexShaderHeader;
            if (useBones) vertexShader += Shader.bonesHeader(mesh.bones.length);

            vertexShader += main;

            if (options.lighting) {
                vertexShader += Shader.modelView;
            } else {
                vertexShader += Shader.modelView_uModelView;
            }
            if (useBones) vertexShader += Shader.bonesMain;

            vertexShader += Shader.vertexPosition;

            vertexShader += shader.vertexShaderMain;
            vertexShader += footer;

            fragmentShader += shader.fragmentShaderHeader;
            fragmentShader += main;
            fragmentShader += shader.fragmentShaderMain;
            fragmentShader += footer;

            for (key in shaders) {
                other = shaders[key];
                if (key == shader._id) continue;

                if (vertexShader === other.vertexShader && fragmentShader === other.fragmentShader) {
                    vertexShader = other.vertexShader;
                    fragmentShader = other.fragmentShader;
                    glShader.program = other.program;
                    glShader.attributes = other.attributes;
                    glShader.uniforms = other.uniforms;
                    used = true;
                }
            }

            glShader.vertexShader = vertexShader;
            glShader.fragmentShader = fragmentShader;

            if (!used) {
                glShader.program = createProgram(gl, glShader.vertexShader, glShader.fragmentShader);

                glShader.attributes = {};
                glShader.uniforms = {};

                parseUniformsAttributes(gl, glShader.program, vertexShader, fragmentShader, glShader.attributes, glShader.uniforms);
            }
            shader._needsUpdate = false;

            return glShader;
        }

        function buildTexture(renderer, texture, image) {
            if (!image) return renderer._webgl.textures[ENUM_WHITE_TEXTURE];

            var gl = renderer.context,
                webgl = renderer._webgl,
                textures = webgl.textures,
                glTexture = textures[texture._id];

            if (!texture._needsUpdate) return glTexture || textures[ENUM_WHITE_TEXTURE];

            glTexture = glTexture || (textures[texture._id] = gl.createTexture());
            var ext = webgl.ext,
                gpu = webgl.gpu,
                TFA = ext.textureFilterAnisotropic,

                isPOT = isPowerOfTwo(image.width) && isPowerOfTwo(image.height),
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

            gl.texImage2D(TEXTURE_2D, 0, FORMAT, FORMAT, gl.UNSIGNED_BYTE, image);

            gl.texParameteri(TEXTURE_2D, gl.TEXTURE_MAG_FILTER, MAG_FILTER);
            gl.texParameteri(TEXTURE_2D, gl.TEXTURE_MIN_FILTER, MIN_FILTER);

            gl.texParameteri(TEXTURE_2D, gl.TEXTURE_WRAP_S, WRAP);
            gl.texParameteri(TEXTURE_2D, gl.TEXTURE_WRAP_T, WRAP);

            if (TFA) gl.texParameterf(gl.TEXTURE_2D, TFA.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);
            if (isPOT) gl.generateMipmap(TEXTURE_2D);

            webgl.lastTexture = glTexture;
            texture._needsUpdate = false;

            return glTexture;
        }


        return WebGLRenderer;
    }
);
