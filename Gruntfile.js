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
        },
		watch: {
			scripts: {
                files: [
                    "src/**/*.js",
                ],
                tasks: ["jsbeautifier", "requirejs"],
                options: {
                    spawn: false,
                }
            }
		}
    });

    grunt.loadNpmTasks("grunt-contrib-requirejs");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-jsbeautifier");

    grunt.registerTask("dev", ["watch"]);
    grunt.registerTask("default", ["jsbeautifier", "requirejs"]);
};
