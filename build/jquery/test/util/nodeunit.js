(function() {

	var testObject = {
			done: window.start
		};

	jQuery.each( "ok equal notEqual deepEqual notDeepEqual strictEqual notStrictEqual expect".split(" "), function( _, method ) {
		testObject[ method ] = window[ method ];
	});

	window.nodeunit = function( module, options, tests ) {
		window.module( module, options );
		jQuery.each( tests, function( name, test ) {
			window.asyncTest( name, function() {
				test( testObject );
			});
		});
	};
})();
