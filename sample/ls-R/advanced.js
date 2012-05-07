var fs = require("fs"),
	path = require("path"),
	Fence = require("../../dist/node/lib/fence");

module.exports = function( filename ) {
	return Fence(function( join, release, abort ) {
		(function inspect( file, callback ) {
			fs.stat( file, join(function( err, stat ) {
				if ( err ) {
					abort( err );
				} else if ( !stat.isDirectory() ) {
					callback( true );
				} else {
					fs.readdir( file, join(function( err, files ) {
						if ( err ) {
							abort( err );
						} else {
							var dir = {};
							files.forEach(function( sub ) {
								inspect( path.join( file, sub ), join(function( data ) {
									dir[ sub ] = data;
								}) );
							});
							callback( dir );
						}
					}) );
				}
			}) );
		})( filename, release );
	});
};