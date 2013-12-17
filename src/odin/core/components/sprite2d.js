define([
        "odin/base/class",
        "odin/base/time",
        "odin/math/vec2",
        "odin/core/components/component",
        "odin/core/assets/assets"
    ],
    function(Class, Time, Vec2, Component, Assets) {
        "use strict";


        function Sprite2D(opts) {
            opts || (opts = {});

            Component.call(this, "Sprite2D", opts.sync, opts.json);

            this.visible = opts.visible != undefined ? !! opts.visible : true;

            this.z = opts.z != undefined ? opts.z : 0;

            this.alpha = opts.alpha != undefined ? opts.alpha : 1;

            this.texture = opts.texture != undefined ? opts.texture : undefined;

            this.width = opts.width || 1;
            this.height = opts.height || 1;

            this.x = opts.x || 0;
            this.y = opts.y || 0;
            this.w = opts.w || 1;
            this.h = opts.h || 1;

            this.animations = opts.animations != undefined ? opts.animations : undefined;
            this.animation = "idle";

            this.mode = opts.mode != undefined ? opts.mode : LOOP;

            this.rate = opts.rate != undefined ? opts.rate : 1;

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

            this.texture = other.texture;

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

            if ((!this.playing || this.animation !== name) && this.animations.raw[name]) {
                this.animation = name;
                this.rate = rate || this.rate;

                if (this.mode === ONCE) this._frame = 0;

                switch (mode) {

                    case PING_PONG:
                    case "pingpong":
                        this.mode = PING_PONG;
                        break;

                    case ONCE:
                    case "once":
                        this.mode = ONCE;
                        this._frame = 0;
                        break;

                    case LOOP:
                    case "loop":
                    default:
                        this.mode = LOOP;
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
                animation = animations && animations.raw ? animations.raw[this.animation] : undefined;

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

                    if (mode === PING_PONG) {
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
                            if (mode === LOOP) {
                                this._frame = 0;
                            } else if (mode === ONCE) {
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
			json = Component.prototype.toSYNC.call(this, json);

            json.visible = this.visible;

            json.z = this.z;

            json.alpha = this.alpha;

            json.width = this.width;
            json.height = this.height;
            
			if (this.animations) {
				json.animation = this.animation;
	
				json.x = this.x;
				json.y = this.y;
				json.w = this.w;
				json.h = this.h;
				
				json.mode = this.mode;
				json.rate = this.rate;
	
				json._time = this._time;
				json._frame = this._frame;
				json._order = this._order;
	
				json.playing = this.playing;
			}

            return json;
        };


        Sprite2D.prototype.fromSYNC = function(json) {
			Component.prototype.fromSYNC.call(this, json);

            this.visible = json.visible;

            this.z = json.z;

            this.alpha = json.alpha;

            this.width = json.width;
            this.height = json.height;

			if (this.animations) {
				
				this.animation = json.animation;
				
				this.x = json.x;
				this.y = json.y;
				this.w = json.w;
				this.h = json.h;
				
				this.mode = json.mode;
				this.rate = json.rate;
	
				this._time = json._time;
				this._frame = json._frame;
				this._order = json._order;
	
				this.playing = json.playing;
			}

            return this;
        };


        Sprite2D.prototype.toJSON = function(json) {
			json || (json = {});
			Component.prototype.toJSON.call(this, json);

            json.visible = this.visible;

            json.z = this.z;

            json.alpha = this.alpha;

            json.texture = this.texture ? this.texture.name : undefined;

            json.width = this.width;
            json.height = this.height;

            json.x = this.x;
            json.y = this.y;
            json.w = this.w;
            json.h = this.h;

            json.animations = this.animations ? this.animations.name : undefined;
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
			
			this.texture = json.texture ? Assets.hash[json.texture] : undefined;

            this.width = json.width;
            this.height = json.height;

            this.x = json.x;
            this.y = json.y;
            this.w = json.w;
            this.h = json.h;

            this.animations = json.animations ? Assets.hash[json.animations] : undefined;
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


        var ONCE = Sprite2D.ONCE = 1,
			LOOP = Sprite2D.LOOP = 2,
			PING_PONG = Sprite2D.PING_PONG = 3;


        return Sprite2D;
    }
);
