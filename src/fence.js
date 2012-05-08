(function( Deferred ) {

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

	return function( block ) {
		var count = 1,
			resolveContext,
			defer = Deferred();
		function tick() {
			if ( !( --count ) ) {
				defer.resolveWith( resolveContext[ 0 ], resolveContext[ 1 ] );
				resolveContext = undefined;
			}
		}
		function abort() {
			if ( count ) {
				count = 0;
				defer.rejectWith( this, arguments );
			}
			return this;
		}
		block(
			function( object ) {
				var filtered, promise, pAbort;
				if ( count ) {
					count++;
					if ( typeof object === "function" ) {
						filtered = once(function() {
							if ( count ) {
								var tmp = object.apply( this, arguments );
								tick();
								return tmp;
							}
						});
					} else if ( object && typeof object.promise === "function" ) {
						filtered = (( promise = object.promise() )).pipe(
								function() {
									tick();
									return promise;
								},
								function() {
									// No need to abort anymore
									pAbort = undefined;
									// We need to abort everyone is not done already
									abort.apply( this, arguments );
									// Never notify errors, leave as pending
									return promise;
								}
						);
						if ( typeof (( pAbort = object.abort )) === "function" ) {
							filtered = filtered.promise({
								abort: once(function() {
									if ( pAbort ) {
										pAbort.apply( object, arguments );
									}
									return this;
								})
							});
							defer.fail( filtered.abort );
						}
					} else {
						filtered = once( tick );
					}
				} else if( defer.state() !== "rejected" ) {
					throw "cannot add sync points to a fence that already completed";
				}
				return filtered || noop;
			},
			once(function() {
				resolveContext = [ this, arguments ];
				tick();
			}),
			abort
		);
		return defer.promise({
			abort: abort
		});
	};

})