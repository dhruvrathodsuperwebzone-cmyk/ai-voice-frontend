import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { getRole } from '../utils/roleUtils';
import { addEdge, useEdgesState, useNodesState } from 'reactflow';
import FlowEditor from '../components/scripts/FlowEditor';
import PageLoader from '../components/PageLoader';
import { createScript, deleteScript, getScriptById, updateScript } from '../services/scriptsService';

function toLinearFlowNodes(steps) {
  const baseX = 80;
  const baseY = 120;
  const gapX = 360;

  const nodes = (steps || []).map((s, idx) => ({
    id: String(s.id ?? `step_${idx + 1}`),
    type: 'script',
    position: { x: baseX + idx * gapX, y: baseY },
    data: { label: s.label ?? `Step ${idx + 1}`, prompt: s.prompt ?? '' },
  }));

  const edges = nodes.slice(0, -1).map((n, idx) => ({
    id: `e_${nodes[idx].id}_${nodes[idx + 1].id}`,
    source: nodes[idx].id,
    target: nodes[idx + 1].id,
    type: 'smoothstep',
    animated: false,
  }));

  return { nodes, edges };
}

function sanitizeNodes(nodes) {
  return nodes.map((n) => {
    const { onChange, ...restData } = (n.data || {});
    return { ...n, data: restData };
  });
}

function deriveSteps(nodes) {
  const sorted = [...nodes].sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));
  return sorted
    .filter((n) => n.type === 'script')
    .map((n) => ({
      id: n.id,
      label: n.data?.label ?? 'Step',
      prompt: n.data?.prompt ?? '',
    }));
}

const DEFAULT_STEPS = [
  { id: 'greeting', label: 'Greeting', prompt: 'Hello, may I speak with the owner?' },
  { id: 'hotel_size', label: 'Ask hotel size', prompt: 'How many rooms?' },
  { id: 'offer', label: 'Offer AI receptionist', prompt: 'We have an AI receptionist for 24/7 bookings. Demo?' },
  { id: 'objections', label: 'Handle objections', prompt: 'What would make it easier to try?' },
  { id: 'payment', label: 'Send payment link', prompt: 'I will send a payment link. 14-day free trial.' },
];

function toSimpleSteps(nodes) {
  const steps = deriveSteps(nodes);
  if (steps.length > 0) return steps.map((s) => ({ label: s.label, prompt: s.prompt }));
  return DEFAULT_STEPS.map((s) => ({ label: s.label, prompt: s.prompt }));
}

