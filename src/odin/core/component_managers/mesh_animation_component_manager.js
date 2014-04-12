if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/component_managers/component_manager"
    ],
    function(ComponentManager) {
        "use strict";


        function MeshAnimationComponentManager() {

            ComponentManager.call(this, 1000000);
        }

        ComponentManager.extend(MeshAnimationComponentManager);


        return MeshAnimationComponentManager;
    }
);
