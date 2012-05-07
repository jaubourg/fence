var fs = require("fs"),
	path = require("path");

module.exports = function inspect( file, callback ) {
	var count = 1;
	function error( err ) {
		var tmp = callback;
		if ( tmp ) {
			callback = undefined;
			tmp( err );
		}
	}
	function success( value ) {
		var tmp = callback;
		if ( tmp && !( --count ) ) {
			callback = undefined;
			tmp( undefined, value );
		}
	}
	fs.stat( file, function( err, stat ) {
		if ( err ) {
			error( err );
		} else if ( !stat.isDirectory() ) {
			success( true );
		} else {
			fs.readdir( file, function( err, files ) {
				if ( err ) {
					error( err );
				} else {
					var dir = {};
					count = 1;
					files.forEach(function( sub ) {
						count++;
						inspect( path.join( file, sub ), function( err, data ) {
							if ( err ) {
								error( err );
							} else {
								dir[ sub ] = data;
								success( dir );
							}
						});
					});
					success( dir );
				}
			});
		}
	});
};
