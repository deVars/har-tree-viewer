import { Entry } from "har-format";

export interface HARLogEntries {
  log: {
    entries: ChromiumHAREntry[];
  }
}

export interface SlimHAR {
  _initiator: string | null;
  method: string;
  mimeType: string[];
  url: string;
  time: number;
  _xferSize: number;
}

export interface SlimHARLinkedList extends SlimHAR {
  id: string;
  isChildrenShown: boolean;
  children: SlimHARLinkedList[];
}

enum InitiatorTypes {
  parser, script, other
}

interface ChromiumHAREntry extends Omit<Entry, '_initiator'> {
  _initiator: HARParserInitiator | HARScriptInitiator | HAROtherInitiator;
}

export interface HAROtherInitiator {
  type: keyof typeof InitiatorTypes;
}

export interface HARParserInitiator {
  type: keyof typeof InitiatorTypes;
  url: string;
  linenumber: number;
}

export interface HARScriptInitiatorStackCallFrame {
  functionName: string;
  scriptId: string;
  url: string;
  lineNumber: number;
  columnNumber: number;
}

export declare interface HARScriptInitiator {
  type: keyof typeof InitiatorTypes;
  stack: {
    callFrames: HARScriptInitiatorStackCallFrame[]
    parent?: {
      description: string
      callFrames: HARScriptInitiatorStackCallFrame[]
    }
  };
}
