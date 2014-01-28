if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/shaders/shader",
    ],
    function(Shader) {
        "use strict";


        return new Shader({
            name: "shader_unlit",
            load: false,

            vertex: [
                "uniform mat4 modelViewMatrix;",
                "uniform mat4 projectionMatrix;",

                "uniform vec2 mainTextureOffset;",
                "uniform vec2 mainTextureScale;",

                "attribute vec3 aVertexPosition;",
                "attribute vec2 aVertexUv;",

                "varying vec2 vVertexUv;",

                "void main() {",

                "	vVertexUv = mainTextureOffset + aVertexUv / mainTextureScale;",
                "	gl_Position = projectionMatrix * modelViewMatrix * vec4(aVertexPosition, 1.0);",
                "}"
            ].join("\n"),

            fragment: [
                "uniform vec3 color;",
                "uniform float alpha;",
                "uniform sampler2D mainTexture;",

                "varying vec2 vVertexUv;",

                "void main() {",
                "	vec4 finalColor = texture2D(mainTexture, vVertexUv);",
                "	finalColor.xyz *= color;",
                "	finalColor.w *= alpha;",

                "	gl_FragColor = finalColor;",
                "}"
            ].join("\n")
        });
    }
);
