if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/shaders/shader",
    ],
    function(Shader) {
        "use strict";


        function ReflectiveVertexLit() {

            Shader.call(this, {
                name: "shader_reflective_vertex_lit",
                load: false,

                lights: true,
                vertexLit: true,

                vertex: [
                    "varying vec2 vUv;",
                    "varying vec3 vReflect;",
                    "varying vec3 vDiffuseLight;",

                    "void main() {",
                    "	vec3 worldNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * objectNormal);",
                    "	vec3 cameraToVertex = normalize(worldPosition.xyz - cameraPosition);",

                    "	vReflect = reflect(cameraToVertex, worldNormal);",
                    "	vUv = uv;",
                    "	VertexLight(transformedNormal, worldPosition.xyz, -mvPosition.xyz, vDiffuseLight);",

                    "	gl_Position = projectionMatrix * mvPosition;",
                    "}"
                ].join("\n"),

                fragment: [
                    "uniform vec3 diffuseColor;",
                    "uniform sampler2D diffuseMap;",
                    "uniform samplerCube envMap;",

                    "uniform float reflectivity;",
                    "uniform int combine;",

                    "varying vec2 vUv;",
                    "varying vec3 vReflect;",
                    "varying vec3 vDiffuseLight;",

                    "void main() {",

                    "	vec4 finalColor = texture2D(diffuseMap, vUv);",
                    "	finalColor.xyz *= diffuseColor;",

                    "	vec3 cubeColor = textureCube(envMap, vReflect).xyz;",

                    "	if (combine == 1) {",
                    "		finalColor.xyz = mix(finalColor.xyz, cubeColor, reflectivity);",
                    "	} else if (combine == 2) {",
                    "		finalColor.xyz += cubeColor * reflectivity;",
                    "	} else {",
                    "		finalColor.xyz = mix(finalColor.xyz, finalColor.xyz * cubeColor, reflectivity);",
                    "	}",

                    "	gl_FragColor = vec4(vDiffuseLight * finalColor.xyz, finalColor.w);",
                    "}"
                ].join("\n")
            });
        }

        Shader.extend(ReflectiveVertexLit);


        return ReflectiveVertexLit;
    }
);
