if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/time",
        "odin/core/assets/assets",
        "odin/core/components/component",
        "odin/core/enums"
    ],
    function(Time, Assets, Component, Enums) {
        "use strict";


        var abs = Math.abs,
            WrapMode = Enums.WrapMode;


        function MeshAnimation(opts) {
            opts || (opts = {});

            Component.call(this, "MeshAnimation", opts);

            this.current = opts.current != undefined ? opts.current : "idle";
            this.mode = opts.mode != undefined ? opts.mode : WrapMode.Loop;

            this.rate = opts.rate != undefined ? opts.rate : 1 / 24;

            this._time = 0;
            this._frame = 0;
            this._order = 1;

            this.playing = this.sheet ? true : false;
        }

        Component.extend(MeshAnimation);


        MeshAnimation.prototype.copy = function(other) {

            this.current = other.current;
            this.mode = other.mode;

            this.rate = other.rate;

            this._time = other._time;
            this._frame = other._frame;
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
            this._order = 1;
            this._time = 0;

            return this;
        };


        MeshAnimation.prototype.update = function() {
            if (!this.playing) return;
            var meshFilter = this.meshFilter,
                mesh, current, dt, count, length, order, frame, mode, animation;

            if (!meshFilter) return;

            mesh = meshFilter.mesh;
            current = mesh.animations[this.current];

            if (!current) return;

            dt = Time.delta;
            order = this._order;
            frame = this._frame;
            mode = this.mode;

            if (!this.rate || this.rate === Infinity || this.rate < 0) {
                frame = abs(frame) % current.length;
            } else {
                this._time += dt;
                count = this._time / this.rate;

                if (count >= 1) {
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

            animation = current[frame];
            this._frame = frame;
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
