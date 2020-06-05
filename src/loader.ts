import {
  HARLogEntries,
  SlimHAR,
  SlimHARLinkedList,
  HARParserInitiator,
  HARScriptInitiator,
  HAROtherInitiator,
  HARScriptInitiatorStackCallFrame
} from './hartreedefs';
import { numFix } from './utils';

export async function getTreeHAR(file: File, blacklistMimeTypes: string[]): Promise<SlimHARLinkedList | null> {
  return fetch(URL.createObjectURL(file))
    .then(response => response.json())
    .then(getSlimHAREntries)
    .then(getDistinctURLEntries)
    .then((slimHarEntries) => applyHAREntryFilters(slimHarEntries, blacklistMimeTypes))
    .then(stratifySlimHAREntries)
}

function getSlimHAREntries(harjson: HARLogEntries): SlimHAR[] {
  return harjson.log.entries.map(entry => ({
    _initiator: getInitiatorUrl(entry['_initiator']),
    method: entry.request.method,
    mimeType: entry.response.content.mimeType.split('/'),
    url: entry.request.url,
    time: numFix(entry.time, 3),
    _xferSize: numFix(entry.response._transferSize || 0, 3),
  }));
}

function getInitiatorUrl(initiator: HARParserInitiator | HARScriptInitiator | HAROtherInitiator): string | null {
  switch(initiator.type) {
    case 'parser': return (initiator as HARParserInitiator).url;
    case 'script': {
      const scriptInitiator = initiator as HARScriptInitiator;
      const parentCallFrames: HARScriptInitiatorStackCallFrame[] = scriptInitiator.stack.parent
        ? scriptInitiator.stack.parent['callFrames']
        : [{url: '', functionName: '', scriptId: '', lineNumber: 0, columnNumber: 0}];
      const callFrames = scriptInitiator.stack['callFrames'].length > 0
        ? scriptInitiator.stack['callFrames']
        : parentCallFrames;
      return callFrames[0].url;
    }
    default: return null;
  }
}

function applyHAREntryFilters(slimHAREntries: SlimHAR[],
                              blacklistMimeTypes: string[]): SlimHAR[] {
  return slimHAREntries.filter((entry) =>
    blacklistMimeTypes.every(type => !entry.mimeType.includes(type))
  );
}

function getDistinctURLEntries(slimHAREntries: SlimHAR[]): SlimHAR[] {
  const urlSet = new Set();
  return slimHAREntries.reduce((distincts: SlimHAR[], entry) => {
    if (!urlSet.has(entry.url)) {
      urlSet.add(entry.url);
      return [...distincts, entry];
    }
    return distincts;
  }, []);
}

function stratifySlimHAREntries(slimHAREntries: SlimHAR[]): SlimHARLinkedList | null {
  let entries = [...slimHAREntries];
  const currentEntry = entries.shift();
  if (!currentEntry) {
    return null;
  }
  return {
    ...(currentEntry as SlimHAR),
    id: currentEntry.url,
    children: getEntryChildren(currentEntry, entries),
    isChildrenShown: true,
  };
}

function getEntryChildren(currentEntry: SlimHAR, entries: SlimHAR[]): SlimHARLinkedList[] {
  const [entryChildren, otherEntries] =
    partitionEntries(entries, entry => entry._initiator === currentEntry.url);
  return entryChildren.map(entry => ({
    ...entry,
    id: entry.url,
    children: getEntryChildren(entry, otherEntries),
    isChildrenShown: true,
  }));
}

function partitionEntries(entries: SlimHAR[],
                          condition: (slimHar: SlimHAR) => boolean): SlimHAR[][] {
  const trueList: SlimHAR[] = [], falseList: SlimHAR[] = [];
  entries.forEach(entry => condition(entry)
    ? trueList.push(entry)
    : falseList.push(entry));
  return [trueList, falseList];
}