if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/class",
        "odin/base/object_pool"
    ],
    function(Class, ObjectPool) {
        "use strict";


        function Prefab(object) {

            Class.call(this);

            this.object = object.toJSON();
            this.objectPool = new ObjectPool(object.constructor);
        }

        Class.extend(Prefab);


        Prefab.prototype.create = function() {
            var object = this.objectPool.create();

            object.clear();

            object.fromJSON(this.object);
            object.on("remove", onRemove, this);

            return object;
        };


        function onRemove(object) {

            this.objectPool.removeObject(object);
        };


        return Prefab;
    }
);