export default function ScriptBuilderPage() {
  const { id } = useParams();
  const isNew = id === 'new' || !id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [name, setName] = useState(isNew ? 'Hotel AI pitch' : '');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleted, setDeleted] = useState(false);
  const [builderMode, setBuilderMode] = useState('easy');
  const [simpleSteps, setSimpleSteps] = useState(() => DEFAULT_STEPS.map((s) => ({ label: s.label, prompt: s.prompt })));

  const initial = useMemo(() => (isNew ? toLinearFlowNodes(DEFAULT_STEPS) : { nodes: [], edges: [] }), [isNew]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  const addCounter = useRef(1);

  const handleNodeDataChange = useCallback((nodeId, patch) => {
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, data: { ...(n.data || {}), ...patch } } : n)));
  }, [setNodes]);

  const attachOnChange = useCallback((list) => {
    return list.map((n) => ({
      ...n,
      data: { ...(n.data || {}), onChange: handleNodeDataChange },
    }));
  }, [handleNodeDataChange]);

  useEffect(() => {
    setNodes((prev) => attachOnChange(prev));
  }, [attachOnChange, setNodes]);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await getScriptById(id);
        const data = res?.data ?? res;
        if (cancelled) return;

        setName(data?.name ?? '');

        const flow = data?.flow ?? {};
        if (Array.isArray(flow?.nodes) && Array.isArray(flow?.edges)) {
          setNodes(attachOnChange(flow.nodes));
          setEdges(flow.edges);
          setSimpleSteps(toSimpleSteps(flow.nodes));
        } else if (Array.isArray(flow?.steps)) {
          const { nodes: n, edges: e } = toLinearFlowNodes(flow.steps);
          setNodes(attachOnChange(n));
          setEdges(e);
          setSimpleSteps(flow.steps.map((s, idx) => ({ label: s.label ?? `Step ${idx + 1}`, prompt: s.prompt ?? '' })));
        } else {
          const { nodes: n, edges: e } = toLinearFlowNodes(DEFAULT_STEPS);
          setNodes(attachOnChange(n));
          setEdges(e);
          setSimpleSteps(DEFAULT_STEPS.map((s) => ({ label: s.label, prompt: s.prompt })));
        }
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.message || err?.message || 'Failed to load script');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [attachOnChange, id, isNew, setEdges, setNodes]);

  const onConnect = useCallback((connection) => {
    setEdges((eds) => addEdge({ ...connection, type: 'smoothstep' }, eds));
  }, [setEdges]);

  const syncSimpleStepsToFlow = useCallback((steps) => {
    const cleaned = steps
      .map((s, idx) => ({
        id: `step_${idx + 1}`,
        label: (s.label || '').trim() || `Step ${idx + 1}`,
        prompt: (s.prompt || '').trim(),
      }))
      .filter((s) => s.label || s.prompt);

    const fallback = cleaned.length > 0 ? cleaned : [{ id: 'step_1', label: 'Step 1', prompt: '' }];
    const { nodes: n, edges: e } = toLinearFlowNodes(fallback);
    setNodes(attachOnChange(n));
    setEdges(e);
  }, [attachOnChange, setEdges, setNodes]);

  const onAddNode = useCallback((type) => {
    const idx = addCounter.current++;
    const newId = `${type}_${Date.now()}_${idx}`;
    const base = {
      id: newId,
      type,
      position: { x: 120 + idx * 40, y: 160 + (idx % 4) * 40 },
      data: { onChange: handleNodeDataChange },
    };

    if (type === 'script') base.data = { ...base.data, label: `Step ${idx}`, prompt: '' };
    if (type === 'decision') base.data = { ...base.data, label: `Decision ${idx}`, question: '' };
    if (type === 'condition') base.data = { ...base.data, label: `Condition ${idx}`, expression: '' };

    setNodes((ns) => [...ns, base]);
  }, [handleNodeDataChange, setNodes]);

  function updateSimpleStep(index, patch) {
    setSimpleSteps((prev) => {
      const next = prev.map((s, i) => (i === index ? { ...s, ...patch } : s));
      syncSimpleStepsToFlow(next);
      return next;
    });
  }

  function addSimpleStep() {
    setSimpleSteps((prev) => {
      const next = [...prev, { label: `Step ${prev.length + 1}`, prompt: '' }];
      syncSimpleStepsToFlow(next);
      return next;
    });
  }

  function removeSimpleStep(index) {
    setSimpleSteps((prev) => {
      const next = prev.filter((_, i) => i !== index);
      syncSimpleStepsToFlow(next);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: name?.trim() || 'Untitled script',
        flow: {
          nodes: sanitizeNodes(nodes),
          edges,
          steps: deriveSteps(nodes),
        },
      };

      if (isNew) {
        const created = await createScript(payload);
        const createdData = created?.data ?? created;
        const newId = createdData?.id ?? createdData?.script?.id;
        if (newId) navigate(`/dashboard/scripts/${newId}`, { replace: true });
      } else {
        await updateScript(id, payload);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (isNew) return;
    setError('');
    try {
      await deleteScript(id);
      setDeleted(true);
      navigate('/dashboard/scripts', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Delete failed');
    }
  }

  if (getRole(user) === 'viewer') {
    return <Navigate to="/dashboard/scripts" replace />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/dashboard/scripts" className="hover:text-slate-700">Scripts</Link>
            <span>/</span>
            <span className="truncate">{isNew ? 'New' : `Script ${id}`}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Script Builder</h1>
          <p className="mt-1 text-sm text-slate-500">Use Easy mode for quick scripts, or Advanced mode for visual flow mapping.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || loading || deleted}
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="btn-primary-gradient rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Script details</h2>
          <p className="mt-1 text-xs text-slate-500">This is saved to your backend as JSON flow.</p>

          <div className="mt-4 space-y-2">
            <label className="block text-xs font-medium text-slate-600">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Hotel AI pitch"
            />
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Quick start</p>
            <p className="mt-1 text-xs text-slate-500">Connect nodes to define the order and branching.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const { nodes: n, edges: e } = toLinearFlowNodes(DEFAULT_STEPS);
                  setNodes(attachOnChange(n));
                  setEdges(e);
                  setSimpleSteps(DEFAULT_STEPS.map((s) => ({ label: s.label, prompt: s.prompt })));
                }}
                disabled={loading || saving}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Load example flow
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimpleSteps([{ label: 'Step 1', prompt: '' }]);
                  syncSimpleStepsToFlow([{ label: 'Step 1', prompt: '' }]);
                }}
                disabled={loading || saving}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Clear canvas
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-100 bg-white p-3">
              <p className="text-slate-500">Nodes</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{nodes.length}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-3">
              <p className="text-slate-500">Edges</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{edges.length}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-3 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setBuilderMode('easy')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${builderMode === 'easy' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              Easy mode
            </button>
            <button
              type="button"
              onClick={() => setBuilderMode('advanced')}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${builderMode === 'advanced' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              Advanced mode
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-12 shadow-sm">
              <PageLoader message="Loading script…" className="min-h-[14rem]" size="md" />
            </div>
          ) : builderMode === 'easy' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">Script steps</h2>
                <button
                  type="button"
                  onClick={addSimpleStep}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  + Add step
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">Simple list editor. We auto-build the flow in the background.</p>
              <div className="mt-4 space-y-3">
                {simpleSteps.map((step, idx) => (
                  <div key={`${idx}-${step.label}`} className="rounded-xl border border-slate-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step {idx + 1}</p>
                      {simpleSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSimpleStep(idx)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      value={step.label}
                      onChange={(e) => updateSimpleStep(idx, { label: e.target.value })}
                      placeholder="Step title"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <textarea
                      value={step.prompt}
                      onChange={(e) => updateSimpleStep(idx, { prompt: e.target.value })}
                      placeholder="What should AI say in this step?"
                      rows={3}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <FlowEditor
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onAddNode={onAddNode}
            />
          )}
        </div>
      </div>
    </div>
  );
}

