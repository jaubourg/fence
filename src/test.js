( function( Fence, Deferred ) {

	var global = this;

	function abortable( test, options ) {
		var defer = Deferred();
		setTimeout( options.success ? defer.resolve : defer.reject, options.timeout || ( 10 + Math.random() * 100 ) );
		return defer.promise( {
			abort: function() {
				test.ok( options.abort, options.title + " aborted" );
				defer.rejectWith( this, arguments );
			}
		} ).done( function() {
			test.ok( !options.abort && options.success, options.title + " done" );
		} ).fail( function() {
			test.ok( options.abort || options.error, options.title + " fail" );
		} );
	}

	return {

		"simple synchro": function( test ) {
			test.expect( 4 );

			Fence( function( $F, release ) {

				setTimeout( $F.join( function() {
					test.ok( true, "first timer simple synchro ok" );
				} ), Math.random() * 50 );

				setTimeout( $F.join( function() {
					test.ok( true, "second timer simple synchro ok" );
				} ), 100 + Math.random() * 100 );

				release( "hello" );

			} ).done( function( value ) {
				test.strictEqual( this, global, "context is ok" );
				test.strictEqual( value, "hello", "resolve value is ok" );
			} ).always( function() {
				test.done();
			} );
		},
	
		"synchro with errorFirst": function( test ) {
			test.expect( 3 );
			
			Fence( function( $F, release ) {

				$F.join.errorFirst( function( value ) {
					test.strictEqual( value, "value", "first param is the value" );
				} )( null, "value" );

				release( "hello" );

			} ).done( function( value ) {
				test.strictEqual( this, global, "context is ok" );
				test.strictEqual( value, "hello", "resolve value is ok" );
			} ).always( function() {
				test.done();
			} );
		},

		"synchro with errorFirst (error)": function( test ) {
			test.expect( 1 );
			
			Fence( function( $F, release ) {

				$F.join.errorFirst( function( value ) {
					test.ok( false, "function called" );
				} )( "OMG error" );

				release( "hello" );

			} ).done( function() {
				test.ok( false, "done" );
			} ).fail( function( error ) {
				test.strictEqual( error, "OMG error", "error propagated through abort" );
			} ).always( function() {
				test.done();
			} );
		},

		"synchro with promises": function( test ) {
			test.expect( 4 );

			Fence( function( $F, release ) {

				$F.join( Deferred( function( defer ) {
					setTimeout( defer.resolve, Math.random() * 50 );
				} ).done( function() {
					test.ok( true, "first timer synchro promises ok" );
				} ).fail( function() {
					test.ok( false, "first timer synchro promises fail" );
				} ) );

				$F.join( Deferred( function( defer ) {
					setTimeout( defer.resolve, 100 + Math.random() * 100 );
				} ).done( function() {
					test.ok( true, "second timer synchro promises ok" );
				} ).fail( function() {
					test.ok( false, "second timer synchro promises fail" );
				} ) );

				release( "hello" );

			} ).done( function( value ) {
				test.strictEqual( this, global, "context is ok" );
				test.strictEqual( value, "hello", "resolve value is ok" );
			} ).fail( function() {
				test.ok( false, "global failed" );
			} ).always( function() {
				test.done();
			} );
		},

		"synchro with promises - observables (not a direct promise)": function( test ) {
			test.expect( 4 );

			function create( delay ) {
				return {
					promise: Deferred( function( defer ) {
							setTimeout( defer.resolve, delay );
						} ).done( function() {
							test.ok( true, "first timer synchro promises ok" );
						} ).fail( function() {
							test.ok( false, "first timer synchro promises fail" );
						} ).promise
				};
			}

			Fence( function( $F, release ) {

				$F.join( create( Math.random() * 50 ) );
				$F.join( create( 100 + Math.random() * 100 ) );

				release( "hello" );

			} ).done( function( value ) {
				test.strictEqual( this, global, "context is ok" );
				test.strictEqual( value, "hello", "resolve value is ok" );
			} ).fail( function() {
				test.ok( false, "global failed" );
			} ).always( function() {
				test.done();
			} );
		},

		"synchro with promises - error": function( test ) {
			test.expect( 4 );

			Fence( function( $F, release ) {

				$F.join( Deferred( function( defer ) {
					setTimeout( function() {
						defer.rejectWith( global, [ "world" ] );
						$F.join( function() {
							test.ok( false, "callbacks are called after failure" );
						} )();
					}, Math.random() * 50 );
				} ).done( function() {
					test.ok( false, "first timer synchro promises error ok" );
				} ).fail( function() {
					test.ok( true, "first timer synchro promises error fail" );
				} ) ).fail( function() {
					test.ok( false, "no fail handler outside" );
				} );

				$F.join( Deferred( function( defer ) {
					setTimeout( defer.reject, 100 + Math.random() * 100 );
				} ).done( function() {
					test.ok( false, "second timer synchro promises error ok" );
				} ).fail( function() {
					test.ok( true, "second timer synchro promises error fail" );
				} ) ).fail( function() {
					test.ok( false, "no fail handler outside" );
				} );

				release( "hello" );

			} ).done( function() {
				test.ok( false, "global success" );
			} ).fail( function( value ) {
				test.strictEqual( this, global, "context is ok" );
				test.strictEqual( value, "world", "reject value is ok" );
			} ).always( function() {
				setTimeout( function() {
					test.done();
				}, 500 );
			} );
		},

		"dynamic promise": function( test ) {
			test.expect( 1 );

			Fence( function( $F, release ) {
				var count = 0;

				$F.join( {
					promise: function() {
						return Deferred( function( defer ) {
							var tmp = ++count;
							setTimeout( function() {
								defer.resolve( tmp );
							}, 10 );
						} ).promise.apply( this, arguments );
					}
				} ).done( release );

			} ).done( function( value ) {
				test.strictEqual( value, 1, ".promise() was called once" );
			} ).always( function() {
				test.done();
			} );
		},

		"abort": function( test ) {
			test.expect( 1 );

			Fence(function( $F, release ) {

				setTimeout( $F.join( function() {
					test.ok( false, "first timer abort ok" );
				} ), Math.random() * 100 );

				setTimeout( $F.join( function() {
					test.ok( false, "second timer abort ok" );
				} ), 100 + Math.random() * 100 );

				release( "hello" );

			} ).done( function() {
				test.ok( false, "done" );
			} ).fail( function( value ) {
				test.strictEqual( value, "cancel", "proper rejection value" );
			} ).always( function() {
				test.done();
			} ).abort( "cancel" );
		},

		"abort (inside)": function( test ) {
			test.expect( 1 );

			Fence( function( $F, release ) {

				setTimeout( $F.join( function() {
					test.ok( false, "first timer abort ok" );
				} ), Math.random() * 100 );

				setTimeout( $F.join( function() {
					test.ok( false, "second timer abort ok" );
				} ), 100 + Math.random() * 100 );

				release( "hello" );

				$F.abort( "cancel" );

			} ).done( function() {
				test.ok( false, "done" );
			} ).fail( function( value ) {
				test.strictEqual( value, "cancel", "proper rejection value" );
			} ).always( function() {
				test.done();
			} );
		},

		"abort (global)": function( test ) {
			test.expect( 7 );

			var f = Fence( function( $F, release ) {

				setTimeout( $F.join( function() {
					test.ok( false, "function timer ok" );
				} ), 100 + Math.random() * 100 );

				test.strictEqual( $F.join( abortable( test, {
					title: "first",
					abort: true,
					success: true
				} ) ).promise().abort, undefined, "abort method is not part of the promise" );

				$F.join( abortable( test, {
					title: "second",
					abort: true,
					success: true
				} ) );

				release();
			} );

			f.done( function() {
				test.ok( false, "global success" );
			} ).fail( function( value ) {
				test.strictEqual( this, f, "context is ok" );
				test.strictEqual( value, "aborted", "reject value is ok" );
			} ).always( function() {
				test.done();
			} ).abort( "aborted" );
		},

		"abort (local)": function( test ) {
			test.expect( 8 );

			var bob, f = Fence( function( $F, release ) {

				setTimeout( $F.join( function() {
					test.ok( false, "function timer ok" );
				} ), 100 + Math.random() * 100 );

				$F.join( bob = abortable( test, {
					title: "first",
					abort: true,
					success: true
				} ).fail(function() {
					test.ok( true, "Fail handlers attached before are fired" );
				} ) ).fail(function() {
					test.ok( true, "Fail handlers attached afer are fired" );
				} );

				setTimeout( function() {
					bob.abort( "local abort" );
				}, 0 );

				$F.join( abortable( test, {
					title: "second",
					abort: true,
					success: true
				} ) );

				release();
			} );

			f.done( function() {
				test.ok( false, "global success" );
			} ).fail( function( value ) {
				test.strictEqual( this, bob, "context is ok" );
				test.strictEqual( value, "local abort", "reject value is ok" );
			} ).always( function() {
				setTimeout( function() {
					test.done();
				}, 10 );
			} );
		},

		"decrementing internal counter is protected": function( test ) {
			test.expect( 2 );

			Fence( function( $F, release ) {

				var cb1, cb2;

				setTimeout( (( cb1 = $F.join( function() {
					test.ok( true, "first timer decpro ok" );
					cb1();
				} ) )), Math.random() * 100 );

				setTimeout( (( cb2 = $F.join( function() {
					test.ok( true, "second timer decpro ok" );
					cb2();
				} ) )), 100 + Math.random() * 100 );

				release( "hello" );
				release( "hello" );

			} ).always( function() {
				test.done();
			} );
		},

		"adding after finished throws an exception": function( test ) {
			test.expect( 1 );

			Fence( function( $F, release ) {

				release( "hello" );

				try {
					$F.join( function() {
						test.ok( false, "function added called: LOLWAT?!?" );
					} )();
				} catch( e ) {
					test.ok( true, "exception raised" );
				}

			} ).always( function() {
				test.done();
			} );
		},
	
		"progress event": function( test ) {
			test.expect( 5 );
			
			var count = 3;
			
			Fence( function( $F, release ) {
				( function notify( count ) {
					if ( count ) {
						setTimeout( $F.join( function() {
							notify( count - 1 );
							$F.notify( count );
						} ), Math.random() * 50 );
					}
				} )( 3 );
				release( "hello" );
			} ).progress( function( value ) {
				test.strictEqual( value, count--, "Progress called with value " + value ); 
			} ).done( function( value ) {
				test.strictEqual( this, global, "context is ok" );
				test.strictEqual( value, "hello", "resolve value is ok" );
			} ).fail( function() {
				test.ok( false, "global failed" );
			} ).always( function() {
				test.done();
			} );
		}
	};
} )