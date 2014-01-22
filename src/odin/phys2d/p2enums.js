if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/enum"
    ],
    function(Enum) {
        "use strict";


        return {
            BodyType: new Enum("Particle RigidBody"),
            ShapeType: new Enum("Convex Circle Segment"),
            MotionState: new Enum("Dynamic Static Kinematic"),
            SleepState: new Enum("Awake Sleepy Sleeping")
        };
    }
);
