import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, Building2, Check, Settings } from 'lucide-react';
import { useGameStore, Studio } from '../store';

interface StudioSelectionProps {
    onCreateStudio: () => void;
    onEditStudio: (studio: Studio) => void;
}

const StudioSelection: React.FC<StudioSelectionProps> = ({ onCreateStudio, onEditStudio }) => {
    const { studios, activeStudio, selectStudio, fetchStudios } = useGameStore();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        fetchStudios();
    }, [fetchStudios]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollAmount = container.clientWidth * 0.6;

        if (direction === 'left') {
            container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="mb-10 relative group">
            {/* Header Section */}
            <div className="flex justify-between items-end mb-6 px-1">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Select Studio</h2>
                    <p className="text-gray-500 mt-1 text-lg">Choose a workspace to manage your games</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={onCreateStudio}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors shadow-sm hover:shadow-md"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Studio</span>
                    </button>

                    <div className="flex bg-gray-100 rounded-full p-1">
                        <button
                            onClick={() => scroll('left')}
                            className="p-2 rounded-full hover:bg-white hover:shadow-sm text-gray-600 transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="p-2 rounded-full hover:bg-white hover:shadow-sm text-gray-600 transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Slider Section */}
            {studios.length === 0 ? (
                <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-12 text-center">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Studios Yet</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">Create your first studio to start building games. Studios help you organize projects and manage shared assets.</p>
                    <button
                        onClick={onCreateStudio}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                        <Plus className="w-5 h-5 text-red-500" />
                        Create First Studio
                    </button>
                </div>
            ) : (
                <div
                    ref={scrollContainerRef}
                    className="flex gap-6 overflow-x-auto pb-8 pt-4 -mx-4 px-4 snap-x hide-scrollbar"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {studios.map((studio) => {
                        const isActive = activeStudio?.id === studio.id;
                        return (
                            <motion.div
                                key={studio.id}
                                layoutId={studio.id}
                                onClick={() => selectStudio(studio.id)}
                                className={`
                  relative flex-shrink-0 w-[164px] h-[220px] group cursor-pointer
                  rounded-lg transition-all duration-300 flex flex-col
                  ${isActive
                                        ? 'ring-2 ring-red-500 ring-offset-2 shadow-lg scale-105 z-10'
                                        : 'hover:shadow-md hover:-translate-y-1 bg-white border border-gray-200'
                                    }
                `}
                            >
                                {/* Banner / Header Background */}
                                <div className="h-14 bg-gradient-to-br from-gray-900 to-gray-800 rounded-t-lg overflow-hidden relative flex-shrink-0">
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                                </div>

                                {/* Content */}
                                <div className={`p-3 pt-0 ${isActive ? 'bg-red-50/30' : 'bg-white'} rounded-b-lg flex-1 flex flex-col relative`}>
                                    <div className="flex justify-center -mt-6 relative mb-2">
                                        {/* Logo Avatar - Centered & Smaller */}
                                        <div className="w-12 h-12 rounded-xl bg-white p-0.5 shadow-md border border-gray-100 overflow-hidden relative">
                                            {studio.logo ? (
                                                <img src={studio.logo} alt={studio.name} className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg text-xs font-bold text-gray-400 uppercase">
                                                    {studio.name.substring(0, 2)}
                                                </div>
                                            )}

                                            {isActive && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                                                    <Check className="w-2 h-2 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-center mb-1">
                                        <h3 className={`font-bold truncate text-xs mb-0.5 ${isActive ? 'text-red-900' : 'text-gray-900'}`}>
                                            {studio.name}
                                        </h3>
                                        <div className="h-0.5 w-6 bg-gray-100 mx-auto rounded-full my-1"></div>
                                    </div>

                                    <div className="text-center flex-1">
                                        <p className="text-[10px] text-gray-400 line-clamp-3 leading-relaxed px-1 text-center">
                                            {studio.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between text-[9px] text-gray-400 border-t border-gray-50 pt-1.5 mt-auto">
                                        <span className="opacity-70">{new Date(studio.createdAt).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditStudio(studio);
                                            }}
                                            className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-red-600"
                                            title="Configure Studio"
                                        >
                                            <Settings className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StudioSelection;
