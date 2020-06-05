/**
 * @fileoverview custom extern for the main file
 * @author Roseller Velicaria, Jr.
 * @externs
 * svg.js from https://raw.githubusercontent.com/google/closure-compiler/master/contrib/externs/svg.js
 * 20200605
 */

/**
 * roll-up umd specific
 * umd code uses the global var and this has to be tailored to what
 * the umd name in the roll-up config is set
 **/
const global = {hartree: {}};

/**
 * this is the export structure the UMD will create
 * @type {{getTreeHAR: hartree.getTreeHAR, drawTree: hartree.drawTree, clearTree: hartree.clearTree}}
 */
const hartree = {
  "drawTree": function() {},
  "clearTree": function() {},
  "getTreeHAR": function() {},
};
