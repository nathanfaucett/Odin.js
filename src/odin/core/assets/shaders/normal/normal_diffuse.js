if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/shaders/shader",
    ],
    function(Shader) {
        "use strict";


        function NormalDiffuse() {

            Shader.call(this, {
                name: "shader_normal_diffuse",
                load: false,

                lights: true,
                specular: false,
                OES_standard_derivatives: true,

                vertex: [
                    "varying vec2 vUv;",
                    "varying vec3 vTangent;",
                    "varying vec3 vBinormal;",

                    "void main() {",
                    "	#ifdef USE_SKINNING",
                    "		vec4 boneTangent = boneMatrix * vec4( tangent.xyz, 0.0 );",
                    "		vTangent = normalize( normalMatrix * boneTangent.xyz );",
                    "	#else",
                    "		vTangent = normalize( normalMatrix * tangent.xyz );",
                    "	#endif",

                    "	vUv = uv;",
                    "	vBinormal = normalize( cross( vNormal, vTangent ) * tangent.w );",

                    "	gl_Position = projectionMatrix * mvPosition;",
                    "}"
                ].join("\n"),

                fragment: [
                    "uniform vec3 diffuseColor;",
                    "uniform sampler2D diffuseMap;",

                    "uniform sampler2D normalMap;",
                    "uniform float normalScale;",

                    "varying vec2 vUv;",
                    "varying vec3 vTangent;",
                    "varying vec3 vBinormal;",

                    "void main() {",
                    "	vec3 normalTex = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;",
                    "	normalTex.xy *= normalScale;",

                    "	mat3 tsb = mat3( vTangent, vBinormal, vNormal );",
                    "	vec3 normal = normalize(tsb * normalTex);",

                    "	vec3 diffuseLight = PixelLightNoSpec(normal);",

                    "	vec4 finalColor = texture2D(diffuseMap, vUv);",
                    "	finalColor.xyz *= diffuseColor;",

                    "	gl_FragColor = vec4(diffuseLight * finalColor.xyz, finalColor.w);",
                    "}"
                ].join("\n")
            });
        }

        Shader.extend(NormalDiffuse);


        return NormalDiffuse;
    }
);
