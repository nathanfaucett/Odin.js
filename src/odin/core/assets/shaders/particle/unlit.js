if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/shaders/shader",
    ],
    function(Shader) {
        "use strict";


        function ParticleUnlit() {

            Shader.call(this, {
                name: "shader_particle_unlit",

                vertex: [
                    "void main() {",
                    "	gl_Position = projectionMatrix * mvPosition;",
                    "}"
                ].join("\n"),

                fragment: [
                    "uniform sampler2D diffuseMap;",

                    "void main() {",
                    "	float c = cos(vAngle);",
                    "	float s = sin(vAngle);",

                    "	vec2 rotatedUV = vec2(c * (gl_PointCoord.x - 0.5) + s * (gl_PointCoord.y - 0.5) + 0.5,",
                    "						  c * (gl_PointCoord.y - 0.5) - s * (gl_PointCoord.x - 0.5) + 0.5);",

                    "	vec4 rotatedTexture = texture2D(diffuseMap, rotatedUV);",
                    "	gl_FragColor = vec4(vParticleColor * rotatedTexture.xyz, vAlpha * rotatedTexture.w);",
                    "}"
                ].join("\n")
            });
        }

        Shader.extend(ParticleUnlit);


        return ParticleUnlit;
    }
);
