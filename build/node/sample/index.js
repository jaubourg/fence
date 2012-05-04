var fs = require("fs"),
	path = require("path"),
	argv = process.argv,
	subdir = path.join( __dirname, argv[ 2 ] ),
	parent = path.dirname( path.dirname( __dirname ) );

if ( argv.length < 3 ) {
	console.log( "Usage: node " + argv[ 1 ] + " <dir>" );
	process.exit( 1 );
}

fs.readdir( subdir, function( error, files ) {
	if ( error ) {
		throw error;
	}

	var results = [],
		typeLength = 0,
		methods = files.map(function( name ) {
			var fn = require( path.join( subdir, name ) ),
				type = name.replace( /\.js$/, "" ),
				now, tmp;
			if ( type.length > typeLength ) {
				typeLength = type.length;
			}
			return function loop( next, it ) {
				if ( !( --it ) ) {
					results.push({
						time: +new Date - now,
						type: type
					});
					return next();
				}
				if ( !now ) {
					now = +new Date;
				}
				function done( result ) {
					loop( next, it );
				}
				if (( tmp = fn( parent, done ) ) && tmp.done ) {
					tmp.done( done );
				}
			};
		}),
		spaces = ( new Array( typeLength ) ).join( " " );

	(function next() {
		var fn = methods.shift();
		if ( fn ) {
			fn( next, 5 );
		} else {
			results.sort(function( a, b ) {
				return a.time - b.time;
			});
			results.forEach(function( data ) {
				console.log( data.type +
					( spaces.substr( 0, typeLength - data.type.length ) ) +
					" | (ms) " + Math.round( data.time / 5 ) +
					" | " + Math.round( data.time * 100 / results[ 0 ].time ) + "%" );
			});
		}
	})();
});
