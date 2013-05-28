var start = new Date();

var Deferred = require( "JQDeferred" );
var sylar = require( "sylar" );
var uglify = require( "uglify-js" ).minify;

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
	},
	rename: {
		"jquery.fence<.min>.js": function( name, data ) {
			return name.replace( /(\.fence\.)/, "$1" + data.config.version + "." ); 
		}
	}
} ).progress( function( filename ) {
	console.log( "Handling " + filename );
} ).done( function() {
	console.log( "Built in " + ( ( new Date() ) - start ) + "ms" );
} ).fail( function( error ) {
	throw error;
} );
