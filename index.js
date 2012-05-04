var fs = require( "fs" ),
	path = require( "path" ),
	wrench = require( "wrench" ),
	r_extension = /\.[^\.]+/g,
	r_isjson = /\.json$/g,
	r_replacers = /@([A-Z]+)@/g,
	fn_replacers = (function( directory ) {
		var replacers = {};
		fs.readdirSync( directory ).forEach(function( filename ) {
			var content = ( "" + fs.readFileSync( path.join( directory, filename ) ) ).trim(), obj, key;
			if ( r_isjson.test( filename ) ) {
				obj = JSON.parse( content );
				for( key in obj ) {
					replacers[ key.toUpperCase() ] = obj[ key ].trim();
				}
			} else {
				replacers[ filename.replace( r_extension, "" ).toUpperCase() ] = content;
			}
		});
		return function( _, key ) {
			if ( !replacers[ key ] ) {
				throw "Unknown replacer " + key;
			}
			return replacers[ key ];
		};
	})( path.join( __dirname, "./src" ) ),
	outputDir = path.join( __dirname, "./dist" );

wrench.rmdirSyncRecursive( outputDir, true );

(function buildDir( input, output ) {
	fs.stat( input, function( err, stats ) {
		if ( err ) {
			throw err;
		}
		if ( stats.isDirectory() ) {
			var count = 2,
				files;
			function recurse() {
				files.forEach(function( file ) {
					buildDir( path.join( input, file ), path.join( output, file.replace( r_replacers, fn_replacers ) ) );
				});
			}
			fs.mkdir( output, 0777, function( err ) {
				if ( err ) {
					throw err;
				}
				if ( !( --count ) ) {
					recurse();
				}
			});
			fs.readdir( input, function( err, _files ) {
				if ( err ) {
					throw err;
				}
				files = _files;
				if ( !( --count ) ) {
					recurse();
				}
			});
		} else {
			fs.readFile( input, function( err, data ) {
				if ( err ) {
					throw err;
				}
				data = ( "" + data ).replace( r_replacers, fn_replacers );
				fs.writeFile( output, data, function( err ) {
					if ( err ) {
						throw err;
					}
				});
			});
		}
	});
})( path.join( __dirname, "./build" ), outputDir );
