if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/component_managers/component_manager"
    ],
    function(ComponentManager) {
        "use strict";


        function TransformComponentManager() {

            ComponentManager.call(this, 999999);
        }

        ComponentManager.extend(TransformComponentManager);


        TransformComponentManager.prototype.sortFunction = function(a, b) {

            return a.depth - b.depth;
        };


        return TransformComponentManager;
    }
);
