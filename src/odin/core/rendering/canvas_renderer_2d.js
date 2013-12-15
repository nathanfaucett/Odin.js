define([
        "odin/base/event_emitter",
        "odin/base/device",
        "odin/base/dom",
        "odin/math/mathf",
        "odin/math/mat32",
        "odin/math/color"
    ],
    function(EventEmitter, Device, Dom, Mathf, Mat32, Color) {
        "use strict";


        var EMPTY_ARRAY = [],
            DEFAULT_IMAGE = new Image;
        
        DEFAULT_IMAGE.src = "data:image/gif;base64,R0lGODlhAQABAIAAAP7//wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";
        
        function CanvasRenderer2D(opts) {
            opts || (opts = {});

            EventEmitter.call(this);

            this.canvas = undefined;
            this.context = undefined;

            this._lastCamera = undefined;
            this._lastResizeFn = undefined;
            this._lastBackground = new Color;
        }
        EventEmitter.extend(CanvasRenderer2D, EventEmitter);


        CanvasRenderer2D.prototype.init = function(canvas) {

            this.canvas = canvas;
            this.context = canvas.element.getContext("2d");

            this._lastCamera = undefined;
            this._lastResizeFn = undefined;
            this._lastBackground.set(0, 0, 0);

            return this;
        };


        CanvasRenderer2D.prototype.destroy = function() {

            this.canvas = undefined;
            this.context = undefined;

            this._lastCamera = undefined;
            this._lastResizeFn = undefined;
            this._lastBackground.set(0, 0, 0);
        };


        CanvasRenderer2D.prototype.render = function(scene, camera) {
            var ctx = this.context,
                lastCamera = this._lastCamera,
                lastBackground = this._lastBackground,
                background = camera.backgroundColor,
                components = scene.components,
                sprite2ds = components.Sprite2D || EMPTY_ARRAY,
                sprite2d,
                transform2d,
                i;

            if (lastBackground.r !== background.r || lastBackground.g !== background.g || lastBackground.b !== background.b) {
                lastBackground.copy(background);
            }
            if (lastCamera !== camera) {
                var canvas = this.canvas,
                    w = canvas.pixelWidth,
                    h = canvas.pixelHeight,
                    hw = w * 0.5,
                    hh = h * 0.5;
                    
                camera.set(w, h);

                ctx.translate(hw, hh);
                ctx.scale(hw, -hh);

                if (canvas.fullScreen) {
                    if (this._lastResizeFn) canvas.off("resize", this._lastResizeFn);

                    this._lastResizeFn = function() {
                        var w = this.pixelWidth,
                            h = this.pixelHeight,
                            hw = w * 0.5,
                            hh = h * 0.5;
                        
                        camera.set(w, h);
                        
                        ctx.translate(hw, hh);
                        ctx.scale(hw, -hh);
                    };

                    canvas.on("resize", this._lastResizeFn);
                }

                this._lastCamera = camera;
            }
            
            ctx.clearRect(-1, -1, 2, 2);

            for (i = sprite2ds.length; i--;) {
                sprite2d = sprite2ds[i];
                transform2d = sprite2d.transform2d;

                if (!transform2d) continue;

                transform2d.updateModelView(camera.view);
                this.renderSprite2D(camera, transform2d, sprite2d);
            }
        };


        var MAT = new Mat32;
        CanvasRenderer2D.prototype.renderSprite2D = function(camera, transform2d, sprite2d) {
            var ctx = this.context,
                imageAsset = sprite2d.image,
                image, mvp;

            MAT.mmul(camera.projection, transform2d.modelView);
            mvp = MAT.elements;

            if (imageAsset) {
                image = imageAsset.data;
            } else {
                image = DEFAULT_IMAGE;
            }

            ctx.save();

            ctx.transform(mvp[0], -mvp[2], -mvp[1], mvp[3], mvp[4], mvp[5]);
            
            ctx.globalAlpha = sprite2d.alpha;

            ctx.drawImage(
                image,
                sprite2d.x, sprite2d.y,
                sprite2d.w, sprite2d.h,
                sprite2d.width * -0.5,
                sprite2d.height * -0.5,
                sprite2d.width,
                sprite2d.height
            );

            ctx.restore();
        };


        return new CanvasRenderer2D;
    }
);
