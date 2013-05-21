var Fence = require( "../../dist/node/lib/fence" );
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
					Fence( function( $F, release ) {
						var dir = {};
						files.forEach( function( sub ) {
							inspect( path.join( file, sub ), $F.join.errorFirst( function( data ) {
								dir[ sub ] = data;
							} ) );
						} );
						release( undefined, dir );
					} ).always( callback );
				}
			} );
		}
	} );
};
