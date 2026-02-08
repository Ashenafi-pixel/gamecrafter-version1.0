import React, { useRef, useState, useEffect } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { useGameStore } from '../../../../store';
import { Target, Grid, Gift, Layers, RefreshCw } from 'lucide-react';

// Domain Model Categories with Assets
const CATEGORIES = [
    {
        id: 'MATCH',
        title: 'Match & Collect',
        description: 'Classic Match-3, Collect N symbols, or Lucky Number matching.',
        icon: Target,
        image: '/assets/mechanics/instant-win.jpg', // Swapped to match visual content
        color: 'from-blue-600 to-cyan-500'
    },
    {
        id: 'GRID',
        title: 'Grid Search',
        description: 'Find prizes hidden in a grid. Avoid mines or traps.',
        icon: Grid,
        image: '/assets/mechanics/grid-search.jpg',
        color: 'from-purple-600 to-indigo-500'
    },
    {
        id: 'BONUS',
        title: 'Instant Win',
        description: 'Single reveal instant wins or trigger-based bonus games.',
        icon: Gift,
        image: '/assets/mechanics/match-3.jpg', // Swapped to match visual content
        color: 'from-green-600 to-emerald-500'
    },
    {
        id: 'PROGRESSION',
        title: 'Progression Journey',
        description: 'Multi-stage reveals where players advance through levels.',
        icon: Layers,
        image: '/assets/mechanics/progression.jpg',
        color: 'from-orange-600 to-amber-500'
    }
];

