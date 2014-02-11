if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/shaders/unlit",
        "odin/core/assets/shaders/vertex_lit",

    ],
    function(Unlit, VertexLit) {
        "use strict";


        return {
			Unlit: Unlit,
			VertexLit: VertexLit
		};
    }
);
