var fs = require("fs"),
	path = require("path"),
	Fence = require("../../lib/fence");

module.exports = function inspect( file ) {
	return Fence(function( join, release ) {
		fs.stat( file, function( err, stat ) {
			if ( err ) {
				throw err;
			}
			if ( !stat.isDirectory() ) {
				return release( stat );
			}
			fs.readdir( file, function( err, files ) {
				if ( err ) {
					throw err;
				}
				var dir = {
					".": stat
				};
				files.forEach(function( sub ) {
					inspect( path.join( file, sub ) ).done(join(function( value ) {
						dir[ sub ] = value;
					}));
				});
				release( dir );
			});
		});
	});
};

