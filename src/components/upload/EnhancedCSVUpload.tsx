import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, X, AlertCircle, Loader2, Database, Trash2, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parse } from 'papaparse';
import CSVManager from '@/csvManager';
import { CSVTradeData } from '@/csvManager';

interface ParsedTrade {
  id?: string;
  date?: string;
  pair?: string;
  direction?: string;
  entry?: string;
  exit?: string;
  positionSize?: string;
  result?: string;
  rr?: string;
  ruleViolation?: string;
  notes?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
  duplicates: number;
}

interface DataSummary {
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  pairs: string[];
  directions: string[];
}

const IMPORTED_FILES_KEY = 'tradient_imported_filenames';

function getImportedFilenames(): Set<string> {
  try {
    const raw = localStorage.getItem(IMPORTED_FILES_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function saveImportedFilename(filename: string): void {
  try {
    const existing = getImportedFilenames();
    existing.add(filename);
    localStorage.setItem(IMPORTED_FILES_KEY, JSON.stringify([...existing]));
  } catch { /* ignore */ }
}

export default function EnhancedCSVUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [parsedData, setParsedData] = useState<ParsedTrade[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [hasImported, setHasImported] = useState(false);
  const [isDuplicateFile, setIsDuplicateFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_VALIDATION_MESSAGES = 50;

  const validateCSVData = useCallback((trades: CSVTradeData[]): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let isValid = true;
    let duplicates = 0;
    let errorCount = 0;
    let warningCount = 0;

    if (trades.length === 0) {
      errors.push('CSV mapping resulted in an empty dataset');
      return { isValid: false, errors, warnings, rowCount: 0, duplicates };
    }

    const tradeIds = new Set<string>();
    
    // Check constraints on the heuristically converted trades
    for (let index = 0; index < trades.length; index++) {
      const row = trades[index];

      // Stop collecting messages if we've hit the cap
      if (errorCount >= MAX_VALIDATION_MESSAGES && warningCount >= MAX_VALIDATION_MESSAGES) break;

      if (row.id && tradeIds.has(row.id)) {
        duplicates++;
        if (warningCount < MAX_VALIDATION_MESSAGES) {
          warnings.push(`Row ${index + 1}: Duplicate trade ID: ${row.id}`);
          warningCount++;
        }
      } else if (row.id) {
        tradeIds.add(row.id);
      }

      if (row.pair === 'UNKNOWN' && errorCount < MAX_VALIDATION_MESSAGES) {
        errors.push(`Row ${index + 1}: Unable to map Pair/Symbol. Please ensure column exists.`);
        errorCount++;
        isValid = false;
      }
    }

    if (errorCount >= MAX_VALIDATION_MESSAGES) {
      errors.push(`... and more errors (showing first ${MAX_VALIDATION_MESSAGES})`);
    }
    if (warningCount >= MAX_VALIDATION_MESSAGES) {
      warnings.push(`... and more warnings (showing first ${MAX_VALIDATION_MESSAGES})`);
    }

    return {
      isValid,
      errors,
      warnings,
      rowCount: trades.length,
      duplicates
    };
  }, []);

  /** Convert and heuristically map any CSV format to typed trades */
  const convertToTrades = useCallback((data: any[]): CSVTradeData[] => {
    const KEYWORD_MAP = {
      date: ['date', 'time', 'opened', 'open_time', 'opentime', 'datetime', 'timestamp'],
      pair: ['pair', 'symbol', 'asset', 'instrument', 'item', 'ticker'],
      direction: ['direction', 'type', 'side', 'action', 'position', 'order_type'],
      entry: ['entry', 'price', 'open_price', 'openprice', 'entry_price', 'avg_price'],
      exit: ['exit', 'close', 'close_price', 'closeprice', 'exit_price', 'close_rate'],
      positionSize: ['size', 'volume', 'lots', 'quantity', 'qty', 'amount'],
      result: ['result', 'profit', 'pnl', 'net', 'net_profit', 'pl', 'realized'],
      rr: ['rr', 'risk_reward', 'risk/reward', 'r/r', 'risk'],
      ruleViolation: ['violation', 'mistake', 'error', 'rule'],
      notes: ['notes', 'comment', 'reason', 'tags']
    };

    let lastDate = new Date().toISOString().split('T')[0];
    let lastPair = '';
    let lastSize = 0.01;

    return data.map((rawRow, index) => {
      const normalized: any = {};
      const rawKeys = Object.keys(rawRow);
      
      // Heuristic Map
      for (const [targetKey, keywords] of Object.entries(KEYWORD_MAP)) {
         const matchedKey = rawKeys.find(key => 
           keywords.some(k => key.toLowerCase().replace(/[^a-z0-9]/g, '').includes(k.replace(/[^a-z0-9]/g, '')))
         );
         if (matchedKey) {
           normalized[targetKey] = rawRow[matchedKey];
         }
      }

      // Cleanup Strings mapped to Numbers
      const cleanNum = (val: any) => {
        if (val === undefined || val === null || val === '') return null;
        const cleaned = val.toString().replace(/[^0-9.-]/g, '');
        return cleaned ? parseFloat(cleaned) : null;
      };

      let entry = cleanNum(normalized.entry) || 0;
      let exit = cleanNum(normalized.exit) || 0;
      let result = cleanNum(normalized.result) || 0;
      let positionSize = cleanNum(normalized.positionSize);
      let rr = cleanNum(normalized.rr) || 0;

      // Infer Direction if missing
      let direction = 'long';
      if (normalized.direction) {
        const dirStr = normalized.direction.toString().toLowerCase();
        if (dirStr.includes('sell') || dirStr.includes('short')) direction = 'short';
      } else {
        if (entry > 0 && exit > 0) {
           if (result > 0) direction = exit > entry ? 'long' : 'short';
           else if (result < 0) direction = exit < entry ? 'long' : 'short';
        }
      }

      // Date Fallbacks
      let dateStr = normalized.date?.toString() || '';
      const dateMatch = dateStr.match(/\d{4}-\d{2}-\d{2}/);
      if (dateMatch) {
         lastDate = dateMatch[0];
      } else if (dateStr) {
         const d = new Date(dateStr);
         if (!isNaN(d.getTime())) lastDate = d.toISOString().split('T')[0];
      }

      // Pair Fallbacks
      if (normalized.pair) {
        lastPair = normalized.pair.toString().toUpperCase().trim();
      }

      // Size Fallbacks
      if (positionSize !== null && positionSize > 0) {
        lastSize = positionSize;
      } else {
        positionSize = lastSize;
      }

      return {
        id: rawRow.id || rawRow.ticket || rawRow.order || `TR-${Date.now()}-${index}`,
        date: lastDate,
        pair: lastPair || 'UNKNOWN',
        direction: direction as 'long' | 'short',
        entry,
        exit,
        positionSize,
        result,
        rr,
        ruleViolation: normalized.ruleViolation || null,
        notes: normalized.notes || ''
      };
    });
  }, []);

  const generateDataSummary = useCallback((trades: CSVTradeData[]): DataSummary | null => {
    if (trades.length === 0) return null;

    const totalTrades = trades.length;
    const totalPnL = trades.reduce((sum, trade) => sum + trade.result, 0);
    const winningTrades = trades.filter(t => t.result > 0);
    const losingTrades = trades.filter(t => t.result < 0);
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.result, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + t.result, 0) / losingTrades.length : 0;
    
    const pairs = [...new Set(trades.map(t => t.pair))];
    const directions = [...new Set(trades.map(t => t.direction))];

    return {
      totalTrades,
      totalPnL,
      winRate,
      avgWin,
      avgLoss,
      pairs,
      directions
    };
  }, []);

  const handleFileSelect = useCallback((selectedFile: File, forceImport = false) => {
    if (selectedFile && selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setValidationResult({
        isValid: false,
        errors: ['Please select a valid CSV file'],
        warnings: [],
        rowCount: 0,
        duplicates: 0
      });
      return;
    }

    // Check for duplicate filename
    const importedNames = getImportedFilenames();
    const isDup = importedNames.has(selectedFile.name);
    setIsDuplicateFile(isDup && !forceImport);

    setFile(selectedFile);
    setValidationResult(null);
    setParsedData([]);
    setDataSummary(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFile = useCallback(async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const text = await file.text();
      setUploadProgress(20);

      parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setUploadProgress(40);

          // First pass: Convert utilizing heuristic mapping algorithm
          const trades = convertToTrades(results.data);

          // Yield to UI thread before heavy validation
          setTimeout(() => {
            setUploadProgress(60);

            // Validate the automatically mapped data
            const validation = validateCSVData(trades);
            setValidationResult(validation);

            if (validation.isValid) {
              const summary = generateDataSummary(trades);
              setDataSummary(summary);
            }

            setUploadProgress(80);

            // Yield again before safely saving
            setTimeout(() => {
              if (validation.isValid) {
                const existingTrades = CSVManager.loadFromLocalStorage();

                // Avoid replacing or duplicating existing trades. Prevent ID clashes:
                const existingIds = new Set(existingTrades.map(t => t.id));
                const newUniqueTrades = trades.filter(t => !existingIds.has(t.id));

                // New trades should appear first (newest first)
                const mergedTrades = [...newUniqueTrades, ...existingTrades]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                // Save — CSVManager seamlessly dispatches the 'tradesUpdated' event
                CSVManager.saveToLocalStorage(mergedTrades);
                // Track this filename so we can warn on re-import
                if (file) saveImportedFilename(file.name);
                setHasImported(true);
                setIsDuplicateFile(false);
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
                setParsedData([]);

                setValidationResult({
                  isValid: true,
                  errors: [],
                  warnings: [`Successfully imported ${newUniqueTrades.length} new trades (${mergedTrades.length} total stored)`],
                  rowCount: newUniqueTrades.length,
                  duplicates: trades.length - newUniqueTrades.length,
                });
              }

              setUploadProgress(100);
              setIsUploading(false);
            }, 0);
          }, 0);
        },
        error: (error) => {
          setValidationResult({
            isValid: false,
            errors: [`CSV parsing error: ${error.message}`],
            warnings: [],
            rowCount: 0,
            duplicates: 0
          });
          setIsUploading(false);
          setUploadProgress(0);
        }
      });
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: [`File reading error: ${error}`],
        warnings: [],
        rowCount: 0,
        duplicates: 0
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [file, validateCSVData, generateDataSummary, convertToTrades]);

  const resetUpload = useCallback(() => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setValidationResult(null);
    setParsedData([]);
    setDataSummary(null);
    setUploadProgress(0);
    setIsUploading(false);
    setHasImported(false);
    setIsDuplicateFile(false);
  }, []);

  const clearUploadedData = useCallback(() => {
    localStorage.removeItem('tradient_trades_csv');
    resetUpload();
    
    // Single event dispatch
    window.dispatchEvent(new CustomEvent('tradesUpdated', {
      detail: { tradesCount: 0 }
    }));
    
    setValidationResult({
      isValid: true,
      errors: [],
      warnings: ['All uploaded data cleared. Using sample data.'],
      rowCount: 0,
      duplicates: 0
    });
  }, [resetUpload]);

  return (
    <Card className="glass-card border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Data Management</h3>
            <p className="text-sm text-muted-foreground">
              Import and manage your trading data
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import Data
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Manage Data
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6 mt-4">
            {hasImported ? (
              <div className="p-8 rounded-xl bg-success/10 border border-success/20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle className="h-10 w-10 text-success" />
                  <h4 className="text-lg font-semibold">Import complete</h4>
                  <p className="text-sm text-muted-foreground">Your CSV has been imported and your trades are now available in the dashboard and journal.</p>
                  <Button onClick={resetUpload} className="mt-2">
                    Import another file
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Upload Area */}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    isDragging 
                      ? 'border-primary bg-primary/5 scale-[1.02]' 
                      : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/10'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  
                  <div className="space-y-4">
                    <motion.div
                      animate={{ scale: isDragging ? 1.1 : 1 }}
                      className="mx-auto w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center"
                    >
                      <FileText className="h-8 w-8 text-primary" />
                    </motion.div>
                    
                    <div className="space-y-2">
                      <h4 className="text-lg font-semibold">
                        {file ? file.name : 'Drop your CSV file here'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {file 
                          ? `Size: ${(file.size / 1024).toFixed(1)} KB` 
                          : 'or click to browse'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Duplicate File Warning */}
            <AnimatePresence>
              {file && isDuplicateFile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                >
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                      This file was already imported
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                      <span className="font-mono font-medium">{file.name}</span> has been imported before. Importing again may create duplicates (existing trade IDs will be skipped).
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
                        onClick={() => handleFileSelect(file, true)}
                        disabled={isUploading}
                      >
                        Import Anyway
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={resetUpload}
                        disabled={isUploading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* File Actions */}
            <AnimatePresence>
              {file && !isDuplicateFile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={processFile}
                      disabled={isUploading}
                      className="flex items-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Process File
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={resetUpload}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress Bar */}
            <AnimatePresence>
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Validation Results */}
            <AnimatePresence>
              {validationResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {validationResult.isValid ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Valid
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Invalid
                      </Badge>
                    )}
                    
                    <span className="text-sm text-muted-foreground">
                      {validationResult.rowCount} trades found
                      {validationResult.duplicates > 0 && ` (${validationResult.duplicates} duplicates)`}
                    </span>
                  </div>

                  {/* Errors */}
                  {validationResult.errors.length > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <h5 className="font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Errors ({validationResult.errors.length})
                      </h5>
                      <ul className="space-y-1 text-sm text-red-700 dark:text-red-400">
                        {validationResult.errors.map((error, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-500 dark:text-red-400 mt-0.5">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {validationResult.warnings.length > 0 && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <h5 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Warnings ({validationResult.warnings.length})
                      </h5>
                      <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
                        {validationResult.warnings.map((warning, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-yellow-500 dark:text-yellow-400 mt-0.5">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Data Summary */}
                  {dataSummary && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                    >
                      <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">
                        Data Summary
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                            {dataSummary.totalTrades}
                          </div>
                          <div className="text-blue-700 dark:text-blue-500">Total Trades</div>
                        </div>
                        <div className="text-center">
                          <div className={`font-bold text-lg ${
                            dataSummary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${dataSummary.totalPnL.toFixed(2)}
                          </div>
                          <div className="text-blue-700 dark:text-blue-500">Total P&L</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                            {dataSummary.winRate.toFixed(1)}%
                          </div>
                          <div className="text-blue-700 dark:text-blue-500">Win Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                            ${dataSummary.avgWin.toFixed(2)}
                          </div>
                          <div className="text-blue-700 dark:text-blue-500">Avg Win</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                            ${dataSummary.avgLoss.toFixed(2)}
                          </div>
                          <div className="text-blue-700 dark:text-blue-500">Avg Loss</div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className="text-blue-700 dark:text-blue-500 font-medium">Pairs:</span>
                          {dataSummary.pairs.slice(0, 5).map(pair => (
                            <Badge key={pair} variant="outline" className="text-xs">
                              {pair}
                            </Badge>
                          ))}
                          {dataSummary.pairs.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{dataSummary.pairs.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sample Format */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h5 className="font-semibold mb-3">Expected CSV Format:</h5>
              <div className="text-xs font-mono bg-background p-3 rounded border overflow-x-auto">
                id,date,pair,direction,entry,exit,positionSize,result,rr,ruleViolation,notes
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Required fields: id, date, pair, direction, entry, exit
              </p>
            </div>
          </TabsContent>

          {/* Manage Data Tab */}
          <TabsContent value="manage" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Current Data Source</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div>
                        <h4 className="font-medium">Data Status</h4>
                        <p className="text-sm text-muted-foreground">
                          {localStorage.getItem('tradient_trades_csv') ? 'Using uploaded CSV data' : 'Using sample data'}
                        </p>
                      </div>
                      <Badge 
                        variant={localStorage.getItem('tradient_trades_csv') ? "default" : "secondary"}
                        className="ml-2"
                      >
                        {localStorage.getItem('tradient_trades_csv') ? 'Active' : 'Sample'}
                      </Badge>
                    </div>
                    
                  <div>
                    {localStorage.getItem('tradient_trades_csv') && (
                      <div className="text-sm text-muted-foreground">
                        <p>• All analytics are using your uploaded data</p>
                        <p>• Trade journal shows real trades</p>
                        <p>• You can switch back to sample data anytime</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      onClick={clearUploadedData}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Uploaded Data
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        const trades = CSVManager.loadFromLocalStorage();
                        if (trades.length > 0) {
                          CSVManager.downloadCSV(trades, `trading_data_${new Date().toISOString().split('T')[0]}.csv`);
                        }
                      }}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Current Data
                    </Button>
                  </div>
                </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Sample CSV Generator</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Download a sample CSV file with the correct format to use as a template for your data.
                    </p>
                    
                    <Button
                      onClick={() => {
                        const sampleData = [
                          {
                            id: 'TR-001',
                            date: '2025-01-15',
                            pair: 'EUR/USD',
                            direction: 'long' as const,
                            entry: 1.08567,
                            exit: 1.08923,
                            positionSize: 0.10,
                            result: 35.60,
                            rr: 1.8,
                            ruleViolation: null,
                            notes: 'Pullback trade during London session'
                          },
                          {
                            id: 'TR-002',
                            date: '2025-01-15',
                            pair: 'GBP/USD',
                            direction: 'short' as const,
                            entry: 1.26345,
                            exit: 1.26012,
                            positionSize: 0.15,
                            result: -49.95,
                            rr: 1.2,
                            ruleViolation: 'Late Entry',
                            notes: 'Breakout failure during NY session'
                          }
                        ];
                        
                        CSVManager.downloadCSV(sampleData, 'sample_trading_data.csv');
                      }}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Sample CSV
                    </Button>
                    
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Format Guide:</h5>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• <strong>id:</strong> Unique trade identifier</li>
                        <li>• <strong>date:</strong> Trade date (YYYY-MM-DD)</li>
                        <li>• <strong>pair:</strong> Currency pair (e.g., EUR/USD)</li>
                        <li>• <strong>direction:</strong> "long" or "short"</li>
                        <li>• <strong>entry/exit:</strong> Price levels</li>
                        <li>• <strong>result:</strong> Profit/Loss amount</li>
                        <li>• <strong>rr:</strong> Risk/Reward ratio</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
