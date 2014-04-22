if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/component_managers/component_manager"
    ],
    function(ComponentManager) {
        "use strict";


        function Camera2DComponentManager() {

            ComponentManager.call(this);
        }

        ComponentManager.extend(Camera2DComponentManager);


        Camera2DComponentManager.prototype.sortFunction = function(a, b) {

            return a._active ? 1 : b._active ? -1 : 0;
        };


        return Camera2DComponentManager;
    }
);
