( function( Deferred ) {

	function noop() {
	}

	function once( fn ) {
		var ret;
		return function() {
			var tmp = fn;
			if ( tmp ) {
				fn = undefined;
				return ( ret = tmp.apply( this, arguments ) );
			}
			return ret;
		};
	}

	var global = this;
	
	var pending = Deferred();
	
	function returnPending() {
		return pending;
	}
	
	return function( block ) {
		var count = 1;
		var resolveContext;
		var defer = Deferred();
		function tick() {
			if ( !( --count ) ) {
				defer.resolveWith( resolveContext[ 0 ], resolveContext[ 1 ] );
				resolveContext = undefined;
			}
		}
		function join( object ) {
			var filtered;
			if ( count ) {
				count++;
				if ( typeof object === "function" ) {
					filtered = once( function() {
						if ( count ) {
							var tmp = object.apply( this, arguments );
							tick();
							return tmp;
						}
					} );
				} else if ( object && typeof object.promise === "function" ) {
					if ( typeof object.abort === "function" ) {
						defer.fail( object.abort );
					}
					filtered = object.promise().done( tick ).fail( abort ).pipe( null, returnPending ).promise( {
						abort: abort
					} );
				} else {
					filtered = once( tick );
				}
			} else if( defer.state() !== "rejected" ) {
				throw "cannot join with a fence that already completed";
			}
			return filtered || noop;
		}
		join.errorFirst = function( cb ) {
			cb = cb || noop;
			return join( typeof cb === "function" ? function( error ) {
				return error ? abort( error ) : cb.apply( this, [].slice.call( arguments, 1 ) );
			} : cb );
		};
		function abort() {
			if ( count ) {
				count = 0;
				defer.rejectWith( this, arguments );
			}
		}
		block( defer.promise( {
			join: join,
			notify: defer.notify,
			notifyWith: defer.notifyWith,
			abort: abort
		} ), once( function() {
			resolveContext = [ this, arguments ];
			tick();
		} ) );
		return defer.promise( {
			abort: abort
		} );
	};

} )