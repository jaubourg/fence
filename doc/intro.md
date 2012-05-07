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

If you're wondering where all the points above come from, just take a look at an [advanced use case](/jaubourg/fence/blob/master/doc/use-case/ls-R.md#ls--r-in-nodejs).

It's alright though, seeing as, most of the time, you'll find yourself joining between a few promises in a non-critical part of your application. For more advanced situations, though, another tool could come in handy. 

What we need is a new means to join asynchronous tasks that:
* has minimum footprint and constraints,
* makes it easy to deal with complex task chaining (especially recursion),
* provides a means to abort tasks when one failed,
* returns a promise which resolve value is not set in stone (unlike `when`).

TO CONTINUE
