var fs = require("fs"),
	path = require("path"),
	Fence = require("../../dist/node/lib/fence");

module.exports = function inspect( file, callback ) {
	fs.stat( file, function( err, stat ) {
		if ( err ) {
			callback( err );
		} else if ( !stat.isDirectory() ) {
			callback( undefined, true );
		} else {
			fs.readdir( file, function( err, files ) {
				if ( err ) {
					callback( err );
				} else {
					Fence(function( join, release, abort ) {
						var dir = {};
						files.forEach(function( sub ) {
							inspect( path.join( file, sub ), join(function( err, data ) {
								if ( err ) {
									abort( err );
								} else {
									dir[ sub ] = data;
								}
							}));
						});
						release( undefined, dir );
					}).always( callback );
				}
			});
		}
	});
};
