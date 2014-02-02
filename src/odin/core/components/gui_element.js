if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/math/rect",
        "odin/core/components/component"
    ],
    function(Rect, Component) {
        "use strict";


        function GUIElement(type, opts) {
            opts || (opts = {});

            Component.call(this, type || "GUIElement", opts);
        }

        Component.extend(GUIElement);


        var RECT = new Rect;
        GUIElement.prototype.screen = function(camera, rect) {
            rect || (rect = RECT);
            camera || (camera = this.gameObject.scene.game.camera);

            rect.x = 0;
            rect.y = 0;
            rect.width = camera.width;
            rect.height = camera.height;

            return rect;
        };


        return GUIElement;
    }
);
