if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/base/enum"
    ],
    function(Enum) {
        "use strict";


        return {
            AxisType: new Enum("Button Mouse MouseWheel Touch Joystick"),
            Blending: new Enum("Default None Additive Subtractive Muliply"),
            EmitterType: new Enum("Circle CircleEdge Box BoxEdge"),
            FontStyle: new Enum("Normal Bold Italic BoldAnditalic"),
            TextClipping: new Enum("Overflow Clip"),
            TextAnchor: new Enum("UpperLeft UpperCenter UpperRight MiddleLeft MiddleCenter MiddleRight LowerLeft LowerCenter LowerRight"),
            WrapMode: new Enum("Once Loop PingPong Clamp")
        };
    }
);
