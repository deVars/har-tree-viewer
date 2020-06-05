import { tree, hierarchy } from "d3-hierarchy";
import "d3-transition";
import { SlimHARLinkedList } from "./hartreedefs";
import * as d3Select from "d3-selection";
import { linkHorizontal } from "d3-shape";
import { numFix } from "./utils";
import { HierarchyPointLink, HierarchyPointNode } from "d3-hierarchy";

const width = 640;
const animationDurationMSecs = 600;
const rootNodeLeftMarginMaxWidthFactor = 0.8;
const nodeCircleRadius = 2.5;
const labelFontSizePx = 16;
// const labelMaxWidthPx = width / (data.height + 1);
const labelMaxWidthPx = 150;

interface HARTreeNode extends SlimHARLinkedList {
  cached_children?: SlimHARLinkedList[];
  name?: string;
}

interface NodePoint {
  x: number;
  y: number;
}


/** @export {function()} */
export function clearTree() {
  d3Select.select('#svg-root').remove();
}

/** @export {function(SlimHARLinkedList, string, string)} */
export function drawTree(data:SlimHARLinkedList, canvasID: string, nodeInfoID: string) {
  const getTreeLayout = tree<HARTreeNode>()
    .nodeSize([labelFontSizePx, labelMaxWidthPx]);
  const sortedHierarchicalData = hierarchy(data)
    .sort((a, b) => b.height - a.height);
  const root = getTreeLayout(sortedHierarchicalData);
  const nodeLinearTranslateFn = (d: NodePoint) =>
    `translate(${d.y}, ${d.x})`;

  let minHeight = Infinity, maxHeight = -Infinity;
  root.each(d => {
    maxHeight = d.x > maxHeight ? d.x : maxHeight;
    minHeight = d.x < minHeight ? d.x : minHeight;
    d.data.name = getNodeLabel(d.data.url);
  });

  const defaultTransition = d3Select.select('#svg-root').transition()
    .duration(animationDurationMSecs);

  const svg = d3Select.select('#svg-root')
    .data<number[]>([[0, 0, (root.height + 2) * labelMaxWidthPx, maxHeight - minHeight + 12 * 2]])
    .join(
      enter => enter.select(`#${canvasID}`)
          .append('svg:svg')
            .attr('id', 'svg-root')
            .attr('viewBox', d => d.toString()),
      update => update.empty() ? update :
        update.call(update => update.transition(defaultTransition)
          .attr('viewBox', d => d.join(' '))
        ),
      exit => exit.remove()
    );

  svg.select('#tree-container')
    .data<NodePoint>([{
      y: labelMaxWidthPx * rootNodeLeftMarginMaxWidthFactor,
      x: labelFontSizePx - minHeight},])
    .join(
      enter => enter.select('#svg-root')
        .append('svg:g')
        .attr('id', 'tree-container')
        .attr('transform', nodeLinearTranslateFn)
        .call(enter => enter.append('svg:g')
          .attr('id', 'paths-root')
          .clone()
          .attr('id', 'nodes-root')
        ),
      update => update.empty() ? update :
          update.call(update => update.transition(defaultTransition)
            .attr('transform', nodeLinearTranslateFn)
          ),
      exit => exit.remove(),
    );

  const treeLineFn = linkHorizontal<HierarchyPointNode<HARTreeNode>, HierarchyPointNode<HARTreeNode>>().x(d => d.y).y(d => d.x);
  svg.select('#paths-root')
    .selectAll("path")
    .data<HierarchyPointLink<HARTreeNode>>(root.links(), d => (d as HierarchyPointLink<HARTreeNode>).target.data.id)
    .join(
      enter => enter.append('svg:path')
        .attr("d", treeLineFn as any),
      update => update.call(update =>
        update.transition(defaultTransition)
          .attr('d', treeLineFn as any)
        ),
      exit => exit.remove());


  svg.select('#nodes-root')
    .selectAll("g")
    .data(root.descendants(), d => (d as HierarchyPointNode<HARTreeNode>).data.id)
    .join(
      enter => enter.append('svg:g')
        .attr("transform", nodeLinearTranslateFn)
        .call(appendNodeCircle, data, canvasID, nodeInfoID)
        .call(appendNodeText, true)
        .call(appendNodeText, false),
      update => update.call(update =>
        update.transition(defaultTransition)
          .attr('transform', nodeLinearTranslateFn)
        ),
      exit => exit.remove(),
    );
}

