var fs = require("fs"),
	path = require("path"),
	Fence = require("../../dist/node/lib/fence");

module.exports = function( filename ) {
	return Fence(function( join, release, abort ) {
		(function inspect( file, callback ) {
			fs.stat( file, join(function( err, stat ) {
				if ( err ) {
					return abort( err );
				}
				if ( !stat.isDirectory() ) {
					return callback( stat );
				}
				fs.readdir( file, join(function( err, files ) {
					if ( err ) {
						return abort( err );
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
				}) );
			}) );
		})( filename, release );
	});
};