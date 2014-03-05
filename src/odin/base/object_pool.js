if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define(
    function() {
        "use strict";


        function ObjectPool(constructor) {

            this.pooled = [];
            this.objects = [];
            this.object = constructor;
        }


        ObjectPool.prototype.create = function() {
            var pooled = this.pooled,
                object = pooled.length ? pooled.pop() : new this.object;

            this.objects.push(object);
            return object;
        };


        ObjectPool.prototype.removeObject = function(object) {
            var objects = this.objects,
                pooled = this.pooled,
                index = objects.indexOf(object);

            if (index > -1) {
                pooled.push(object);
                objects.splice(index, 1);
            }

            return this;
        };


        ObjectPool.prototype.remove = ObjectPool.prototype.removeObjects = function() {
            var i = arguments.length;

            while (i--) this.removeObject(arguments[i]);

            return this;
        };


        ObjectPool.prototype.clear = function() {
            var objects = this.objects,
                pooled = this.pooled,
                i = objects.length;

            while (i--) pooled.push(objects[i]);
            objects.length = 0;

            return this;
        };


        ObjectPool.prototype.clearForEach = function(fn) {
            var objects = this.objects,
                pooled = this.pooled,
                object,
                i = objects.length;

            while (i--) {
                object = objects[i];

                pooled.push(object);
                fn(object);
            }
            objects.length = 0;

            return this;
        };


        return ObjectPool;
    }
);
