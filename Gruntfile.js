module.exports = function(grunt) {

    grunt.initConfig({
        requirejs: {
            compile: {
                options: {
                    baseUrl: "./src",
                    optimize: "uglify2",
                    name: "odin",
                    out: "./odin.js",

                    uglify2: {
                        output: {
                            beautify: false
                        },
                        compress: {
                            sequences: true
                        },
                        warnings: true,
                        mangle: true
                    }
                }
            }
        },
        jsbeautifier: {
            files: [
				"src/**/*.js",
			]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-requirejs");
    grunt.loadNpmTasks("grunt-jsbeautifier");

    grunt.registerTask("default", ["requirejs"]);
    grunt.registerTask("beautify", ["jsbeautifier"]);
};
