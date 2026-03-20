import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Calendar, DollarSign, Target, AlertCircle, Clock, Globe, BarChart3, Shield, Brain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { CSVTradeData } from '@/csvManager';

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrade: (trade: CSVTradeData) => void;
  initialData?: CSVTradeData | null;
}

const currencyPairs = [
  { value: 'EUR/USD', label: 'EUR/USD', category: 'Major' },
  { value: 'GBP/USD', label: 'GBP/USD', category: 'Major' },
  { value: 'USD/JPY', label: 'USD/JPY', category: 'Major' },
  { value: 'USD/CHF', label: 'USD/CHF', category: 'Major' },
  { value: 'AUD/USD', label: 'AUD/USD', category: 'Major' },
  { value: 'NZD/USD', label: 'NZD/USD', category: 'Major' },
  { value: 'EUR/GBP', label: 'EUR/GBP', category: 'Cross' },
  { value: 'EUR/JPY', label: 'EUR/JPY', category: 'Cross' },
  { value: 'GBP/JPY', label: 'GBP/JPY', category: 'Cross' },
  { value: 'EUR/CHF', label: 'EUR/CHF', category: 'Cross' },
  { value: 'AUD/JPY', label: 'AUD/JPY', category: 'Cross' },
  { value: 'USD/CAD', label: 'USD/CAD', category: 'Major' },
  { value: 'AUD/CAD', label: 'AUD/CAD', category: 'Cross' },
  { value: 'NZD/JPY', label: 'NZD/JPY', category: 'Cross' },
  { value: 'GBP/CHF', label: 'GBP/CHF', category: 'Cross' }
];

const tradingSessions = [
  { value: 'london', label: 'London', icon: '🇬🇧' },
  { value: 'new-york', label: 'New York', icon: '🇺🇸' },
  { value: 'tokyo', label: 'Tokyo', icon: '🇯🇵' },
  { value: 'sydney', label: 'Sydney', icon: '🇦🇺' },
  { value: 'overlap', label: 'Overlap', icon: '⚡' }
];

const tradeSetups = [
  'Breakout', 'Support/Resistance', 'Trend Following', 'Counter-trend',
  'Range Trading', 'News Trading', 'Scalping', 'Swing Trading',
  'Technical Analysis', 'Fundamental Analysis', 'Price Action'
];

const ruleViolations = [
  'None',
  'Oversized Position',
  'No Stop Loss',
  'Traded During News',
  'Revenge Trade',
  'Early Entry',
  'Late Entry',
  'Early Exit',
  'Late Exit',
  'Moving Stop Loss',
  'Overtrading',
  'Against Trend',
  'No Trading Plan',
  'Emotional Trading'
];

const emotionalStates = [
  'Calm', 'Confident', 'Anxious', 'Fearful', 'Greedy', 'Patient', 'Impatient', 'Disciplined'
];

const marketConditions = [
  'Trending Up', 'Trending Down', 'Ranging', 'Volatile', 'Low Volume', 'High Volume'
];

