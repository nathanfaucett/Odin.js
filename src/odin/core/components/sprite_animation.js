if (typeof define !== "function") {
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


        var WrapMode = Enums.WrapMode,
            floor = Math.floor;


        /**
         * @class SpriteAnimation
         * @extends Component
         * @brief base class for handling sprite animation sheets
         * @param Object options
         */
        function SpriteAnimation(opts) {
            opts || (opts = {});

            Component.call(this, "SpriteAnimation", !! opts.sync, opts.json);

            this.sheet = opts.sheet != undefined ? opts.sheet : undefined;

            this.current = opts.current != undefined ? opts.current : "idle";
            this.mode = opts.mode != undefined ? opts.mode : WrapMode.Loop;

            this.rate = opts.rate !== undefined ? opts.rate : 1 / 24;

            this._time = 0;
            this._frame = 0;
            this._order = 1;

            this.playing = this.sheet ? true : false;
        }

        Component.extend(SpriteAnimation);


        SpriteAnimation.prototype.copy = function(other) {

            this.sheet = other.sheet;

            this.current = other.current;
            this.mode = other.mode;

            this.rate = other.rate;

            this._time = other._time;
            this._frame = other._frame;
            this._order = other._order;

            this.playing = other.playing;

            return this;
        };


        SpriteAnimation.prototype.clear = function() {

            this.sheet = undefined;

            return this;
        };


        SpriteAnimation.prototype.play = function(name, mode, rate) {
            if (!this.sheet) return this;
            if ((this.playing && this.current === name) || !this.sheet[name]) return this;

            this.current = name;
            this.rate = rate || (rate = this.rate);
            this.mode = mode || (mode = this.mode);
            this._frame = 0;
            this._order = 1;
            this._time = 0;

            this.playing = true;
            this.emit("play", name, mode, rate);

            return this;
        };


        SpriteAnimation.prototype.stop = function() {

            if (this.playing) this.emit("stop");
            this.playing = false;
            this._frame = 0;
            this._order = 1;
            this._time = 0;

            return this;
        };


        SpriteAnimation.prototype.update = function() {
            if (!this.playing || !this.rate) return;
            var sprite = this.sprite,
                sheet = this.sheet,
                current = sheet[this.current],
                dt, count, length, order, frame, mode, animation;

            if (!sprite || !sheet || !current) return;

            dt = Time.delta;
            order = this._order;
            frame = this._frame;
            mode = this.mode;

            this._time += dt;
            count = this._time / this.rate;

            if (count >= 1) {
                this._time = 0;
                length = current.length;
                frame += (order * floor(count));

                switch (mode) {

                    case WrapMode.Loop:
                        frame = frame % length;
                        break;

                    case WrapMode.Once:
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
                        break;

                    case WrapMode.PingPong:
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
                        break;

                    case WrapMode.Clamp:
                        if (order > 0) {
                            if (frame >= length) frame = length - 1;
                        } else {
                            if (frame < 0) frame = 0;
                        }
                        break;
                }

                animation = current[frame];
                sprite.x = animation[0];
                sprite.y = animation[1];
                sprite.w = animation[2];
                sprite.h = animation[3];
            }

            this._frame = frame;
        };


        SpriteAnimation.prototype.toJSON = function(json) {
            json = Component.prototype.toJSON.call(this, json);

            json.sheet = this.sheet ? this.sheet.name : undefined;

            json.current = this.current;
            json.mode = this.mode;

            json.rate = this.rate;

            json._time = this._time;
            json._frame = this._frame;
            json._order = this._order;

            json.playing = this.playing;

            return json;
        };


        SpriteAnimation.prototype.fromServerJSON = function(json) {
            Component.prototype.fromServerJSON.call(this, json);

            this.sheet = json.sheet ? Assets.hash[json.sheet] : undefined;

            this.current = json.current;
            this.mode = json.mode;

            this.rate = json.rate;

            this._time = json._time;
            this._frame = json._frame;
            this._order = json._order;

            this.playing = json.playing;

            return this;
        };


        SpriteAnimation.prototype.fromJSON = function(json) {
            Component.prototype.fromJSON.call(this, json);

            this.sheet = json.sheet ? Assets.hash[json.sheet] : undefined;

            this.current = json.current;
            this.mode = json.mode;

            this.rate = json.rate;

            this._time = json._time;
            this._frame = json._frame;
            this._order = json._order;

            this.playing = json.playing;

            return this;
        };


        return SpriteAnimation;
    }
);
