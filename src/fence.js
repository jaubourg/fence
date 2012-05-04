(function( Deferred ) {

	var global = this,
		noop = function() {};

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
			function( fn ) {
				var ret;
				if ( !count && defer.state() !== "rejected" ) {
					throw "cannot add sync points to a fence that already completed";
				}
				if ( count ) {
					count++;
					if ( typeof fn === "function" ) {
						ret = once(function() {
							if ( count ) {
								var tmp = fn.apply( this, arguments );
								tick();
								return tmp;
							}
						});
					} else if ( fn && typeof fn.promise === "function" ) {
						ret = fn.pipe(
								function() {
									tick();
									return fn;
								},
								function() {
									// No need to abort anymore
									fn = undefined;
									// We need to abort everyone is not done already
									abort.apply( this, arguments );
									// Never notify errors, leave as pending
									return Deferred().promise();
								}
						);
						if ( typeof fn.abort === "function" ) {
							defer.fail(( ret.abort = once(function() {
								return fn && fn.abort.apply( fn, arguments );
							}) ));
						}
					} else {
						ret = once(tick);
					}
				}
				return ret || noop;
			},
			once(function() {
				resolveContext = [ this, arguments ];
				tick();
			})
		);
		return defer.promise({
			abort: abort
		});
	};

})