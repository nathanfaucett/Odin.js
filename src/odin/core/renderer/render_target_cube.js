if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/renderer/render_target",
        "odin/core/enums"
    ],
    function(RenderTarget, Enums) {
        "use strict";

        /**
         * @class RenderTargetCube
         * @extends RenderTarget
         * @brief WebGL Render Target helper
         */

        function RenderTargetCube(opts) {
            opts || (opts = {});

            RenderTarget.call(this, opts);
        }

        RenderTarget.extend(RenderTargetCube);


        RenderTargetCube.prototype.clone = function() {

            return new RenderTargetCube().copy(this);
        };


        RenderTargetCube.prototype.copy = function(other) {
            RenderTarget.prototype.copy.call(this, other);

            return this;
        };


        RenderTargetCube.prototype.toJSON = function(json, pack) {
            json = RenderTarget.prototype.toJSON.call(this, json);

            return json;
        };


        RenderTargetCube.prototype.fromJSON = function(json) {
            RenderTarget.prototype.fromJSON.call(this, json);

            return this;
        };


        return RenderTargetCube;
    }
);
