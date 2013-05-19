module.exports = function( grunt ) {

	var task = grunt.task;
	var file = grunt.file;
	var utils = grunt.utils;
	var log = grunt.log;
	var verbose = grunt.verbose;
	var fail = grunt.fail;
	var option = grunt.option;
	var config = grunt.config;
	var template = grunt.template;

	grunt.initConfig({
		meta: {
			banner: "/*! jQuery Fence v<%= config.version %> | GPLv2/MIT License */"
		},
		build: {
			"dist/jquery.fence.<%= config.version %>.js": [ "src/jquery.fence.js" ]
		},
		min: {
			"dist/jquery.fence.<%= config.version %>.min.js": [ "<banner>", "dist/jquery.fence.<%= config.version %>.js" ]
		},
		lint: {
			files: [ "dist/jquery.fence.<%= config.version %>.js" ]
		},
		jshint: {
			options: {
				evil: true,
				browser: true,
				wsh: true,
				eqnull: true,
				expr: true,
				curly: true,
				trailing: true,
				undef: true,
				smarttabs: true,
				maxerr: 100
			},
			globals: {
				jQuery: true
			}
		},
		uglify: {}
	});

	grunt.registerTask( "default", "build min" );

	grunt.registerMultiTask( "build", "Concatenate source", function() {
		// Concat specified files.
		var compiled = "",
				name = this.file.dest;

		this.file.src.forEach(function( filepath ) {
			compiled += file.read( filepath );
		});

		// Write concatenated source to file
		file.write( name, compiled );

		// Fail task if errors were logged.
		if ( this.errorCount ) {
			return false;
		}

		// Otherwise, print a success message.
		log.writeln( "File '" + name + "' created." );
	});
};
