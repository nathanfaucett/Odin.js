if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/shaders/shader",
    ],
    function(Shader) {
        "use strict";


        function Specular() {

            Shader.call(this, {
                name: "shader_specular",
                load: false,

                lights: true,

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

                    "uniform float shininess;",

                    "varying vec2 vUv;",

                    "void main() {",
                    "	vec4 finalColor = texture2D(diffuseMap, vUv);",
                    "	finalColor.xyz *= diffuseColor;",

                    "	vec3 diffuseLight, specularLight;",
                    "	PixelLight(normalize(vNormal), vec3(1.0), 1.0, shininess, diffuseLight, specularLight);",

                    "	gl_FragColor = vec4(diffuseLight * finalColor.xyz + specularLight * finalColor.xyz, finalColor.w);",
                    "}"
                ].join("\n")
            });
        }

        Shader.extend(Specular);


        return Specular;
    }
);
