if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/time",
        "odin/math/mathf",
        "odin/math/mat4",
        "odin/math/vec3",
        "odin/math/quat",
        "odin/core/assets/assets",
        "odin/core/components/component",
        "odin/core/enums"
    ],
    function(Time, Mathf, Mat4, Vec3, Quat, Assets, Component, Enums) {
        "use strict";


        var clamp01 = Mathf.clamp01,
            abs = Math.abs,
            WrapMode = Enums.WrapMode;


        function MeshAnimation(opts) {
            opts || (opts = {});

            Component.call(this, "MeshAnimation", opts);

            this.current = opts.current != undefined ? opts.current : "idle";
            this.mode = opts.mode != undefined ? opts.mode : WrapMode.Loop;

            this.rate = opts.rate != undefined ? opts.rate : 1 / 24;

            this._time = 0;
            this._frame = 0;
            this._lastFrame = 0;
            this._order = 1;

            this.playing = this.sheet ? true : false;
        }

        Component.extend(MeshAnimation);
        MeshAnimation.order = -1000000;


        MeshAnimation.prototype.copy = function(other) {

            this.current = other.current;
            this.mode = other.mode;

            this.rate = other.rate;

            this._time = other._time;
            this._frame = other._frame;
            this._lastFrame = other._lastFrame;
            this._order = other._order;

            this.playing = other.playing;

            return this;
        };


        MeshAnimation.prototype.play = function(name, mode, rate) {
            var meshFilter = this.meshFilter;
            if ((this.playing && this.current === name) || !meshFilter || !meshFilter.mesh.animations[name]) return this;

            this.current = name;
            this.rate = rate != undefined ? rate : (rate = this.rate);
            this.mode = mode || (mode = this.mode);
            this._frame = 0;
            this._lastFrame = 0;
            this._order = 1;
            this._time = 0;

            this.playing = true;
            this.emit("play", name, mode, rate);

            return this;
        };


        MeshAnimation.prototype.stop = function() {

            if (this.playing) this.emit("stop");
            this.playing = false;
            this._frame = 0;
            this._lastFrame = 0;
            this._order = 1;
            this._time = 0;

            return this;
        };


        var POSITION = new Vec3,
            LAST_POSITION = new Vec3,
            ROTATION = new Quat,
            LAST_ROTATION = new Quat,
            SCALE = new Vec3,
            LAST_SCALE = new Vec3,
            MAT4 = new Mat4;

        MeshAnimation.prototype.update = function() {
            if (!this.playing) return;
            var meshFilter = this.meshFilter,
                meshBones, mesh, bonesLength, alpha = 0.0,
                boneCurrent, boneTransform, uniform, parentIndex, boneFrame, lastBoneFrame, pos, rot, scl,
                current, dt, count, length, order, frame, lastFrame, mode, frameState, lastFrameState, i;

            if (!meshFilter) return;
            meshBones = meshFilter._bones;

            mesh = meshFilter.mesh;
            if (!mesh) return;

            if (!(bonesLength = meshBones.length)) return;
            i = bonesLength;

            current = mesh.animations[this.current];
            if (!current) return;

            dt = Time.delta;
            order = this._order;
            frame = this._frame;
            lastFrame = this._lastFrame;
            mode = this.mode;

            if (!this.rate || this.rate === Infinity || this.rate < 0) {
                frame = abs(frame) % current.length;
            } else {
                this._time += dt;
                count = this._time / this.rate;
                alpha = count;

                if (count >= 1) {
                    lastFrame = frame;
                    alpha = 0.0;

                    this._time = 0;
                    length = current.length;
                    frame += (order * (count | 0));

                    if (mode === WrapMode.Loop) {
                        frame = frame % length;
                    } else if (mode === WrapMode.Once) {
                        if (order > 0) {
                            if (frame >= length) {
                                frame = length - 1;
                                this.stop();
                            }
                        } else {
                            if (frame < 0) {
                                frame = 0;
                                this.stop();
                            }
                        }
                    } else if (mode === WrapMode.PingPong) {
                        if (order > 0) {
                            if (frame >= length) {
                                this._order = -1;
                                frame = length - 1;
                            }
                        } else {
                            if (frame < 0) {
                                this._order = 1;
                                frame = 0;
                            }
                        }
                    } else if (mode === WrapMode.Clamp) {
                        if (order > 0) {
                            if (frame >= length) frame = length - 1;
                        } else {
                            if (frame < 0) frame = 0;
                        }
                    }
                }
            }

            alpha = clamp01(alpha);
            frameState = current[frame];
            lastFrameState = current[lastFrame] || frameState;

            while (i--) {
                boneCurrent = meshBones[i];

                boneTransform = boneCurrent.transform;
                uniform = boneCurrent.uniform;
                parentIndex = boneCurrent.parentIndex;
                pos = boneTransform.position;
                rot = boneTransform.rotation;
                scl = boneTransform.scale;

                boneFrame = frameState[i];
                lastBoneFrame = lastFrameState[i];

                LAST_POSITION.x = lastBoneFrame[0];
                LAST_POSITION.y = lastBoneFrame[1];
                LAST_POSITION.z = lastBoneFrame[2];

                LAST_ROTATION.x = lastBoneFrame[3];
                LAST_ROTATION.y = lastBoneFrame[4];
                LAST_ROTATION.z = lastBoneFrame[5];
                LAST_ROTATION.w = lastBoneFrame[6];

                LAST_SCALE.x = lastBoneFrame[7];
                LAST_SCALE.y = lastBoneFrame[8];
                LAST_SCALE.z = lastBoneFrame[9];

                POSITION.x = boneFrame[0];
                POSITION.y = boneFrame[1];
                POSITION.z = boneFrame[2];

                ROTATION.x = boneFrame[3];
                ROTATION.y = boneFrame[4];
                ROTATION.z = boneFrame[5];
                ROTATION.w = boneFrame[6];

                SCALE.x = boneFrame[7];
                SCALE.y = boneFrame[8];
                SCALE.z = boneFrame[9];

                pos.vlerp(LAST_POSITION, POSITION, alpha);
                rot.qlerp(LAST_ROTATION, ROTATION, alpha);
                scl.vlerp(LAST_SCALE, SCALE, alpha);
            }

            this._frame = frame;
            this._lastFrame = lastFrame;
        };


        MeshAnimation.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.current = this.current;
            json.mode = this.mode;

            json.rate = this.rate;

            json._time = this._time;
            json._frame = this._frame;
            json._order = this._order;

            json.playing = this.playing;

            return json;
        };


        MeshAnimation.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.current = json.current;
            this.mode = json.mode;

            this.rate = json.rate;

            this._time = json._time;
            this._frame = json._frame;
            this._order = json._order;

            this.playing = json.playing;

            return this;
        };


        return MeshAnimation;
    }
);
