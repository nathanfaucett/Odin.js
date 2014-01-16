if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/event_emitter",
        "base/device",
        "base/dom",
        "math/mathf",
        "math/vec2",
        "math/mat32",
        "math/color"
    ],
    function(EventEmitter, Device, Dom, Mathf, Vec2, Mat32, Color) {
        "use strict";


        var EMPTY_ARRAY = [],
            DEFAULT_IMAGE = new Image;

        DEFAULT_IMAGE.src = "data:image/gif;base64,R0lGODlhAQABAIAAAP7//wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";

        function CanvasRenderer2D(opts) {
            opts || (opts = {});

            EventEmitter.call(this);

            this.canvas = undefined;
            this.context = undefined;
            this._context = false;

            this._offContext = undefined;

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
            this.setBlending(Enums.BlendingDefault);

            this._offContext = document.createElement("canvas").getContext("2d");

            return this;
        };


        CanvasRenderer2D.prototype.clear = function() {

            this.canvas = undefined;
            this.context = undefined;
            this._context = false;

            this._lastCamera = undefined;
            this._lastResizeFn = undefined;
            this._lastBackground.set(0, 0, 0);

            this._offContext = undefined;

            return this;
        };


        CanvasRenderer2D.prototype.setBlending = function(blending) {
            var ctx = this.context;

            switch (blending) {
                case Enums.BlendingNone:
                    ctx.globalCompositeOperation = "none";
                    break;

                case Enums.BlendingAdditive:
                    ctx.globalCompositeOperation = "color-dodge";
                    break;

                case Enums.BlendingSubtractive:
                    ctx.globalCompositeOperation = "color-burn";
                    break;

                case Enums.BlendingMuliply:
                    ctx.globalCompositeOperation = "multiply";
                    break;

                case Enums.BlendingDefault:
                default:
                    ctx.globalCompositeOperation = "source-over";
                    break;
            }
        };


        CanvasRenderer2D.prototype.render = function(scene, camera) {
            if (!this._context) return;
            var ctx = this.context,
                lastBackground = this._lastBackground,
                background = scene.world.background,
                components = scene.components,
                sprite2ds = components.Sprite2D || EMPTY_ARRAY,
                particleSystems = components.ParticleSystem || EMPTY_ARRAY,
                sprite2d, particleSystem, transform2d,
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

            for (i = particleSystems.length; i--;) {
                particleSystem = particleSystems[i];
                transform2d = particleSystem.transform2d;

                if (!transform2d) continue;

                transform2d.updateModelView(camera.view);
                this.renderParticleSystem(camera, transform2d, particleSystem);
            }
        };


        var MAT = new Mat32,
            mvp = MAT.elements;
        CanvasRenderer2D.prototype.renderSprite2D = function(camera, transform2d, sprite2d) {
            var ctx = this.context,
                texture = sprite2d.texture;

            MAT.mmul(camera.projection, transform2d.modelView);

            if (texture) {
                texture = texture.raw;
            } else {
                texture = DEFAULT_IMAGE;
            }

            ctx.save();
            this.setBlending(sprite2d.blending);

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


        CanvasRenderer2D.prototype.renderParticleSystem = function(camera, transform2d, particleSystem) {
            var ctx = this.context,
                offCtx = this._offContext,
                offCanvas = offCtx.canvas,
                emitters = particleSystem.emitters,
                emitter, texture, w, h, particles, view, particle, pos, size, color,
                i = emitters.length,
                j;

            if (!i) return;

            for (; i--;) {
                emitter = emitters[i];
                particles = emitter.particles;
                if (!(j = particles.length)) continue;

                texture = emitter.texture;
                if (texture) {
                    texture = texture.raw;
                } else {
                    texture = DEFAULT_IMAGE;
                }

                view = emitter.worldSpace ? camera.view : transform2d.modelView;

                ctx.save();
                this.setBlending(emitter.blending);

                MAT.mmul(camera.projection, view);
                ctx.transform(mvp[0], -mvp[2], -mvp[1], mvp[3], mvp[4], mvp[5]);

                if (texture) {
                    w = texture.width;
                    h = texture.height;

                    for (; j--;) {
                        particle = particles[j];
                        pos = particle.position;
                        size = particle.size;

                        ctx.save();

                        offCtx.save();

                        if (offCanvas.width !== w) offCanvas.width = w;
                        if (offCanvas.height !== h) offCanvas.height = h;

                        offCtx.drawImage(texture, 0, 0);
                        offCtx.globalCompositeOperation = "source-atop";
                        offCtx.fillStyle = particle.color.toRGB();
                        offCtx.fillRect(0, 0, w, h);

                        ctx.globalAlpha = particle.alpha;

                        ctx.translate(pos.x, pos.y);
                        ctx.rotate(particle.angle);
                        ctx.drawImage(offCanvas, 0, 0, w, h, -size * 0.5, -size * 0.5, size, size);

                        offCtx.restore();
                        ctx.restore();
                    }
                } else {
                    for (; j--;) {
                        particle = particles[j];
                        pos = particle.position;
                        size = particle.size;

                        ctx.save();

                        ctx.fillStyle = particle.color.toRGB();
                        ctx.globalAlpha = particle.alpha;

                        ctx.translate(pos.x, pos.y);
                        ctx.rotate(particle.angle);
                        ctx.fillRect(-size * 0.5, -size * 0.5, size, size);

                        ctx.restore();
                    }
                }

                ctx.restore();
            }
        };


        return CanvasRenderer2D;
    }
);
