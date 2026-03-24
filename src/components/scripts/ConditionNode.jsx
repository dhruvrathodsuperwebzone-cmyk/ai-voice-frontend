import { Handle, Position } from 'reactflow';

export default function ConditionNode({ id, data }) {
  const label = data?.label ?? 'Condition';
  const expression = data?.expression ?? '';
  const onChange = data?.onChange;

  return (
    <div className="w-[360px] rounded-2xl border border-indigo-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 rounded-t-2xl border-b border-indigo-100 bg-indigo-50 px-3 py-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Condition node</p>
          <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <label className="block text-xs font-medium text-slate-600">Label</label>
        <input
          value={label}
          onChange={(e) => onChange?.(id, { label: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          placeholder="e.g. If hotel_size > 50"
        />
        <label className="block text-xs font-medium text-slate-600 mt-2">Expression</label>
        <input
          value={expression}
          onChange={(e) => onChange?.(id, { expression: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          placeholder='e.g. "hotel_rooms >= 50"'
        />
        <p className="text-xs text-slate-500">
          Use this for rule-based branching. (You can later evaluate this expression in your calling runtime.)
        </p>
      </div>

      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !bg-slate-400" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !bg-indigo-600" />
    </div>
  );
}