function getNodeLabel(urlStr: string) {
  let label = '';
  if(urlStr.indexOf('?') !== -1) {
    const [_, capture] = [...(urlStr.match(/\/\/(.*?)\?/) || [])];
    label = capture;
  } else if(urlStr.indexOf('=') !== -1) {
    const [_, capture] = [...(urlStr.match(/\/\/(.*?)=/) || [])] ;
    label = capture;
  } else {
    const [_, capture] = [...(urlStr.match(/\/\/(.*)/) || [])];
    label = capture;
  }
  return label.substring(label.lastIndexOf('/') + 1) || label;
}

function appendNodeCircle(selection: d3Select.Selection<any, any, any, any>, data: SlimHARLinkedList, canvasID: string, nodeInfoID: string): void {
  selection.append('svg:circle')
  .attr("class", d => `node ${getHasChildrenClass(d)}`)
  .attr('r', nodeCircleRadius)
  .on('mouseover', d => getNodeInfo(nodeInfoID, d.data, d))
  .on('click', d => toggleChildren(d, data, canvasID, nodeInfoID));

  function getHasChildrenClass(nodeData: HARTreeNode) {
    return nodeData.children || nodeData.cached_children
      ? 'node-has-children'
      : 'node-has-no-children';
  }
}

function appendNodeText(selection: d3Select.Selection<any, any, any, any>, isOutline: boolean): void {
  selection.append('svg:text')
  .attr("dy", "0.31em")
  .attr("x", d => d.children ? -6 : 6)
  .attr("class", d => `${getLabelAlignClass(d)} ${isOutline ? 'label-outline' : ''}`)
  .text(d => d.data.name);

  function getLabelAlignClass(d: HARTreeNode) {
    return d.children ? 'label-align-end' : 'label-align-start';
  }
}

function getNodeInfo(nodeInfoID: string, data: HARTreeNode, node: HierarchyPointNode<HARTreeNode>) {
  const details = {
    method: data.method,
    url: data.url.length < 80 ? data.url : `${data.url.substring(0, 80)}...`,
    mimeType: data.mimeType.join('/'),
    time_millisecs: data.time,
    cumulativeTime_millisecs: numFix(
      node.ancestors().reduce((sum, d) =>
        // assume root page document load time is negligible
        !d.parent ? sum : d.data.time + sum, 0
      ), 3),
    xferSize: data._xferSize,
  };

  d3Select.select('#node-info-details')
    .data([details])
    .join(
      enter => enter.empty() ? enter :
        enter.call(enter =>
          d3Select.select(`#${nodeInfoID}`)
            .append('dl')
            .attr('id','node-info-details')
            .call(updateInfo, enter.datum())
        ),
      update => update.empty() ? update : update.call(
          update => update.selectAll('dd')
            .data(d => Object.values(d))
            .text(d => d)
        ),
    );

  function updateInfo(selection: d3Select.Selection<any, any, any, any>, d: {}) {
    Object.entries<string>(d)
    .forEach(([key, val]) => {
      selection.append('dt').text(key);
      selection.append('dd').text(val);
    });
  }
}

function toggleChildren(node: HierarchyPointNode<HARTreeNode>, data: SlimHARLinkedList, canvasID: string, nodeInfoID: string) {
  if (node.children && node.children.length === 0
    && node.data.cached_children
    && node.data.cached_children.length === 0) {
    // nice try
    return;
  }
  node.data.isChildrenShown = !node.data.isChildrenShown;
  if (!node.data.cached_children) {
    node.data.cached_children = node.data.children;
    // node.cached_nodes = node.children;
  }
  if (node.data.children && node.data.cached_children) {
    node.data.children = node.data.isChildrenShown
      ? node.data.cached_children : [];
  }
  // node.children = node.data.isChildrenShown
  //   ? node.cached_nodes : [];
  new Promise(resolve => resolve(drawTree(data, canvasID, nodeInfoID)));
}