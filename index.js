var Deferred = require( "JQDeferred" );
var sylar = require( "sylar" );
var uglify = require( "uglify-js" ).minify;

function now() {
	return ( new Date() ).getTime();
}

var start = now();

var source = Deferred();

sylar.template( {
	root: __dirname,
	src: "build",
	dest: "dist",
	data: "src",
	filter: {
		"jquery.fence.js": function( content ) {
			source.resolve( content );
			return content;
		},
		"jquery.fence.min.js": function( banner ) {
			return source.pipe( function( source ) {
				return banner + uglify( source, {
					fromString: true 
				} ).code;
			} );
		}
	}
} ).progress( function( filename ) {
	console.log( "Handling " + filename.slice( __dirname.length + 1 ) );
} ).done( function() {
	console.log( "Built in " + ( now() - start ) + "ms" );
} ).fail( function( error ) {
	throw error;
} );
