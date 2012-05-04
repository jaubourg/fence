(function( Fence, Deferred ) {

	var global = this;

	function abortable( test, options ) {
		var defer = Deferred();
		setTimeout( options.success ? defer.resolve : defer.reject, options.timeout || ( 10 + Math.random() * 100 ) );
		return defer.promise({
			abort: function() {
				test.ok( options.abort, options.title + " aborted" );
				defer.rejectWith( this, arguments );
			}
		}).done(function() {
			test.ok( !options.abort && options.success, options.title + " done" );
		}).fail(function() {
			test.ok( options.abort || options.error, options.title + " fail" );
		});
	}

	return {

		"simple synchro": function( test ) {
			test.expect( 4 );

			Fence(function( join, release ) {

				setTimeout( join(function() {
					test.ok( true, "first timer sisy ok" );
				}), Math.random() * 50 );

				setTimeout( join(function() {
					test.ok( true, "second timer sisy ok" );
				}), 100 + Math.random() * 100 );

				release( "hello" );

			}).done(function( value ) {
				test.strictEqual( this, global, "context is ok" );
				test.strictEqual( value, "hello", "resolve value is ok" );
				test.done();
			});
		},

		"synchro with promises": function( test ) {
			test.expect( 4 );

			Fence(function( join, release ) {

				join( Deferred(function( defer ) {
					setTimeout( defer.resolve, Math.random() * 50 );
				}).done(function() {
					test.ok( true, "first timer sypro ok" );
				}).fail(function() {
					test.ok( false, "first timer sypro fail" );
				}) );

				join( Deferred(function( defer ) {
					setTimeout( defer.resolve, 100 + Math.random() * 100 );
				}).done(function() {
					test.ok( true, "second timer sypro ok" );
				}).fail(function() {
					test.ok( false, "second timer sypro fail" );
				}) );

				release( "hello" );

			}).done(function( value ) {
				test.strictEqual( this, global, "context is ok" );
				test.strictEqual( value, "hello", "resolve value is ok" );
				test.done();
			}).fail(function() {
				test.ok( false, "global failed" );
				test.done();
			});
		},

		"synchro with promises - error": function( test ) {
			test.expect( 4 );

			Fence(function( join, release ) {

				join( Deferred(function( defer ) {
					setTimeout( function() {
						defer.rejectWith( global, [ "world" ] );
						join(function() {
							test.ok( false, "callbacks are called after failure" );
						})();
					}, Math.random() * 50 );
				}).done(function() {
					test.ok( false, "first timer syproe ok" );
				}).fail(function() {
					test.ok( true, "first timer syproe fail" );
				}) );

				join( Deferred(function( defer ) {
					setTimeout( defer.reject, 100 + Math.random() * 100 );
				}).done(function() {
					test.ok( false, "second timer syproe ok" );
				}).fail(function() {
					test.ok( true, "second timer syproe fail" );
				}).always(function() {
					test.done();
				}) );

				release( "hello" );

			}).done(function() {
				test.ok( false, "global success" );
			}).fail(function( value ) {
				test.strictEqual( this, global, "context is ok" );
				test.strictEqual( value, "world", "reject value is ok" );
			});
		},

		"abort": function( test ) {
			test.expect( 1 );

			Fence(function( join, release ) {

				setTimeout( join(function() {
					test.ok( false, "first timer abort ok" );
				}), Math.random() * 100 );

				setTimeout( join(function() {
					test.ok( false, "second timer abort ok" );
				}), 100 + Math.random() * 100 );

				release( "hello" );

			}).done(function() {
				test.ok( false, "done" );
			}).fail(function( value ) {
				test.strictEqual( value, "cancel", "proper rejection value" );
			}).abort( "cancel" ).always(function() {
				test.done();
			});
		},

		"abort (global)": function( test ) {
			test.expect( 6 );

			var f = Fence(function( join, release ) {

				setTimeout( join(function() {
					test.ok( false, "function timer ok" );
				}), 100 + Math.random() * 100 );

				join( abortable( test, {
					title: "first",
					abort: true,
					success: true
				}) );

				join( abortable( test, {
					title: "second",
					abort: true,
					success: true
				}) );

				release();
			});

			f.done(function() {
				test.ok( false, "global success" );
			}).fail(function( value ) {
				test.strictEqual( this, f, "context is ok" );
				test.strictEqual( value, "aborted", "reject value is ok" );
				test.done();
			}).abort( "aborted" );
		},

		"abort (local)": function( test ) {
			test.expect( 7 );

			var bob, f = Fence(function( join, release ) {

				setTimeout( join(function() {
					test.ok( false, "function timer ok" );
				}), 100 + Math.random() * 100 );

				join( bob = abortable( test, {
					title: "first",
					abort: true,
					success: true
				}).fail(function() {
					test.ok( true, "Fail handlers attached before are fired" );
				}) ).fail(function() {
					test.ok( false, "Fail handlers attached afer are never fired" );
				});

				setTimeout(function() {
					bob.abort( "local abort" );
				}, 0 );

				join( abortable( test, {
					title: "second",
					abort: true,
					success: true
				}) );

				release();
			});

			f.done(function() {
				test.ok( false, "global success" );
			}).fail(function( value ) {
				test.strictEqual( this, bob, "context is ok" );
				test.strictEqual( value, "local abort", "reject value is ok" );
				test.done();
			});
		},

		"decrementing internal counter is protected": function( test ) {
			test.expect( 2 );

			Fence(function( join, release ) {

				var cb1, cb2;

				setTimeout(( cb1 = join(function() {
					test.ok( true, "first timer decpro ok" );
					cb1();
				}) ), Math.random() * 100 );

				setTimeout(( cb2 = join(function() {
					test.ok( true, "second timer decpro ok" );
					cb2();
				}) ), 100 + Math.random() * 100 );

				release( "hello" );
				release( "hello" );

			}).done(function() {
				test.done();
			});
		},

		"adding after finished throws an exception": function( test ) {
			test.expect( 1 );

			Fence(function( join, release ) {

				release( "hello" );

				try {
					join(function() {
						test.ok( false, "function added called: LOLWAT?!?" );
					})();
				} catch( e ) {
					test.ok( true, "exception raised" );
				}

			}).done(function() {
				test.done();
			});
		}
	};
})