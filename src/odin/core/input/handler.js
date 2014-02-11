if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/event_emitter",
        "odin/base/dom",
        "odin/base/object_pool",
        "odin/math/vec2",
        "odin/core/input/input"
    ],
    function(EventEmitter, Dom, ObjectPool, Vec2, Input) {
        "use strict";


        var min = Math.min,
            max = Math.max,

            addEvent = Dom.addEvent,
            removeEvent = Dom.removeEvent;


        function Handler() {

            EventEmitter.call(this);

            this.element = undefined;
        }

        EventEmitter.extend(Handler);


        Handler.prototype.setElement = function(element) {
            if (this.element) this.removeElement();

            this.element = element;

            addEvent(element, "mousedown mouseup mousemove mouseout mousewheel DOMMouseScroll", handleMouse, Input);
            addEvent(top, "keydown keyup", handleKeys, Input);

            addEvent(element, "touchstart touchmove touchend touchcancel", handleTouches, Input);
            addEvent(window, "devicemotion", handleDevicemotion, Input);
        };


        Handler.prototype.removeElement = function() {
            if (!this.element) return;
            var element = this.element;

            removeEvent(element, "mousedown mouseup mousemove mouseout mousewheel DOMMouseScroll", handleMouse, Input);
            removeEvent(top, "keydown keyup", handleKeys, Input);

            removeEvent(element, "touchstart touchmove touchend touchcancel", handleTouches, Input);
            removeEvent(window, "devicemotion", handleDevicemotion, Input);

            this.element = undefined;
        };


        function handleDevicemotion(e) {
            var acc = e.accelerationIncludingGravity,
                acceleration;

            if (acc && (acc.x || acc.y || acc.z)) {
                acceleration = this.acceleration;

                acceleration.x = acc.x;
                acceleration.y = acc.y;
                acceleration.z = acc.z;

                this.emit("acceleration");
            }
        }


        function handleTouches(e) {
            e.preventDefault();
            var type = e.type,
                touches = this.touches,
                evtTouches = e.touches,
                changedTouches = e.changedTouches,
                i;

            if (type === "touchstart") {

                for (i = evtTouches.length; i--;) this.emit("touchstart", touches.start(evtTouches[i]));

            } else if (type === "touchend") {

                for (i = changedTouches.length; i--;) this.emit("touchend", touches.end(i));

            } else if (type === "touchcancel") {

                touches.cancel();
                this.emit("touchcancel");

            } else if (type === "touchmove") {

                if (this.touchesMoveNeedsUpdate) {

                    for (i = changedTouches.length; i--;) this.emit("touchmove", touches.move(i, changedTouches[i]));
                    this.touchesMoveNeedsUpdate = false;
                }
            }
        }


        var mouseFirst = false,
            mouseLast = new Vec2,
            mouseWheel = 0;

        function handleMouse(e) {
            e.preventDefault();
            var type = e.type,
                button;

            if (type === "mousedown") {
                button = MOUSE_BUTTONS[e.button];

                this.buttons.on(button);
                updateMousePosition(this, e);
                this.emit("mousedown", button);

            } else if (type === "mouseup") {
                button = MOUSE_BUTTONS[e.button];

                this.buttons.off(button);
                updateMousePosition(this, e);
                this.emit("mouseup", button);

            } else if (type === "mouseout") {
                button = MOUSE_BUTTONS[e.button];

                this.buttons.off(button);
                updateMousePosition(this, e);
                this.emit("mouseout", button);

            } else if (type === "mousewheel" || type === "DOMMouseScroll") {

                mouseWheel = max(-1, min(1, (e.wheelDelta || -e.detail)));
                this.mouseWheel = mouseWheel;
                this.emit("mousewheel", mouseWheel);

            } else if (type === "mousemove") {

                if (this.mouseMoveNeedsUpdate) {

                    updateMousePosition(this, e);
                    this.mouseMoveNeedsUpdate = false;
                    this.emit("mousemove");
                }
            }
        }


        function updateMousePosition(input, e) {
            var position = input.mousePosition,
                delta = input.mouseDelta,
                element = e.target || e.srcElement,
                offsetX = element.offsetLeft || 0,
                offsetY = element.offsetTop || 0,
                x = (e.pageX || e.clientX) - offsetX,
                y = (e.pageY || e.clientY) - offsetY;

            mouseLast.x = mouseFirst ? position.x : x;
            mouseLast.y = mouseFirst ? position.y : y;

            position.x = x;
            position.y = y;

            delta.x = position.x - mouseLast.x;
            delta.y = position.y - mouseLast.y;

            mouseFirst = true;
        }


        function handleKeys(e) {
            e.preventDefault();
            var type = e.type,
                key = KEY_CODES[e.keyCode];

            if (type === "keydown") {
                this.buttons.on(key);
                this.emit("keydown", key);
            } else if (type === "keyup") {
                this.buttons.off(key);
                this.emit("keyup", key);
            }
        }

        var MOUSE_BUTTONS = {
            "0": "mouse0",
            "1": "mouse1",
            "2": "mouse2"
        }

        var KEY_CODES = {
            8: "backspace",
            9: "tab",
            13: "enter",
            16: "shift",
            17: "ctrl",
            18: "alt",
            19: "pause",
            20: "capslock",
            27: "escape",
            32: "space",
            33: "pageup",
            34: "pagedown",
            35: "end",
            37: "left",
            38: "up",
            39: "right",
            40: "down",
            45: "insert",
            46: "delete",
            112: "f1",
            113: "f2",
            114: "f3",
            115: "f4",
            116: "f5",
            117: "f6",
            118: "f7",
            119: "f8",
            120: "f9",
            121: "f10",
            122: "f11",
            123: "f12",
            144: "numlock",
            145: "scrolllock",
            186: "semicolon",
            187: "equal",
            188: "comma",
            189: "dash",
            190: "period",
            191: "slash",
            192: "graveaccent",
            219: "openbracket",
            220: "backslash",
            221: "closebraket",
            222: "singlequote"
        };

        for (var i = 48; i <= 90; i++) KEY_CODES[i] = String.fromCharCode(i).toLowerCase();


        return new Handler;
    }
);