const CategorySelector: React.FC = () => {
    const { config, updateConfig } = useGameStore();
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Drag-to-scroll refs
    const sliderRef = useRef<HTMLDivElement>(null);
    const isDown = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const isDragging = useRef(false);

    // Drag Handlers
    const onMouseDown = (e: React.MouseEvent) => {
        isDown.current = true;
        isDragging.current = false;
        if (sliderRef.current) {
            startX.current = e.pageX - sliderRef.current.offsetLeft;
            scrollLeft.current = sliderRef.current.scrollLeft;
        }
    };

    const onMouseLeave = () => {
        isDown.current = false;
        isDragging.current = false;
    };

    const onMouseUp = () => {
        isDown.current = false;
        // Reset dragging flag after a short delay to allow click capture to fire first if needed
        setTimeout(() => {
            isDragging.current = false;
        }, 50);
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDown.current) return;
        e.preventDefault();

        if (sliderRef.current) {
            const x = e.pageX - sliderRef.current.offsetLeft;
            const walk = (x - startX.current) * 2; // Scroll speed multiplier

            // Should we treat this as a drag?
            if (Math.abs(walk) > 5) {
                isDragging.current = true;
            }

            sliderRef.current.scrollLeft = scrollLeft.current - walk;
        }
    };

    // Derived state
    const getCategoryFromType = (type?: string) => {
        // MATCH
        if (type === 'match_3' || type === 'match_2' || type === 'match_4') return 'MATCH';

        // GRID
        if (type === 'find_symbol' || type === 'golden_path') return 'GRID';

        // BONUS / INSTANT
        if (type === 'lucky_number' || type === 'instant_win' || type === 'pick_one' || type === 'wheel') return 'BONUS';

        // PROGRESSION
        if (type === 'journey') return 'PROGRESSION';

        return 'MATCH';
    };

    const activeCategory = getCategoryFromType(config.scratch?.mechanic?.type);

    // Sync internal state with external config on mount
    useEffect(() => {
        const index = CATEGORIES.findIndex(c => c.id === activeCategory);
        if (index !== -1) setActiveIndex(index);
    }, [activeCategory]);

    // DRAG LOGIC

    const onDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        if (offset < -100 || velocity < -500) {
            setActiveIndex(prev => Math.min(prev + 1, CATEGORIES.length - 1));
        } else if (offset > 100 || velocity > 500) {
            setActiveIndex(prev => Math.max(prev - 1, 0));
        }
    };

    // SUB-MECHANICS DATA
    const SUB_MECHANICS: Record<string, { id: string; label: string; icon: any }[]> = {
        MATCH: [
            { id: 'match_3', label: 'Match 3 (Classic)', icon: Target },
            { id: 'match_2', label: 'Match 2 (Easy)', icon: Target },
            { id: 'match_4', label: 'Match 4 (Hard)', icon: Target },
        ],
        GRID: [
            { id: 'find_symbol', label: 'Symbol Hunt', icon: Grid }, // Mines logic
            { id: 'golden_path', label: 'Golden Path', icon: Layers }, // Sequence logic
        ],
        BONUS: [
            { id: 'instant_win', label: 'Instant Win', icon: Gift },
            { id: 'lucky_number', label: 'Lucky Numbers', icon: Gift }, // Target Match
            { id: 'pick_one', label: 'Pick One', icon: Target }, // 1-Click
            { id: 'wheel', label: 'Scratch Wheel', icon: RefreshCw }, // Bonus
        ],
        PROGRESSION: [
            { id: 'journey', label: 'Level Journey', icon: Layers },
        ]
    };

    return (
        <div className="flex flex-col h-auto w-full bg-slate-50 relative pb-12">

            {/* Header */}
            <div className="text-center pt-4 pb-2 z-10">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-1">
                    Choose Gameplay Core
                </h2>
                {/* Description removed as requested */}
            </div>

            {/* Carousel Container */}
            <div
                className="w-full h-auto flex items-center justify-center relative perspective-1000 min-h-[200px]"
                ref={containerRef}
            >
                {/* Cards - Draggable Container */}
                <motion.div
                    className="relative h-[200px] w-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-pan-y"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragStart={() => { isDragging.current = true; }}
                    onDragEnd={(e, info) => {
                        // Reset dragging after a tick to allow tap detection if needed, 
                        // though Framer's onTap usually handles this.
                        setTimeout(() => { isDragging.current = false; }, 10);
                        onDragEnd(e, info);
                    }}
                >
                    {CATEGORIES.map((cat, index) => {
                        // Calculate relative position to active index
                        const offset = index - activeIndex;
                        const isActive = offset === 0;
                        const isVisible = Math.abs(offset) <= 1.5;

                        return (
                            <motion.div
                                key={cat.id}
                                onTap={() => {
                                    // Only trigger if not just finishing a drag
                                    if (!isDragging.current && index !== activeIndex) {
                                        setActiveIndex(index);
                                    }
                                }}
                                className={`absolute rounded-xl overflow-hidden shadow-lg
                                    ${isActive ? 'z-30 ring-2 ring-offset-2 ring-indigo-500' : 'z-10 brightness-50'}
                                    ${!isVisible ? 'pointer-events-none' : 'cursor-pointer'} 
                                `}
                                style={{
                                    width: isActive ? 120 : 90,
                                    height: isActive ? 180 : 135,
                                    x: offset * 100, // Tighter spacing
                                    rotateY: offset * 10,
                                    scale: isActive ? 1 : 0.9,
                                    opacity: isVisible ? 1 : 0,
                                }}
                                initial={false}
                                animate={{
                                    width: isActive ? 120 : 90,
                                    height: isActive ? 180 : 135,
                                    x: offset * 100,
                                    rotateY: offset * 10,
                                    scale: isActive ? 1 : 0.85,
                                    zIndex: 30 - Math.abs(offset),
                                    opacity: isVisible ? 1 : 0
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30
                                }}
                            >
                                {/* Image Background */}
                                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                                    <img
                                        src={cat.image}
                                        alt={cat.title}
                                        className="w-full h-full object-cover object-top opacity-90 transition-transform duration-700 hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                                </div>

                                {/* Content Overlay */}
                                <div className="absolute inset-0 p-3 flex flex-col justify-end text-white pb-8">
                                    <h3 className="text-sm font-black mb-0 leading-tight text-center drop-shadow-md">
                                        {cat.title}
                                    </h3>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>

            {/* Sub-Mechanic Selector (Cleaner Design) */}
            <div className="max-w-4xl mx-auto w-full px-6 mt-6">
                <div className="flex flex-col items-center">
                    <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider">Select Variant</h3>

                    {/* Drag-to-scroll Slider */}
                    <div
                        ref={sliderRef}
                        className="flex items-center overflow-x-auto gap-3 pb-4 px-4 w-full justify-center no-scrollbar mask-gradient cursor-grab active:cursor-grabbing select-none"
                        onMouseDown={onMouseDown}
                        onMouseLeave={onMouseLeave}
                        onMouseUp={onMouseUp}
                        onMouseMove={onMouseMove}
                        onClickCapture={(e) => {
                            // Prevent click if we dragged
                            if (isDragging.current) {
                                e.stopPropagation();
                                e.preventDefault();
                            }
                        }}
                    >
                        {SUB_MECHANICS[CATEGORIES[activeIndex].id]?.map((sub) => {
                            const isSelected = config.scratch?.mechanic?.type === sub.id;
                            return (
                                <button
                                    key={sub.id}
                                    onClick={async () => {
                                        // Logic duplicated from handleSelect partially but specific to sub-type
                                        const mechanicType = sub.id;
                                        // Import smart defaults
                                        const { getScratchDefaults } = await import('../../../../utils/validation/scratch-validator');
                                        const defaults = getScratchDefaults(mechanicType);

                                        updateConfig({
                                            scratch: {
                                                ...config.scratch,
                                                ...defaults,
                                                mechanic: { ...defaults.mechanic }, // FRESH MECHANIC - Do not merge old values (fixes persistent winningSymbol)
                                                prizes: defaults.prizes || config.scratch?.prizes // Overwrite prizes if default exists
                                            } as any
                                        });
                                    }}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all whitespace-nowrap flex-shrink-0
                                       ${isSelected
                                            ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm transform scale-105'
                                            : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 text-gray-600'
                                        }
                                   `}
                                >
                                    <sub.icon size={14} strokeWidth={2.5} />
                                    <div className="font-bold text-xs tracking-wide">{sub.label}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

        </div>
    );
};
export default CategorySelector;
