var fs = require("fs"),
	path = require("path"),
	Fence = require("../../lib/fence");

module.exports = function( filename ) {
	return Fence(function( join, release ) {
		(function inspect( file, callback ) {
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
					var dir = {
						".": stat
					};
					files.forEach(function( sub ) {
						inspect( path.join( file, sub ), join(function( value ) {
							dir[ sub ] = value;
						}) );
					});
					callback( dir );
				});
			});
		})( filename, release );
	});
};