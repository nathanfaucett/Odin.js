if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/event_emitter",
        "base/device",
        "base/dom",
        "core/game/config"
    ],
    function(EventEmitter, Device, Dom, Config) {
        "use strict";


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
