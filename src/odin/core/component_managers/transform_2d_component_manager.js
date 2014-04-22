if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/component_managers/component_manager"
    ],
    function(ComponentManager) {
        "use strict";


        function Transform2DComponentManager() {

            ComponentManager.call(this, 999999);
        }

        ComponentManager.extend(Transform2DComponentManager);


        Transform2DComponentManager.prototype.sortFunction = function(a, b) {

            return a.depth - b.depth;
        };


        return Transform2DComponentManager;
    }
);
