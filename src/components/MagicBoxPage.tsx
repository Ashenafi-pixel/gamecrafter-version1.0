import React, { useState, useRef, useEffect } from 'react';
import { PremiumSlotMachine } from './slot-visualization';

const TABS = ['visuals', 'audio', 'animation', 'ui'] as const;
type Tab = typeof TABS[number];

const cueKeys = ['spinStart', 'spinStop', 'smallWin', 'bigWin', 'megaWin'] as const;
type CueKey = typeof cueKeys[number];

/**
 * MagicBoxPage: an interactive slot design playground
 */
const MagicBoxPage: React.FC = () => {
  // Global states
  const [tab, setTab] = useState<Tab>('visuals');
  const [bg, setBg] = useState<string>('');
  const [frame, setFrame] = useState<string>('');
  const [symbols, setSymbols] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(3000);
  const [spinLabel, setSpinLabel] = useState<string>('SPIN');
  const [spinColor, setSpinColor] = useState<string>('#dc2626');
  const [showInfo, setShowInfo] = useState<boolean>(true);
  
  // Audio cues and volumes
  const [audioCues, setAudioCues] = useState<Record<CueKey, string>>(Object.fromEntries(cueKeys.map(k => [k, ''])) as any);
  const [audioVolumes, setAudioVolumes] = useState<Record<CueKey, number>>(Object.fromEntries(cueKeys.map(k => [k, 1])) as any);
  
  // Animation timeline segments
  const phases = ['Anticipation', 'Acceleration', 'Spin', 'Deceleration'];
  const [segs, setSegs] = useState<number[]>([0.25, 0.25, 0.25, 0.25]);
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ i: number; x: number; orig: number[] } | null>(null);
  
  // Track uploaded background's natural size for crisp preview
  const [bgSize, setBgSize] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  useEffect(() => {
    if (!bg) return;
    const img = new Image();
    img.onload = () => setBgSize({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = bg;
  }, [bg]);

  // Drag-to-resize logic
  useEffect(() => {
    if (!drag) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - drag.x;
      const w = ref.current?.offsetWidth || 1;
      const delta = dx / w;
      const arr = [...drag.orig];
      const a = Math.max(0.05, Math.min(0.95, arr[drag.i] + delta));
      const b = Math.max(0.05, Math.min(0.95, arr[drag.i + 1] - delta));
      arr[drag.i] = a;
      arr[drag.i + 1] = b;
      setSegs(arr);
    };
    const onUp = () => {
      setDrag(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [drag]);

  const startDrag = (i: number, e: React.MouseEvent) => {
    e.preventDefault();
    setDrag({ i, x: e.clientX, orig: segs });
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Preview Area */}
      <div className="flex-1 border-b flex items-center justify-center bg-black">
        <div style={{ width: bgSize.width, height: bgSize.height, imageRendering: 'pixelated' }}>
          <PremiumSlotMachine
            initialBalance={1000}
            backgroundUrl={bg}
            frameUrl={frame}
            symbolList={symbols}
            spinConfig={{
              baseDuration: duration / 1000,
              anticipationPauseDuration: segs[0] * duration / 1000,
              accelerationDuration: segs[1] * duration / 1000,
              constantSpeedDuration: segs[2] * duration / 1000,
              decelerationDuration: segs[3] * duration / 1000,
            }}
            spinButtonLabel={spinLabel}
            spinButtonColor={spinColor}
            showInfoStrip={showInfo}
          />
        </div>
      </div>
      {/* Bottom Drawer */}
      <div className="bg-gray-800">
        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t}
              className={`flex-1 p-2 ${tab === t ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="p-4 h-64 overflow-auto text-white">
          {tab === 'visuals' && (
            <div className="space-y-4">
              <div>
                <label>Background</label>
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; f && setBg(URL.createObjectURL(f)); }} />
              </div>
              <div>
                <label>Frame</label>
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; f && setFrame(URL.createObjectURL(f)); }} />
              </div>
              <div>
                <label>Symbols</label>
                <input type="file" accept="image/*" multiple onChange={e => { const fs = e.target.files; if (fs) setSymbols(Array.from(fs).map(f => URL.createObjectURL(f))); }} />
              </div>
            </div>
          )}
          {tab === 'audio' && (
            <div className="space-y-4">
              <div className="text-center">Audio config here…</div>
            </div>
          )}
          {tab === 'animation' && (
            <div className="space-y-4 text-gray-200">
              <div>Total Duration (ms): <input type="number" value={duration} onChange={e => setDuration(+e.target.value)} className="w-24 text-black" /></div>
              <div ref={ref} className="relative flex h-8 bg-gray-700">
                {segs.map((s, i) => (<div key={i} style={{ flex: s, background: '#4b5563' }} />))}
                {segs.slice(0, -1).map((_, i) => { const left = segs.slice(0, i + 1).reduce((a, b) => a + b, 0) * 100; return <div key={i} className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize" style={{ left: `${left}%` }} onMouseDown={e => startDrag(i, e)} /> })}
              </div>
              <ul className="mt-2 text-sm">
                {phases.map((p, i) => (<li key={i} className="flex justify-between"><span>{p}</span><span>{Math.round(segs[i] * duration)} ms</span></li>))}
              </ul>
            </div>
          )}
          {tab === 'ui' && (
            <div className="space-y-4 text-white">
              <div className="flex items-center space-x-2">
                <label>Spin Label:</label>
                <input type="text" value={spinLabel} onChange={e => setSpinLabel(e.target.value)} className="text-black p-1 rounded" />
              </div>
              <div className="flex items-center space-x-2">
                <label>Spin Color:</label>
                <input type="color" value={spinColor} onChange={e => setSpinColor(e.target.value)} className="w-8 h-8 p-0 border-0" />
              </div>
              <div className="flex items-center space-x-2">
                <input id="info" type="checkbox" checked={showInfo} onChange={e => setShowInfo(e.target.checked)} className="accent-blue-500" />
                <label htmlFor="info">Show Info Strip</label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MagicBoxPage;