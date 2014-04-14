if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/component_managers/component_manager"
    ],
    function(ComponentManager) {
        "use strict";


        function MeshFilterComponentManager() {

            ComponentManager.call(this);
        }

        ComponentManager.extend(MeshFilterComponentManager);


        MeshFilterComponentManager.prototype.sortFunction = function(a, b) {

            return a.mesh === b.mesh ? 1 : -1;
        };


        MeshFilterComponentManager.prototype.update = function() {
			
        };


        return MeshFilterComponentManager;
    }
);
