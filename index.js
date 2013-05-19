var _ = require( "lodash" );
var sylar = require( "sylar" );

var data = sylar.data( __dirname + "/" + "src" ).fail( function( error ) {
	throw error;
} );

sylar( {
	base: __dirname,
	src: "build",
	dest: "dist",
	filter: {
		"*": function( content ) {
			return data.then( function( data ) {
				return _.template( content, data );
			} );
		}
	}
} ).done( function() {
	console.log( "Built" );
} ).fail( function( error ) {
	console.log( "Error: " + error );
} );