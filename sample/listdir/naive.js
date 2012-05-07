var fs = require("fs"),
	path = require("path"),
	Fence = require("../../dist/node/lib/fence");

module.exports = function inspect( file ) {
	return Fence(function( join, release, abort ) {
		fs.stat( file, join(function( err, stat ) {
			if ( err ) {
				abort( err );
			} else if ( !stat.isDirectory() ) {
				release( stat );
			} else {
				fs.readdir( file, join(function( err, files ) {
					if ( err ) {
						abort( err );
					} else {
						var dir = {
							".": stat
						};
						files.forEach(function( sub ) {
							inspect( path.join( file, sub ) ).done(join(function( value ) {
								dir[ sub ] = value;
							}));
						});
						release( dir );
					}
				}) );
			}
		}) );
	});
};

