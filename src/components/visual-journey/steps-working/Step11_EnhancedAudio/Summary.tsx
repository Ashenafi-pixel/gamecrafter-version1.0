import React from "react";
import { motion } from 'framer-motion';
import { Check, FileText, FileArchive } from "lucide-react";
import { packs } from "./data";
import { useGameStore } from "../../../../store";
import type { SoundItemKey, Answer, ThemePreset, QualityPreset } from "./types";

interface SummaryProps {
  answers: Record<SoundItemKey, Answer | undefined>;
  themePreset: ThemePreset;
  qualityPreset: QualityPreset;
}

export const Summary: React.FC<SummaryProps> = ({ 
  answers, 
  themePreset, 
  qualityPreset 
}) => {
  const audioFiles = useGameStore((state) => state.audioFiles);
  const allAnswers = Object.values(answers).filter(Boolean);
  const totalItems = packs.reduce((sum, pack) => sum + pack.items.length, 0);
  const completedItems = allAnswers.length;
  const completionRate = Math.round((completedItems / totalItems) * 100);
  const hasIssuesCount = allAnswers.filter(answer => answer?.hasIssues).length;
  const generatedCount = allAnswers.filter(answer => answer?.sourceType === 'generated').length;
  const uploadedCount = allAnswers.filter(answer => answer?.sourceType === 'uploaded').length;

  const downloadJSON = () => {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        themePreset,
        qualityPreset,
        totalItems,
        completedItems,
        completionRate: `${completionRate}%`,
        generatedCount,
        uploadedCount,
        hasIssuesCount
      },
      answers: Object.entries(answers).reduce((acc, [key, answer]) => {
        if (answer) {
          acc[key] = {
            sourceType: answer.sourceType,
            ...(answer.prompt && { prompt: answer.prompt }),
            ...(answer.fileName && { fileName: answer.fileName }),
            ...(answer.lufs !== undefined && { lufs: answer.lufs }),
            ...(answer.sr && { sr: answer.sr }),
            ...(answer.dur && { dur: answer.dur }),
            ...(answer.hasIssues !== undefined && { hasIssues: answer.hasIssues })
          };
        }
        return acc;
      }, {} as Record<string, any>),
      packs: packs.map(pack => ({
        key: pack.key,
        title: pack.title,
        items: pack.items.map(item => ({
          key: item.key,
          label: item.label,
          completed: !!answers[item.key]
        }))
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slotai-audio-config-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadZIP = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add JSON config
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          themePreset,
          qualityPreset,
          totalItems,
          completedItems,
          completionRate: `${completionRate}%`,
          generatedCount,
          uploadedCount,
          hasIssuesCount
        },
        answers: Object.entries(answers).reduce((acc, [key, answer]) => {
          if (answer) {
            acc[key] = {
              sourceType: answer.sourceType,
              ...(answer.prompt && { prompt: answer.prompt }),
              ...(answer.fileName && { fileName: answer.fileName }),
              ...(answer.lufs !== undefined && { lufs: answer.lufs }),
              ...(answer.sr && { sr: answer.sr }),
              ...(answer.dur && { dur: answer.dur }),
              ...(answer.hasIssues !== undefined && { hasIssues: answer.hasIssues })
            };
          }
          return acc;
        }, {} as Record<string, any>)
      };
      zip.file('config.json', JSON.stringify(exportData, null, 2));

      // Add audio files from store
      const categories = ['background', 'reels', 'ui', 'wins', 'bonus', 'features', 'ambience'];
      for (const category of categories) {
        const categoryFiles = audioFiles[category as keyof typeof audioFiles];
        if (categoryFiles && Object.keys(categoryFiles).length > 0) {
          const folder = zip.folder(category);
          for (const [name, fileData] of Object.entries(categoryFiles)) {
            if (fileData.audioData) {
              folder?.file(`${name}.mp3`, fileData.audioData);
            }
          }
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `slotai-audio-pack-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to create ZIP:', error);
      alert('Failed to create ZIP file. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-32"
    >
      {/* Header */}
      <div className="border rounded-lg p-6 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-green-100 text-green-600">
            <Check className="h-5 w-5 uw:h-8 uw:w-8" />
          </div>
          <h2 className="text-xl uw:text-3xl font-bold">Sound Pack Complete!</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl uw:text-3xl font-bold text-red-600">{completedItems}</div>
            <div className="text-sm uw:text-xl text-gray-500">Items Complete</div>
          </div>
          <div className="text-center">
            <div className="text-2xl uw:text-3xl font-bold text-green-600">{completionRate}%</div>
            <div className="text-sm uw:text-xl text-gray-500">Completion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl uw:text-3xl font-bold text-blue-600">{generatedCount}</div>
            <div className="text-sm uw:text-xl text-gray-500">Generated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl uw:text-3xl font-bold text-purple-600">{uploadedCount}</div>
            <div className="text-sm uw:text-xl text-gray-500">Uploaded</div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="px-3 py-1 border rounded text-sm uw:text-2xl">Theme: {themePreset}</div>
          <div className="px-3 py-1 border rounded text-sm uw:text-2xl">Quality: {qualityPreset}</div>
          {hasIssuesCount > 0 && (
            <div className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm">
              {hasIssuesCount} issue{hasIssuesCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Pack Cohesion Analysis */}
      <div className="border rounded-lg p-6 bg-white">
        <h3 className="text-lg uw:text-3xl font-bold mb-4">Pack Cohesion Analysis</h3>
        <div className="grid gap-4">
          {packs.map((pack) => {
            const packItems = pack.items.filter(item => answers[item.key]);
            const packProgress = Math.round((packItems.length / pack.items.length) * 100);
            
            return (
              <div
                key={pack.key}
                className={`flex items-center justify-between p-4 rounded-lg border uw:text-2xl ${
                  packProgress === 100
                    ? "border-green-200 bg-green-50"
                    : "border-orange-200 bg-orange-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    {pack.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{pack.title}</h4>
                    <p className="text-sm uw:text-xl text-gray-500">
                      {packItems.length} / {pack.items.length} items
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {packProgress === 100 ? (
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm uw:text-xl flex items-center gap-1">
                      <Check className="h-3 w-3 uw:h-6 uw:w-6 " />
                      Complete
                    </div>
                  ) : (
                    <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-sm uw:text-xl">
                      {packProgress}% Complete
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Actions */}
      <div className="border rounded-lg p-6 bg-white">
        <h3 className="text-lg uw:text-3xl font-bold mb-4">Export Your Sound Pack</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={downloadJSON}
            className="h-auto p-4 border rounded-lg flex flex-col items-start hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="font-medium uw:text-2xl">Export Configuration</span>
            </div>
            <p className="text-sm uw:text-xl text-gray-600 text-left">
              Download JSON config with prompts and audio analysis data
            </p>
          </button>

          <button 
            onClick={downloadZIP}
            className="h-auto p-4 bg-red-600 text-white rounded-lg flex flex-col items-start hover:bg-red-700 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileArchive className="h-5 w-5" />
              <span className="font-medium uw:text-2xl ">Export Audio Pack</span>
            </div>
            <p className="text-sm uw:text-xl text-whitered-100 text-left">
              Download ZIP file with all generated and uploaded audio files
            </p>
          </button>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2 uw:text-3xl">What's included:</h4>
          <ul className="text-sm text-gray-600 space-y-1 uw:text-xl">
            <li>• All {completedItems} generated and uploaded audio files</li>
            <li>• Configuration JSON with prompts and metadata</li>
            <li>• Audio analysis data (LUFS, BPM, key signatures)</li>
            <li>• Pack cohesion report</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};