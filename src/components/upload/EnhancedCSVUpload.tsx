import { useState, useCallback } from 'react';
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

export default function EnhancedCSVUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [parsedData, setParsedData] = useState<ParsedTrade[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);

  const MAX_VALIDATION_MESSAGES = 50;

  const validateCSVData = useCallback((data: ParsedTrade[]): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let isValid = true;
    let duplicates = 0;
    let errorCount = 0;
    let warningCount = 0;

    if (data.length === 0) {
      errors.push('CSV file is empty');
      return { isValid: false, errors, warnings, rowCount: 0, duplicates };
    }

    const tradeIds = new Set<string>();
    
    // Check required columns
    const requiredFields = ['id', 'date', 'pair', 'direction', 'entry', 'exit'];
    const firstRow = data[0];
    
    requiredFields.forEach(field => {
      if (!firstRow[field]) {
        errors.push(`Missing required column: ${field}`);
        isValid = false;
      }
    });

    // Validate data — cap messages to avoid DOM overload
    for (let index = 0; index < data.length; index++) {
      const row = data[index];
      if (index === 0) continue;

      // Stop collecting messages if we've hit the cap
      if (errorCount >= MAX_VALIDATION_MESSAGES && warningCount >= MAX_VALIDATION_MESSAGES) break;

      if (row.id && tradeIds.has(row.id)) {
        duplicates++;
        if (warningCount < MAX_VALIDATION_MESSAGES) {
          warnings.push(`Row ${index}: Duplicate trade ID: ${row.id}`);
          warningCount++;
        }
      } else if (row.id) {
        tradeIds.add(row.id);
      }

      if (!row.id && errorCount < MAX_VALIDATION_MESSAGES) {
        errors.push(`Row ${index}: Trade ID is required`);
        errorCount++;
        isValid = false;
      }

      if (!row.pair && errorCount < MAX_VALIDATION_MESSAGES) {
        errors.push(`Row ${index}: Pair is required`);
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
      rowCount: data.length - 1,
      duplicates
    };
  }, []);

  /** Convert parsed CSV rows to typed trade objects — done once and reused */
  const convertToTrades = useCallback((data: ParsedTrade[]): CSVTradeData[] => {
    return data.map(row => ({
      id: row.id || `TR-${Date.now()}`,
      date: row.date || new Date().toISOString().split('T')[0],
      pair: row.pair || '',
      direction: (row.direction || 'long') as 'long' | 'short',
      entry: parseFloat(row.entry || '0'),
      exit: parseFloat(row.exit || '0'),
      positionSize: parseFloat(row.positionSize || '0'),
      result: parseFloat(row.result || '0'),
      rr: parseFloat(row.rr || '0'),
      ruleViolation: row.ruleViolation || null,
      notes: row.notes || ''
    }));
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

  const handleFileSelect = useCallback((selectedFile: File) => {
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
          
          const data = results.data as ParsedTrade[];
          setParsedData(data);

          // Yield to UI thread before heavy validation
          setTimeout(() => {
            setUploadProgress(60);

            // Validate parsed data
            const validation = validateCSVData(data);
            setValidationResult(validation);

            // Convert once and reuse
            const trades = convertToTrades(data);
            
            if (validation.isValid) {
              const summary = generateDataSummary(trades);
              setDataSummary(summary);
            }
            
            setUploadProgress(80);

            // Yield again before save
            setTimeout(() => {
              if (validation.isValid) {
                // Load existing trades and merge
                const existingTrades = CSVManager.loadFromLocalStorage();
                const mergedTrades = [...existingTrades, ...trades];
                
                // Save — CSVManager dispatches the tradesUpdated event
                CSVManager.saveToLocalStorage(mergedTrades);
                
                setValidationResult({
                  isValid: true,
                  errors: [],
                  warnings: [`Successfully merged ${trades.length} new trades (${mergedTrades.length} total)`],
                  rowCount: trades.length,
                  duplicates: 0
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
    setValidationResult(null);
    setParsedData([]);
    setDataSummary(null);
    setUploadProgress(0);
    setIsUploading(false);
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

            {/* File Actions */}
            <AnimatePresence>
              {file && (
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
