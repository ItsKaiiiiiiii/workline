export type NodeType =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'transform'
  | 'api'
  | 'database'
  | 'notification'
  | 'output';

export interface NodeConfig {
  type: NodeType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  defaultParams: Record<string, any>;
  inputs: string[];
  outputs: string[];
}

export interface NodeData {
  id: string;
  label: string;
  type: NodeType;
  description: string;
  params: Record<string, any>;
  icon: string;
  color: string;
  bgColor: string;
  inputs: string[];
  outputs: string[];
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: NodeData[];
  edges: EdgeData[];
  createdAt: Date;
  updatedAt: Date;
}
