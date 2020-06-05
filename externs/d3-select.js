/**
 * @fileoverview custom d3-select externs
 * @author Roseller Velicaria, Jr.
 * @externs
 * 20200605
 */

/**
 * namespace map
 * referenced when creating elements using insert, append, etc
 * @type {{xmlns: string, svg: string, xml: string, xhtml: string, xlink: string}}
 */
const namespaces = {
  "svg": "",
  "xhtml": "",
  "xlink": "",
  "xml": "",
  "xmlns": ""
};

/**
 * used when entering data-join combos
 * the least we need to preserve is __data__ as it is referenced
 * on the dist version of d3-selection
 * @constructor
 */
function EnterNode() {}
EnterNode.prototype = {
  // ownerDocument: {},
  // namespaceURI: {},
  // _next: {},
  // _parent: {},
  __data__: {},
};

