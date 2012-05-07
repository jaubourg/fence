var fs = require( "fs" ),
    path = require( "path" ),
    Deferred = require( "JQDeferred" );

module.exports = function inspect( file ) {
	return Deferred(function( defer ) {
		fs.stat( file, function( err, stat ) {
			if ( err ) {
				defer.reject( err );
			} else  if ( !stat.isDirectory() ) {
				defer.resolve( stat );
			} else {
				fs.readdir( file, function( err, files ) {
					if ( err ) {
						defer.reject( err );
					} else {
						var dir = {
								".": stat
							};
						Deferred.when.apply( Deferred, files.map(function( sub ) {
							return inspect( path.join( file, sub ) ).done(function( data ) {
								dir[ sub ] = data;
							});
						}) ).done(function() {
							defer.resolve( dir );
						}).fail(function( err ) {
							defer.reject( err );
						});
					}
				});
			}
		});
	}).promise();
};
