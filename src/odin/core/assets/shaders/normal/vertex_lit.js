if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/shaders/shader",
    ],
    function(Shader) {
        "use strict";


        function VertexLit() {

            Shader.call(this, {
                name: "shader_vertex_lit",
                load: false,

                lights: true,
                vertexLit: true,

                vertex: [
                    "varying vec2 vUv;",
                    "varying vec3 vDiffuseLight;",

                    "void main() {",
                    "	vUv = uv;",
                    "	VertexLight(transformedNormal, worldPosition.xyz, -mvPosition.xyz, vDiffuseLight);",
                    "	gl_Position = projectionMatrix * mvPosition;",
                    "}"
                ].join("\n"),

                fragment: [
                    "uniform vec3 diffuseColor;",
                    "uniform sampler2D diffuseMap;",

                    "varying vec2 vUv;",
                    "varying vec3 vDiffuseLight;",

                    "void main() {",
                    "	vec4 finalColor = texture2D(diffuseMap, vUv);",
                    "	finalColor.xyz *= diffuseColor;",

                    "	gl_FragColor = vec4(vDiffuseLight * finalColor.xyz, finalColor.w);",
                    "}"
                ].join("\n")
            });
        }

        Shader.extend(VertexLit);


        return VertexLit;
    }
);
