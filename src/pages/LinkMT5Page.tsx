import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  Settings, 
  Zap, 
  ShieldCheck,
  ExternalLink,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function LinkMT5Page() {
  const [token, setToken] = useState<string>('');
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{ url: string; error: string }>({ url: '', error: '' });
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const authToken = localStorage.getItem('tradient_auth_token');
        const response = await fetch(`${apiUrl}/api/mt5/token`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setToken(data.token);
          setWebhookUrl(data.webhookUrl);
        } else {
          toast.error(data.message || 'Failed to fetch MT5 token');
        }
      } catch (error) {
        console.error('Error fetching token:', error);
        
        const isDemo = localStorage.getItem('tradient_auth_token') === 'demo-token';
        if (isDemo) {
          setDebugInfo({ 
            url: apiUrl, 
            error: 'Authentication failed: Falling back to Offline Demo Mode because the backend was unreachable during login.' 
          });
          setLoading(false);
          return;
        }

        toast.error('Network error connecting to backend');
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  const copyToClipboard = (text: string, type: 'token' | 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
    toast.success(`${type === 'token' ? 'Token' : 'Webhook URL'} copied to clipboard`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse text-sm">Securing connection...</p>
        </div>
      </div>
    );
  }

  const isDemo = localStorage.getItem('tradient_auth_token') === 'demo-token';

  if (isDemo) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md border-dashed border-2 border-orange-500/30 bg-orange-500/5">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-2">
              <Settings className="w-6 h-6 text-orange-500" />
            </div>
            <CardTitle>Deployment Config Required</CardTitle>
            <CardDescription>
              MT5 Auto-Sync requires a live backend connection. You are currently in **Offline Demo Mode**.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              To enable this on your deployed site, you must set the <code className="bg-muted px-1 rounded text-orange-600">VITE_API_URL</code> environment variable to point to your backend server.
            </p>
            
            <div className="bg-muted/50 p-3 rounded-lg text-left space-y-2 border border-border/50">
               <p className="text-[10px] font-bold text-muted-foreground uppercase">Runtime Diagnostics</p>
               <div className="text-[11px] font-mono break-all">
                  <span className="text-muted-foreground font-bold">API_URL:</span> {debugInfo.url || 'http://localhost:5000 (DEFAULT)'}
               </div>
               <div className="text-[11px] font-mono text-red-500/80 leading-tight">
                  <span className="text-muted-foreground font-bold">LATEST_ERROR:</span> {debugInfo.error}
               </div>
            </div>

            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/dashboard'}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
            <Terminal className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">MT5 Integration</h1>
            <p className="text-muted-foreground">Sync your trades automatically from MetaTrader 5</p>
          </div>
          <Badge variant="outline" className="ml-auto bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1">
             Sync Active
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Configuration Card */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Zap className="w-24 h-24 text-primary" />
            </div>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Connection Credentials
              </CardTitle>
              <CardDescription>
                Use these unique credentials to link your MetaTrader 5 terminal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Webhook URL Section */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Webhook Endpoint URL</label>
                <div className="flex items-center gap-2 group">
                  <div className="flex-1 bg-muted/50 rounded-xl p-4 border border-border/50 font-mono text-sm overflow-x-auto whitespace-nowrap text-foreground/80 group-hover:border-primary/30 transition-colors">
                    {webhookUrl}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 shrink-0 rounded-xl border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all"
                    onClick={() => copyToClipboard(webhookUrl, 'url')}
                  >
                    {copiedUrl ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Token Section */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Unique Authentication Token</label>
                <div className="flex items-center gap-2 group">
                  <div className="flex-1 bg-muted/50 rounded-xl p-4 border border-border/50 font-mono text-sm overflow-x-auto whitespace-nowrap text-foreground group-hover:border-primary/30 transition-colors font-bold tracking-widest">
                    {token}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 shrink-0 rounded-xl border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all font-bold"
                    onClick={() => copyToClipboard(token, 'token')}
                  >
                    {copiedToken ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-primary/5 p-2 rounded-lg border border-primary/10">
                   <Info className="w-3.5 h-3.5 text-primary" />
                   Keep this token private. It is how the system recognizes your trades.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Instructions Card */}
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">Setup Instructions</CardTitle>
              <CardDescription>Follow these steps to enable auto-sync on your MT5 terminal.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8 relative">
                {/* Visual Line connecting steps */}
                <div className="absolute left-4 top-2 bottom-6 w-0.5 bg-border/40 -z-10"></div>

                <div className="flex gap-6">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold shrink-0 shadow-lg shadow-primary/20">1</div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Download Expert Advisor</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Download the <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">TradientSync.mq5</code> script. 
                      Place it in your MT5's <code className="bg-muted px-1.5 py-0.5 rounded text-xs">MQL5/Experts</code> folder.
                    </p>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="mt-2 rounded-lg gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-none"
                      onClick={() => window.location.href = `${apiUrl}/api/mt5/download`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download EA Script
                    </Button>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold shrink-0 shadow-lg shadow-primary/20">2</div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Allow WebRequests</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      In MT5, go to <strong className="text-foreground">Tools &gt; Options &gt; Expert Advisors</strong>. Check "Allow WebRequest for listed URL" and add:
                    </p>
                    <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-xs font-mono text-primary flex items-center justify-between">
                      {webhookUrl ? new URL(webhookUrl).origin : 'Pending...'}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => webhookUrl && copyToClipboard(new URL(webhookUrl).origin, 'url')}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold shrink-0 shadow-lg shadow-primary/20">3</div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">Attach & Configure</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Drag the EA onto any chart. In the "Inputs" tab, paste your **Unique Token** shown above. Press OK and ensure the hat icon is blue.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info/Status */}
        <div className="space-y-6">
          <Card className="border-border/40 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 uppercase tracking-widest">
                <Zap className="w-4 h-4" />
                Live Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Backend Hub</span>
                <span className="text-green-500 flex items-center gap-1.5 font-medium">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">MT5 Terminal</span>
                <span className="text-yellow-500 flex items-center gap-1.5 font-medium italic">
                  Waiting...
                </span>
              </div>
              <div className="pt-4 border-t border-primary/10 space-y-2">
                 <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Connected Accounts</div>
                 <div className="text-sm font-bold flex items-center justify-between">
                    <span>MT5-Global</span>
                    <Badge className="bg-primary/20 text-primary border-none hover:bg-primary/30">Free Tier</Badge>
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/30">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 italic">
                <Settings className="w-4 h-4" />
                Technical Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Encountering issues? Make sure "Algo Trading" is enabled (Green button) at the top of your MT5 terminal.
              </p>
              <Button variant="outline" className="w-full rounded-xl gap-2 text-xs border-border/50">
                View Documentation
                <ExternalLink className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
