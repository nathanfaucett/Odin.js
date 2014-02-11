if (typeof(define) !== "function") {
    var define = require("amdefine")(module);
}
define([
        "odin/core/assets/shaders/shader",
    ],
    function(Shader) {
        "use strict";

		
		function Unlit() {
			
			Shader.call(this, {
				name: "shader_unlit",
				load: false,
	
				vertex: [
					"varying vec2 vUv;",
	
					"void main() {",
					"	vUv = uv;",
					"	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
					"}"
				].join("\n"),
	
				fragment: [
					"uniform vec3 diffuseColor;",
					"uniform sampler2D diffuseMap;",
	
					"varying vec2 vUv;",
	
					"void main() {",
					"	vec4 finalColor = texture2D(diffuseMap, vUv);",
					"	finalColor.xyz *= diffuseColor;",
	
					"	gl_FragColor = finalColor;",
					"}"
				].join("\n")
			});
		}
		
		Shader.extend(Unlit);
		

        return Unlit;
    }
);
