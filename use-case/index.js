var fs = require( "fs" );
var path = require( "path" );

var argv = process.argv;

if ( argv.length < 3 ) {
	console.log( "Usage: node " + argv[ 1 ] + " <dir>" );
	process.exit( 1 );
}

var subdir = path.join( __dirname, argv[ 2 ] );
var parent = path.dirname( path.dirname( __dirname ) );

fs.readdir( subdir, function( error, files ) {
	if ( error ) {
		throw error;
	}

	var results = [];
	var types = files.map( function( name ) {
		var fn = require( path.join( subdir, name ) );
		var object = {
			type: name.replace( /\.js$/, "" ),
			time: 0,
			run: function( callback ) {
				function done() {
					object.time += ( +new Date - now );
					object.result = [].slice.call( arguments );
					callback();
				}
				now = +new Date;
				if ( (( tmp = fn( parent, done ) )) && tmp.done ) {
					tmp.done( done );
				}
			}
		};
		return object;
	} );
	var total = 12;
	var loops = total * types.length;
	var iteration = 0;
	var count = 0;

	function TableLog() {
		var width = [];
		var lines = [];
		var slice = lines.slice;
		return {
			line: function() {
				lines.push( slice.call( arguments ).map( function( value, i ) {
					value = value.trim();
					width[ i ] = width[ i ] || 0;
					if ( value.length > width[ i ] ) {
						width[ i ] = value.length;
					}
					return value;
				} ) );
			},
			flush: function() {
				lines.forEach( function( cols ) {
					console.log( cols.map( function( value, i ) {
						return value + ( new Array( width[ i ] - value.length + 1 ) ).join( " " );
					} ).join( " | " ) );
				} );
				lines = [];
				width = [];
			}
		};
	}

	( function next() {
		if ( iteration < loops ) {
			var typeId = (( iteration++ )) % types.length;
			if ( !typeId ) {
				count++;
				console.log( "iteration " + count + " / "  + total );
			}
			types[ typeId ].run( next );
		} else {
			types.sort( function( a, b ) {
				return a.time - b.time;
			} );
			console.log( "\n----- RESULTS -----\n" );
			var logger = TableLog();
			types.forEach( function( data ) {
				logger.line(
					data.type,
					"(ms) " + Math.round( data.time / total ),
					Math.round( data.time * 100 / types[ 0 ].time ) + "%"
				);
			} );
			logger.flush();
		}
	} )();
} );
