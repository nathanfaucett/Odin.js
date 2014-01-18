module.exports = function(grunt) {

    grunt.initConfig({
        requirejs: {
            compile: {
                options: {
                    baseUrl: "./src",
                    optimize: "uglify2",
                    name: "odin",
                    out: "build/odin.js",

                    uglify2: {
                        output: {
                            beautify: false,
                            space_colon: false,
                            bracketize: true
                        },
                        compress: {
                            sequences: true,
                            hoist_vars: true
                        },
                        preserveLicenseComments: false,
                        mangle: false,

                        generateSourceMaps: true,
                        warnings: true
                    }
                }
            }
        },
        jsbeautifier: {
            files: [
                "**/*.js",
                "!build/**/*",
                "!node_modules/**/*"
            ]
        },
        watch: {
            scripts: {
                files: [
                    "**/*.js",
                    "!build/**/*",
                    "!node_modules/**/*"
                ],
                tasks: ["jsbeautifier"],
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
    grunt.registerTask("build", ["requirejs"]);
    grunt.registerTask("jsb", ["jsbeautifier"]);
    grunt.registerTask("default", ["jsbeautifier", "requirejs"]);
};
