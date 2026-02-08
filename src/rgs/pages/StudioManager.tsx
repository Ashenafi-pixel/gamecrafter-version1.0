
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Save, X, Image as ImageIcon, Briefcase } from 'lucide-react';

interface Studio {
    id: string;
    name: string;
    logo_url: string;
    config: any;
}

const StudioManager: React.FC = () => {
    const [studios, setStudios] = useState<Studio[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentStudio, setCurrentStudio] = useState<Partial<Studio>>({});

    useEffect(() => {
        fetchStudios();
    }, []);

    const fetchStudios = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/rgs/studios');
            if (res.ok) {
                setStudios(await res.json());
            }
        } catch (error) {
            console.error('Failed to fetch studios', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!currentStudio.name) return;

        try {
            const method = currentStudio.id ? 'PUT' : 'POST';
            const url = currentStudio.id
                ? `/api/rgs/studios/${currentStudio.id}`
                : '/api/rgs/studios';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentStudio)
            });

            if (res.ok) {
                setIsEditing(false);
                setCurrentStudio({});
                fetchStudios();
            }
        } catch (error) {
            console.error('Failed to save studio', error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <Briefcase className="text-indigo-600" /> Studio Manager
                    </h1>
                    <p className="text-slate-500">Manage Tenants and Aggregator Partners</p>
                </div>
                <button
                    onClick={() => { setCurrentStudio({}); setIsEditing(true); }}
                    className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold transition-colors"
                >
                    <Plus size={18} /> Add New Studio
                </button>
            </div>

            {isEditing && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-2xl shadow-lg border border-indigo-100"
                >
                    <h2 className="text-lg font-bold mb-6 text-slate-800">
                        {currentStudio.id ? 'Edit Studio' : 'Create New Studio'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Studio Name</label>
                                <input
                                    type="text"
                                    value={currentStudio.name || ''}
                                    onChange={e => setCurrentStudio({ ...currentStudio, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. Neon Gaming"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Logo URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={currentStudio.logo_url || ''}
                                        onChange={e => setCurrentStudio({ ...currentStudio, logo_url: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Preview</label>
                                <div className="h-32 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
                                    {currentStudio.logo_url ? (
                                        <img src={currentStudio.logo_url} alt="Preview" className="max-h-20 max-w-full object-contain" />
                                    ) : (
                                        <div className="text-slate-400 flex flex-col items-center">
                                            <ImageIcon size={24} />
                                            <span className="text-xs mt-1">No Logo</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-8 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200"
                        >
                            <Save size={18} /> Save Studio
                        </button>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studios.map(studio => (
                    <motion.div
                        key={studio.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative"
                    >
                        <button
                            onClick={() => { setCurrentStudio(studio); setIsEditing(true); }}
                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        >
                            <Edit2 size={16} />
                        </button>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center p-2 border border-slate-200">
                                {studio.logo_url ? (
                                    <img src={studio.logo_url} alt={studio.name} className="max-w-full max-h-full object-contain" />
                                ) : (
                                    <span className="text-2xl font-black text-slate-300">{studio.name.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 leading-tight">{studio.name}</h3>
                                <div className="text-xs font-mono text-slate-400">{studio.id}</div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Active</span>
                            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">0 Games</span>
                        </div>
                    </motion.div>
                ))}

                {studios.length === 0 && !isLoading && (
                    <div className="col-span-full py-20 text-center text-slate-400">
                        <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No studios found. Create your first one!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudioManager;
