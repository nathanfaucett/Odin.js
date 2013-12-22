if (typeof define !== 'function') { var define = require('amdefine')(module) }
define(
    function(require) {
        "use strict";

		
		function Odin() {
			
			this.Class = require("odin/base/class");
			this.Device = require("odin/base/device");
			this.Dom = require("odin/base/dom");
			this.EventEmitter = require("odin/base/event_emitter");
			this.ObjectPool = require("odin/base/object_pool");
			this.requestAnimationFrame = require("odin/base/request_animation_frame");
			this.Time = require("odin/base/time");
			
			this.Asset = require("odin/core/assets/asset");
			this.AssetLoader = require("odin/core/assets/asset_loader");
			this.Assets = require("odin/core/assets/assets");
			this.AudioClip = require("odin/core/assets/audio_clip");
			this.SpriteSheet = require("odin/core/assets/sprite_sheet");
			this.Texture = require("odin/core/assets/texture");
			
			this.AudioSource = require("odin/core/components/audio_source");
			this.Camera = require("odin/core/components/camera");
			this.Camera2D = require("odin/core/components/camera2d");
			this.Component = require("odin/core/components/component");
			this.Sprite2D = require("odin/core/components/sprite2d");
			this.Transform = require("odin/core/components/transform");
			this.Transform2D = require("odin/core/components/transform2d");
			
			this.Game = require("odin/core/game/game");
			this.ClientGame = require("odin/core/game/client_game");
			this.Log = require("odin/core/game/log");
			
			this.Handler = require("odin/core/input/handler");
			this.Input = require("odin/core/input/input");
			
			this.CanvasRenderer2D = require("odin/core/rendering/canvas_renderer_2d");
			this.WebGLRenderer2D = require("odin/core/rendering/webgl_renderer_2d");
			
			this.GameObject = require("odin/core/game_object");
			this.Scene = require("odin/core/scene");
			
			this.AABB2 = require("odin/math/aabb2");
			this.AABB3 = require("odin/math/aabb3");
			this.Color = require("odin/math/color");
			this.Mat2 = require("odin/math/mat2");
			this.Mat3 = require("odin/math/mat3");
			this.Mat32 = require("odin/math/mat32");
			this.Mat4 = require("odin/math/mat4");
			this.Mathf = require("odin/math/mathf");
			this.Quat = require("odin/math/quat");
			this.Vec2 = require("odin/math/vec2");
			this.Vec3 = require("odin/math/vec3");
			this.Vec4 = require("odin/math/vec4");
			
			if (this.Device.mobile) {
				window.onerror = function(message,page,line,chr) {
					alert("line: "+ line +", page: "+ page +"\nmessage: "+ message);
				};
			}
		}
		
		
		Odin.prototype.globalize = function() {
			
            for (var key in this) window[key] = this[key];
            window.Odin = this;
        };
		
        return new Odin;
    }
);