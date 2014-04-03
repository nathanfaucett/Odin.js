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
        "odin/math/rect",
        "odin/math/rect_offset",
        "odin/math/vec2",
        "odin/math/vec3",
        "odin/math/vec4",
        "odin/math/quat",
        "odin/math/mat2",
        "odin/math/mat3",
        "odin/math/mat4",
        "odin/core/enums",
        "odin/core/game/log",
        "odin/core/game/config",
        "odin/core/renderer/render_target",
        "odin/core/renderer/render_target_cube",
        "odin/core/renderer/shader_chunks",
        "odin/core/assets/texture",
        "odin/core/assets/texture_cube",
        "odin/core/components/mesh_filter",
        "odin/core/components/sprite",
        "odin/core/components/particle_system/emitter",
        "odin/core/components/particle_system/emitter_2d"
    ],
    function(
        EventEmitter, Device, Dom, util,
        Mathf, Color, Rect, RectOffset, Vec2, Vec3, Vec4, Quat, Mat2, Mat3, Mat4,
        Enums, Log, Config, RenderTarget, RenderTargetCube, ShaderChunks,
        Texture, TextureCube, MeshFilter, Sprite, Emitter, Emitter2D
    ) {
        "use strict";


        var Blending = Enums.Blending,
            ShadowMapType = Enums.ShadowMapType,
            CullFace = Enums.CullFace,
            Side = Enums.Side,

            LightType = Enums.LightType,

            FilterMode = Enums.FilterMode,
            TextureFormat = Enums.TextureFormat,
            TextureWrap = Enums.TextureWrap,

            getWebGLContext = Dom.getWebGLContext,
            addEvent = Dom.addEvent,
            removeEvent = Dom.removeEvent,

            createProgram = Dom.createProgram,

            merge = util.merge,

            max = Math.max,
            floor = Math.floor,
            clamp = Mathf.clamp,
            isPowerOfTwo = Mathf.isPowerOfTwo,

            defineProperty = Object.defineProperty,
            EMPTY_ARRAY = [];

        /**
         * @class Renderer
         * @extends EventEmitter
         * @param {object} options
         */

        function Renderer(opts) {
            opts || (opts = {});

            EventEmitter.call(this);

            this.autoClear = opts.autoClear != undefined ? opts.autoClear : true;
            this.autoClearColor = opts.autoClearColor != undefined ? opts.autoClearColor : true;
            this.autoClearDepth = opts.autoClearDepth != undefined ? opts.autoClearDepth : true;
            this.autoClearStencil = opts.autoClearStencil != undefined ? opts.autoClearStencil : true;

            this.shadowMapEnabled = opts.shadowMapEnabled != undefined ? opts.shadowMapEnabled : true;
            this.shadowMapAutoUpdate = opts.shadowMapAutoUpdate != undefined ? opts.shadowMapAutoUpdate : true;
            this.shadowMapType = opts.shadowMapType != undefined ? opts.shadowMapType : ShadowMapType.PCFShadowMap;
            this.shadowMapCullFace = opts.shadowMapCullFace != undefined ? opts.shadowMapCullFace : CullFace.Front;
            this.shadowMapDebug = opts.shadowMapDebug != undefined ? opts.shadowMapDebug : false;
            this.shadowMapCascade = opts.shadowMapCascade != undefined ? opts.shadowMapCascade : false;

            var _lastCamera = undefined,
                _lastResizeFn = undefined,
                _lastScene = undefined,
                _lastGUI = undefined,

                _mat4 = new Mat4,
                _projScreenMatrix = new Mat4,
                _quat = new Quat,
                _vector2 = new Vec2,
                _vector3 = new Vec3,
                _vector3_2 = new Vec3,
                _vector4 = new Vec4,
                _rect = new Rect,
                _rect_2 = new Rect,
                _rectOffset = new RectOffset,
                _color = new Color,

                _shaders = {},
                _lastBuffers = undefined,
                _spriteBuffers = undefined,

                _textTextures = {},
                _canvas2d = undefined,
                _ctx = undefined;

            /**
             * @method render
             * @memberof Renderer
             * @brief renderers scene from camera's perspective
             * @param Scene scene
             * @param Camera camera
             */
            function render(camera, scene, gui, renderTarget) {
                if (!_context || !camera) return;
                var lineWidth, blending, cullFace,
                    background = camera.background,
                    i;

                setRenderTarget(renderTarget);

                if (_lastClearColor.r !== background.r || _lastClearColor.g !== background.g || _lastClearColor.b !== background.b) {
                    _lastClearColor.copy(background);
                    _gl.clearColor(background.r, background.g, background.b, 1);
                    if (!this.autoClear) clearCanvas(true, this.autoClearDepth, this.autoClearStencil);
                }
                if (_lastCamera !== camera) {

                    if (camera.autoResize) {
                        var w = _canvas.pixelWidth,
                            h = _canvas.pixelHeight;

                        camera.set(w, h);
                        setViewport(0, 0, w, h);

                        if (_lastResizeFn) _canvas.off("resize", _lastResizeFn);

                        _lastResizeFn = function() {
                            var w = this.pixelWidth,
                                h = this.pixelHeight;

                            camera.set(w, h);
                            setViewport(0, 0, w, h);
                        };

                        _canvas.on("resize", _lastResizeFn);
                    } else {
                        setViewport(0, 0, camera.width, camera.height);
                    }

                    _lastCamera = camera;
                }
                if (scene && _lastScene !== scene) {
                    if (_lastScene) removeSceneEvents(_lastScene);
                    addSceneEvents(scene);

                    _lastScene = scene;
                }
                if (gui && _lastGUI !== gui) {
                    if (_lastGUI) removeGUIEvents(_lastGUI);
                    addGUIEvents(gui);

                    _lastScene = gui;
                }

                _projScreenMatrix.mmul(camera.projection, camera.view);
                if (this.autoClear) clearCanvas(this.autoClearColor, this.autoClearDepth, this.autoClearStencil);

                if (scene) {
                    var components = scene.components,
                        ambient = scene.world.ambient,
                        lights = components.Light || EMPTY_ARRAY,
                        meshFilters = components.MeshFilter || EMPTY_ARRAY,
                        sprites = components.Sprite || EMPTY_ARRAY,
                        particleSystems = components.ParticleSystem || EMPTY_ARRAY,
                        meshFilter, particleSystem, sprite, transform;

                    lineWidth = _lastLineWidth;
                    blending = _lastBlending;
                    cullFace = _lastCullFace;

                    i = meshFilters.length;
                    while (i--) {
                        meshFilter = meshFilters[i];
                        transform = meshFilter.transform || meshFilter.transform2d;

                        if (!transform) continue;

                        transform.updateMatrices(camera.view);
                        renderMeshFilter(camera, lights, ambient, transform, meshFilter);
                    }

                    i = sprites.length;
                    while (i--) {
                        sprite = sprites[i];
                        transform = sprite.transform || sprite.transform2d;

                        if (!transform) continue;

                        transform.updateMatrices(camera.view);
                        renderSprite(camera, lights, ambient, transform, sprite);
                    }

                    i = particleSystems.length;
                    while (i--) {
                        particleSystem = particleSystems[i];
                        transform = particleSystem.transform || sprite.transform2d;

                        if (!transform) continue;

                        transform.updateMatrices(camera.view);
                        renderParticleSystem(camera, lights, ambient, transform, particleSystem);
                    }

                    setCullFace(cullFace);
                    setBlending(blending);
                    setLineWidth(lineWidth);
                }
                if (gui) {
                    var components = gui.components,
                        guiContents = components.GUIContent || EMPTY_ARRAY,
                        guiContent, transform,
                        i;

                    lineWidth = _lastLineWidth;
                    blending = _lastBlending;
                    cullFace = _lastCullFace;

                    useDepth && setDepthTest(false);
                    setCullFace(CullFace.Back);

                    i = guiContents.length;
                    while (i--) {
                        guiContent = guiContents[i];
                        transform = guiContent.guiTransform;

                        if (!transform) continue;

                        transform.updateMatrices(camera.guiProjection);
                        renderGUIContent(camera, transform, guiContent);
                    }

                    setBlending(blending);
                    setLineWidth(lineWidth);
                    setCullFace(cullFace);
                    useDepth && setDepthTest(true);
                }
            };
            this.render = render;


            var _guiBuffers = undefined,
                _guiContentShader = undefined;

            function renderGUIContent(camera, transform, guiContent) {
                if (!_guiBuffers) createGUIBuffers();
                if (!_guiContentShader) createGUIContentShader();

                var force = setProgram(_guiContentShader.program),
                    uniforms = _guiContentShader.uniforms,
                    attributes = _guiContentShader.attributes,

                    texture = guiContent.texture,
                    text = guiContent.text,

                    style = guiContent.style,
                    styleState = style._state,
                    state = style[styleState],

                    innerRect = _rect.copy(transform.position),
                    outerRect = _rect_2;

                if (texture) {

                } else if (text) {
                    texture = createTextTexture(guiContent, innerRect, text, style);
                    outerRect.copy(innerRect);
                } else {
                    return;
                }

                if (_lastBuffers !== _guiBuffers) {
                    disableAttributes();

                    attributes.position.set(_guiBuffers._webglVertexBuffer);
                    attributes.uv.set(_guiBuffers._webglUvBuffer);

                    _lastBuffers = _guiBuffers;
                }

                style.padding.add(outerRect);
                style.margin.add(outerRect);

                uniforms.mvpMatrix.set(transform.modelView, force);
                uniforms.size.set(_vector2.set(outerRect.width, outerRect.height), force);
                uniforms.crop.set(_vector4.set(0, 0, 1, 1), force);
                uniforms.alpha.set(style.alpha, force);

                _gl.activeTexture(_gl.TEXTURE0);
                _gl.bindTexture(_gl.TEXTURE_2D, texture._webgl);
                _gl.uniform1i(uniforms.texture.location, 0);

                _gl.drawArrays(_gl.TRIANGLE_STRIP, 0, _guiBuffers._webglVertexCount);
            }


            function createTextTexture(guiContent, innerRect, text, style) {
                var texture = _textTextures[guiContent._id];
                if (!guiContent._needsUpdate) {
                    innerRect.width = texture.width;
                    innerRect.height = texture.height;
                    return texture;
                }

                var canvas = _canvas2d,
                    TEXTURE_2D = _gl.TEXTURE_2D,

                    lineHeight = style.lineHeight,
                    lineSpacing = style.lineSpacing,
                    halfLineSpacing = lineSpacing * 0.5,
                    fontHeight = determineFontHeight(style.font),
                    ctxStyle = style.fontStyle + " " + style.fontSize + "pt " + style.font,

                    maxWidth = innerRect.width,
                    maxHeight = innerRect.height,
                    width, height,

                    lines = wwLastLines,
                    line, x = 0,
                    y = 0,
                    i, il;

                texture = texture || (_textTextures[guiContent._id] = {});

                _ctx.font = ctxStyle;
                lineHeight = lineHeight > fontHeight ? lineHeight : fontHeight;

                if (style.wordWrap && !style.stretchWidth) {
                    wordWrap(text, maxWidth, lineHeight, lineSpacing);
                    width = wwLastX;
                    height = wwLastY;
                } else {
                    lines.length = 0;
                    lines.push(text);
                    width = _ctx.measureText(text).width;
                    height = lineHeight + lineSpacing;
                }

                canvas.width = style.fixedWidth || width;
                canvas.height = style.fixedHeight || height;

                _ctx.font = ctxStyle;
                _ctx.textAlign = "left";
                _ctx.textBaseline = "top";

                for (i = 0, il = lines.length; i < il; i++) {
                    line = lines[i];
                    y += halfLineSpacing;
                    _ctx.fillText(line, x, y);
                    y += lineHeight + halfLineSpacing;
                }


                texture.width = innerRect.width = width;
                texture.height = innerRect.height = height;

                texture._webgl = texture._webgl || (texture._webgl = _gl.createTexture());

                _gl.bindTexture(TEXTURE_2D, texture._webgl);

                _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, 0);

                _gl.texImage2D(TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, canvas);

                _gl.texParameteri(TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.NEAREST);
                _gl.texParameteri(TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.NEAREST);

                _gl.texParameteri(TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
                _gl.texParameteri(TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);

                _gl.bindTexture(TEXTURE_2D, null);

                guiContent._needsUpdate = false;

                return texture;
            }


            var wwLastLines = [],
                wwLastX = 0,
                wwLastY = 0;

            function wordWrap(text, maxWidth, lineHeight, lineSpacing) {
                wwLastLines.length = 0;
                wwLastX = 0;
                wwLastY = lineHeight + lineSpacing;

                var words = text.split(" "),
                    line = "",
                    word, testLine, testWidth,
                    i = 0,
                    il = words.length;

                for (; i < il; i++) {
                    word = words[i];
                    testLine = line + word + " ";
                    testWidth = _ctx.measureText(testLine).width;

                    if (testWidth > maxWidth && i > 0) {
                        wwLastLines.push(line);
                        line = word + " ";
                        wwLastY += lineHeight + lineSpacing;

                        testWidth = _ctx.measureText(line).width;
                        wwLastX = testWidth > wwLastX ? testWidth : wwLastX;
                    } else {
                        line = testLine;
                    }
                }
                wwLastLines.push(line);
            }


            var heightCache = {};

            function determineFontHeight(fontStyle) {
                var result = heightCache[fontStyle];

                if (!result) {
                    var body = document.body || document.getElementsByTagName("body")[0],
                        dummy = document.createElement("div"),
                        dummyText = document.createTextNode("M");

                    dummy.appendChild(dummyText);
                    dummy.setAttribute("style", "font: " + fontStyle + ";font-size:1em;line-height:1;position:absolute;top:0;left:0;padding:0;margin:0;");
                    body.appendChild(dummy);

                    result = dummy.offsetHeight;
                    heightCache[fontStyle] = result;

                    body.removeChild(dummy);
                }

                return result;
            }


            function renderMeshFilter(camera, lights, ambient, transform, meshFilter) {
                var mesh = meshFilter.mesh,
                    material = meshFilter.material,
                    side, shader;

                if (!mesh || !material) return;

                setBlending(material.blending);

                side = material.side;
                if (side === Side.Front) {
                    setCullFace(CullFace.Back);
                } else if (side === Side.Back) {
                    setCullFace(CullFace.Front);
                } else if (side === Side.Both) {
                    setCullFace();
                }

                createMeshBuffers(mesh);
                shader = createShader(mesh, material, lights);
                shader.bind(meshFilter, mesh, material, transform, camera, lights, ambient);

                if (!meshFilter._webglMeshInitted) {
                    mesh._webglUsed += 1;
                    shader.markAsUsed(material);
                    meshFilter._webglMeshInitted = true;
                }

                if (material.wireframe) {
                    setLineWidth(material.wireframeLineWidth);
                    _gl.drawElements(_gl.LINES, mesh._webglLineCount, _gl.UNSIGNED_SHORT, 0);
                } else {
                    _gl.drawElements(_gl.TRIANGLES, mesh._webglIndexCount, _gl.UNSIGNED_SHORT, 0);
                }
            }


            function renderSprite(camera, lights, ambient, transform, sprite) {
                var material = sprite.material,
                    side, shader;

                if (!material) return;
                if (!_spriteBuffers) createSprite();

                setBlending(material.blending);

                side = material.side;
                if (side === Side.Front) {
                    setCullFace(CullFace.Back);
                } else if (side === Side.Back) {
                    setCullFace(CullFace.Front);
                } else if (side === Side.Both) {
                    setCullFace();
                }

                shader = createShader(sprite, material, lights);

                if (!sprite._webglInitted) {
                    shader.markAsUsed(material);
                    sprite._webglInitted = true;
                }

                shader.bind(sprite, sprite, material, transform, camera, lights, ambient);

                if (material.wireframe) {
                    setLineWidth(material.wireframeLineWidth);
                    _gl.drawArrays(_gl.LINE_STRIP, 0, _spriteBuffers._webglVertexCount);
                } else {
                    _gl.drawArrays(_gl.TRIANGLE_STRIP, 0, _spriteBuffers._webglVertexCount);
                }
            }


            function renderParticleSystem(camera, lights, ambient, transform, particleSystem) {
                var emitters = particleSystem.emitters,
                    material = particleSystem.material,
                    shader, emitter,
                    i = emitters.length;

                setCullFace(CullFace.Back);

                while (i--) {
                    emitter = emitters[i];

                    if (emitter instanceof Emitter) {
                        material = emitter.material;
                        if (!material) return;

                        setBlending(material.blending);
                        setCullFace(CullFace.Back);

                        createEmitterBuffers(emitter, transform);
                        shader = createShader(emitter, material, lights);
                        shader.bind(particleSystem, emitter, material, transform, camera, lights, ambient);

                        if (!emitter._webglInitted) {
                            shader.markAsUsed(material);
                            emitter._webglInitted = true;
                        }

                        _gl.drawArrays(_gl.POINTS, 0, emitter._webglParticleCount);
                    } else if (emitter instanceof Emitter2D) {
                        material = emitter.material;
                        if (!material) return;

                        setBlending(material.blending);
                        setCullFace(CullFace.Back);

                        createEmitter2DBuffers(emitter, transform);
                        shader = createShader(emitter, material, lights);
                        shader.bind(particleSystem, emitter, material, transform, camera, lights, ambient);

                        if (!emitter._webglInitted) {
                            shader.markAsUsed(material);
                            emitter._webglInitted = true;
                        }

                        _gl.drawArrays(_gl.POINTS, 0, emitter._webglParticleCount);
                    }
                }
            }

            function addSceneEvents(scene) {
                var components = scene.components,
                    meshFilters = components.MeshFilter || EMPTY_ARRAY,
                    sprites = components.Sprite || EMPTY_ARRAY,
                    particleSystems = components.ParticleSystem || EMPTY_ARRAY,
                    i;

                i = meshFilters.length;
                while (i--) meshFilters[i].on("remove", onMeshFilterRemove);

                i = sprites.length;
                while (i--) sprites[i].on("remove", onSpriteRemove);

                i = particleSystems.length;
                while (i--) particleSystems[i].on("remove", onParticleSystemRemove);

                scene.on("addMeshFilter", onMeshFilterAdd);
                scene.on("addSprite", onSpriteAdd);
                scene.on("addParticleSystem", onParticleSystemAdd);
            }

            function removeSceneEvents(scene) {

                scene.off("addMeshFilter", onMeshFilterAdd);
                scene.off("addSprite", onSpriteAdd);
                scene.off("addParticleSystem", onMeshFilterAdd);
            }

            function onMeshFilterAdd(meshFilter) {

                meshFilter.on("remove", onMeshFilterRemove);
            }

            function onSpriteAdd(sprite) {

                sprite.on("remove", onSpriteRemove);
            }

            function onParticleSystemAdd(particleSystem) {

                particleSystem.on("remove", onParticleSystemRemove);
            }

            function onMeshFilterRemove() {
                var mesh = this.mesh;

                deleteMeshBuffers(mesh);
                deleteShader(mesh);

                this.off("remove", onMeshFilterRemove);
            }

            function onSpriteRemove() {

                deleteShader(this);

                this.off("remove", onSpriteRemove);
            }

            function onParticleSystemRemove() {
                var emitters = this.emitters,
                    emitter, i = emitters.length;

                while (i--) {
                    emitter = emitters[i];

                    deleteEmitterBuffers(emitter);
                    deleteShader(emitter);
                }

                this.off("remove", onParticleSystemRemove);
            }

            function deleteMeshBuffers(mesh) {
                if (mesh._webglUsed > 1) {
                    mesh._webglUsed -= 1;
                    return;
                }

                if (mesh._webglVertexBuffer != undefined) _gl.deleteBuffer(mesh._webglVertexBuffer);
                if (mesh._webglNormalBuffer != undefined) _gl.deleteBuffer(mesh._webglNormalBuffer);
                if (mesh._webglTangentBuffer != undefined) _gl.deleteBuffer(mesh._webglTangentBuffer);
                if (mesh._webglColorBuffer != undefined) _gl.deleteBuffer(mesh._webglColorBuffer);
                if (mesh._webglUvBuffer != undefined) _gl.deleteBuffer(mesh._webglUvBuffer);
                if (mesh._webglUv2Buffer != undefined) _gl.deleteBuffer(mesh._webglUv2Buffer);

                if (mesh._webglBoneIndexBuffer != undefined) _gl.deleteBuffer(mesh._webglBoneIndexBuffer);
                if (mesh._webglBoneWeightBuffer != undefined) _gl.deleteBuffer(mesh._webglBoneWeightBuffer);

                if (mesh._webglIndexBuffer != undefined) _gl.deleteBuffer(mesh._webglIndexBuffer);
                if (mesh._webglLineBuffer != undefined) _gl.deleteBuffer(mesh._webglLineBuffer);

                mesh._webglVertexArray = mesh._webglVertexArray = undefined;
                mesh._webglNormalBuffer = mesh._webglNormalArray = undefined;
                mesh._webglTangentBuffer = mesh._webglTangentArray = undefined;
                mesh._webglColorBuffer = mesh._webglColorArray = undefined;
                mesh._webglUvBuffer = mesh._webglUvArray = undefined;
                mesh._webglUv2Buffer = mesh._webglUv2Array = undefined;

                mesh._webglBoneIndexBuffer = mesh._webglBoneIndexArray = undefined;
                mesh._webglBoneWeightBuffer = mesh._webglBoneWeightArray = undefined;

                mesh._webglIndexBuffer = mesh._webglIndexArray = undefined;
                mesh._webglLineBuffer = mesh._webglLineArray = undefined;

                mesh._webglUsed = 0;
            }

            function deleteEmitterBuffers(emitter) {

                if (emitter._webglVertexBuffer != undefined) _gl.deleteBuffer(emitter._webglVertexBuffer);
                if (emitter._webglParticleBuffer != undefined) _gl.deleteBuffer(emitter._webglParticleBuffer);
                if (emitter._webglParticleColorBuffer != undefined) _gl.deleteBuffer(emitter._webglParticleColorBuffer);

                emitter._webglVertexBuffer = emitter._webglVertexArray = undefined;
                emitter._webglParticleBuffer = emitter._webglParticleArray = undefined;
                emitter._webglParticleColorBuffer = emitter._webglParticleColorArray = undefined;
            }

            function addGUIEvents(gui) {
                var components = gui.components,
                    guiContents = components.GUIContent || EMPTY_ARRAY,
                    i;

                i = guiContents.length;
                while (i--) guiContents[i].on("remove", onGUIContentRemove);

                gui.on("addGUIContent", onGUIContentAdd);
            }

            function removeGUIEvents(gui) {

                gui.off("addGUIContent", onGUIContentAdd);
            }

            function onGUIContentAdd(guiContent) {

                guiContent.on("remove", onGUIContentRemove);
            }

            function onGUIContentRemove() {

                deleteShader(this);

                this.off("remove", onGUIContentRemove);
            }

            function deleteShader(obj) {
                var shader = _shaders[obj._id];
                if (!shader) return;
                var material = obj.material || obj.materials,
                    i;

                if (material) {
                    i = material.length;

                    if (i) {
                        while (i--) deleteMaterial(material[i]);
                    } else {
                        deleteMaterial(material);
                    }
                }

                if (shader.used > 1) {
                    shader.used--;
                    return;
                }

                _shaders[obj._id] = undefined;
                if (shader.program) _gl.deleteProgram(shader.program);
            }

            function deleteMaterial(material) {
                var materialUniforms = material.uniforms,
                    key;

                for (key in materialUniforms) deleteTexture(materialUniforms[key]);
            }

            function deleteTexture(obj) {
                if (obj instanceof Texture) {
                    if (obj._webglUsed > 1) {
                        obj._webglUsed -= 1;
                        return;
                    }

                    _gl.deleteTexture(obj._webgl);
                    obj._webgl = undefined;
                    obj._webglUsed = 0;
                } else if (obj instanceof TextureCube) {
                    if (obj._webglUsed > 1) {
                        obj._webglUsed -= 1;
                        return;
                    }

                    var j = obj._webgl.length;
                    while (j--) {
                        _gl.deleteTexture(obj._webgl[j]);
                        obj._webgl[j] = undefined;
                        obj._webglUsed = 0;
                    }
                }
            }

            function createMeshBuffers(mesh) {
                if (!mesh.dynamic && mesh._webglBuffersInitted) return;
                var DRAW = mesh.dynamic ? _gl.DYNAMIC_DRAW : _gl.STATIC_DRAW,
                    ARRAY_BUFFER = _gl.ARRAY_BUFFER,
                    ELEMENT_ARRAY_BUFFER = _gl.ELEMENT_ARRAY_BUFFER,
                    bufferArray, items, item, i, len, offset, vertexIndex;

                items = mesh.vertices || EMPTY_ARRAY;
                len = items.length;
                if (len && mesh.verticesNeedUpdate) {
                    bufferArray = mesh._webglVertexArray;
                    if (!bufferArray || bufferArray.length !== len * 3) {
                        bufferArray = mesh._webglVertexArray = new Float32Array(len * 3);
                        mesh._webglVertexCount = len;
                    }

                    i = len;
                    while (i--) {
                        item = items[i];
                        offset = i * 3;

                        bufferArray[offset] = item.x;
                        bufferArray[offset + 1] = item.y;
                        bufferArray[offset + 2] = item.z;
                    }

                    mesh._webglVertexBuffer = mesh._webglVertexBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ARRAY_BUFFER, mesh._webglVertexBuffer);
                    _gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                    mesh.verticesNeedUpdate = false;
                }

                items = mesh.normals || EMPTY_ARRAY;
                len = items.length;
                if (len && mesh.normalsNeedUpdate) {
                    bufferArray = mesh._webglNormalArray;
                    if (!bufferArray || bufferArray.length !== len * 3) bufferArray = mesh._webglNormalArray = new Float32Array(len * 3);

                    i = len;
                    while (i--) {
                        item = items[i];
                        offset = i * 3;

                        bufferArray[offset] = item.x;
                        bufferArray[offset + 1] = item.y;
                        bufferArray[offset + 2] = item.z;
                    }

                    mesh._webglNormalBuffer = mesh._webglNormalBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ARRAY_BUFFER, mesh._webglNormalBuffer);
                    _gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                    mesh.normalsNeedUpdate = false;
                }

                items = mesh.tangents || EMPTY_ARRAY;
                len = items.length;
                if (len && mesh.tangentsNeedUpdate) {
                    bufferArray = mesh._webglTangentArray;
                    if (!bufferArray || bufferArray.length !== len * 4) bufferArray = mesh._webglTangentArray = new Float32Array(len * 4);

                    i = len;
                    while (i--) {
                        item = items[i];
                        offset = i * 4;

                        bufferArray[offset] = item.x;
                        bufferArray[offset + 1] = item.y;
                        bufferArray[offset + 2] = item.z;
                        bufferArray[offset + 3] = item.w;
                    }

                    mesh._webglTangentBuffer = mesh._webglTangentBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ARRAY_BUFFER, mesh._webglTangentBuffer);
                    _gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                    mesh.tangentsNeedUpdate = false;
                }

                items = mesh.indices || EMPTY_ARRAY;
                len = items.length;
                if (len && mesh.indicesNeedUpdate) {
                    bufferArray = mesh._webglIndexArray;
                    if (!bufferArray || bufferArray.length !== len) {
                        bufferArray = mesh._webglIndexArray = new Uint16Array(len);
                        mesh._webglIndexCount = len;
                    }

                    i = len;
                    while (i--) bufferArray[i] = items[i];

                    mesh._webglIndexBuffer = mesh._webglIndexBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ELEMENT_ARRAY_BUFFER, mesh._webglIndexBuffer);
                    _gl.bufferData(ELEMENT_ARRAY_BUFFER, bufferArray, DRAW);

                    bufferArray = mesh._webglLineArray;
                    if (!bufferArray || bufferArray.length !== len * 3) {
                        bufferArray = mesh._webglLineArray = new Uint16Array(len * 3);
                        mesh._webglLineCount = len * 3;
                    }

                    i = len;
                    vertexIndex = offset = 0;
                    while (i--) {

                        bufferArray[offset] = items[vertexIndex];
                        bufferArray[offset + 1] = items[vertexIndex + 1];

                        bufferArray[offset + 2] = items[vertexIndex];
                        bufferArray[offset + 3] = items[vertexIndex + 2];

                        bufferArray[offset + 4] = items[vertexIndex + 1];
                        bufferArray[offset + 5] = items[vertexIndex + 2];

                        offset += 6;
                        vertexIndex += 3;
                    }

                    mesh._webglLineBuffer = mesh._webglLineBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ELEMENT_ARRAY_BUFFER, mesh._webglLineBuffer);
                    _gl.bufferData(ELEMENT_ARRAY_BUFFER, bufferArray, DRAW);

                    mesh.indicesNeedUpdate = false;
                }

                items = mesh.colors || EMPTY_ARRAY;
                len = items.length;
                if (len && mesh.colorsNeedUpdate) {
                    bufferArray = mesh._webglColorArray;
                    if (!bufferArray || bufferArray.length !== len * 3) bufferArray = mesh._webglColorArray = new Float32Array(len * 3);

                    i = len;
                    while (i--) {
                        item = items[i];
                        offset = i * 3;

                        bufferArray[offset] = item.x;
                        bufferArray[offset + 1] = item.y;
                        bufferArray[offset + 2] = item.z;
                    }

                    mesh._webglColorBuffer = mesh._webglColorBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ARRAY_BUFFER, mesh._webglColorBuffer);
                    _gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                    mesh.colorsNeedUpdate = false;
                }

                items = mesh.uvs || EMPTY_ARRAY;
                len = items.length;
                if (len && mesh.uvsNeedUpdate) {
                    bufferArray = mesh._webglUvArray;
                    if (!bufferArray || bufferArray.length !== len * 2) bufferArray = mesh._webglUvArray = new Float32Array(len * 2);

                    i = len;
                    while (i--) {
                        item = items[i];
                        offset = i * 2;

                        bufferArray[offset] = item.x;
                        bufferArray[offset + 1] = item.y;
                    }

                    mesh._webglUvBuffer = mesh._webglUvBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ARRAY_BUFFER, mesh._webglUvBuffer);
                    _gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                    mesh.uvsNeedUpdate = false;
                }

                items = mesh.uv2s || EMPTY_ARRAY;
                len = items.length;
                if (len && mesh.uv2sNeedUpdate) {
                    bufferArray = mesh._webglUv2Array;
                    if (!bufferArray || bufferArray.length !== len * 2) bufferArray = mesh._webglUv2Array = new Float32Array(len * 2);

                    i = len;
                    while (i--) {
                        item = items[i];
                        offset = i * 2;

                        bufferArray[offset] = item.x;
                        bufferArray[offset + 1] = item.y;
                    }

                    mesh._webglUv2Buffer = mesh._webglUv2Buffer || _gl.createBuffer();
                    _gl.bindBuffer(ARRAY_BUFFER, mesh._webglUv2Buffer);
                    _gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                    mesh.uvsNeedUpdate = false;
                }

                items = mesh.boneIndices || EMPTY_ARRAY;
                len = items.length;
                if (len && mesh.boneIndicesNeedUpdate) {
                    bufferArray = mesh._webglBoneIndexArray;
                    if (!bufferArray || bufferArray.length !== len) bufferArray = mesh._webglBoneIndexArray = new Float32Array(len);

                    i = len;
                    while (i--) bufferArray[i] = items[i];

                    mesh._webglBoneIndexBuffer = mesh._webglBoneIndexBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ARRAY_BUFFER, mesh._webglBoneIndexBuffer);
                    _gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                    mesh.boneIndicesNeedUpdate = false;
                }

                items = mesh.boneWeights || EMPTY_ARRAY;
                len = items.length;
                if (len && mesh.boneWeightsNeedUpdate) {
                    bufferArray = mesh._webglBoneWeightArray;
                    if (!bufferArray || bufferArray.length !== len) bufferArray = mesh._webglBoneWeightArray = new Float32Array(len);

                    i = len;
                    while (i--) bufferArray[i] = items[i];

                    mesh._webglBoneWeightBuffer = mesh._webglBoneWeightBuffer || _gl.createBuffer();
                    _gl.bindBuffer(ARRAY_BUFFER, mesh._webglBoneWeightBuffer);
                    _gl.bufferData(ARRAY_BUFFER, bufferArray, DRAW);

                    mesh.boneWeightsNeedUpdate = false;
                }

                mesh._webglBuffersInitted = true;
            }


            function createEmitterBuffers(emitter, transform) {
                var MAX = Emitter.MAX_PARTICLES,

                    DRAW = _gl.DYNAMIC_DRAW,
                    ARRAY_BUFFER = _gl.ARRAY_BUFFER,

                    positionArray, dataArray, colorArray,
                    positionBuffer, dataBuffer, colorBuffer,

                    particles = emitter.particles,
                    particle,
                    i = 0,
                    len = particles.length,
                    offset, position, color,
                    me, x, y, z,
                    m13, m23, m33, m43,
                    m14, m24, m34, m44

                if (len) {
                    if (emitter.sort) {
                        emitter.worldSpace ? _mat4.copy(_projScreenMatrix) : _mat4.mmul(_projScreenMatrix, transform.matrixWorld);
                        me = _mat4.elements;
                        m13 = me[2];
                        m23 = me[6];
                        m33 = me[10];
                        m43 = me[14];
                        m14 = me[3];
                        m24 = me[7];
                        m34 = me[11];
                        m44 = me[15];

                        i = len;
                        while (i--) {
                            particle = particles[i];
                            position = particle.position;
                            x = position.x;
                            y = position.y;
                            z = position.z;

                            particle.z = (m13 * x + m23 * y + m33 * z + m43) / (m14 * x + m24 * y + m34 * z + m44);
                        }

                        particles.sort(zSort);
                    }

                    positionArray = emitter._webglVertexArray || (emitter._webglVertexArray = new Float32Array(MAX * 3));
                    dataArray = emitter._webglParticleArray || (emitter._webglParticleArray = new Float32Array(MAX * 3));
                    colorArray = emitter._webglParticleColorArray || (emitter._webglParticleColorArray = new Float32Array(MAX * 3));

                    i = len;
                    while (i--) {
                        particle = particles[i];
                        position = particle.position;
                        color = particle.color;
                        offset = i * 3;

                        positionArray[offset] = position.x;
                        positionArray[offset + 1] = position.y;
                        positionArray[offset + 2] = position.z;

                        dataArray[offset] = particle.angle;
                        dataArray[offset + 1] = particle.size;
                        dataArray[offset + 2] = particle.alpha;

                        colorArray[offset] = color.r;
                        colorArray[offset + 1] = color.g;
                        colorArray[offset + 2] = color.b;
                    }

                    positionBuffer = emitter._webglVertexBuffer || (emitter._webglVertexBuffer = _gl.createBuffer());
                    _gl.bindBuffer(ARRAY_BUFFER, positionBuffer);
                    _gl.bufferData(ARRAY_BUFFER, positionArray, DRAW);

                    dataBuffer = emitter._webglParticleBuffer || (emitter._webglParticleBuffer = _gl.createBuffer());
                    _gl.bindBuffer(ARRAY_BUFFER, dataBuffer);
                    _gl.bufferData(ARRAY_BUFFER, dataArray, DRAW);

                    colorBuffer = emitter._webglParticleColorBuffer || (emitter._webglParticleColorBuffer = _gl.createBuffer());
                    _gl.bindBuffer(ARRAY_BUFFER, colorBuffer);
                    _gl.bufferData(ARRAY_BUFFER, colorArray, DRAW);
                }

                emitter._webglParticleCount = len;
            }


            function createEmitter2DBuffers(emitter) {
                var MAX = Emitter2D.MAX_PARTICLES,

                    DRAW = _gl.DYNAMIC_DRAW,
                    ARRAY_BUFFER = _gl.ARRAY_BUFFER,

                    positionArray, dataArray, colorArray,
                    positionBuffer, dataBuffer, colorBuffer,

                    particles = emitter.particles,
                    particle,
                    i = 0,
                    len = particles.length,
                    offset, position, color;

                if (len) {
                    positionArray = emitter._webglVertexArray || (emitter._webglVertexArray = new Float32Array(MAX * 3));
                    dataArray = emitter._webglParticleArray || (emitter._webglParticleArray = new Float32Array(MAX * 3));
                    colorArray = emitter._webglParticleColorArray || (emitter._webglParticleColorArray = new Float32Array(MAX * 3));

                    i = len;
                    while (i--) {
                        particle = particles[i];
                        position = particle.position;
                        color = particle.color;
                        offset = i * 3;

                        positionArray[offset] = position.x;
                        positionArray[offset + 1] = position.y;
                        positionArray[offset + 2] = 0.0;

                        dataArray[offset] = particle.angle;
                        dataArray[offset + 1] = particle.size;
                        dataArray[offset + 2] = particle.alpha;

                        colorArray[offset] = color.r;
                        colorArray[offset + 1] = color.g;
                        colorArray[offset + 2] = color.b;
                    }

                    positionBuffer = emitter._webglVertexBuffer || (emitter._webglVertexBuffer = _gl.createBuffer());
                    _gl.bindBuffer(ARRAY_BUFFER, positionBuffer);
                    _gl.bufferData(ARRAY_BUFFER, positionArray, DRAW);

                    dataBuffer = emitter._webglParticleBuffer || (emitter._webglParticleBuffer = _gl.createBuffer());
                    _gl.bindBuffer(ARRAY_BUFFER, dataBuffer);
                    _gl.bufferData(ARRAY_BUFFER, dataArray, DRAW);

                    colorBuffer = emitter._webglParticleColorBuffer || (emitter._webglParticleColorBuffer = _gl.createBuffer());
                    _gl.bindBuffer(ARRAY_BUFFER, colorBuffer);
                    _gl.bufferData(ARRAY_BUFFER, colorArray, DRAW);
                }

                emitter._webglParticleCount = len;
            }


            function zSort(a, b) {

                return b.z - a.z;
            }


            function createShader(obj, material, lights) {
                if (!material.needsUpdate && (_shaders[obj._id])) return _shaders[obj._id];

                var shader = material.shader,
                    uniforms = material.uniforms,
                    OES_standard_derivatives = !! _extensions.OES_standard_derivatives,
                    parameters = {};

                parameters.mobile = Device.mobile;

                if (obj instanceof MeshFilter) {
                    parameters.mesh = true;
                } else if (obj instanceof Sprite) {
                    parameters.sprite = true;
                } else if (obj instanceof Emitter) {
                    parameters.emitter = true;
                    parameters.worldSpace = obj.worldSpace;
                } else if (obj instanceof Emitter2D) {
                    parameters.emitter = true;
                    parameters.emitter2d = true;
                    parameters.worldSpace = obj.worldSpace;
                }

                parameters.useLights = shader.lights;
                parameters.useShadows = shader.shadows;
                parameters.useFog = shader.fog;
                parameters.useBones = obj.useBones && obj.bones.length > 0;
                parameters.useVertexLit = shader.vertexLit;
                parameters.useSpecular = shader.specular;

                parameters.useNormal = !! uniforms.normalMap;
                parameters.useBump = !! uniforms.bumpMap;

                parameters.positions = true;
                parameters.normals = parameters.useNormal || (obj.normals && obj.normals.length > 0);
                parameters.tangents = parameters.useNormal || (obj.tangents && obj.tangents.length > 0);
                parameters.uvs = parameters.sprite || (obj.uvs && obj.uvs.length > 0);
                parameters.colors = parameters.sprite || (obj.colors && obj.colors.length > 0);

                parameters.OES_standard_derivatives = OES_standard_derivatives && shader.OES_standard_derivatives;

                if (parameters.useBones) parameters.bones = obj.bones.length;
                allocateLights(lights, parameters);
                allocateShadows(lights, parameters);

                parameters.shadowMapEnabled = _this.shadowMapEnabled && material.receiveShadow && parameters.maxShadows > 0;
                parameters.shadowMapType = _this.shadowMapType;
                parameters.shadowMapDebug = _this.shadowMapDebug;
                parameters.shadowMapCascade = _this.shadowMapCascade;

                material.needsUpdate = false;
                return (_shaders[obj._id] = createShaderProgram(shader.vertex, shader.fragment, parameters));
            }


            function allocateLights(lights, parameters) {
                var maxPointLights = 0,
                    maxDirectionalLights = 0,
                    maxSpotLights = 0,
                    maxHemiLights = 0,
                    light, type,
                    i = lights.length;

                while (i--) {
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
                    i = lights.length;

                while (i--) {
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

            function createShaderProgram(vertexShader, fragmentShader, parameters) {
                var chunks = [],
                    key, program, code, key;

                chunks.push(vertexShader, fragmentShader);
                for (key in parameters) chunks.push(key, parameters[key]);

                code = chunks.join();

                for (key in _shaders) {
                    program = _shaders[key];

                    if (program.code === code) {
                        program.used++;
                        return program;
                    }
                }

                program = new Shader(vertexShader, fragmentShader, parameters, code).buildShader();
                return program;
            }


            var HEADER = /([\s\S]*)?(void[\s]+main)/,
                MAIN_FUNCTION = /void[\s]+main([\s]+)?(\((void)?\))([\s]+)?{([^}]*)}/,
                MAIN_SPLITER = /void[\s]+main([\s]+)?(\((void)?\))([\s]+)?{/;

            function Shader(vertex, fragment, parameters, code) {

                this.vertex = vertex;
                this.fragment = fragment;
                this.parameters = parameters;
                this.code = code;
                this.used = 0;

                this.program = undefined;
                this.attributes = undefined;
                this.uniforms = undefined;
                this._customAttributes = undefined;
                this._customUniforms = undefined;
            }

            Shader.prototype.markAsUsed = function(material) {
                this.used += 1;

                if (material) {
                    var uniforms = material.uniforms,
                        uniform, key;

                    for (key in uniforms) {
                        uniform = uniforms[key];

                        if (uniform instanceof Texture) {
                            uniform._webglUsed += 1;
                        } else if (uniform instanceof TextureCube) {
                            uniform._webglUsed += 1;
                        }
                    }
                }
            }

            Shader.prototype.bind = function(component, obj, material, transform, camera, lights, ambient) {
                var program = this.program,
                    parameters = this.parameters,
                    uniforms = this.uniforms,
                    attributes = this.attributes,
                    force = setProgram(program),
                    sprite = parameters.sprite,
                    texture, w, h, i, length, particleSizeRatio, bone, boneTransform, bones, uBonesPos, uBonesScl, uBonesRot;

                if (sprite) {
                    if (_lastBuffers !== _spriteBuffers) {
                        disableAttributes();

                        attributes.position.set(_spriteBuffers._webglVertexBuffer);
                        attributes.uv.set(_spriteBuffers._webglUvBuffer);

                        if (attributes.normal) attributes.normal.set(_spriteBuffers._webglNormalBuffer);
                        if (attributes.tangent) attributes.tangent.set(_spriteBuffers._webglTangentBuffer);

                        _lastBuffers = _spriteBuffers;
                    }
                } else {
                    if (_lastBuffers !== obj) {
                        disableAttributes();

                        if (obj._webglVertexBuffer && attributes.position) attributes.position.set(obj._webglVertexBuffer);
                        if (obj._webglNormalBuffer && attributes.normal) attributes.normal.set(obj._webglNormalBuffer);
                        if (obj._webglTangentBuffer && attributes.tangent) attributes.tangent.set(obj._webglTangentBuffer);
                        if (obj._webglColorBuffer && attributes.color) attributes.color.set(obj._webglColorBuffer);

                        if (obj._webglUvBuffer && attributes.uv) attributes.uv.set(obj._webglUvBuffer);
                        if (obj._webglUv2Buffer && attributes.uv2) attributes.uv2.set(obj._webglUv2Buffer);

                        if (obj._webglBoneIndexBuffer && attributes.boneIndex) attributes.boneIndex.set(obj._webglBoneIndexBuffer);
                        if (obj._webglBoneWeightBuffer && attributes.boneWeight) attributes.boneWeight.set(obj._webglBoneWeightBuffer);

                        if (obj._webglParticleBuffer && attributes.data) attributes.data.set(obj._webglParticleBuffer);
                        if (obj._webglParticleColorBuffer && attributes.particleColor) attributes.particleColor.set(obj._webglParticleColorBuffer);

                        if (material.wireframe) {
                            if (obj._webglLineBuffer) _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, obj._webglLineBuffer);
                        } else {
                            if (obj._webglIndexBuffer) _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, obj._webglIndexBuffer);
                        }

                        _lastBuffers = obj;
                    }
                }

                if (sprite) {
                    texture = material.uniforms.diffuseMap;
                    if (!texture) throw "Shader.bind: Sprite material and shader requires diffuseMap";

                    w = texture.invWidth;
                    h = texture.invHeight;

                    uniforms.size.set(_vector2.set(obj.width, obj.height), force);
                    uniforms.crop.set(_vector4.set(obj.x * w, obj.y * h, obj.w * w, obj.h * h), force);
                }

                if (parameters.emitter && parameters.worldSpace) {
                    if (uniforms.modelMatrix) uniforms.modelMatrix.set(_mat4.identity(), force);
                    if (uniforms.modelViewMatrix) uniforms.modelViewMatrix.set(camera.view, force);
                } else {
                    if (uniforms.modelMatrix) uniforms.modelMatrix.set(transform.matrixWorld, force);
                    if (uniforms.modelViewMatrix) uniforms.modelViewMatrix.set(transform.modelView, force);
                }
                if (uniforms.particleSizeRatio) {
                    particleSizeRatio = (_currentWidth < _currentHeight ? _currentWidth : _currentHeight);

                    if (parameters.emitter2d || camera.camera2d || camera.orthographic) {
                        particleSizeRatio *= 1.0 / (camera.orthographicSize * 2.0);
                    } else {
                        particleSizeRatio *= 2.0;
                    }

                    uniforms.particleSizeRatio.set(particleSizeRatio);
                }

                if (uniforms.projectionMatrix) uniforms.projectionMatrix.set(camera.projection, force);
                if (uniforms.viewMatrix) uniforms.viewMatrix.set(camera.view, force);
                if (uniforms.normalMatrix) uniforms.normalMatrix.set(transform.normalMatrix, force);
                if (uniforms.cameraPosition) uniforms.cameraPosition.set(_vector3.positionFromMat4((camera.transform || camera.transform2d).matrixWorld), force);
                if (uniforms.ambient) uniforms.ambient.set(ambient, force);

                if (parameters.useBones) {
                    uBonesPos = uniforms.bonesPos;
                    uBonesScl = uniforms.bonesScl;
                    uBonesRot = uniforms.bonesRot;
                    bones = component._bones;
                    i = bones.length;
                    while (i--) {
                        bone = bones[i];
                        boneTransform = bone.transform;
                        _mat4.mmul(bone.uniform, bone.bindPose).decompose(_vector3, _vector3_2, _quat);

                        uBonesPos[i].set(_vector3);
                        uBonesScl[i].set(_vector3_2);
                        uBonesRot[i].set(_quat);
                    }
                }

                if (force && parameters.useLights && (length = lights.length)) {
                    var maxPointLights = parameters.maxPointLights,
                        maxDirectionalLights = parameters.maxDirectionalLights,
                        maxSpotLights = parameters.maxSpotLights,
                        maxHemiLights = parameters.maxHemiLights,

                        pointLights = 0,
                        pointLightColor = uniforms.pointLightColor,
                        pointLightPosition = uniforms.pointLightPosition,
                        pointLightDistance = uniforms.pointLightDistance,

                        directionalLights = 0,
                        directionalLightColor = uniforms.directionalLightColor,
                        directionalLightDirection = uniforms.directionalLightDirection,

                        spotLights = 0,
                        spotLightColor = uniforms.spotLightColor,
                        spotLightPosition = uniforms.spotLightPosition,
                        spotLightDirection = uniforms.spotLightDirection,
                        spotLightDistance = uniforms.spotLightDistance,
                        spotLightAngleCos = uniforms.spotLightAngleCos,
                        spotLightExponent = uniforms.spotLightExponent,

                        hemiLights = 0,
                        hemiLightColor = uniforms.hemiLightColor,
                        hemiLightDirection = uniforms.hemiLightDirection,

                        light, type;

                    for (i = 0; i < length; i++) {
                        light = lights[i];
                        if (!light.visible) continue;

                        type = light.type;
                        _color.copy(light.color).smul(light.energy);

                        if (pointLightColor.length && type === LightType.Point) {
                            if (pointLights >= maxPointLights) continue;

                            _vector3.positionFromMat4((light.transform || light.transform2d).matrixWorld);

                            pointLightColor[pointLights].set(_color, force);
                            pointLightPosition[pointLights].set(_vector3, force);
                            pointLightDistance[pointLights].set(light.distance, force);
                            pointLights++;
                        } else if (directionalLightColor.length && type === LightType.Directional) {
                            if (directionalLights >= maxDirectionalLights) continue;

                            _vector3.positionFromMat4((light.transform || light.transform2d).matrixWorld).sub(light.target).normalize();
                            if (_vector3.lengthSq() === 0) continue;

                            directionalLightColor[directionalLights].set(_color, force);
                            directionalLightDirection[directionalLights].set(_vector3, force);
                            directionalLights++;

                        } else if (spotLightColor.length && type === LightType.Spot) {
                            if (spotLights >= maxSpotLights) continue;

                            _vector3.positionFromMat4((light.transform || light.transform2d).matrixWorld);
                            if (_vector3.lengthSq() === 0) continue;

                            _vector3_2.copy(_vector3).sub(light.target).normalize();
                            if (_vector3_2.lengthSq() === 0) continue;

                            spotLightColor[spotLights].set(_color, force);
                            spotLightPosition[spotLights].set(_vector3, force);
                            spotLightDirection[spotLights].set(_vector3_2, force);
                            spotLightDistance[spotLights].set(light.distance, force);
                            spotLightAngleCos[spotLights].set(light._angleCos, force);
                            spotLightExponent[spotLights].set(light.exponent, force);
                            spotLights++;

                        } else if (hemiLightColor.length && type === LightType.Hemi) {
                            if (hemiLights >= maxHemiLights) continue;

                            _vector3.positionFromMat4((light.transform || light.transform2d).matrixWorld).sub(light.target).normalize();
                            if (_vector3.lengthSq() === 0) continue;

                            hemiLightColor[hemiLights].set(_color, force);
                            hemiLightDirection[hemiLights].set(_vector3, force);
                            hemiLights++;
                        }
                    }
                }

                bindCustomUniforms(this._customUniforms, uniforms, material.name, material.uniforms, force);
                _textureIndex = 0;
            };

            function bindCustomUniforms(customUniforms, uniforms, materialName, materialUniforms, force) {
                var i = customUniforms.length,
                    customUniform, uniformValue, length, name, value, j;

                while (i--) {
                    customUniform = customUniforms[i];
                    name = customUniform;

                    uniformValue = uniforms[name];
                    value = materialUniforms[name];

                    if (!uniformValue) continue;
                    if (!value) throw "WebGLRenderer bindShader: material " + materialName + " was not given a uniform named " + name;

                    if ((length = uniformValue.length)) {
                        j = length;
                        while (j--) uniformValue.set(value[j], force);
                    } else {
                        uniformValue.set(value, force);
                    }
                }
            }

            Shader.prototype.buildShader = function() {
                var parameters = this.parameters,
                    vertexShader = this.vertex,
                    fragmentShader = this.fragment,
                    sprite = parameters.sprite,
                    emitter = parameters.emitter,
                    useLights = parameters.useLights,
                    useShadows = parameters.useShadows,
                    useFog = parameters.useFog,
                    useBones = parameters.useBones,
                    useVertexLit = parameters.useVertexLit,
                    useSpecular = parameters.useSpecular,
                    OES_standard_derivatives = parameters.OES_standard_derivatives,

                    definesPrefix = [
                        "precision " + _precision + " float;",
                        "precision " + _precision + " int;",

                        useFog ? "#define USE_FOG" : "",
                        useLights ? "#define USE_LIGHTS" : "",
                        useShadows ? "#define USE_SHADOWS" : "",
                        useBones ? "#define USE_SKINNING" : "",
                        sprite ? "#define IS_SPRITE" : "",

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
                        emitter ? "attribute vec3 data;" : "",

                        useBones ? "attribute vec3 boneIndex;" : "",
                        useBones ? "attribute vec3 boneWeight;" : "",
                        useBones ? "uniform vec4 bonesRot[" + parameters.bones + "];" : "",
                        useBones ? "uniform vec3 bonesScl[" + parameters.bones + "];" : "",
                        useBones ? "uniform vec3 bonesPos[" + parameters.bones + "];" : ""
                    ].join("\n"),

                    fragmentPrefix = [
                        OES_standard_derivatives ? "#extension GL_OES_standard_derivatives : enable" : "",
                        definesPrefix,

                        "uniform mat4 viewMatrix;",
                        "uniform vec3 cameraPosition;"
                    ].join("\n"),

                    glVertexShader = vertexPrefix + "\n" + vertexShader,
                    glFragmentShader = fragmentPrefix + "\n" + fragmentShader,

                    main = "void main(void) {\n",
                    footer = "\n}",

                    vertexHeader = glVertexShader.match(HEADER)[1],
                    vertexMain = glVertexShader.match(MAIN_FUNCTION)[5],
                    fragmentHeader = glFragmentShader.match(HEADER)[1],
                    fragmentMain = glFragmentShader.match(MAIN_FUNCTION)[5];

                if (sprite) {
                    vertexHeader += ShaderChunks.sprite_header;
                    vertexMain += ShaderChunks.sprite_vertex_after;
                }

                if (emitter) {
                    vertexHeader += ShaderChunks.particle_header_vertex + ShaderChunks.particle_header;
                    fragmentHeader += ShaderChunks.particle_header;
                    if (parameters.emitter2d) {
                        vertexMain = ShaderChunks.particle_vertex_size_2d + vertexMain;
                    } else {
                        vertexMain = ShaderChunks.particle_vertex_size + vertexMain;
                    }
                    vertexMain = ShaderChunks.particle_vertex + vertexMain;
                }

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

                    if (emitter) {
                        vertexMain = ShaderChunks.mvPosition_emitter + vertexMain;
                        vertexMain = ShaderChunks.worldPosition_emitter + vertexMain;
                    } else {
                        vertexMain = (sprite ? ShaderChunks.mvPosition_sprite : ShaderChunks.mvPosition) + vertexMain;
                        vertexMain = (sprite ? ShaderChunks.worldPosition_sprite : ShaderChunks.worldPosition) + vertexMain;
                    }
                    if (parameters.normals) vertexMain = ShaderChunks.transformedNormal + vertexMain;
                } else {
                    if (emitter) {
                        vertexMain = ShaderChunks.mvPosition_emitter + vertexMain;
                    } else {
                        vertexMain = (sprite ? ShaderChunks.mvPosition_sprite : ShaderChunks.mvPosition) + vertexMain;
                    }
                }

                if (useBones) {
                    vertexHeader += ShaderChunks.composeMat4;
                    vertexHeader += ShaderChunks.getBoneMatrix;
                    if (parameters.normals) vertexMain = ShaderChunks.boneNormal + vertexMain;
                    vertexMain = ShaderChunks.bone + vertexMain;
                }

                glVertexShader = vertexHeader + main + vertexMain + footer;
                glFragmentShader = fragmentHeader + main + fragmentMain + footer;

                this.program = createProgram(_gl, glVertexShader, glFragmentShader);

                parseUniformsAttributesArrays(vertexShader, fragmentShader, (this._customAttributes = []), (this._customUniforms = []));
                parseUniformsAttributes(this.program, glVertexShader, glFragmentShader, (this.attributes = {}), (this.uniforms = {}));

                return this;
            };


            var useDepth = !opts.disableDepth,

                _this = this,

                _gl = undefined,
                _canvas = undefined,
                _element = undefined,
                _context = false,

                _extensions = undefined,

                _precision = "highp",
                _maxAnisotropy = 0,
                _maxTextures = 0,
                _maxVertexTextures = 0,
                _maxTextureSize = 0,
                _maxCubeTextureSize = 0,
                _maxRenderBufferSize = 0,

                _maxUniforms = 0,
                _maxVaryings = 0,
                _maxAttributes = 0,

                _viewportX = 0,
                _viewportY = 0,
                _viewportWidth = 1,
                _viewportHeight = 1,

                _currentWidth = 1,
                _currentHeight = 1,

                _textureIndex = 0,

                _lastClearColor = new Color,
                _lastClearAlpha = 1,
                _lastBlending = -1,
                _lastCullFace = -1,
                _cullFaceDisabled = true,
                _lastDepthTest = -1,
                _lastDepthWrite = -1,
                _lastLineWidth = -1,

                _currentFramebuffer = null,

                _enabledAttributes = undefined,
                _lastProgram = undefined,

                _attributes = merge(opts.attributes || {}, {
                    alpha: true,
                    antialias: true,
                    depth: true,
                    premultipliedAlpha: true,
                    preserveDrawingBuffer: false,
                    stencil: true
                });

            this.init = function(canvas) {
                if (_canvas) this.clear();

                _canvas = canvas;
                _element = canvas.element;

                _canvas2d = document.createElement("canvas");
                _ctx = _canvas2d.getContext("2d");

                initGL();
                _context = true;
                setDefaultGLState();

                addEvent(_element, "webglcontextlost", handleWebGLContextLost, this);
                addEvent(_element, "webglcontextrestored", handleWebGLContextRestored, this);

                return this;
            };


            this.clear = function() {
                if (!_canvas) return this;

                this.off();

                removeEvent(element, "webglcontextlost", handleWebGLContextLost, this);
                removeEvent(element, "webglcontextrestored", handleWebGLContextRestored, this);

                _gl = undefined
                _canvas = undefined;
                _element = undefined;
                _context = false;

                _extensions = undefined;

                _precision = "highp";
                _maxAnisotropy = 0;
                _maxTextures = 0;
                _maxVertexTextures = 0;
                _maxTextureSize = 0;
                _maxCubeTextureSize = 0;
                _maxRenderBufferSize = 0;

                _maxUniforms = 0;
                _maxVaryings = 0;
                _maxAttributes = 0;

                _viewportX = 0;
                _viewportY = 0;
                _viewportWidth = 1;
                _viewportHeight = 1;

                _textureIndex = 0;

                _lastClearColor.set(0, 0, 0);
                _lastClearAlpha = 1;
                _lastBlending = -1;
                _lastCullFace = -1;
                _cullFaceDisabled = true;
                _lastDepthTest = -1;
                _lastDepthWrite = -1;
                _lastLineWidth = -1;

                _currentFramebuffer = null;

                _enabledAttributes = undefined;
                _lastProgram = undefined;

                _shaders = {};
                _spriteBuffers = undefined;
                _lastBuffers = undefined;
                _lastCamera = undefined;
                _lastResizeFn = undefined;
                _lastScene = undefined;
                _lastGUI = undefined;

                _textTextures = {};
                _canvas2d = undefined;
                _ctx = undefined;

                _guiContentShader = undefined;
                _guiBuffers = undefined;

                return this;
            };

            defineProperty(this, "gl", {
                get: function() {
                    return _gl;
                }
            });
            defineProperty(this, "canvas", {
                get: function() {
                    return _canvas;
                }
            });
            defineProperty(this, "element", {
                get: function() {
                    return _element;
                }
            });
            defineProperty(this, "precision", {
                get: function() {
                    return _precision;
                }
            });
            defineProperty(this, "maxAnisotropy", {
                get: function() {
                    return _maxAnisotropy;
                }
            });
            defineProperty(this, "maxTextures", {
                get: function() {
                    return _maxTextures;
                }
            });
            defineProperty(this, "maxVertexTextures", {
                get: function() {
                    return _maxVertexTextures;
                }
            });
            defineProperty(this, "maxTextureSize", {
                get: function() {
                    return _maxTextureSize;
                }
            });
            defineProperty(this, "maxCubeTextureSize", {
                get: function() {
                    return _maxCubeTextureSize;
                }
            });
            defineProperty(this, "maxRenderBufferSize", {
                get: function() {
                    return _maxRenderBufferSize;
                }
            });
            defineProperty(this, "maxUniforms", {
                get: function() {
                    return _maxUniforms;
                }
            });
            defineProperty(this, "maxVaryings", {
                get: function() {
                    return _maxVaryings;
                }
            });
            defineProperty(this, "maxAttributes", {
                get: function() {
                    return _maxAttributes;
                }
            });

            function createBuffer(obj, name, array) {

                obj[name] = obj[name] || _gl.createBuffer();
                _gl.bindBuffer(_gl.ARRAY_BUFFER, obj[name]);
                _gl.bufferData(_gl.ARRAY_BUFFER, array, _gl.STATIC_DRAW);
            }

            function createSprite() {
                _spriteBuffers = {};

                createBuffer(_spriteBuffers, "_webglVertexBuffer", new Float32Array([-0.5, 0.5, 0.0, -0.5, -0.5, 0.0,
                    0.5, 0.5, 0.0,
                    0.5, -0.5, 0.0
                ]));
                createBuffer(_spriteBuffers, "_webglUvBuffer", new Float32Array([
                    0.0, 0.0,
                    0.0, 1.0,
                    1.0, 0.0,
                    1.0, 1.0
                ]));
                createBuffer(_spriteBuffers, "_webglNormalBuffer", new Float32Array([
                    0.0, 0.0, 1.0,
                    0.0, 0.0, 1.0,
                    0.0, 0.0, 1.0,
                    0.0, 0.0, 1.0,
                ]));
                createBuffer(_spriteBuffers, "_webglTangentBuffer", new Float32Array([
                    0.0, 0.0, 0.0, 1.0,
                    0.0, 1.0, 0.0, 1.0,
                    1.0, 0.0, 0.0, 1.0,
                    1.0, 1.0, 0.0, 1.0,
                ]));
                _spriteBuffers._webglVertexCount = 4;
            }

            function createGUIBuffers() {
                _guiBuffers = {};

                createBuffer(_guiBuffers, "_webglVertexBuffer", new Float32Array([
                    0.0, 0.0, 0.0,
                    0.0, 1.0, 0.0,
                    1.0, 0.0, 0.0,
                    1.0, 1.0, 0.0
                ]));
                createBuffer(_guiBuffers, "_webglUvBuffer", new Float32Array([
                    0.0, 0.0,
                    0.0, 1.0,
                    1.0, 0.0,
                    1.0, 1.0
                ]));

                _guiBuffers._webglVertexCount = 4;
            }

            function createGUIContentShader() {
                var shader = _guiContentShader = new Shader,
                    header = [
                        "precision " + _precision + " float;",
                        "precision " + _precision + " int;",
                        ""
                    ].join("\n"),
                    vertexShader = header + guiContent_vertex,
                    fragmentShader = header + guiContent_fragment;

                shader.program = createProgram(_gl, vertexShader, fragmentShader);
                parseUniformsAttributes(shader.program, vertexShader, fragmentShader, (shader.attributes = {}), (shader.uniforms = {}));
            }

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


            function setDepthWrite(depthWrite) {

                if (_lastDepthWrite !== depthWrite) {

                    _gl.depthMask(depthWrite);
                    _lastDepthWrite = depthWrite;
                }
            }
            this.setDepthWrite = setDepthWrite;


            function setLineWidth(width) {

                if (_lastLineWidth !== width) {

                    _gl.lineWidth(width);
                    _lastLineWidth = width;
                }
            }
            this.setLineWidth = setLineWidth;


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


            function setClearColor(color, alpha) {
                alpha || (alpha = 1);

                if (!_lastClearColor.equals(color) || alpha !== _lastClearAlpha) {

                    _lastClearColor.copy(color);
                    _lastClearAlpha = alpha;

                    this.context.clearColor(_lastClearColor.r, _lastClearColor.g, _lastClearColor.b, _lastClearAlpha);
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


            function setProgram(program) {

                if (_lastProgram !== program) {
                    _gl.useProgram(program);
                    _lastProgram = program;
                    return true;
                }
                return false;
            };
            this.setProgram = setProgram;


            function enableAttribute(attribute) {

                if (_enabledAttributes[attribute] === 0) {
                    _gl.enableVertexAttribArray(attribute);
                    _enabledAttributes[attribute] = 1;
                }
            };
            this.enableAttribute = enableAttribute;


            function disableAttributes() {
                var i = _maxAttributes;

                while (i--) {

                    if (_enabledAttributes[i] === 1) {
                        _gl.disableVertexAttribArray(i);
                        _enabledAttributes[i] = 0;
                    }
                }
            };
            this.disableAttributes = disableAttributes;


            function setTexture(location, texture) {
                if (!texture) return;
                var index, glTexture;

                if (_textureIndex >= _maxTextures) {
                    Log.warn("Renderer setTexure: using " + _textureIndex + " texture units, GPU only supports " + _maxTextures);
                }

                if ((!texture.needsUpdate || texture instanceof RenderTarget) && (glTexture = texture._webgl)) {
                    index = _textureIndex++;

                    _gl.activeTexture(_gl.TEXTURE0 + index);
                    _gl.bindTexture(_gl.TEXTURE_2D, glTexture);
                    _gl.uniform1i(location, index);

                    return;
                }

                if (!texture.raw) return;

                glTexture = texture._webgl || (texture._webgl = _gl.createTexture());
                index = _textureIndex++;

                var raw = texture.raw,
                    TFA = _extensions.EXT_texture_filter_anisotropic,

                    isPOT = isPowerOfTwo(raw.width) && isPowerOfTwo(raw.height),
                    anisotropy = clamp(texture.anisotropy || 1, 1, _maxAnisotropy),

                    TEXTURE_2D = _gl.TEXTURE_2D,
                    generateMipmap = texture.generateMipmap,
                    filter = texture.filter,
                    format = texture.format,
                    wrap = texture.wrap,
                    WRAP, MAG_FILTER, MIN_FILTER, FORMAT;

                if (filter === FilterMode.None) {
                    MAG_FILTER = _gl.NEAREST;
                    if (generateMipmap && isPOT) {
                        MIN_FILTER = _gl.LINEAR_MIPMAP_NEAREST;
                    } else {
                        MIN_FILTER = _gl.NEAREST;
                    }
                } else { //FilterMode.Linear
                    MAG_FILTER = _gl.LINEAR;
                    if (generateMipmap && isPOT) {
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

                _gl.texImage2D(TEXTURE_2D, 0, FORMAT, FORMAT, _gl.UNSIGNED_BYTE, clampToMaxSize(raw, _maxTextureSize));

                _gl.texParameteri(TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, MAG_FILTER);
                _gl.texParameteri(TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, MIN_FILTER);

                _gl.texParameteri(TEXTURE_2D, _gl.TEXTURE_WRAP_S, WRAP);
                _gl.texParameteri(TEXTURE_2D, _gl.TEXTURE_WRAP_T, WRAP);

                if (TFA) _gl.texParameterf(TEXTURE_2D, TFA.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);
                if (generateMipmap && isPOT) _gl.generateMipmap(TEXTURE_2D);

                texture.needsUpdate = false;
            }

            function setTextureCube(location, cubeTexture) {
                if (!cubeTexture || !cubeTexture.raw) return;
                var glTexture = cubeTexture._webgl,
                    index;

                if (_textureIndex >= _maxTextures) {
                    Log.warn("Renderer setTextureCube: using " + _textureIndex + " texture units, GPU only supports " + _maxTextures);
                    return;
                }

                if (!cubeTexture.needsUpdate && glTexture) {
                    index = _textureIndex++;

                    _gl.activeTexture(_gl.TEXTURE0 + index);
                    _gl.bindTexture(_gl.TEXTURE_CUBE_MAP, glTexture);
                    _gl.uniform1i(location, index);

                    return;
                }

                glTexture = cubeTexture._webgl || (cubeTexture._webgl = _gl.createTexture());
                index = _textureIndex++;

                var raw = cubeTexture.raw,
                    TFA = _extensions.EXT_texture_filter_anisotropic,

                    first = raw[0],
                    isPOT = isPowerOfTwo(first.width) && isPowerOfTwo(first.height),
                    anisotropy = clamp(cubeTexture.anisotropy || 1, 1, _maxAnisotropy),

                    TEXTURE_CUBE_MAP = _gl.TEXTURE_CUBE_MAP,
                    TEXTURE_CUBE_MAP_POSITIVE_X = _gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                    UNSIGNED_BYTE = _gl.UNSIGNED_BYTE,

                    generateMipmap = cubeTexture.generateMipmap,
                    filter = cubeTexture.filter,
                    format = cubeTexture.format,
                    wrap = cubeTexture.wrap,
                    WRAP, MAG_FILTER, MIN_FILTER, FORMAT;

                if (filter === FilterMode.None) {
                    MAG_FILTER = _gl.NEAREST;
                    if (generateMipmap && isPOT) {
                        MIN_FILTER = _gl.LINEAR_MIPMAP_NEAREST;
                    } else {
                        MIN_FILTER = _gl.NEAREST;
                    }
                } else { //FilterMode.Linear
                    MAG_FILTER = _gl.LINEAR;
                    if (generateMipmap && isPOT) {
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

                _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[0], _maxCubeTextureSize));
                _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[1], _maxCubeTextureSize));
                _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[2], _maxCubeTextureSize));
                _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[3], _maxCubeTextureSize));
                _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[4], _maxCubeTextureSize));
                _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, FORMAT, FORMAT, UNSIGNED_BYTE, clampToMaxSize(raw[5], _maxCubeTextureSize));

                _gl.texParameteri(TEXTURE_CUBE_MAP, _gl.TEXTURE_MAG_FILTER, MAG_FILTER);
                _gl.texParameteri(TEXTURE_CUBE_MAP, _gl.TEXTURE_MIN_FILTER, MIN_FILTER);

                _gl.texParameteri(TEXTURE_CUBE_MAP, _gl.TEXTURE_WRAP_S, WRAP);
                _gl.texParameteri(TEXTURE_CUBE_MAP, _gl.TEXTURE_WRAP_T, WRAP);

                if (TFA) _gl.texParameterf(TEXTURE_CUBE_MAP, TFA.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);
                if (generateMipmap && isPOT) _gl.generateMipmap(TEXTURE_CUBE_MAP);

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

                Log.once("Renderer clampToMaxSize: image height larger than machines max size (max = " + maxSize + ")");

                return canvas;
            }


            function setRenderTarget(renderTarget) {
                var isRenderTarget = !! renderTarget,
                    isCube = renderTarget instanceof RenderTargetCube,
                    framebuffer = null,
                    width, height, vx, vy;

                if (isRenderTarget && !renderTarget._webglFramebuffer) {
                    width = renderTarget.width;
                    height = renderTarget.height;
                    renderTarget._webgl = _gl.createTexture();

                    var TFA = _extensions.EXT_texture_filter_anisotropic,
                        isPOT = isPowerOfTwo(width) && isPowerOfTwo(height),
                        anisotropy = clamp(renderTarget.anisotropy || 1, 1, _maxAnisotropy),

                        GL_TEXTURE_TYPE = isCube ? _gl.TEXTURE_CUBE_MAP : _gl.TEXTURE_2D,
                        UNSIGNED_BYTE = _gl.UNSIGNED_BYTE,
                        UNSIGNED_SHORT = _gl.UNSIGNED_SHORT,
                        DEPTH_COMPONENT = _gl.DEPTH_COMPONENT,

                        generateMipmap = renderTarget.generateMipmap,
                        filter = renderTarget.filter,
                        format = renderTarget.format,
                        wrap = renderTarget.wrap,
                        WRAP, MAG_FILTER, MIN_FILTER, FORMAT,
                        webglFramebuffer, webglRenderbuffer, depthOnly = renderTarget.depthOnly,
                        i;

                    if (filter === FilterMode.None) {
                        MAG_FILTER = _gl.NEAREST;
                        if (generateMipmap && isPOT) {
                            MIN_FILTER = _gl.LINEAR_MIPMAP_NEAREST;
                        } else {
                            MIN_FILTER = _gl.NEAREST;
                        }
                    } else { //FilterMode.Linear
                        MAG_FILTER = _gl.LINEAR;
                        if (generateMipmap && isPOT) {
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

                    _gl.bindTexture(GL_TEXTURE_TYPE, renderTarget._webgl);

                    _gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, renderTarget.flipY ? 1 : 0);
                    _gl.pixelStorei(_gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, renderTarget.premultiplyAlpha ? 1 : 0);

                    if (isCube) {
                        webglFramebuffer = renderTarget._webglFramebuffer = [];
                        webglRenderbuffer = renderTarget._webglRenderbuffer = [];

                        if (renderTarget.depthOnly) {
                            _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, DEPTH_COMPONENT, width, height, 0, DEPTH_COMPONENT, UNSIGNED_BYTE, null);
                            _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, DEPTH_COMPONENT, width, height, 0, DEPTH_COMPONENT, UNSIGNED_BYTE, null);
                            _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, DEPTH_COMPONENT, width, height, 0, DEPTH_COMPONENT, UNSIGNED_BYTE, null);
                            _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, DEPTH_COMPONENT, width, height, 0, DEPTH_COMPONENT, UNSIGNED_BYTE, null);
                            _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, DEPTH_COMPONENT, width, height, 0, DEPTH_COMPONENT, UNSIGNED_BYTE, null);
                            _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, DEPTH_COMPONENT, width, height, 0, DEPTH_COMPONENT, UNSIGNED_BYTE, null);
                        } else {
                            _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, FORMAT, width, height, 0, FORMAT, UNSIGNED_BYTE, null);
                            _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, FORMAT, width, height, 0, FORMAT, UNSIGNED_BYTE, null);
                            _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, FORMAT, width, height, 0, FORMAT, UNSIGNED_BYTE, null);
                            _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, FORMAT, width, height, 0, FORMAT, UNSIGNED_BYTE, null);
                            _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, FORMAT, width, height, 0, FORMAT, UNSIGNED_BYTE, null);
                            _gl.texImage2D(_gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, FORMAT, width, height, 0, FORMAT, UNSIGNED_BYTE, null);
                        }

                        _gl.texParameteri(GL_TEXTURE_TYPE, _gl.TEXTURE_MAG_FILTER, MAG_FILTER);
                        _gl.texParameteri(GL_TEXTURE_TYPE, _gl.TEXTURE_MIN_FILTER, MIN_FILTER);

                        _gl.texParameteri(GL_TEXTURE_TYPE, _gl.TEXTURE_WRAP_S, WRAP);
                        _gl.texParameteri(GL_TEXTURE_TYPE, _gl.TEXTURE_WRAP_T, WRAP);

                        i = 6;
                        while (i--) {
                            webglFramebuffer[i] = _gl.createFramebuffer();
                            webglRenderbuffer[i] = _gl.createRenderbuffer();

                            setupFrameBuffer(webglFramebuffer[i], renderTarget, _gl.TEXTURE_CUBE_MAP_POSITIVE_X + i);
                            setupRenderBuffer(webglRenderbuffer[i], renderTarget);
                        }
                    } else {
                        renderTarget._webglFramebuffer = _gl.createFramebuffer();
                        renderTarget._webglRenderbuffer = _gl.createRenderbuffer();

                        if (renderTarget.depthOnly) {
                            _gl.texImage2D(GL_TEXTURE_TYPE, 0, DEPTH_COMPONENT, width, height, 0, DEPTH_COMPONENT, UNSIGNED_SHORT, null);
                        } else {
                            _gl.texImage2D(GL_TEXTURE_TYPE, 0, FORMAT, width, height, 0, FORMAT, UNSIGNED_BYTE, null);
                        }

                        _gl.texParameteri(GL_TEXTURE_TYPE, _gl.TEXTURE_MAG_FILTER, MAG_FILTER);
                        _gl.texParameteri(GL_TEXTURE_TYPE, _gl.TEXTURE_MIN_FILTER, MIN_FILTER);

                        _gl.texParameteri(GL_TEXTURE_TYPE, _gl.TEXTURE_WRAP_S, WRAP);
                        _gl.texParameteri(GL_TEXTURE_TYPE, _gl.TEXTURE_WRAP_T, WRAP);

                        setupFrameBuffer(renderTarget._webglFramebuffer, renderTarget, GL_TEXTURE_TYPE);
                        setupRenderBuffer(renderTarget._webglRenderbuffer, renderTarget);
                    }

                    if (TFA) _gl.texParameterf(GL_TEXTURE_TYPE, TFA.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);
                    if (generateMipmap && isPOT) _gl.generateMipmap(GL_TEXTURE_TYPE);

                    _gl.bindTexture(GL_TEXTURE_TYPE, null);

                    _gl.bindRenderbuffer(_gl.RENDERBUFFER, null);
                    _gl.bindFramebuffer(_gl.FRAMEBUFFER, null);
                }

                if (isRenderTarget) {
                    if (isCube) {
                        framebuffer = renderTarget._webglFramebuffer[renderTarget.activeCubeFace];
                    } else {
                        framebuffer = renderTarget._webglFramebuffer;
                    }

                    vx = 0;
                    vy = 0;
                    width = renderTarget.width;
                    height = renderTarget.height;
                } else {
                    vx = _viewportX;
                    vy = _viewportY;
                    width = _viewportWidth;
                    height = _viewportHeight;
                }

                if (framebuffer !== _currentFramebuffer) {
                    _gl.bindFramebuffer(_gl.FRAMEBUFFER, framebuffer);
                    _gl.viewport(vx, vy, width, height);

                    _currentFramebuffer = framebuffer;
                }

                _currentWidth = width;
                _currentHeight = height;
            }
            this.setRenderTarget = setRenderTarget;


            function setupFrameBuffer(framebuffer, renderTarget, textureTarget) {
                _gl.bindFramebuffer(_gl.FRAMEBUFFER, framebuffer);
                _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, textureTarget, renderTarget._webgl, 0);
            }


            function setupRenderBuffer(renderbuffer, renderTarget) {

                _gl.bindRenderbuffer(_gl.RENDERBUFFER, renderbuffer);

                if (renderTarget.depthBuffer && !renderTarget.stencilBuffer) {

                    _gl.renderbufferStorage(_gl.RENDERBUFFER, _gl.DEPTH_COMPONENT16, renderTarget.width, renderTarget.height);
                    _gl.framebufferRenderbuffer(_gl.FRAMEBUFFER, _gl.DEPTH_ATTACHMENT, _gl.RENDERBUFFER, renderbuffer);
                } else if (!renderTarget.depthBuffer && renderTarget.stencilBuffer) {

                    _gl.renderbufferStorage(_gl.RENDERBUFFER, _gl.STENCIL_INDEX8, renderTarget.width, renderTarget.height);
                    _gl.framebufferRenderbuffer(_gl.FRAMEBUFFER, _gl.STENCIL_ATTACHMENT, _gl.RENDERBUFFER, renderbuffer);
                } else if (renderTarget.depthBuffer && renderTarget.stencilBuffer) {

                    _gl.renderbufferStorage(_gl.RENDERBUFFER, _gl.DEPTH_STENCIL, renderTarget.width, renderTarget.height);
                    _gl.framebufferRenderbuffer(_gl.FRAMEBUFFER, _gl.DEPTH_STENCIL_ATTACHMENT, _gl.RENDERBUFFER, renderbuffer);
                } else {
                    _gl.renderbufferStorage(_gl.RENDERBUFFER, _gl.RGBA4, renderTarget.width, renderTarget.height);
                }
            };


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

                _precision = precision;
                _maxAnisotropy = EXT_texture_filter_anisotropic ? _gl.getParameter(EXT_texture_filter_anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1;
                _maxTextures = _gl.getParameter(_gl.MAX_TEXTURE_IMAGE_UNITS);
                _maxVertexTextures = _gl.getParameter(_gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
                _maxTextureSize = _gl.getParameter(_gl.MAX_TEXTURE_SIZE);
                _maxCubeTextureSize = _gl.getParameter(_gl.MAX_CUBE_MAP_TEXTURE_SIZE);
                _maxRenderBufferSize = _gl.getParameter(_gl.MAX_RENDERBUFFER_SIZE);

                _maxUniforms = max(_gl.getParameter(_gl.MAX_FRAGMENT_UNIFORM_VECTORS), _gl.getParameter(_gl.MAX_VERTEX_UNIFORM_VECTORS)) * 4;
                _maxVaryings = _gl.getParameter(_gl.MAX_VARYING_VECTORS) * 4;
                _maxAttributes = _gl.getParameter(_gl.MAX_VERTEX_ATTRIBS);
            }


            function getExtensions() {
                _extensions = {};

                getExtension("EXT_texture_filter_anisotropic");

                getExtension("WEBGL_compressed_texture_s3tc");
                _extensions.WEBGL_compressed_texture_s3tc_formats = _extensions.WEBGL_compressed_texture_s3tc ? _gl.getParameter(_gl.COMPRESSED_TEXTURE_FORMATS) : null;

                getExtension("OES_standard_derivatives");
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


            function initGL() {
                _gl = getWebGLContext(_element, _attributes);

                _gl.getShaderPrecisionFormat || (_gl.getShaderPrecisionFormat = function() {
                    return {
                        rangeMin: 1,
                        rangeMax: 1,
                        precision: 1
                    };
                });

                getExtensions();
                getGPUInfo();

                _enabledAttributes = new Uint8Array(_maxAttributes);
            }


            function setDefaultGLState() {

                _gl.clearColor(0, 0, 0, 1);
                useDepth && _gl.clearDepth(1);
                _gl.clearStencil(0);

                useDepth && setDepthTest(true);
                useDepth && _gl.depthFunc(_gl.LEQUAL);

                _gl.frontFace(_gl.CCW);

                setCullFace(CullFace.Back);
                setBlending(Blending.Default);
                setLineWidth(1);

                setViewport();
            }


            var SHADER_SPLITER = /[\n;]+/,
                ATTRIBURE = /attribute\s+([a-z]+\s+)?([A-Za-z0-9]+)\s+([a-zA-Z_0-9]+)\s*(\[\s*(.+)\s*\])?/,
                UNIFORM = /uniform\s+([a-z]+\s+)?([A-Za-z0-9]+)\s+([a-zA-Z_0-9]+)\s*(\[\s*(.+)\s*\])?/,
                DEFINE = /#define\s+([a-zA-Z_0-9]+)?\s+([0-9]+)?/;

            function parseUniformsAttributesArrays(vertexShader, fragmentShader, attributes, uniforms) {
                var src = vertexShader + fragmentShader,
                    lines = src.split(SHADER_SPLITER),
                    matchAttributes, matchUniforms,
                    i = lines.length,
                    line;

                while (i--) {
                    line = lines[i];
                    matchAttributes = line.match(ATTRIBURE);
                    matchUniforms = line.match(UNIFORM);

                    if (matchAttributes) {
                        attributes.push(matchAttributes[3]);
                    } else if (matchUniforms) {
                        uniforms.push(matchUniforms[3]);
                    }
                }
            }
            this.parseUniformsAttributesArrays = parseUniformsAttributesArrays;

            function parseUniformsAttributes(program, vertexShader, fragmentShader, attributes, uniforms) {
                var src = vertexShader + fragmentShader,
                    lines = src.split(SHADER_SPLITER),
                    defines = {}, matchAttributes, matchUniforms, matchDefines,
                    uniformArray, name, type, location, length, line,
                    i, j;

                i = lines.length;
                while (i--) {
                    matchDefines = lines[i].match(DEFINE);
                    if (matchDefines) defines[matchDefines[1]] = Number(matchDefines[2]);
                }

                i = lines.length;
                while (i--) {
                    line = lines[i];
                    matchAttributes = line.match(ATTRIBURE);
                    matchUniforms = line.match(UNIFORM);

                    if (matchAttributes) {
                        name = matchAttributes[3];
                        attributes[name] = createAttribute(matchAttributes[2], _gl.getAttribLocation(program, name));
                    } else if (matchUniforms) {
                        type = matchUniforms[2];
                        name = matchUniforms[3];
                        length = matchUniforms[5];

                        if (length) {
                            length = defines[length.trim()] || length;
                            uniformArray = uniforms[name] = [];

                            j = length;
                            while (j--) uniformArray[j] = createUniform(type, _gl.getUniformLocation(program, name + "[" + j + "]"));
                        } else {
                            location = _gl.getUniformLocation(program, name);
                            if (location) uniforms[name] = createUniform(type, location);
                        }
                    }
                }
            }
            this.parseUniformsAttributes = parseUniformsAttributes;


            function createAttribute(type, location) {
                if (location < 0) return null;

                if (type === "int") {
                    return new Attribute1i(location);
                } else if (type === "float") {
                    return new Attribute1f(location);
                } else if (type === "vec2") {
                    return new Attribute2f(location);
                } else if (type === "vec3") {
                    return new Attribute3f(location);
                } else if (type === "vec4") {
                    return new Attribute4f(location);
                }

                return null;
            };


            function Attribute1i(location) {
                this.location = location;
            }
            Attribute1i.prototype.set = function(value) {
                var location = this.location;

                if (location > -1) {
                    _gl.bindBuffer(_gl.ARRAY_BUFFER, value);
                    enableAttribute(location);
                    _gl.vertexAttribPointer(location, 1, _gl.FLOAT, false, 0, 0);
                }
            };

            function Attribute1f(location) {
                this.location = location;
            }
            Attribute1f.prototype.set = function(value) {
                var location = this.location;

                if (location > -1) {
                    _gl.bindBuffer(_gl.ARRAY_BUFFER, value);
                    enableAttribute(location);
                    _gl.vertexAttribPointer(location, 1, _gl.FLOAT, false, 0, 0);
                }
            };

            function Attribute2f(location) {
                this.location = location;
            }
            Attribute2f.prototype.set = function(value) {
                var location = this.location;

                if (location > -1) {
                    _gl.bindBuffer(_gl.ARRAY_BUFFER, value);
                    enableAttribute(location);
                    _gl.vertexAttribPointer(location, 2, _gl.FLOAT, false, 0, 0);
                }
            };

            function Attribute3f(location) {
                this.location = location;
            }
            Attribute3f.prototype.set = function(value) {
                var location = this.location;

                if (location > -1) {
                    _gl.bindBuffer(_gl.ARRAY_BUFFER, value);
                    enableAttribute(location);
                    _gl.vertexAttribPointer(location, 3, _gl.FLOAT, false, 0, 0);
                }
            };

            function Attribute4f(location) {
                this.location = location;
            }
            Attribute4f.prototype.set = function(value) {
                var location = this.location;

                if (location > -1) {
                    _gl.bindBuffer(_gl.ARRAY_BUFFER, value);
                    enableAttribute(location);
                    _gl.vertexAttribPointer(location, 4, _gl.FLOAT, false, 0, 0);
                }
            };


            function createUniform(type, location) {
                if (!location) return null;

                if (type === "int") {
                    return new Uniform1i(location);
                } else if (type === "float") {
                    return new Uniform1f(location);
                } else if (type === "vec2") {
                    return new Uniform2f(location);
                } else if (type === "vec3") {
                    return new Uniform3f(location);
                } else if (type === "vec4") {
                    return new Uniform4f(location);
                } else if (type === "mat2") {
                    return new UniformMatrix2fv(location);
                } else if (type === "mat3") {
                    return new UniformMatrix3fv(location);
                } else if (type === "mat4") {
                    return new UniformMatrix4fv(location);
                } else if (type === "sampler2D") {
                    return new UniformTexture(location);
                } else if (type === "samplerCube") {
                    return new UniformTextureCube(location);
                }

                return null;
            }

            function Uniform1f(location) {
                this.location = location;
                this.value = undefined;
            }
            Uniform1f.prototype.set = function(value, force) {
                if (force || this.value !== value) {
                    _gl.uniform1f(this.location, value);
                    this.value = value;
                }
            };

            function Uniform1i(location) {
                this.location = location;
                this.value = undefined;
            }
            Uniform1i.prototype.set = function(value, force) {
                if (force || this.value !== value) {
                    _gl.uniform1i(this.location, value);
                    this.value = value;
                }
            };

            function Uniform2f(location) {
                this.location = location;
                this.value = new Vec2(NaN, NaN);
            }
            Uniform2f.prototype.set = function(value, force) {
                if (force || this.value.notEquals(value)) {
                    _gl.uniform2f(this.location, value.x, value.y);
                    this.value.copy(value);
                }
            };

            function Uniform3f(location) {
                this.location = location;
                this.value = new Vec3(NaN, NaN, NaN);
            }
            Uniform3f.prototype.set = function(value, force) {
                if (force || this.value.notEquals(value)) {
                    _gl.uniform3f(this.location, value.x, value.y, value.z);
                    this.value.copy(value);
                }
            };

            function Uniform4f(location) {
                this.location = location;
                this.value = new Vec4(NaN, NaN, NaN, NaN);
            }
            Uniform4f.prototype.set = function(value, force) {
                if (force || this.value.notEquals(value)) {
                    _gl.uniform4f(this.location, value.x, value.y, value.z, value.w);
                    this.value.copy(value);
                }
            };

            function UniformMatrix2fv(location) {
                this.location = location;
                this.value = new Mat2(
                    NaN, NaN,
                    NaN, NaN
                );
            }
            UniformMatrix2fv.prototype.set = function(value, force) {
                if (force || this.value.notEquals(value)) {
                    _gl.uniformMatrix2fv(this.location, false, value.elements);
                    this.value.copy(value);
                }
            };

            function UniformMatrix3fv(location) {
                this.location = location;
                this.value = new Mat3(
                    NaN, NaN, NaN,
                    NaN, NaN, NaN,
                    NaN, NaN, NaN
                );
            }
            UniformMatrix3fv.prototype.set = function(value, force) {
                if (force || this.value.notEquals(value)) {
                    _gl.uniformMatrix3fv(this.location, false, value.elements);
                    this.value.copy(value);
                }
            };

            function UniformMatrix4fv(location) {
                this.location = location;
                this.value = new Mat4(
                    NaN, NaN, NaN, NaN,
                    NaN, NaN, NaN, NaN,
                    NaN, NaN, NaN, NaN,
                    NaN, NaN, NaN, NaN
                );
            }
            UniformMatrix4fv.prototype.set = function(value, force) {
                if (force || this.value.notEquals(value)) {
                    _gl.uniformMatrix4fv(this.location, false, value.elements);
                    this.value.copy(value);
                }
            };

            function UniformTexture(location) {
                this.location = location;
            }
            UniformTexture.prototype.set = function(value) {
                setTexture(this.location, value);
            };

            function UniformTextureCube(location) {
                this.location = location;
            }
            UniformTextureCube.prototype.set = function(value) {
                setTextureCube(this.location, value);
            };
        }

        EventEmitter.extend(Renderer);


        var guiContent_vertex = [
            "attribute vec3 position;",
            "attribute vec2 uv;",

            "uniform mat4 mvpMatrix;",
            "uniform vec2 size;",
            "uniform vec4 crop;",

            "varying vec2 vUv;",

            "void main() {",
            "	vUv.x = uv.x * crop.z + crop.x;",
            "	vUv.y = uv.y * crop.w + crop.y;",
            "	gl_Position = mvpMatrix * vec4(position.xy * size, position.z, 1.0);",
            "}"
        ].join("\n");

        var guiContent_fragment = [
            "uniform sampler2D texture;",
            "uniform float alpha;",

            "varying vec2 vUv;",

            "void main() {",
            "	vec4 finalColor = texture2D(texture, vUv);",
            "	gl_FragColor = vec4(finalColor.xyz, finalColor.w * alpha);",
            "}"
        ].join("\n");


        return Renderer;
    }
);
