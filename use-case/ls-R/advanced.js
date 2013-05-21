var Fence = require( "../../dist/node/lib/fence" );
var fs = require( "fs" );
var path = require( "path" );

module.exports = function( filename ) {
	return Fence( function( $F, release ) {
		( function inspect( file, callback ) {
			fs.stat( file, $F.join.errorFirst( function( stat ) {
				if ( !stat.isDirectory() ) {
					callback( true );
				} else {
					fs.readdir( file, $F.join.errorFirst( function( files ) {
						var dir = {};
						files.forEach(function( sub ) {
							inspect( path.join( file, sub ), $F.join( function( data ) {
								dir[ sub ] = data;
							} ) );
						} );
						callback( dir );
					} ) );
				}
			} ) );
		} )( filename, release );
	} );
};