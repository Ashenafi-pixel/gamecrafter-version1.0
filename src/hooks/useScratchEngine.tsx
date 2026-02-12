import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, FileJson, Activity, ShieldCheck, Server, Send } from 'lucide-react';
import { useGameStore } from '../../../store';
import { useSuccessPopup, useWarningPopup } from '../../popups';
import { slotApiClient } from '../../../utils/apiClient';
import { getScratchMathConfig, generateScratchHTML } from '../../../utils/scratch-export-utils';

const Step7_Export: React.FC = () => {
    const { config } = useGameStore();
    const { showSuccess } = useSuccessPopup();
    const { showWarning } = useWarningPopup();

    useEffect(() => {
        console.log("Step7_Export Mounted!");
    }, []);

    const [isSimulating, setIsSimulating] = useState(false);
    const [simStats, setSimStats] = useState<any>(null);

    // Publishing State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [certification, setCertification] = useState<{
        ticketId: string;
        hash: string;
        labName: string;
        timestamp: string;
    } | null>(null);
    const [deployStatus, setDeployStatus] = useState<{
        version: string;
        endpoint: string;
        deployedAt: string;
    } | null>(null);



    // Dynamic Rounds Calculation
    const mathMode = (config.scratch?.math?.mathMode || 'POOL') as 'POOL' | 'UNLIMITED';
    const targetRounds = mathMode === 'POOL'
        ? (config.scratch?.math?.totalTickets || 100000)
        : 2000000;

    const runSimulation = async () => {
        setIsSimulating(true);
        setSimStats(null);

        // Allow UI to update before locking
        await new Promise(r => setTimeout(r, 100));

        try {
            const { resolveRound } = await import('../../../utils/math-engine/scratch-resolver');
            let mathConfig = getScratchMathConfig(config as any);

            let totalWon = 0;
            let wins = 0;
            let maxWin = 0;
            const rounds = targetRounds;
            const batchSize = 25000; // Increased batch for speed vs responsiveness balance

            // Run Simulation
            for (let i = 0; i < rounds; i++) {
                const outcome = resolveRound(mathConfig, `sim_${i}_${Date.now()}`);
                totalWon += outcome.finalPrize; // Multiplier
                if (outcome.isWin) wins++;
                if (outcome.finalPrize > maxWin) maxWin = outcome.finalPrize;

                // Yield to main thread to prevent "Page Unresponsive"
                if (i % batchSize === 0 && i > 0) {
                    await new Promise(r => setTimeout(r, 0));
                }
            }

            const stats = {
                rtp: totalWon / rounds, // If prize is multiplier, then RTP is just Avg Prize
                hitRate: wins / rounds,
                maxWin: maxWin
            };

            setSimStats(stats);
            showSuccess('Simulation Complete', `Calculated RTP: ${(stats.rtp * 100).toFixed(1)}%`);

        } catch (error: any) {
            console.error(error);
            showWarning('Simulation Error', error.message || 'Check configuration');
        } finally {
            setIsSimulating(false);
        }
    };


    const handleDownloadConfig = async () => {
        console.log('\n🚀 ========== EXPORT STARTED ==========');
        console.log('Config object:', config);

        try {
            // Lazy load JSZip
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            const assetsFolder = zip.folder("assets");
            const assetMap = new Map<string, string>(); // Hash -> Filename
            const assetDataUriMap = new Map<string, string>(); // Path -> Base64 Data URI

            console.log('📁 ZIP initialized, starting asset processing...');

            // Helper: Convert Blob to Base64
            const blobToBase64 = (blob: Blob): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            };

            // Recursive helper to extract assets
            const processValue = async (value: any): Promise<any> => {
                if (typeof value === 'string') {
                    // Blob URL or Local Asset Path (e.g. /src/assets/...)
                    if (value.startsWith('blob:') || value.startsWith('/src/assets/') || value.startsWith('/assets/') || (value.includes('/assets/') && (value.endsWith('.png') || value.endsWith('.jpg') || value.endsWith('.mp3') || value.endsWith('.wav')))) {
                        try {
                            const response = await fetch(value);
                            if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
                            const blob = await response.blob();
                            const arrayBuffer = await blob.arrayBuffer();
                            const view = new Uint8Array(arrayBuffer);

                            // Determine Type & Ext
                            let ext = 'dat';
                            let prefix = 'asset_';
                            if (blob.type.includes('image')) {
                                prefix = 'img_';
                                ext = blob.type.split('/')[1] || 'png';
                                if (ext === 'svg+xml') ext = 'svg';
                            } else if (blob.type.includes('audio')) {
                                prefix = 'sfx_';
                                ext = blob.type.split('/')[1] === 'mpeg' ? 'mp3' : 'wav';
                            }

                            // Hash
                            let hash = 0;
                            for (let i = 0; i < Math.min(view.length, 1000); i++) hash = ((hash << 5) - hash) + view[i];
                            hash = (hash & hash) + view.length;

                            const filename = `${prefix}${Math.abs(hash)}.${ext}`;
                            const fullPath = `assets/${filename}`;

                            if (assetsFolder && !assetMap.has(filename)) {
                                assetsFolder.file(filename, arrayBuffer);
                                assetMap.set(filename, filename);

                                // Capture Base64 for HTML Embedding
                                const base64 = await blobToBase64(blob);
                                assetDataUriMap.set(fullPath, base64);
                            } else if (assetMap.has(filename)) {
                                // Ensure map has it even if already processed
                                if (!assetDataUriMap.has(fullPath)) {
                                    const base64 = await blobToBase64(blob);
                                    assetDataUriMap.set(fullPath, base64);
                                }
                            }
                            return fullPath;
                        } catch (e) {
                            console.warn(`Export Asset Fetch Failed: ${value}`, e);
                            return value;
                        }
                    }

                    // Base64 Image
                    if (value.startsWith('data:image')) {
                        const ext = value.split(';')[0].split('/')[1] || 'png';
                        const base64Data = value.split(',')[1];
                        // Simple hash
                        let hash = 0;
                        for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash) + value.charCodeAt(i);
                        hash = hash & hash;
                        const filename = `img_${Math.abs(hash)}.${ext}`;
                        const fullPath = `assets/${filename}`;

                        if (assetsFolder && !assetMap.has(filename)) {
                            assetsFolder.file(filename, base64Data, { base64: true });
                            assetMap.set(filename, filename);
                            assetDataUriMap.set(fullPath, value); // Store original Data URI
                        } else {
                            assetDataUriMap.set(fullPath, value);
                        }
                        return fullPath;
                    }
                    // Base64 Audio
                    if (value.startsWith('data:audio')) {
                        const ext = value.split(';')[0].split('/')[1] === 'mpeg' ? 'mp3' : 'wav';
                        const base64Data = value.split(',')[1];
                        let hash = 0;
                        for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash) + value.charCodeAt(i);
                        hash = hash & hash;
                        const filename = `sfx_${Math.abs(hash)}.${ext}`;
                        const fullPath = `assets/${filename}`;

                        if (assetsFolder && !assetMap.has(filename)) {
                            assetsFolder.file(filename, base64Data, { base64: true });
                            assetMap.set(filename, filename);
                            assetDataUriMap.set(fullPath, value); // Store original Data URI
                        } else {
                            assetDataUriMap.set(fullPath, value);
                        }
                        return fullPath;
                    }
                    return value;
                } else if (Array.isArray(value)) {
                    return Promise.all(value.map(item => processValue(item)));
                } else if (typeof value === 'object' && value !== null) {
                    const newObj: any = {};
                    for (const key in value) {
                        newObj[key] = await processValue(value[key]);
                    }
                    return newObj;
                }
                return value;
            };

            // 1. Process Main Config
            // We operate on the FULL scratch config to ensure all values are present
            const fullConfig = {
                ...config,
                scratch: config.scratch || {},
                marketing: config.marketing,
                theme: config.theme,
                // These are usually in top-level but ensuring parity
                displayName: config.displayName,
                gameId: config.gameId,
                rtp: config.rtp,
                volatility: config.volatility,
                bet: config.bet,
                audio: config.audio,
                splashScreen: config.splashScreen,
                gameRules: config.gameRules,
                localization: config.localization
            };
            // Deep clone to avoid mutating store during traversal
            const cleanConfig = await processValue(JSON.parse(JSON.stringify(fullConfig)));

            console.log('✨ processValue complete');
            console.log('cleanConfig.scratch.prizes:', cleanConfig.scratch?.prizes);
            console.log('cleanConfig.scratch.layers:', cleanConfig.scratch?.layers);
            console.log('cleanConfig.scratch.layers.scene:', cleanConfig.scratch?.layers?.scene);
            console.log('cleanConfig.scratch.layers.surface:', cleanConfig.scratch?.layers?.surface);
            console.log('cleanConfig.scratch.layers.card:', cleanConfig.scratch?.layers?.card);
            console.log('cleanConfig.scratch.layers.overlay:', cleanConfig.scratch?.layers?.overlay);
            console.log('cleanConfig.scratch.layers.foil:', cleanConfig.scratch?.layers?.foil);
            console.log('cleanConfig.scratch.mascot:', cleanConfig.scratch?.mascot);
            console.log('cleanConfig.scratch.brush:', cleanConfig.scratch?.brush);
            console.log('cleanConfig.scratch.logo:', cleanConfig.scratch?.logo);
            console.log('cleanConfig.scratch.sounds:', cleanConfig.scratch?.sounds);
            console.log('cleanConfig.scratch.audio:', cleanConfig.scratch?.audio);
            console.log('cleanConfig.theme:', cleanConfig.theme);
            console.log('cleanConfig.theme.logo:', cleanConfig.theme?.logo);

            zip.file("project_scratch.json", JSON.stringify(cleanConfig, null, 2));

            // 2. Math Config (Strict Rules)
            const mathConfig = getScratchMathConfig(config as any);
            zip.file("math.json", JSON.stringify(mathConfig, null, 2));

            // 3. Simple Visuals export (subset of cleanConfig)
            const visualExport = {
                ...cleanConfig,
                math: undefined, // Remove math derived data from visuals
                mechanic: undefined // Remove mechanic settings from visuals
            };
            zip.file("visuals.json", JSON.stringify(visualExport, null, 2));

            // 4. Generate HTML Playable/Preview (self-contained: Base64 assets + theme.generated for CORS-free file://)
            const createEmbeddedConfig = (obj: any): any => {
                if (typeof obj === 'string') {
                    if (assetDataUriMap.has(obj)) return assetDataUriMap.get(obj);
                    return obj;
                } else if (Array.isArray(obj)) {
                    return obj.map(item => createEmbeddedConfig(item));
                } else if (typeof obj === 'object' && obj !== null) {
                    const newObj: any = {};
                    for (const key in obj) newObj[key] = createEmbeddedConfig(obj[key]);
                    return newObj;
                }
                return obj;
            };
            const embeddedConfig = createEmbeddedConfig(cleanConfig);

            console.log('\n🔄 Creating symbol map...');
            console.log('embeddedConfig.scratch:', embeddedConfig.scratch);
            console.log('embeddedConfig.scratch?.prizes:', embeddedConfig.scratch?.prizes);

            const symbolMap: Record<string, string> = {};
            // FIX: prizes are in scratch.prizes, not at root level
            const prizes = embeddedConfig.scratch?.prizes || embeddedConfig.prizes || [];
            console.log(`Found ${prizes.length} prizes`);

            // DEBUG: Show first prize structure
            if (prizes.length > 0) {
                console.log('First prize structure:', prizes[0]);
                console.log('Prize keys:', Object.keys(prizes[0]));
            }

            // Get symbols collection - this contains metadata, NOT images
            const symbolsCollection = embeddedConfig.scratch?.symbols || {};
            console.log('Symbols collection keys:', Object.keys(symbolsCollection));

            prizes.forEach((p: any, index: number) => {
                // CRITICAL FIX: symbolId IS the base64 image itself, not a reference!
                const symbolId = p?.symbolId;

                if (p?.id && symbolId) {
                    // Use symbolId directly as the image value
                    symbolMap[p.id] = symbolId;
                    const preview = typeof symbolId === 'string' ? symbolId.substring(0, 50) : symbolId;
                    console.log(`  ✓ Symbol ${index + 1}: ${p.id} → ${preview}...`);
                } else {
                    console.log(`  ✗ Prize ${index + 1}: id=${p?.id}, hasSymbolId=${!!symbolId}`);
                }
            });

            console.log('Symbol map created:', Object.keys(symbolMap));



            // Correct asset mapping for HTML template
            const mascotImage = embeddedConfig.scratch?.mascot?.image;
            const frameImage = embeddedConfig.scratch?.layers?.overlay?.image;
            const foilImage = embeddedConfig.scratch?.layers?.foil?.image;
            const foilTexture = embeddedConfig.scratch?.layers?.foil?.texture; // e.g., 'platinum', 'gold'

            if (embeddedConfig.scratch?.layers) {
                // Ensure frame is in overlay
                if (frameImage) {
                    embeddedConfig.scratch.layers.overlay = {
                        ...embeddedConfig.scratch.layers.overlay,
                        image: frameImage
                    };
                }

                // Ensure scratch cover (foil) is in surface
                if (!embeddedConfig.scratch.layers.surface) {
                    embeddedConfig.scratch.layers.surface = {};
                }
                embeddedConfig.scratch.layers.surface.value = foilImage || foilTexture || 'foil';
            }

            const configForHtml = {
                ...embeddedConfig,
                scratch: embeddedConfig.scratch || embeddedConfig,
                theme: {
                    generated: {
                        background: embeddedConfig.scratch?.layers?.scene?.value || embeddedConfig.layers?.scene?.value || (embeddedConfig as any).background?.image,
                        symbols: symbolMap,
                        surface: embeddedConfig.scratch?.layers?.surface?.value,
                        frame: frameImage,
                        mascot: mascotImage,
                        logo: embeddedConfig.scratch?.logo?.image
                    }
                }
            };

            console.log('configForHtml.theme.generated.symbols:', Object.keys(configForHtml.theme.generated.symbols));
            console.log('configForHtml.theme.generated.background:', configForHtml.theme.generated.background?.substring(0, 50));

            // COMPREHENSIVE ASSET VERIFICATION
            console.log('\n🔍 ========== ASSET VERIFICATION ==========');

            // 1. Background
            const bgValue = configForHtml.theme.generated.background;
            console.log('✓ Background:', bgValue ? (bgValue.startsWith?.('data:') ? '✅ Base64 embedded' : `⚠️ Path: ${bgValue}`) : '❌ Missing');

            // 2. Symbols
            console.log(`✓ Symbols: ${Object.keys(symbolMap).length} symbols`);
            Object.entries(symbolMap).forEach(([id, path]: [string, any]) => {
                const isBase64 = path?.startsWith?.('data:');
                console.log(`  ${id}: ${isBase64 ? '✅ Base64' : `⚠️ ${path}`}`);
            });

            // 3. Surface (Scratch Cover)
            const surfaceValue = configForHtml.theme.generated.surface;
            console.log('✓ Scratch Surface:', surfaceValue ? (surfaceValue.startsWith?.('data:') ? '✅ Base64 embedded' : `⚠️ Value: ${surfaceValue}`) : '❌ Missing');

            // 4. Frame (Persistent Overlay)
            const frameValue = configForHtml.theme.generated.frame;
            console.log('✓ Card Frame:', frameValue ? (frameValue.startsWith?.('data:') ? '✅ Base64 embedded' : `⚠️ Path: ${frameValue}`) : '❌ Missing');

            // 5. Mascot
            const mascotValue = configForHtml.theme.generated.mascot;
            console.log('✓ Mascot:', mascotValue ? (mascotValue.startsWith?.('data:') ? '✅ Base64 embedded' : `⚠️ Path: ${mascotValue}`) : '❌ Missing');

            // 6. Brush settings
            const brushValue = embeddedConfig.scratch?.brush;
            console.log('✓ Brush:', brushValue ? `✅ Configured (${brushValue.tipType}, size: ${brushValue.size})` : '❌ Missing');

            // 7. Sounds - check scratch.audio
            const audioSounds = embeddedConfig.scratch?.audio || {};
            const soundEntries = Object.entries(audioSounds).filter(([key]) => key !== 'isGenerating');
            console.log(`✓ Sounds: ${soundEntries.length} sound effects`);
            soundEntries.forEach(([key, value]: [string, any]) => {
                const isBase64 = value?.startsWith?.('data:');
                console.log(`  ${key}: ${isBase64 ? '✅ Base64' : `⚠️ ${value}`}`);
            });

            // 8. Logo
            const logoValue = embeddedConfig.scratch?.logo?.image;
            console.log('✓ Logo:', logoValue ? (logoValue.startsWith?.('data:') ? '✅ Base64 embedded' : `⚠️ Path: ${logoValue}`) : '❌ Missing');

            console.log('==========================================\n');

            const htmlContent = generateScratchHTML(configForHtml);
            zip.file("index.html", htmlContent);



            // Generate ZIP
            const blob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(blob);

            // Download
            const link = document.createElement('a');
            link.href = url;
            link.download = `${config.gameId || "game"}_bundle.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log('\n✅ ========== EXPORT COMPLETE ==========');
            console.log(`📦 Total assets in ZIP: ${assetMap.size}`);
            console.log(`🎯 Total assets in base64 map: ${assetDataUriMap.size}`);
            console.log('Asset map keys:', Array.from(assetDataUriMap.keys()));
            console.log('=========================================\n');

            showSuccess('Export Complete', `Bundle downloaded with ${assetMap.size} assets`);
        } catch (e: any) {
            console.error('❌ EXPORT FAILED:', e);
            console.error('Stack trace:', e.stack);
            showWarning('Export Failed', e.message);
        }
    };


    const submitToLab = async () => {
        if (!simStats) return;
        setIsSubmitting(true);
        // Mock API call for Lab
        setTimeout(() => {
            setCertification({
                ticketId: `TKT-${Math.floor(Math.random() * 10000)}`,
                hash: `0x${Math.random().toString(16).slice(2)}...`,
                labName: 'GLI',
                timestamp: new Date().toISOString()
            });
            setIsSubmitting(false);
            showSuccess('Submission Successful', 'Certified by Lab');
        }, 1500);
    };

    const deployToRGS = async () => {
        if (!certification) return;
        setIsDeploying(true);

        try {
            // 1. Force Save to ensure Workshop Draft is up to date (Critical for Math Mode)
            await slotApiClient.saveToWorkshop(config.gameId || 'scratch_demo', config as any);

            // 2. Publish (Backend reads from Draft)
            const response = await slotApiClient.publishToRGS(
                config.gameId || 'scratch_demo',
                certification.ticketId
            );

            if (response.success) {
                setDeployStatus({
                    version: response.version,
                    endpoint: response.endpoint,
                    deployedAt: response.deployedAt
                });
                showSuccess('Deployment Complete', 'Game is live on Staging RGS');
            }
        } catch (error) {
            console.error(error);
            showWarning('Deployment Failed', 'RGS Handshake Error');
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 bg-white min-h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-gray-900">Final Validation & Export</h2>
                    <p className="text-gray-500">Validate your math model and submit the package.</p>
                </div>
                <button
                    onClick={handleDownloadConfig}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                    <FileJson size={18} />
                    <span>Download Config</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. Validation Panel */}
                <motion.div
                    className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl shadow-red-900/5 space-y-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <Activity className="text-red-600" size={24} />
                        <h3 className="text-xl font-bold text-gray-900">Math Validation</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100">
                            <p className="mb-2">Target RTP: <span className="text-gray-900 font-bold font-mono">{((config.scratch?.math?.rtp || 0.96) * 100).toFixed(1)}%</span></p>
                            <p>Simulation Rounds: <span className="text-gray-900 font-bold font-mono">{targetRounds.toLocaleString()}</span></p>
                        </div>

                        {simStats && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200 shadow-sm">
                                    <span className="text-gray-500">Observed RTP</span>
                                    <span className={`font-mono font-bold ${Math.abs(simStats.rtp - (config.scratch?.math?.rtp || 0.96)) < 0.05 ? 'text-green-600' : 'text-red-600'}`}>
                                        {(simStats.rtp * 100).toFixed(2)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200 shadow-sm">
                                    <span className="text-gray-500">Hit Rate</span>
                                    <span className="font-mono font-bold text-gray-900">
                                        {(simStats.hitRate * 100).toFixed(2)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white rounded border border-gray-200 shadow-sm">
                                    <span className="text-gray-500">Max Win</span>
                                    <span className="font-mono font-bold text-yellow-600">
                                        {simStats.maxWin}x
                                    </span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={runSimulation}
                            disabled={isSimulating || !!certification}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isSimulating || certification ? 'bg-gray-100 text-gray-400' : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
                                }`}
                        >
                            {isSimulating ? (
                                <>Simulating...</>
                            ) : certification ? (
                                <><CheckCircle size={20} /> Validation Locked</>
                            ) : (
                                <><Play size={20} /> Run Monte Carlo Simulation</>
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* 2. Publishing Panel */}
                <motion.div
                    className="bg-white rounded-2xl p-6 border border-gray-200 space-y-6 shadow-xl shadow-red-900/5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <ShieldCheck className={certification ? "text-green-600" : "text-gray-400"} size={24} />
                        <h3 className="text-xl font-bold text-gray-900">Certification & Deploy</h3>
                    </div>

                    {!certification ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                                <Send className="text-blue-500 shrink-0 mt-0.5" size={18} />
                                <p className="text-xs text-blue-700/80">
                                    Submit your validated game package directly to the lab for certification. This process is automated and tamper-proof.
                                </p>
                            </div>

                            <button
                                onClick={submitToLab}
                                disabled={!simStats || isSubmitting}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${!simStats || isSubmitting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                                    }`}
                            >
                                {isSubmitting ? 'Sending to Lab...' : 'Submit to Lab'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-50 border border-green-100 rounded-lg space-y-2">
                                <div className="flex items-center gap-2 text-green-700 font-bold">
                                    <ShieldCheck size={18} />
                                    <span>Certified by {certification.labName}</span>
                                </div>
                                <div className="text-xs text-green-800/70 font-mono break-all">
                                    Ticket: {certification.ticketId}
                                </div>
                                <div className="text-xs text-green-800/70 font-mono break-all">
                                    Hash: {certification.hash.substring(0, 24)}...
                                </div>
                            </div>

                            {!deployStatus ? (
                                <button
                                    onClick={deployToRGS}
                                    disabled={isDeploying}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isDeploying ? 'bg-gray-100 text-gray-400' : 'bg-gray-900 hover:bg-black text-white shadow-lg shadow-gray-900/20'
                                        }`}
                                >
                                    {isDeploying ? 'Deploying...' : (
                                        <><Server size={20} /> Deploy to Staging RGS</>
                                    )}
                                </button>
                            ) : (
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2 text-center">
                                    <div className="flex items-center justify-center gap-2 text-gray-900 font-bold">
                                        <Server size={18} className="text-green-600" />
                                        <span>Live on RGS</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Version: {deployStatus.version}</p>
                                    <a href="#" className="text-xs text-blue-600 hover:underline block truncate">
                                        {deployStatus.endpoint}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Step7_Export;