export default function AddTradeModal({ isOpen, onClose, onAddTrade, initialData }: AddTradeModalProps) {
  const defaultFormData = {
    id: '',
    date: new Date().toISOString().split('T')[0],
    pair: '',
    direction: 'long' as 'long' | 'short',
    entry: 0,
    exit: 0,
    positionSize: 0,
    result: 0,
    rr: 0,
    ruleViolation: null as string | null,
    notes: '',
    session: 'london',
    setupType: '',
    emotionalState: 'Calm',
    marketCondition: 'Ranging',
    confidence: 70,
    timeHeld: '1-4 hours',
    commission: 0,
    swap: 0
  };

  const [formData, setFormData] = useState<CSVTradeData & typeof defaultFormData>(defaultFormData);

  // Update form fields if initialData is provided
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        ...defaultFormData,
        ...initialData
      });
    } else if (isOpen && !initialData) {
      setFormData(defaultFormData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.pair) newErrors.pair = 'Currency pair is required';
    if (!formData.entry || formData.entry <= 0) newErrors.entry = 'Valid entry price is required';
    if (!formData.exit || formData.exit <= 0) newErrors.exit = 'Valid exit price is required';
    if (!formData.positionSize || formData.positionSize <= 0) newErrors.positionSize = 'Valid position size is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateResult = () => {
    if (!formData.entry || !formData.exit || !formData.positionSize) return 0;
    
    const priceDiff = formData.direction === 'long' 
      ? formData.exit - formData.entry
      : formData.entry - formData.exit;
    
    return priceDiff * formData.positionSize * 100000 - formData.commission + formData.swap;
  };

  const calculateRR = () => {
    if (!formData.entry || !formData.exit || !formData.result) return 0;
    const riskAmount = formData.positionSize * 100000 * 0.01; // 1% risk
    return Math.abs(formData.result / riskAmount);
  };

  const calculatePips = () => {
    if (!formData.entry || !formData.exit) return 0;
    const diff = Math.abs(formData.exit - formData.entry);
    return formData.pair.includes('JPY') ? diff * 100 : diff * 10000;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const tradeData: CSVTradeData = {
      ...formData,
      id: initialData ? initialData.id : `TR-${Date.now()}`,
      result: calculateResult(),
      rr: calculateRR()
    };

    onAddTrade(tradeData);
    onClose();
    
    // Form is effectively reset in useEffect
  };

  const updateField = (field: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const estimatedResult = calculateResult();
  const estimatedRR = calculateRR();
  const pips = calculatePips();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card border-0 w-[95vw] sm:w-full mx-auto">
        <DialogHeader className="px-4 sm:px-6 pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl text-responsive-lg">
            <Target className="w-6 h-6 text-primary" />
            {initialData ? 'Edit Trade' : 'Add New Trade'}
            <Badge variant="secondary" className="ml-2">Advanced</Badge>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-4 sm:px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1">
              <TabsTrigger value="basic" className="flex items-center gap-2 text-xs sm:text-sm py-2 px-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Basic</span>
                <span className="sm:hidden">B</span>
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2 text-xs sm:text-sm py-2 px-2">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Advanced</span>
                <span className="sm:hidden">A</span>
              </TabsTrigger>
              <TabsTrigger value="psychology" className="flex items-center gap-2 text-xs sm:text-sm py-2 px-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Psychology</span>
                <span className="sm:hidden">P</span>
              </TabsTrigger>
              <TabsTrigger value="review" className="flex items-center gap-2 text-xs sm:text-sm py-2 px-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Review</span>
                <span className="sm:hidden">R</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Trade Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="date">Trade Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => updateField('date', e.target.value)}
                        className="glass-card border-0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="session">Trading Session</Label>
                      <Select value={formData.session} onValueChange={(value) => updateField('session', value)}>
                        <SelectTrigger className="glass-card border-0">
                          <SelectValue placeholder="Select session" />
                        </SelectTrigger>
                        <SelectContent>
                          {tradingSessions.map(session => (
                            <SelectItem key={session.value} value={session.value}>
                              <span className="flex items-center gap-2">
                                <span>{session.icon}</span>
                                {session.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="pair">Currency Pair</Label>
                      <Select value={formData.pair} onValueChange={(value) => updateField('pair', value)}>
                        <SelectTrigger className="glass-card border-0">
                          <SelectValue placeholder="Select pair" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="max-h-60 overflow-y-auto">
                            {['Major', 'Cross'].map(category => (
                              <div key={category}>
                                <div className="px-2 py-1 text-sm font-semibold text-muted-foreground sticky top-0 bg-background">
                                  {category}
                                </div>
                                {currencyPairs
                                  .filter(pair => pair.category === category)
                                  .map(pair => (
                                    <SelectItem key={pair.value} value={pair.value}>
                                      {pair.label}
                                    </SelectItem>
                                  ))}
                              </div>
                            ))}
                          </div>
                        </SelectContent>
                      </Select>
                      {errors.pair && <p className="text-sm text-destructive mt-1">{errors.pair}</p>}
                    </div>
                  </div>

                  <div>
                    <Label>Trade Direction</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <Button
                        type="button"
                        variant={formData.direction === 'long' ? 'default' : 'outline'}
                        onClick={() => updateField('direction', 'long')}
                        className="h-12 text-sm sm:text-base"
                      >
                        <TrendingUp className="w-5 h-5 mr-2" />
                        <span className="hidden sm:inline">Long (Buy)</span>
                        <span className="sm:hidden">Long</span>
                      </Button>
                      <Button
                        type="button"
                        variant={formData.direction === 'short' ? 'default' : 'outline'}
                        onClick={() => updateField('direction', 'short')}
                        className="h-12 text-sm sm:text-base"
                      >
                        <TrendingDown className="w-5 h-5 mr-2" />
                        <span className="hidden sm:inline">Short (Sell)</span>
                        <span className="sm:hidden">Short</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Price & Position
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="entryPrice">Entry Price</Label>
                      <Input
                        id="entryPrice"
                        type="number"
                        step="0.00001"
                        placeholder="1.08420"
                        value={formData.entry || ''}
                        onChange={(e) => updateField('entry', parseFloat(e.target.value) || 0)}
                        className="glass-card border-0 font-mono text-lg"
                      />
                      {errors.entry && <p className="text-sm text-destructive mt-1">{errors.entry}</p>}
                    </div>
                    <div>
                      <Label htmlFor="exitPrice">Exit Price</Label>
                      <Input
                        id="exitPrice"
                        type="number"
                        step="0.00001"
                        placeholder="1.08910"
                        value={formData.exit || ''}
                        onChange={(e) => updateField('exit', parseFloat(e.target.value) || 0)}
                        className="glass-card border-0 font-mono text-lg"
                      />
                      {errors.exit && <p className="text-sm text-destructive mt-1">{errors.exit}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="positionSize">Position Size (Lots)</Label>
                      <Input
                        id="positionSize"
                        type="number"
                        step="0.01"
                        placeholder="1.0"
                        value={formData.positionSize || ''}
                        onChange={(e) => updateField('positionSize', parseFloat(e.target.value) || 0)}
                        className="glass-card border-0 font-mono"
                      />
                      {errors.positionSize && <p className="text-sm text-destructive mt-1">{errors.positionSize}</p>}
                    </div>
                    <div>
                      <Label htmlFor="commission">Commission ($)</Label>
                      <Input
                        id="commission"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.commission || ''}
                        onChange={(e) => updateField('commission', parseFloat(e.target.value) || 0)}
                        className="glass-card border-0 font-mono"
                      />
                    </div>
                    <div>
                      <Label htmlFor="swap">Swap ($)</Label>
                      <Input
                        id="swap"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.swap || ''}
                        onChange={(e) => updateField('swap', parseFloat(e.target.value) || 0)}
                        className="glass-card border-0 font-mono"
                      />
                    </div>
                  </div>

                  {/* Real-time Calculations */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Pips</p>
                      <p className="text-xl font-bold font-mono">{pips.toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Est. Result</p>
                      <p className={`text-xl font-bold font-mono ${estimatedResult >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {estimatedResult >= 0 ? '+' : ''}${estimatedResult.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">R:R Ratio</p>
                      <p className="text-xl font-bold font-mono">1:{estimatedRR.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Risk %</p>
                      <p className="text-xl font-bold font-mono">{(formData.positionSize * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-6">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Advanced Trading Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="setupType">Trade Setup</Label>
                      <Select value={formData.setupType} onValueChange={(value) => updateField('setupType', value)}>
                        <SelectTrigger className="glass-card border-0">
                          <SelectValue placeholder="Select setup type" />
                        </SelectTrigger>
                        <SelectContent>
                          {tradeSetups.map(setup => (
                            <SelectItem key={setup} value={setup}>{setup}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="marketCondition">Market Condition</Label>
                      <Select value={formData.marketCondition} onValueChange={(value) => updateField('marketCondition', value)}>
                        <SelectTrigger className="glass-card border-0">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          {marketConditions.map(condition => (
                            <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="timeHeld">Time Held</Label>
                    <Select value={formData.timeHeld} onValueChange={(value) => updateField('timeHeld', value)}>
                      <SelectTrigger className="glass-card border-0">
                        <SelectValue placeholder="Select time held" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="< 1 hour">Less than 1 hour</SelectItem>
                        <SelectItem value="1-4 hours">1-4 hours</SelectItem>
                        <SelectItem value="4-8 hours">4-8 hours</SelectItem>
                        <SelectItem value="1 day">1 day</SelectItem>
                        <SelectItem value="2-3 days">2-3 days</SelectItem>
                        <SelectItem value="1 week">1 week</SelectItem>
                        <SelectItem value="> 1 week">More than 1 week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ruleViolation">Rule Violation</Label>
                    <Select value={formData.ruleViolation || ''} onValueChange={(value) => updateField('ruleViolation', value === 'None' ? null : value)}>
                      <SelectTrigger className="glass-card border-0">
                        <SelectValue placeholder="Select violation" />
                      </SelectTrigger>
                      <SelectContent>
                        {ruleViolations.map(violation => (
                          <SelectItem key={violation} value={violation}>{violation}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Psychology Tab */}
            <TabsContent value="psychology" className="space-y-6">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Trading Psychology
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="emotionalState">Emotional State</Label>
                    <Select value={formData.emotionalState} onValueChange={(value) => updateField('emotionalState', value)}>
                      <SelectTrigger className="glass-card border-0">
                        <SelectValue placeholder="Select emotional state" />
                      </SelectTrigger>
                      <SelectContent>
                        {emotionalStates.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Confidence Level: {formData.confidence}%</Label>
                    <Slider
                      value={[formData.confidence]}
                      onValueChange={(value) => updateField('confidence', value[0])}
                      max={100}
                      min={0}
                      step={5}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Trade Notes & Analysis</Label>
                    <Textarea
                      id="notes"
                      className="glass-card border-0 min-h-[120px]"
                      placeholder="Describe your trade analysis, thoughts, and lessons learned..."
                      value={formData.notes}
                      onChange={(e) => updateField('notes', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Review Tab */}
            <TabsContent value="review" className="space-y-6">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Trade Review
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Trade Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pair:</span>
                          <span className="font-mono text-sm">{formData.pair || 'Not selected'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Direction:</span>
                          <Badge variant={formData.direction === 'long' ? 'default' : 'destructive'} className="text-xs">
                            {formData.direction?.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Session:</span>
                          <span className="text-sm">{tradingSessions.find(s => s.value === formData.session)?.label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Setup:</span>
                          <span className="text-sm">{formData.setupType || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Financial Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pips:</span>
                          <span className="font-mono font-bold text-sm">{pips.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Result:</span>
                          <span className={`font-mono font-bold text-sm ${estimatedResult >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ${estimatedResult.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">R:R Ratio:</span>
                          <span className="font-mono font-bold text-sm">1:{estimatedRR.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Position Size:</span>
                          <span className="font-mono text-sm">{formData.positionSize} lots</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {formData.ruleViolation && (
                    <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-orange-500">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-semibold">Rule Violation:</span>
                        <span>{formData.ruleViolation}</span>
                      </div>
                    </div>
                  )}

                  {formData.notes && (
                    <div>
                      <h3 className="font-semibold mb-2">Notes</h3>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm">{formData.notes}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              <Target className="w-4 h-4 mr-2" />
              {initialData ? 'Save Changes' : 'Add Trade'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
