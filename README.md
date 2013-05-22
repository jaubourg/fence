# Fence

A minimal yet very useful synchronization primitive on top of jQuery Deferreds that is available as a jQuery plugin client-side and a npm package for node server-side.

_Latest version of Fence is version 0.4.0_

## What is it?

See our [Introduction to Fence](https://github.com/jaubourg/fence/blob/master/doc/intro.md#introduction-to-fence).

## Installation

### Server-Side: Node

* use npm: `npm install fence`
* or put `fence` as a dependency in `package.json` 

Fence itself depends on [JQDeferred](https://github.com/jaubourg/jquery-deferred-for-node) an automated port of jQuery Deferreds to node.

Once Fence is installed, `require` it in your code:

```javascript
var Fence = require( "fence" );
```

### Client-Side

[Download](https://github.com/jaubourg/fence/downloads) the minified or full-text version of the plugin and drop it into your project.

Then:
* put a script tag to load the plugin in your html: `<script src="path/to/js/fence.0.4.0.js"></script>`
* OR use your favorite script loader: `yepnope( "path/to/js/fence.0.4.0.js" );`

After that, Fence is available as `jQuery.Fence`, that simple.

## Build Fence

To build Fence yourself, you need node.

1. clone the repository: `git clone git://github.com/jaubourg/fence.git`
2. enter the newly created directory: `cd fence`
3. checkout the [version](https://github.com/jaubourg/fence/tags) you want to build: `git checkout 0.4.0`
4. install node dependencies: `npm install`
5. launch the builder: `node .`

Node package is now located in `dist/node`, jQuery plugin in `dist/jquery`.