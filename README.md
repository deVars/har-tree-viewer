# HAR Tree Viewer
Lets you view chrome HARs like a tree to check a page's dependencies.

[See it in action](https://devars.duckdns.org/har-tree-viewer/) when you saved your HAR via chrome's network inspector.

This started when I wanted to experiment on rollup's capabilities on bundling.  It just so happens that I needed a HAR Tree Viewer to easily see a website's "heaviness"/"bulk" and so the initial code was born.

Typescript entered later on because I wanted to know how much effort it would be to port a D3 code to TS.  And then came tsickle so I could squeeze more out of the package.  

GCC *simple* level compilation got it down to 61kB.

GCC *advanced* level compilation got it down to 53kB.

GCC is a beast if you can tame it.

## Why can't I use just any HAR?
Chromium derivatives and Goog Chrome adds more fields to the baseline [HAR spec](http://www.softwareishard.com/blog/har-12-spec/).  This additives make it possible to display HAR entries in a more or less hierarchical way. 

## Notes
* Uses [D3](https://github.com/d3/d3) v5 for hierarchy trees
* Mangled by [tsickle](https://github.com/angular/tsickle) and [closure compiler](https://github.com/google/closure-compiler)