# Introduction to Fence

## pre-requisite

To use Fence, you need a good understanding of asynchronous programming and [Deferreds as implemented in jQuery](http://api.jquery.com/category/deferred-object/).

## `when` is not (always) enough

With Deferreds, jQuery introduced `when` and it was awesome:

```javascript
$.when( $.ajax( firstUrl ), $.ajax( secondUrl ) ).done(function( firstParamArray, secondParamArray ) {
	// Wheeee! The two requests succeeded
}).fail(function() {
	// OMG! One request failed
});
```

Even if the number of requests/promises to join is variable, you can still fill up an array and use `$.when` with some `apply` magic:

```javascript
$.when.apply( $, arrayOfPromises ).done(function() {
	// Wheeee! All the requests succeeded
	$.each( arguments, function( N, paramArray ) {
		// \o/ I have the resolve parameters of the Nth promise! 
	})
}).fail(function() {
	// OMG! One request failed
});
```

Of course, it looks a little awkward but it gets the job done, right? Yes and no.

See, `when` has some serious issues:
* it's quite difficult to deal with recursive asynchronous tasks elegantly without sacrificing performance
* recursion also involves recursive structures as an output and `when` always resolves with an unflexible list of arguments
* even without recursion, whenever tasks have to be chained, the cost of creating internal Deferreds can become an issue
* also, `when` can only deal with promises which means all your asynchronous operations have to be promise-aware or "promified"
* "promifying" your API can introduce a lot of noise and can quickly make code more cryptic
* when a task fails, the resulting join fails, which is fine, but all the tasks already initiated will continue as if nothing happened (their result will simply be ignored by the join)

If you're wondering where all the points above come from, just take a look at an [advanced use case](https://github.com/jaubourg/fence/blob/master/doc/use-case/ls-R.md#ls--r-in-nodejs).

It's alright though, seeing as, most of the time, you'll find yourself joining between a few promises in a non-critical part of your application. For more advanced situations, though, another tool could come in handy. 

What we need is a new means to join asynchronous tasks that:
* has minimum footprint and constraints,
* makes it easy to deal with complex task chaining (especially recursion),
* provides a means to abort tasks when one failed,
* returns a promise with a format of its resolve value not set in stone (unlike `when`).

## enters Fence

### basics

Using Fence will look like this:

```javascript
Fence( function( FENCE, release ) {
	// Your asynchronous code
} );

// OR, in the browser

jQuery.Fence( function( FENCE, release ) {
	// Your asynchronous code
} );
```

So you call the Fence function/method and give it a callback that accepts an object and a function as its parameters.

The callback given to Fence is called right away, **before** the call to Fence returns.

Fence, of course, will return an Observable object that implements the Promise interface and has an abort method that does exactly the same thing as the `abort` function listed below:

| function / method       | what the Hell is it for? |
| ----------------------- | ------------------------ |
| `FENCE.join`            | to "join" with promises or callbacks |
| `FENCE.join.errorFirst` | to "join" with nodejs-like callbacks with error first in the arguments |
| `FENCE.notify`          | to generate progress events on the promise returned by Fence |
| `FENCE.notifyWith`      | to generate progress events on the promise returned by Fence (with given context) |
| `FENCE.abort`           | to abort whatever it is the Fence is waiting for / doing |
| `release`               | has to be called with the value that the promise returned by Fence is to be resolved with (you can release before joined tasks completed, the Fence will still wait for everything to be done before resolving) |

Calling `FENCE.abort` will have the following consequences:

1. it will abort any joined object that has an abort method
2. it will prevent any joined callback not called already from being called

### joining two ajax requests

```javascript
jQuery.Fence( function( FENCE, release ) {

	var result = {};

	FENCE.join( $.ajax( myTemplateURL ).done( function( template ) {
		result.template = template;
	} ) );

	FENCE.join( $.ajax( myDataURL ).done( function( data ) {
		result.data = data;
	} ) );

	release( result );

} ).done( function( result ) {
	// Called when both requests succeeded
	// result.template contains the template
	// result.data contains the data
} );
```

It seems a bit more complicated than using `when`, so what is the gain?

1. the resolve value of the join can have any format (you just pass it to the release callback)
2. if one of the requests fails, then the other will be aborted automagically

### timeout multiple ajax requests

```javascript
jQuery.Fence( function( FENCE, release ) {

	var result = {};

	$.each( myURLs, function( _, url ) {

		FENCE.join( $.ajax( url ).done( function( data ) {
			result[ url ] = data;
		} ) );

	} );

	setTimeout( abort, 5000 );

	release( result );

} ).done( function( result ) {
	// Called if all requests completed under 5 seconds
} );
```

The example is straight-forward:
* we have a list of urls to request and we request all of them
* we call abort after 5 seconds (which will abort all the outbound requests)

If we wanted to have all the requests that succeeded before the call to abort, we could rewrite the code as follows:

```javascript
jQuery.Fence( function( FENCE, release ) {

	var result = {};

	$.each( myURLs, function( _, url ) {

		FENCE.join( $.ajax( url ).done( function( data ) {
			result[ url ] = data;
		} ) );

	} );

	setTimeout( function() {
		abort( "cancelled", result );
	}, 5000 );

	release( myResult );

} ).done( function( result ) {
	// Called if all requests completed under 5 seconds
} ).fail( function( isAbort, partialResult ) {
	if ( isAbort === "cancelled" ) {
		for( var url in partialResult ) {
			console.log( url, partialResult[ url ] )
		}
	}
} );
```

That simple!

### join callback-based services

But Fence is not limited to Promises or abortable objects.

For instance, here is how to get the stats of all the files in a directory using Fence:

```javascript
Fence( function( FENCE, release ) {
	fs.readdir( dir, FENCE.join.errorFirst( function( files ) {
		
		var stats = {};

		files.forEach( function( file ) {
			fs.stat( path.join( dir, file ), FENCE.join.errorFirst( function( stat ) {
				stats[ file ] = stat;
			} ) ); 
		} );

		release( stats );
	} ) ); 
} ).done( function( stats ) {
	for( var file in stats ) {
		console.log( file, stats[ file ] );
	}
} ).fail( function( err ) {
	throw err;
} );
```

You can get a much more complete example in our [`ls -R` usecase](https://github.com/jaubourg/fence/blob/master/doc/use-case/ls-R.md#ls--r-in-nodejs).

## that's it for now

We covered pretty much everything that Fence had to offer. It may be time to head over to the [API documentation](https://github.com/jaubourg/fence/blob/master/doc/API.md#api) for the details.
