var Fence = require( "../../dist/node/lib/fence" );
var fs = require( "fs" );
var path = require( "path" );

module.exports = function inspect( file ) {
	return Fence( function( $F, release ) {
		fs.stat( file, $F.join.errorFirst( function( stat ) {
			if ( !stat.isDirectory() ) {
				release( true );
			} else {
				fs.readdir( file, $F.join.errorFirst( function( files ) {
					var dir = {};
					files.forEach( function( sub ) {
						inspect( path.join( file, sub ) ).done( $F.join( function( data ) {
							dir[ sub ] = data;
						} ) );
					} );
					release( dir );
				} ) );
			}
		} ) );
	} );
};

