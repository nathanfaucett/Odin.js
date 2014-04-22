if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/component_managers/component_manager"
    ],
    function(ComponentManager) {
        "use strict";


        function LightComponentManager() {

            ComponentManager.call(this);
        }

        ComponentManager.extend(LightComponentManager);


        LightComponentManager.prototype.sortFunction = function(a, b) {

            return a.type - b.type;
        };


        LightComponentManager.prototype.update = function() {

        };


        return LightComponentManager;
    }
);
