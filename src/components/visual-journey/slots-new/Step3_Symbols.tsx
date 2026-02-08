import React from 'react';
import { useGameStore } from '../../../store';
import { Grid3X3, Upload, Wand2 } from 'lucide-react';

const Step3_Symbols: React.FC = () => {
    const { config } = useGameStore();

    return (
        <div className="p-6 h-full overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Grid3X3 className="w-6 h-6 text-purple-600" />
                Symbol Manager
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* High Value Symbols */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 border-b pb-2">High Value (Majors)</h3>
                    <div className="aspect-square bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50">
                        <div className="text-center text-gray-400">
                            <Upload className="w-8 h-8 mx-auto mb-2" />
                            <span className="text-sm">Add Major</span>
                        </div>
                    </div>
                </div>

                {/* Low Value Symbols */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 border-b pb-2">Low Value (Minors)</h3>
                    <div className="aspect-square bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50">
                        <div className="text-center text-gray-400">
                            <Upload className="w-8 h-8 mx-auto mb-2" />
                            <span className="text-sm">Add Minor</span>
                        </div>
                    </div>
                </div>

                {/* Specials */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700 border-b pb-2">Special Symbols</h3>
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                        <div className="font-bold text-yellow-800">Wild Symbol</div>
                        <div className="text-xs text-yellow-600 mt-1">Substitutes for all paying symbols</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                        <div className="font-bold text-purple-800">Scatter</div>
                        <div className="text-xs text-purple-600 mt-1">Triggers Free Spins</div>
                    </div>
                </div>

                {/* AI Generation Panel */}
                <div className="bg-slate-900 text-white p-6 rounded-xl md:col-span-1 lg:col-span-1">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-blue-400" />
                        AI Generator
                    </h3>
                    <p className="text-sm text-slate-400 mb-6">
                        Generate a consistent set of symbols based on your theme "<strong>{config.theme?.name || 'Untitled'}</strong>".
                    </p>
                    <button className="w-full py-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 transition-colors">
                        Generate All
                    </button>
                </div>
            </div>

            <div className="mt-12 p-8 bg-gray-50 rounded-xl border border-gray-200 text-center">
                <p className="text-gray-500">
                    This step will replace the fragmented symbol editing in Step 3.
                    <br />
                    It focuses purely on <span className="font-bold text-gray-700">Assets & Hierarchy</span>, decoupled from Grid Layout.
                </p>
            </div>
        </div>
    );
};

export default Step3_Symbols;
