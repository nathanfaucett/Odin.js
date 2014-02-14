if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/shaders/unlit",
        "odin/core/assets/shaders/vertex_lit",
        "odin/core/assets/shaders/reflective_vertex_lit",

    ],
    function(Unlit, VertexLit, ReflectiveVertexLit) {
        "use strict";


        return {
            Unlit: Unlit,
            VertexLit: VertexLit,

            ReflectiveVertexLit: ReflectiveVertexLit
        };
    }
);
