if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/device",
        "odin/math/vec2",
        "odin/core/input/input",
        "odin/core/gui/gui_style",
        "odin/core/gui/components/gui_component"
    ],
    function(Device, Vec2, Input, GUIStyle, GUIComponent) {
        "use strict";


        function GUIContent(opts) {
            opts || (opts = {});

            GUIComponent.call(this, "GUIContent", opts);

            this.text = opts.text;
            this.texture = opts.texture;

            this.style = opts.style instanceof GUIStyle ? opts.style : new GUIStyle(opts.style);

            this.alpha = opts.alpha != undefined ? opts.alpha : 1;
            this.z = opts.z != undefined ? opts.z : 0;

            this._down = false;
            this.needsUpdate = true;
        }

        GUIComponent.extend(GUIContent);


        GUIContent.prototype.copy = function(other) {

            this.text = other.text;
            this.texture = other.texture;

            this.style.copy(other.style);

            this.alpha = other.alpha;
            this.z = other.z;

            return this;
        };


        GUIContent.prototype.clear = function() {
            GUIComponent.prototype.clear.call(this);

            return this;
        };


        var ACTIVE = "active",
            HOVER = "hover",
            NORMAL = "normal",
            VEC = new Vec2;
        GUIContent.prototype.update = function() {
            var style = this.style,
                orgState = style._state,
                state = orgState,
                gui = this.guiObject.gui,
                aspect = gui.aspect,
                down = this._down,
                click, touch, position;

            if (Device.mobile) {
                if ((touch = Input.touches[0])) {
                    click = true;
                    position = touch.position;
                } else {
                    click = false;
                }
            } else {
                click = Input.mouseButton(0)
                position = Input.mousePosition;
            }

            if (down && click) {
                state = ACTIVE;
            } else if (down && Device.mobile && !click) {
                state = ACTIVE;
            } else {
                if (position) {
                    VEC.x = position.x * gui.invWidth;
                    VEC.y = position.y * gui.invHeight;

                    if (aspect >= 1) {
                        VEC.x *= aspect;
                    } else {
                        VEC.y /= aspect;
                    }
                    if (this.guiTransform.position.contains(VEC)) {

                        if (click) {
                            down = true;
                            state = ACTIVE;
                        } else {
                            down = false;
                            state = HOVER;
                        }
                    } else {
                        state = NORMAL;
                    }
                } else {
                    state = NORMAL;
                }
            }

            if (state !== orgState) {
                this.style._state = state;
                this.needsUpdate = true;
            }

            this._down = down;
        };


        GUIContent.prototype.setText = function(text) {

            this.text = text.toString();
            this.needsUpdate = true;

            return this;
        };


        GUIContent.prototype.sort = function(a, b) {

            return b.z - a.z;
        };


        GUIContent.prototype.toJSON = function(json) {
            json = GUIComponent.prototype.toJSON.call(this, json);

            json.text = this.text;
            json.texture = this.texture ? this.texture.name : undefined;

            json.style = this.style.toJSON(json.style);

            json.alpha = this.alpha;
            json.z = this.z;

            return json;
        };


        GUIContent.prototype.fromJSON = function(json) {
            GUIComponent.prototype.fromJSON.call(this, json);

            this.text = json.text;
            this.texture = json.texture ? Assets.get(json.texture) : undefined;

            this.style.fromJSON(json.style);

            this.alpha = json.alpha;
            this.z = json.z;

            return this;
        };


        return GUIContent;
    }
);
