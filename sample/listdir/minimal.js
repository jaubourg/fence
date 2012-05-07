var fs = require("fs"),
	path = require("path"),
	Fence = require("../../dist/node/lib/fence");

module.exports = function inspect( file, callback ) {
	fs.stat( file, function( err, stat ) {
		if ( err ) {
			throw err;
		}
		if ( !stat.isDirectory() ) {
			return callback( stat );
		}
		fs.readdir( file, function( err, files ) {
			if ( err ) {
				throw err;
			}
			Fence(function( join, release ) {
				var dir = {
						".": stat
					};
				files.forEach(function( sub ) {
					inspect( path.join( file, sub ), join(function( value ) {
						dir[ sub ] = value;
					}));
				});
				release( dir );
			}).done( callback );
		});
	});
};
