var fs = require( "fs" ),
	path = require( "path" ),
	Deferred = require( "JQDeferred" );

function stat( file ) {
	return Deferred(function( defer ) {
		fs.stat( file, function( err, stat ) {
			if ( err ) {
				defer.reject( err );
			} else {
				defer.resolve( stat );
			}
		});
	}).promise();
}

function readdir( file ) {
	return Deferred(function( defer ) {
		fs.readdir( file, function( err, files ) {
			if ( err ) {
				defer.reject( err );
			} else {
				defer.resolve( files );
			}
		});
	}).promise();
}

module.exports = function inspect( file ) {
	return stat( file ).pipe(function( stat ) {
		if ( !stat.isDirectory() ) {
			return true;
		}
		return readdir( file ).pipe(function( files ) {
				var dir = {};
				return Deferred.when.apply( Deferred, files.map(function( sub ) {
					return inspect( path.join( file, sub ) ).done(function( data ) {
						dir[ sub ] = data;
					});
				}) ).pipe(function() {
					return dir;
				});
		});
	});
};
