if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/base/time",
        "odin/math/vec2",
        "odin/core/components/component"
    ],
    function(Class, Time, Vec2, Component) {
        "use strict";


        function Sprite2D(opts) {
            opts || (opts = {});

            Component.call(this);

            this.visible = opts.visible !== undefined ? !! opts.visible : true;

            this.z = opts.z !== undefined ? opts.z : 0;

            this.alpha = opts.alpha !== undefined ? opts.alpha : 1;

            this.image = opts.image !== undefined ? opts.image : undefined;

            this.width = opts.width || 1;
            this.height = opts.height || 1;

            this.x = opts.x || 0;
            this.y = opts.y || 0;
            this.w = opts.w || 64;
            this.h = opts.h || 64;

            this.animations = opts.animations;
            this.animation = "idle";

            this.mode = opts.mode !== undefined ? opts.mode : Sprite2D.LOOP;

            this.rate = opts.rate !== undefined ? opts.rate : 1;

            this._time = 0;
            this._frame = 0;
            this._order = 1;

            this.playing = this.animations ? true : false;
        }

        Class.extend(Sprite2D, Component);


        Sprite2D.prototype.copy = function(other) {

            this.visible = other.visible;

            this.z = other.z;

            this.alpha = other.alpha;

            this.image = other.image

            this.width = other.width;
            this.height = other.height;

            this.x = other.x;
            this.y = other.y;
            this.w = other.w;
            this.h = other.h;

            this.animations = other.animations;
            this.animation = other.animation;

            this.mode = other.mode;
            this.rate = other.rate;

            this._time = other._time;
            this._frame = other._frame;
            this._order = other._order;

            this.playing = other.playing;

            return this;
        };

        
        Sprite2D.prototype.play = function(name, mode, rate) {
            if (!this.animations) return;

            if ((!this.playing || this.animation !== name) && this.animations.data[name]) {
                this.animation = name;
                this.rate = rate || this.rate;

                if (this.mode === Sprite2D.ONCE) {
                    this._frame = 0;
                }

                switch (mode) {

                    case Sprite2D.PINGPONG:
                    case "pingpong":
                        this.mode = Sprite2D.PINGPONG;
                        break;

                    case Sprite2D.ONCE:
                    case "once":
                        this.mode = Sprite2D.ONCE;
                        this._frame = 0;
                        break;

                    case Sprite2D.LOOP:
                    case "loop":
                    default:
                        this.mode = Sprite2D.LOOP;
                        break;
                }

                this.playing = true;
                this.trigger("play", name);
            }
        };


        Sprite2D.prototype.stop = function() {

            if (this.playing) this.trigger("stop");
            this.playing = false;
        };


        Sprite2D.prototype.update = function() {
            var animations = this.animations,
                animation = animations && animations.data ? animations.data[this.animation] : undefined;

            if (!animation) return;

            var frame = this._frame,
                frames = animation.length - 1,
                order = this._order,
                mode = this.mode,
                currentFrame = animation[frame],
                frameTime = currentFrame[4],
                currentFrame;

            if (this.playing) {
                this._time += Time.delta * this.rate;

                if (this._time >= frameTime) {
                    this._time = 0;

                    if (currentFrame) {
                        this.x = currentFrame[0];
                        this.y = currentFrame[1];
                        this.w = currentFrame[2];
                        this.h = currentFrame[3];
                    }

                    if (mode === Sprite2D.PINGPONG) {
                        if (order === 1) {
                            if (frame >= frames) {
                                this._order = -1;
                            } else {
                                this._frame++;
                            }
                        } else {
                            if (frame <= 0) {
                                this._order = 1;
                            } else {
                                this._frame--;
                            }
                        }
                    } else {
                        if (frame >= frames) {
                            if (mode === Sprite2D.LOOP) {
                                this._frame = 0;
                            } else if (mode === Sprite2D.ONCE) {
                                this.stop();
                            }
                        } else {
                            this._frame++;
                        }
                    }
                }
            }
        };


        Sprite2D.prototype.toSYNC = function(json) {
			json || (json = {});
			Component.prototype.toSYNC.call(this, json);
            var image = this.image,
                animations = this.animations;

            json.visible = this.visible;

            json.z = this.z;

            json.alpha = this.alpha;

            json.width = this.width;
            json.height = this.height;

            json.x = this.x;
            json.y = this.y;
            json.w = this.w;
            json.h = this.h;
            
            json.animation = this.animation;

            json.mode = this.mode;
            json.rate = this.rate;

            json._time = this._time;
            json._frame = this._frame;
            json._order = this._order;

            json.playing = this.playing;

            return json;
        };


        Sprite2D.prototype.fromSYNC = function(json) {
			Component.prototype.fromSYNC.call(this, json);

            this.visible = json.visible;

            this.z = json.z;

            this.alpha = json.alpha;

            //this.image = json.image ? Assets.get(json.image) : undefined;

            this.width = json.width;
            this.height = json.height;

            this.x = json.x;
            this.y = json.y;
            this.w = json.w;
            this.h = json.h;

            this.animation = json.animation;

            this.mode = json.mode;
            this.rate = json.rate;

            this._time = json._time;
            this._frame = json._frame;
            this._order = json._order;

            this.playing = json.playing;

            return this;
        };


        Sprite2D.prototype.toJSON = function(json) {
			json || (json = {});
			Component.prototype.toJSON.call(this, json);
            var image = this.image,
                animations = this.animations;

            json.visible = this.visible;

            json.z = this.z;

            json.alpha = this.alpha;

            json.image = image ? image.name : undefined;

            json.width = this.width;
            json.height = this.height;

            json.x = this.x;
            json.y = this.y;
            json.w = this.w;
            json.h = this.h;

            json.animations = animations ? animations.name : undefined;
            json.animation = this.animation;

            json.mode = this.mode;
            json.rate = this.rate;

            json._time = this._time;
            json._frame = this._frame;
            json._order = this._order;

            json.playing = this.playing;

            return json;
        };


        Sprite2D.prototype.fromJSON = function(json) {
			Component.prototype.fromJSON.call(this, json);

            this.visible = json.visible;

            this.z = json.z;

            this.alpha = json.alpha;

            //this.image = json.image ? Assets.get(json.image) : undefined;

            this.width = json.width;
            this.height = json.height;

            this.x = json.x;
            this.y = json.y;
            this.w = json.w;
            this.h = json.h;

            this.animations = json.animations ? Assets.get(json.animations) : undefined;
            this.animation = json.animation;

            this.mode = json.mode;
            this.rate = json.rate;

            this._time = json._time;
            this._frame = json._frame;
            this._order = json._order;

            this.playing = json.playing;

            return this;
        };


        Sprite2D.prototype.sort = function(a, b) {

            return b.z - a.z;
        };


        Sprite2D.ONCE = 1;
        Sprite2D.LOOP = 2;
        Sprite2D.PINGPONG = 3;


        return Sprite2D;
    }
);
