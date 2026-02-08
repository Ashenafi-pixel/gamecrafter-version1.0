import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

const HeroCarousel: React.FC = () => {

    const slides = [
        {
            title: "SUGAR RUSH",
            subtitle: "BONANZA",
            desc: "Experience the sweetest wins. Multipliers up to 500x!",
            btn: "PLAY NOW",
            bg: "bg-gradient-to-r from-purple-900 to-rose-900",
            image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=2070&auto=format&fit=crop"
        },
        {
            title: "ZEUS VS HADES",
            subtitle: "GODS OF WAR",
            desc: "Choose your volatility. Battle for Olympus!",
            btn: "JOIN BATTLE",
            bg: "bg-gradient-to-r from-slate-900 to-blue-900",
            image: "https://images.unsplash.com/photo-1629814249584-bd4d53cf0e7d?q=80&w=2071&auto=format&fit=crop"
        }
    ];

    const [current, setCurrent] = React.useState(0);

    const next = () => setCurrent((prev) => (prev + 1) % slides.length);
    const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

    // Auto-play
    React.useEffect(() => {
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full h-[360px] md:h-[420px] rounded-2xl overflow-hidden group">

            {slides.map((slide, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: idx === current ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    className={`absolute inset-0 ${slide.bg} flex items-center`}
                >
                    {/* Background Image / Overlay */}
                    <div
                        className="absolute inset-0 opacity-40 mix-blend-overlay bg-cover bg-center"
                        style={{ backgroundImage: `url(${slide.image})` }}
                    />

                    <div className="relative z-10 px-8 md:px-16 max-w-2xl">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: idx === current ? 0 : 20, opacity: idx === current ? 1 : 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur border border-white/20 rounded text-[10px] font-bold tracking-wider mb-4 text-white">
                                NEW RELEASE
                            </span>
                            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-4 leading-none">
                                {slide.title} <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">{slide.subtitle}</span>
                            </h1>
                            <p className="text-lg text-slate-300 mb-8 max-w-md font-medium">
                                {slide.desc}
                            </p>
                            <button className="bg-green-500 hover:bg-green-400 text-[#0f121b] font-black px-8 py-4 rounded-lg flex items-center gap-2 transform transition hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                                <Play size={20} fill="currentColor" /> {slide.btn}
                            </button>
                        </motion.div>
                    </div>
                </motion.div>
            ))}

            {/* Controls */}
            <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all border border-white/10"
            >
                <ChevronLeft size={20} />
            </button>

            <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all border border-white/10"
            >
                <ChevronRight size={20} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrent(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${current === idx ? 'w-8 bg-green-500' : 'bg-white/30 hover:bg-white/50'}`}
                    />
                ))}
            </div>

        </div>
    );
};

export default HeroCarousel;
