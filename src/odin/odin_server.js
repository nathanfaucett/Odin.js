define(
    function() {
        "use strict";

		
		function Odin() {
			
			this.Class = require("odin/base/class");
			this.EventEmitter = require("odin/base/event_emitter");
			this.ObjectPool = require("odin/base/object_pool");
			this.requestAnimationFrame = require("odin/base/request_animation_frame");
			this.Time = require("odin/base/time");
			
			this.Camera = require("odin/core/components/camera");
			this.Camera2D = require("odin/core/components/camera2d");
			this.Component = require("odin/core/components/component");
			this.Sprite2D = require("odin/core/components/sprite2d");
			this.Transform = require("odin/core/components/transform");
			this.Transform2D = require("odin/core/components/transform2d");
			
			this.Game = require("odin/core/game/game");
			this.ServerGame = require("odin/core/game/server_game");
			
			this.Input = require("odin/core/input/input");
			
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
		}
		
		
		Odin.prototype.globalize = function() {
            
            for (var key in this) global[key] = this[key];
            global.Odin = this;
        };
		

        return new Odin;
    }
);