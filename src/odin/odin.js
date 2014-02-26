if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function(require) {
        "use strict";


        var IS_SERVER = !(typeof(window) !== "undefined" && window.document),
            IS_CLIENT = !IS_SERVER,

            defineProperty = Object.defineProperty;


        /**
         * Holds all accessible Classes
         * @class Odin
         */
        function Odin() {

            this.Phys2D = require("odin/phys2d/phys2d");

            this.AudioCtx = require("odin/base/audio_ctx");
            this.Class = require("odin/base/class");
            this.Device = require("odin/base/device");
            this.Dom = require("odin/base/dom");
            this.Enum = require("odin/base/enum");
            this.EventEmitter = require("odin/base/event_emitter");
            this.ObjectPool = require("odin/base/object_pool");
            this.requestAnimationFrame = require("odin/base/request_animation_frame");
            this.io = require("odin/base/socket.io");
            this.Time = require("odin/base/time");
            this.util = require("odin/base/util");

            this.Shader = require("odin/core/assets/shaders/shader");
            this.ShaderLib = require("odin/core/assets/shaders/shader_lib");
            this.Asset = require("odin/core/assets/asset");
            this.AssetLoader = require("odin/core/assets/asset_loader");
            this.Assets = require("odin/core/assets/assets");
            this.AudioClip = require("odin/core/assets/audio_clip");
            this.Bone = require("odin/core/assets/bone");
            this.Material = require("odin/core/assets/material");
            this.Mesh = require("odin/core/assets/mesh");
            this.SpriteSheet = require("odin/core/assets/sprite_sheet");
            this.Texture = require("odin/core/assets/texture");
            this.TextureCube = require("odin/core/assets/texture_cube");

            this.ParticleSystem = require("odin/core/components/particle_system/particle_system");
            this.AudioSource = require("odin/core/components/audio_source");
            this.Camera = require("odin/core/components/camera");
            this.Camera2D = require("odin/core/components/camera_2d");
            this.Component = require("odin/core/components/component");
            this.GUIText = require("odin/core/components/gui_text");
            this.GUITexture = require("odin/core/components/gui_texture");
            this.Light = require("odin/core/components/light");
            this.MeshFilter = require("odin/core/components/mesh_filter");
            this.OrbitControl = require("odin/core/components/orbit_control");
            this.RigidBody2D = require("odin/core/components/rigid_body_2d");
            this.Sprite = require("odin/core/components/sprite");
            this.SpriteAnimation = require("odin/core/components/sprite_animation");
            this.Transform = require("odin/core/components/transform");
            this.Transform2D = require("odin/core/components/transform_2d");

            this.Game = require("odin/core/game/game");
            this.ClientGame = require("odin/core/game/client_game");
            this.Config = require("odin/core/game/config");
            this.Log = require("odin/core/game/log");
            this.BaseGame = require("odin/core/game/base_game");

            this.GUIComponent = require("odin/core/gui/components/gui_component");
            this.GUIContent = require("odin/core/gui/components/gui_content");
            this.GUITransform = require("odin/core/gui/components/gui_transform");

            this.GUI = require("odin/core/gui/gui");
            this.GUIObject = require("odin/core/gui/gui_object");
            this.GUIStyle = require("odin/core/gui/gui_style");
            this.GUIStyleState = require("odin/core/gui/gui_style_state");

            this.Handler = require("odin/core/input/handler");
            this.Input = require("odin/core/input/input");

            this.World = require("odin/core/world/world");
            this.World2D = require("odin/core/world/world_2d");

            this.Enums = require("odin/core/enums");
            this.GameObject = require("odin/core/game_object");
            this.Prefab = require("odin/core/prefab");
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
            this.Rect = require("odin/math/rect");
            this.RectOffset = require("odin/math/rect_offset");
            this.Vec2 = require("odin/math/vec2");
            this.Vec3 = require("odin/math/vec3");
            this.Vec4 = require("odin/math/vec4");

            if (this.Device.mobile) {
                window.onerror = function(message, page, line) {
                    alert("line: " + line + ", page: " + page + "\nmessage: " + message);
                };
            }
        }


        defineProperty(Odin.prototype, "isServer", {
            get: function() {
                return IS_SERVER;
            }
        });


        defineProperty(Odin.prototype, "isClient", {
            get: function() {
                return IS_CLIENT;
            }
        });


        /**
         * attaches Odin to window/global and all subclasses
         */
        Odin.prototype.globalize = function() {

            for (var key in this) window[key] = this[key];
            window.Odin = this;
        };


        /**
         * test function n number of times returns time it took
         */
        Odin.prototype.test = function(name, fn, times) {
            times || (times = 1000);

            console.time(name);
            while (times--) fn();
            console.timeEnd(name);
        };


        return new Odin;
    }
);
