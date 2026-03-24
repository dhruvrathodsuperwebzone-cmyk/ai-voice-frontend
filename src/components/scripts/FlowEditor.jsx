import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import ScriptNode from './ScriptNode';
import DecisionNode from './DecisionNode';
import ConditionNode from './ConditionNode';

function InnerFlowEditor({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddNode,
}) {
  const nodeTypes = useMemo(() => ({
    script: ScriptNode,
    decision: DecisionNode,
    condition: ConditionNode,
  }), []);

  return (
    <div className="h-[70vh] min-h-[520px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAddNode('script')}
            className="btn-primary-gradient rounded-xl px-3 py-2 text-sm font-semibold"
          >
            + Script node
          </button>
          <button
            type="button"
            onClick={() => onAddNode('decision')}
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
          >
            + Decision node
          </button>
          <button
            type="button"
            onClick={() => onAddNode('condition')}
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-100"
          >
            + Condition node
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Tip: drag from handles to connect nodes.
        </p>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <MiniMap
          pannable
          zoomable
          className="!bg-white"
          nodeColor={(n) => {
            if (n.type === 'decision') return '#f59e0b';
            if (n.type === 'condition') return '#3b82f6';
            return '#4f46e5';
          }}
        />
        <Controls />
        <Background gap={16} color="#e2e8f0" />
      </ReactFlow>
    </div>
  );
}

export default function FlowEditor(props) {
  return (
    <ReactFlowProvider>
      <InnerFlowEditor {...props} />
    </ReactFlowProvider>
  );
}

