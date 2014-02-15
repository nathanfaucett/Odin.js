if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/shaders/normal/unlit",
        "odin/core/assets/shaders/normal/vertex_lit",
        "odin/core/assets/shaders/normal/diffuse",
        "odin/core/assets/shaders/normal/specular",
        "odin/core/assets/shaders/normal/normal_diffuse",
        "odin/core/assets/shaders/normal/normal_specular",

        "odin/core/assets/shaders/reflective/reflective_vertex_lit",

    ],
    function(
        Unlit, VertexLit, Diffuse, Specular, NormalDiffuse, NormalSpecular,
        ReflectiveVertexLit
    ) {
        "use strict";


        return {
            Unlit: Unlit,
            VertexLit: VertexLit,
            Diffuse: Diffuse,
            Specular: Specular,
            NormalDiffuse: NormalDiffuse,
            NormalSpecular: NormalSpecular,

            ReflectiveVertexLit: ReflectiveVertexLit
        };
    }
);
