if (typeof define !== "function") {
    var define = require("amdefine")(module);
}
define([
        "base/enum"
    ],
    function(Enum) {
        "use strict";


        return new Enum([
            "BlendingDefault",
            "BlendingNone",
            "BlendingAdditive",
            "BlendingSubtractive",
            "BlendingMuliply",

            "Circle",
            "CircleEdge",
            "Box",
            "BoxEdge"
        ]);
    }
);
