
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, Clock, LayoutTemplate, Brush, Trash2, Eye, Code, X, FileJson, Send } from 'lucide-react';

interface Draft {
    draftId: string;
    userName: string;
    gameName: string;
    description: string;
    currentStep: number;
    lastUpdated: string;
    config: any;
}

const Workshop: React.FC = () => {
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
    const [viewMode, setViewMode] = useState<'overview' | 'json'>('overview');

    const fetchDrafts = async () => {
        try {
            const res = await fetch('/api/rgs/drafts');
            if (res.ok) {
                const data = await res.json();
                setDrafts(data);
            }
        } catch (error) {
            console.error('Failed to load drafts', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrafts();
        const interval = setInterval(fetchDrafts, 10000); // 10s auto-refresh
        return () => clearInterval(interval);
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this draft? This cannot be undone.')) return;

        try {
            const res = await fetch(`/api/rgs/draft/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setDrafts(prev => prev.filter(d => d.draftId !== id));
                if (selectedDraft?.draftId === id) setSelectedDraft(null);
            }
        } catch (err) {
            console.error('Failed to delete draft', err);
        }
    };

    const getStepLabel = (step: number) => {
        const steps = ['Theme', 'Layout', 'Visuals', 'Symbols', 'Prizes', 'Logic', 'Export'];
        return steps[step] || `Step ${step + 1}`;
    };

    return (
        <div className="space-y-6 relative h-full">
            {/* Header */}
            <div className="flex justify-between items-center bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                <div>
                    <h2 className="text-2xl font-black text-indigo-900">Creative Workshop</h2>
                    <p className="text-indigo-600">Live view of games currently being built by users.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                    </span>
                    <span className="text-sm font-bold text-indigo-700">Live Sync Active</span>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : drafts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <PenTool className="mx-auto text-slate-300 w-16 h-16 mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">No Active Drafts</h3>
                    <p className="text-slate-400">Games currently in creation will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {drafts.map((draft, i) => (
                        <motion.div
                            key={draft.draftId || i}
                            layoutId={`card-${draft.draftId}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => setSelectedDraft(draft)}
                            className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group cursor-pointer"
                        >
                            {/* Card Header */}
                            <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shadow-inner">
                                        {(draft.userName || 'U')[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{draft.userName || 'Anonymous Creator'}</h3>
                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                            <Clock size={12} />
                                            <span>
                                                {draft.lastUpdated ? new Date(draft.lastUpdated).toLocaleTimeString() : 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => handleDelete(e, draft.draftId)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Draft"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-lg font-black text-slate-800 line-clamp-1">
                                        {draft.gameName || 'Untitled Project'}
                                    </h4>
                                    <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider">
                                        Draft
                                    </div>
                                </div>

                                <p className="text-sm text-slate-500 mb-4 h-10 overflow-hidden line-clamp-2">
                                    {draft.description || 'No description provided.'}
                                </p>

                                {/* Progress Bar */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-xs font-bold text-slate-500">
                                        <span>Current Phase</span>
                                        <span className="text-indigo-600">{getStepLabel(draft.currentStep || 0)}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-indigo-500 h-2 rounded-full transition-all duration-500 relative"
                                            style={{ width: `${Math.max(5, ((draft.currentStep || 0) / 7) * 100)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite]" />
                                        </div>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {draft.config?.theme && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 font-medium">
                                            <Brush size={10} />
                                            {typeof draft.config.theme === 'object'
                                                ? (draft.config.theme.name || draft.config.theme.selectedThemeId || 'Custom Theme')
                                                : draft.config.theme}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 font-medium">
                                        <Eye size={10} /> Inspect
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Inspect Modal */}
            <AnimatePresence>
                {selectedDraft && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedDraft(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            layoutId={`card-${selectedDraft.draftId}`}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative z-10"
                        >
                            {/* Modal Header */}
                            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800">{selectedDraft.gameName}</h3>
                                    <p className="text-slate-500 text-sm">Draft ID: {selectedDraft.draftId}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                                        <button
                                            onClick={() => setViewMode('overview')}
                                            className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'overview' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                        >
                                            Overview
                                        </button>
                                        <button
                                            onClick={() => setViewMode('json')}
                                            className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'json' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-1">
                                                <Code size={14} /> JSON Source
                                            </div>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setSelectedDraft(null)}
                                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                                    >
                                        <X size={20} className="text-slate-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
                                {viewMode === 'overview' ? (
                                    <div className="space-y-6">
                                        {/* Status Checklist */}
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <LayoutTemplate size={16} /> Completion Status
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <StatusItem
                                                    label="Theme"
                                                    complete={!!selectedDraft.config.theme?.selectedThemeId || !!selectedDraft.config.theme?.name}
                                                />
                                                <StatusItem
                                                    label="Mechanics"
                                                    complete={!!selectedDraft.config.scratch}
                                                />
                                                <StatusItem
                                                    label="Prizes"
                                                    complete={selectedDraft.config.scratch?.prizes?.length > 0}
                                                />
                                                <StatusItem
                                                    label="Assets"
                                                    complete={!!selectedDraft.config.scratch?.assets || (typeof selectedDraft.config.scratch?.assetsStep !== 'undefined')}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                                    <Brush size={16} /> Theme Details
                                                </h4>
                                                {selectedDraft.config.theme ? (
                                                    <div className="space-y-2 text-sm">
                                                        <DetailRow label="ID" value={selectedDraft.config.theme.selectedThemeId} />
                                                        <DetailRow label="Name" value={selectedDraft.config.theme.name} />
                                                        <DetailRow label="Style" value={selectedDraft.config.theme.artStyle} />
                                                        <DetailRow label="Mood" value={selectedDraft.config.theme.mood} />
                                                    </div>
                                                ) : <span className="text-slate-400 italic text-sm">Not configured</span>}
                                            </div>

                                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                                    <LayoutTemplate size={16} /> Mechanics
                                                </h4>
                                                <div className="space-y-2 text-sm">
                                                    <DetailRow label="Type" value={selectedDraft.config.gameType} />
                                                    <DetailRow label="Grid" value={selectedDraft.config.gridSize} />
                                                    <DetailRow label="RTP" value={
                                                        typeof selectedDraft.config.rtp === 'object'
                                                            ? `${selectedDraft.config.rtp.targetRTP}%`
                                                            : `${selectedDraft.config.rtp || '96'}%`
                                                    } />
                                                    <DetailRow label="Volatility" value={
                                                        typeof selectedDraft.config.rtp === 'object'
                                                            ? selectedDraft.config.rtp.volatilityScale
                                                            : 'Medium'
                                                    } />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <FileJson size={16} /> Export Variables
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {Object.entries(selectedDraft.config).map(([key, value]) => {
                                                    if (key === 'theme' || key === 'scratch' || typeof value === 'object') return null;
                                                    return (
                                                        <div key={key} className="bg-slate-50 p-3 rounded-xl">
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold">{key}</div>
                                                            <div className="text-sm font-bold text-slate-700 truncate" title={String(value)}>
                                                                {String(value)}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-900 rounded-xl p-4 overflow-auto h-full shadow-inner custom-scrollbar">
                                        <pre className="text-xs font-mono text-emerald-400 leading-relaxed">
                                            {JSON.stringify(selectedDraft, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="bg-white p-4 border-t border-slate-100 flex justify-between items-center">
                                <div className="text-xs text-slate-400">
                                    Last synced: {new Date(selectedDraft.lastUpdated).toLocaleString()}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            if (!confirm('Publish this game to the Casino Lobby?')) return;
                                            try {
                                                const res = await fetch('/api/rgs/publish', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        gameId: selectedDraft.draftId,
                                                        ticketId: 'WORKSHOP-DIRECT',
                                                        studioId: selectedDraft.config.studioId
                                                    })
                                                });
                                                if (res.ok) {
                                                    alert('Game Published Successfully! Check the Casino Lobby.');
                                                } else {
                                                    alert('Publish Failed. Check console.');
                                                }
                                            } catch (e) {
                                                console.error(e);
                                                alert('Publish Error');
                                            }
                                        }}
                                        className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold text-sm transition-colors shadow-lg shadow-emerald-200"
                                    >
                                        <Send size={16} /> Publish to Casino
                                    </button>
                                    <button
                                        onClick={() => window.open(`/play/demo/${selectedDraft.draftId}`, '_blank')}
                                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm transition-colors shadow-lg shadow-indigo-200"
                                    >
                                        <Eye size={16} /> Play Demo
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, selectedDraft.draftId)}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold text-sm transition-colors"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatusItem = ({ label, complete }: { label: string, complete: boolean }) => (
    <div className={`flex items-center gap-2 p-3 rounded-xl border ${complete ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
        <div className={`w-2 h-2 rounded-full ${complete ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        <span className="text-xs font-bold">{label}</span>
        {complete && <span className="ml-auto text-emerald-600 text-[10px]">✓</span>}
    </div>
);

const DetailRow = ({ label, value }: { label: string, value: any }) => (
    <div className="flex justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium truncate max-w-[150px] text-right" title={String(value)}>{String(value || 'N/A')}</span>
    </div>
);

export default Workshop;
