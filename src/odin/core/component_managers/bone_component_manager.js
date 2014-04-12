if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/component_managers/component_manager"
    ],
    function(ComponentManager) {
        "use strict";


        function BoneComponentManager() {

            ComponentManager.call(this, 1000001);
        }

        ComponentManager.extend(BoneComponentManager);


        BoneComponentManager.prototype.sortFunction = function(a, b) {

            return a.parentIndex - b.parentIndex;
        };


        return BoneComponentManager;
    }
);
