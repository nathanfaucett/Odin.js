module.exports = function(grunt) {

    grunt.initConfig({
		requirejs: {
			compile: {
				options: {
					baseUrl: "./src",
					out: "./odin/odin.js",
					name: "odin/odin",
					
					optimize: "uglify2",
					
					uglify2: {
						output: {
							beautify: false
						},
						compress: {
							sequences: true,
							properties: true,
							dead_code: true,
							drop_debugger: true,
							conditionals: true,
							comparisons: true,
							evaluate: true,
							booleans: true,
							loops: true,
							unused: true,
							hoist_funs: true,
							hoist_vars: false,
							if_return: true,
							join_vars: true,
							cascade: true,
							side_effects: true,
							warnings: true,
							global_defs: {}
						},
						warnings: true,
						mangle: true
					}
				}
			}
		},
        watch: {
            scripts: {
                files: [
                    "./**/*.js"
                ],
                tasks: ["build"],
                options: {
                    spawn: false
                },
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-requirejs");

    grunt.registerTask("default", ["watch"]);
    grunt.registerTask("build", ["requirejs"]);
};