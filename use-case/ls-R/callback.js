var fs = require( "fs" );
var path = require( "path" );

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
					var dir = {};
					var count = files.length;
					if ( count ) {
						files.forEach( function( sub ) {
							inspect( path.join( file, sub ), function( err, data ) {
								if ( count ) {
									if ( err ) {
										callback( err );
										count = 0;
									} else {
										dir[ sub ] = data;
										if ( !( --count ) ) {
											callback( undefined, dir );
										}
									}
								}
							} );
						} );
					} else {
						callback( undefined, dir );
					}
				}
			} );
		}
	} );
};
