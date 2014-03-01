if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/shaders/shader",
    ],
    function(Shader) {
        "use strict";


        function Diffuse() {

            Shader.call(this, {
                name: "shader_diffuse",
                load: false,

                lights: true,
                specular: false,

                vertex: [
                    "varying vec2 vUv;",

                    "void main() {",
                    "	vUv = uv;",
                    "	gl_Position = projectionMatrix * mvPosition;",
                    "}"
                ].join("\n"),

                fragment: [
                    "uniform vec3 diffuseColor;",
                    "uniform sampler2D diffuseMap;",

                    "varying vec2 vUv;",

                    "void main() {",
                    "	vec3 diffuseLight = PixelLightNoSpec(normalize(vNormal));",

                    "	vec4 finalColor = texture2D(diffuseMap, vUv);",
                    "	finalColor.xyz *= diffuseColor;",

                    "	gl_FragColor = vec4(diffuseLight * finalColor.xyz, finalColor.w);",
                    "}"
                ].join("\n")
            });
        }

        Shader.extend(Diffuse);


        return Diffuse;
    }
);
