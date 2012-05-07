# ls -R in node.js

Our use-case is the implementation in node.js of a `ls -R`-like function that lists files in a directory recursively (or returns a Promise resolved with the listing). The output should be of the following format: 

```javascript
{
	"folder": {
		"subfolder": {},
		"anotherFile.ext": true,
		"yetAnotherFile.ext": true,
	},
	"file.ext": true
}
```

Of course, the function has to be 100% asynchronous... or as asynchronous as node.js will allow, which is a lot!

## Performance comparison

Before presenting the different approaches, let's take a look at how they fair against one another for quite a big tree:

|                                                    | time (ms) |      |
|:---------------------------------------------------|:---------:|:----:|
| [callback](#callback-based-implementation)         | 338       | 100% |
| [advanced](#fence-based-advanced-implementation)¹  | 357       | 106% |
| [naive](#fence-based-naive-implementation)¹        | 535       | 158% |
| [deferred](#deferred-based-implementation)²        | 570       | 168% |
| [pipe](#deferred-based-pipe-heavy-implementation)² | 1037      | 307% |

1. makes use of Fence (and jQuery Deferreds)
2. makes use of jQuery Deferreds (alone)

Keep this in mind while looking at the solutions below:

## Callback-based implementation

The callback-based implementation is pretty straight-forward:

```javascript
var fs = require("fs"),
	path = require("path");

module.exports = function inspect( file, callback ) {
	fs.stat( file, function( err, stat ) {
		if ( err ) {
			callback( err );
		} else if ( !stat.isDirectory() ) {
			callback( undefined, true );
		} else {
			fs.readdir( file, function( err, files ) {
				if ( err ) {
					callback( err );
				} else {
					var dir = {},
						count = files.length;
					if ( count ) {
						files.forEach(function( sub ) {
							inspect( path.join( file, sub ), function( err, data ) {
								if ( count ) {
									if ( err ) {
										callback( err );
										count = 0;
									} else {
										dir[ sub ] = data;
										if ( !( --count ) ) {
											callback( undefined, dir );
										}
									}
								}
							});
						});
					} else {
						callback( undefined, dir );
					}
				}
			});
		}
	});
};
```

It does what it is supposed to do, but:
* keeping track of the count variable is a bit of a mess
* in fact, the whole inspect callback is a mess
* and we have to special case for empty folders
* also, calling the callback with `undefined` as the first parameter adds a lot of unnecessary noise
* finally, we have a deeply nested function (we could use return here and there instead of elseifs, but it wouldn't really make the code any clearer)

## Deferred-based implementation

 Let's see if using Deferreds can make things a little better:
 
```javascript
var fs = require( "fs" ),
    path = require( "path" ),
    Deferred = require( "JQDeferred" );

module.exports = function inspect( file ) {
	return Deferred(function( defer ) {
		fs.stat( file, function( err, stat ) {
			if ( err ) {
				defer.reject( err );
			} else  if ( !stat.isDirectory() ) {
				defer.resolve( true );
			} else {
				fs.readdir( file, function( err, files ) {
					if ( err ) {
						defer.reject( err );
					} else {
						var dir = {};
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
```

So:
* it's about [70% slower](#performance-comparison)
* it's still quite nested, not as much, but still
* for sure, `defer.resolve` is much more readable than calling a callback with `undefined` as the first parameter
* but, while the callback of the inner inspect is much simpler, there is a lot of trickery and deferred re-routing around the use of `when`

The last point cries out for the use of [pipe](http://api.jquery.com/deferred.pipe/).

## Deferred-based pipe-heavy implementation

```javascript
var fs = require( "fs" ),
	path = require( "path" ),
	Deferred = require( "JQDeferred" );

function stat( file ) {
	return Deferred(function( defer ) {
		fs.stat( file, function( err, stat ) {
			if ( err ) {
				defer.reject( err );
			} else {
				defer.resolve( stat );
			}
		});
	}).promise();
}

function readdir( file ) {
	return Deferred(function( defer ) {
		fs.readdir( file, function( err, files ) {
			if ( err ) {
				defer.reject( err );
			} else {
				defer.resolve( files );
			}
		});
	}).promise();
}

module.exports = function inspect( file ) {
	return stat( file ).pipe(function( stat ) {
		if ( !stat.isDirectory() ) {
			return true;
		}
		return readdir( file ).pipe(function( files ) {
				var dir = {};
				return Deferred.when.apply( Deferred, files.map(function( sub ) {
					return inspect( path.join( file, sub ) ).done(function( data ) {
						dir[ sub ] = data;
					});
				}) ).pipe(function() {
					return dir;
				});
		});
	});
};
```

OMG:
* it's *[three times slower](#performance-comparison)*!
* all of the callback-based functions had to be "promified"
* as such, the original logic is nearly unrecognizable (which means you'll have a hard convincing someone used to callback-based programming that your code is better)
* the `pipe` chain can be followed but the logic requires nested calls to `pipe`
* also, the last `pipe` is only there because `when` resolves as a list of parameters while we want to resolve with an object
* did I mention it's *[three times slower](#performance-comparison)*?

All right, maybe it's time to see how Fence would fare...

## Fence-based naive implementation

Let's go back to the basics (the [callback-based implementation](#callback-based-implementation)) and add a Fence around it:

```javascript
var fs = require("fs"),
	path = require("path"),
	Fence = require("fence");

module.exports = function inspect( file ) {
	return Fence(function( join, release, abort ) {
		fs.stat( file, join(function( err, stat ) {
			if ( err ) {
				abort( err );
			} else if ( !stat.isDirectory() ) {
				release( true );
			} else {
				fs.readdir( file, join(function( err, files ) {
					if ( err ) {
						abort( err );
					} else {
						var dir = {};
						files.forEach(function( sub ) {
							inspect( path.join( file, sub ) ).done(join(function( data ) {
								dir[ sub ] = data;
							}));
						});
						release( dir );
					}
				}) );
			}
		}) );
	});
};
```

Not quite there yet:
* it's about [60% slower](#performance-comparison),
* but: no count management, no `when` trickeries, no `pipe` chains
* as a consequence, it's less nested and, together with the use of `abort` and `release` it makes for code that is quite easy to follow
* however, the calls to `join` are a bit sneaky at times, especially regarding the `done` callback of the nested `inspect`

I'd say we're getting there, except from a performance point of view.

## Fence-based advanced implementation

So what went wrong with the previous implementation? Well, it's quite simple: we didn't _really_ add a Fence around the [callback-based implementation](#callback-based-implementation), we added a Fence around each of its recursion. If we were to add the Fence around the whole thing, we would obtain this:

```javascript
var fs = require("fs"),
	path = require("path"),
	Fence = require("fence");

module.exports = function( filename ) {
	return Fence(function( join, release, abort ) {
		(function inspect( file, callback ) {
			fs.stat( file, join(function( err, stat ) {
				if ( err ) {
					abort( err );
				} else if ( !stat.isDirectory() ) {
					callback( true );
				} else {
					fs.readdir( file, join(function( err, files ) {
						if ( err ) {
							abort( err );
						} else {
							var dir = {};
							files.forEach(function( sub ) {
								inspect( path.join( file, sub ), join(function( data ) {
									dir[ sub ] = data;
								}) );
							});
							callback( dir );
						}
					}) );
				}
			}) );
		})( filename, release );
	});
};
```

Looks nice, doesn't it?

Let's see:
* it's just the [callback-based implementation](#callback-based-implementation) simplified (no count management, less nesting), pretty much anybody can read it
* it's only about [6% slower](#performance-comparison) yet returns a promise
