import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../ui/Card';
import { Button } from '../../../../ui/UIButton';
import { Input } from '../../../../ui/Input';
import { useGameStore } from '../../../../../store';
import { getPaytableFields, getPaytableFieldLabel } from '../../../../../utils/paytableHelpers';
import type { SymbolPay } from '../types/math';

interface SymbolPaytableProps {
  symbolPaysState: SymbolPay[];
  expandedSections: Set<string>;
  toggleSection: (section: string) => void;
  updateSymbolPay: (symbolIndex: number, field: keyof SymbolPay, value: string) => void;
  saveSymbolPay: (symbolIndex: number, field: keyof SymbolPay, value: string) => void;
  tempPaytables: Record<number, Record<string, string>>;
  resetPaytable: () => void;
}

export function SymbolPaytable({ symbolPaysState, expandedSections, toggleSection, updateSymbolPay, saveSymbolPay, tempPaytables, resetPaytable }: SymbolPaytableProps) {
  const config = useGameStore((state) => state.config);
  const reelCount = config?.reels?.layout?.reels || 5;
  const paytableFields = getPaytableFields(reelCount);
  
  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => toggleSection('symbols')}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base uw:text-3xl flex items-center gap-2">
            Editable Symbol Paytable
          </CardTitle>
          {expandedSections.has('symbols') ? <ChevronUp className="h-4 w-4 uw:h-8 uw:w-8" /> : <ChevronDown className="h-4 w-4 uw:h-8 uw:w-8" />}
        </div>
        <CardDescription className="text-xs text-gray-500 flex items-center justify-between">
          <span>Click values to edit. Changes update RTP and hit rate in real-time</span>
        </CardDescription>
      </CardHeader>
      <AnimatePresence>
        {expandedSections.has('symbols') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className='flex items-center justify-end'>
            <Button
            variant="ghost"
            size="sm"
            onClick={resetPaytable}
            className="h-6 px-2 text-xs uw:text-3xl"
            title="Reset paytable to defaults"
          >
            <RotateCcw className="h-3 w-3 uw:h-8 uw:w-8 mr-1" />
            Reset Paytable
          </Button>
            </div>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm uw:text-2xl">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Symbol</th>
                      {paytableFields.map(field => (
                        <th key={field} className="py-2 ">{getPaytableFieldLabel(field)}</th>
                      ))}
                      <th className="text-right py-2">Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {symbolPaysState.map((symbol, index) => (
                      <tr key={symbol.symbol} className="border-b hover:bg-gray-50">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            {symbol.icon.startsWith('data:') || symbol.icon.startsWith('http') || symbol.icon.startsWith('/') || symbol.icon.startsWith('.') ? (
                              <img src={symbol.icon} alt={symbol.symbol} className="w-8 h-8 object-contain" />
                            ) : (
                              <span className="text-lg">{symbol.icon}</span>
                            )}
                            <span className="font-medium uw:text-2xl">{symbol.symbol}</span>
                          </div>
                        </td>
                        {paytableFields.map(field => (
                          <td key={field} className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={tempPaytables[index]?.[field] !== undefined ? tempPaytables[index][field] : (symbol[field] || 0)}
                              onChange={(e) => updateSymbolPay(index, field as keyof SymbolPay, e.target.value)}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                  saveSymbolPay(index, field as keyof SymbolPay, val.toFixed(2));
                                } else {
                                  saveSymbolPay(index, field as keyof SymbolPay, '0.00');
                                }
                              }}
                              className="w-16 text-right border rounded px-2 py-1  text-xs"
                            />
                          </td>
                        ))}
                        <td className="text-right">
                          <span className="text-gray-500 uw:text-2xl">{symbol.frequency}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
