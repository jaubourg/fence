var _ = require( "lodash" );
var sylar = require( "sylar" );

function now() {
	return ( new Date() ).getTime();
}

var start = now();

function cutFilename( filename ) {
	return filename.substr( __dirname.length + 1 );
}

var data = sylar.data( __dirname + "/" + "src" ).progress( function( filename ) {
	console.log( "Reading data from " + cutFilename( filename ) );
} ).fail( function( error ) {
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
} ).progress( function( filename ) {
	console.log( "Handling " + cutFilename( filename ) );
} ).done( function() {
	console.log( "Built in " + ( now() - start ) + "ms" );
} ).fail( function( error ) {
	throw error;
} );
