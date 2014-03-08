if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/device",
        "odin/math/mathf",
        "odin/math/vec2",
        "odin/math/vec3",
        "odin/core/input/input",
        "odin/core/components/component"
    ],
    function(Device, Mathf, Vec2, Vec3, Input, Component) {
        "use strict";


        var pow = Math.pow,
            sqrt = Math.sqrt,
            sin = Math.sin,
            cos = Math.cos,
            tan = Math.tan,
            atan2 = Math.atan2,
            min = Math.min,
            max = Math.max,
            PI = Math.PI,
            MIN_POLOR = 0,
            MAX_POLOR = PI,

            degsToRads = Mathf.degsToRads,
            EPSILON = Mathf.EPSILON,

            NONE = 1,
            ROTATE = 2,
            PAN = 3;


        function OrbitControl(opts) {
            opts || (opts = {});

            Component.call(this, "OrbitControl", opts);

            this.speed = opts.speed > EPSILON ? opts.speed : 1;
            this.zoomSpeed = opts.zoomSpeed > EPSILON ? opts.zoomSpeed : 2;

            this.allowZoom = opts.allowZoom != undefined ? !! opts.allowZoom : true;
            this.allowPan = opts.allowPan != undefined ? !! opts.allowPan : true;
            this.allowRotate = opts.allowRotate != undefined ? !! opts.allowRotate : true;

            this.target = opts.target || new Vec3;

            this._offset = new Vec3;
            this._pan = new Vec3;
            this._scale = 1;
            this._thetaDelta = 0;
            this._phiDelta = 0;
            this._state = NONE;
        }

        Component.extend(OrbitControl);


        OrbitControl.prototype.copy = function() {

            return this;
        };


        OrbitControl.prototype.start = function() {

            if (Device.mobile) {
                Input.on("touchstart", this.onTouchStart, this);
                Input.on("touchend", this.onTouchEnd, this);
                Input.on("touchmove", this.onTouchMove, this);
            } else {
                Input.on("mouseup", this.onMouseUp, this);
                Input.on("mousedown", this.onMouseDown, this);
                Input.on("mousemove", this.onMouseMove, this);
                Input.on("mousewheel", this.onMouseWheel, this);
            }

            this.updateOrbit();

            return this;
        };


        OrbitControl.prototype.clear = function() {
            Component.prototype.clear.call(this);

            if (Device.mobile) {
                Input.on("touchstart", this.onTouchStart, this);
                Input.on("touchend", this.onTouchEnd, this);
                Input.on("touchmove", this.onTouchMove, this);
            } else {
                Input.off("mouseup", this.onMouseUp, this);
                Input.off("mousedown", this.onMouseDown, this);
                Input.off("mousemove", this.onMouseMove, this);
                Input.off("mousewheel", this.onMouseWheel, this);
            }

            return this;
        };


        OrbitControl.prototype.onTouchStart = function() {
            var length = Input.touches.length;

            if (length === 1) {
                this._state = ROTATE;
            } else if (length === 2 && this.allowPan) {
                this._state = PAN;
            } else {
                this._state = NONE;
            }
        };


        var LEFT_MOUSE = "mouse0",
            MIDDLE_MOUSE = "mouse1";
        OrbitControl.prototype.onMouseDown = function(button) {

            if (button === LEFT_MOUSE && this.allowRotate) {
                this._state = ROTATE;
            } else if (button === MIDDLE_MOUSE && this.allowPan) {
                this._state = PAN;
            } else {
                this._state = NONE;
            }
        };


        OrbitControl.prototype.onTouchEnd = OrbitControl.prototype.onMouseUp = function() {

            this._state = NONE;
        };


        OrbitControl.prototype.onTouchMove = function() {
            var update = false,
                touch = Input.touches[0],
                delta = touch.delta,
                camera;

            if (this._state === ROTATE) {
                update = true;
                camera = this.camera;

                this._thetaDelta += 2 * PI * delta.x * camera.invWidth * this.speed;
                this._phiDelta -= 2 * PI * delta.y * camera.invHeight * this.speed;
            } else if (this._state === PAN) {
                update = true;

                this.pan(delta);
            }

            update && this.updateOrbit();
        };


        OrbitControl.prototype.onMouseMove = function() {
            var update = false,
                mouseDelta = Input.mouseDelta,
                camera;

            if (this._state === ROTATE) {
                update = true;
                camera = this.camera;

                this._thetaDelta += 2 * PI * mouseDelta.x * camera.invWidth * this.speed;
                this._phiDelta -= 2 * PI * mouseDelta.y * camera.invHeight * this.speed;
            } else if (this._state === PAN) {
                update = true;

                this.pan(mouseDelta);
            }

            update && this.updateOrbit();
        };


        OrbitControl.prototype.onMouseWheel = function(mouseWheel) {
            if (!this.allowZoom) return;
            var update = false;

            if (mouseWheel > 0) {
                update = true;
                this._scale *= pow(0.95, this.zoomSpeed);
            } else {
                update = true;
                this._scale /= pow(0.95, this.zoomSpeed);
            }

            update && this.updateOrbit();
        };


        OrbitControl.prototype.clear = function() {
            Component.prototype.clear.call(this);

            return this;
        };


        var panOffset = new Vec3;
        OrbitControl.prototype.pan = function(delta) {
            var pan = this._pan,
                camera = this.camera,
                transform = this.transform,
                te = transform.matrixWorld.elements,
                position = transform.position,
                targetDistance;

            panOffset.vsub(position, this.target);
            targetDistance = panOffset.length();

            if (!camera.orthographic) {
                targetDistance *= tan(degsToRads(camera.fov * 0.5));

                panOffset.set(te[0], te[1], te[2]).smul(-2 * delta.x * targetDistance * camera.invWidth);
                pan.add(panOffset);

                panOffset.set(te[4], te[5], te[6]).smul(2 * delta.y * targetDistance * camera.invHeight);
                pan.add(panOffset);
            } else {
                targetDistance *= camera.orthographicSize * 0.5;

                panOffset.set(te[0], te[1], te[2]).smul(-2 * delta.x * targetDistance * camera.invWidth);
                pan.add(panOffset);

                panOffset.set(te[4], te[5], te[6]).smul(2 * delta.y * targetDistance * camera.invHeight);
                pan.add(panOffset);
            }
        };


        OrbitControl.prototype.updateOrbit = function() {
            var transform = this.transform,
                position = transform.position,
                target = this.target,
                offset = this._offset,
                pan = this._pan,
                theta, phi, radius;

            offset.vsub(position, target);
            theta = atan2(offset.x, offset.y);
            phi = atan2(sqrt(offset.x * offset.x + offset.y * offset.y), offset.z);

            theta += this._thetaDelta;
            phi += this._phiDelta;

            phi = max(MIN_POLOR, min(MAX_POLOR, phi));
            phi = max(EPSILON, min(PI - EPSILON, phi));

            radius = offset.length() * this._scale;

            target.add(pan);

            offset.x = radius * sin(phi) * sin(theta);
            offset.y = radius * sin(phi) * cos(theta);
            offset.z = radius * cos(phi);

            position.vadd(target, offset);
            transform.lookAt(target);

            this._scale = 1;
            this._thetaDelta = 0;
            this._phiDelta = 0;
            pan.set(0, 0, 0);
        };


        OrbitControl.prototype.setTarget = function(target) {

            this.target.copy(target);
            this.transform.lookAt(this.target);
        };


        return OrbitControl;
    }
);
