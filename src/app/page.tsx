'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getLocalPrice } from '@/utils/currency';
import { Send, Settings, Star, CheckCircle2, Copy, Check, Zap, ShieldCheck, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export default function Dashboard() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({ business_name: '', google_review_link: '', review_gating: true });
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localPrice, setLocalPrice] = useState({ price: '$19', currency: 'USD' });
  const [usage, setUsage] = useState({ used: 14, total: 300 });
  
  // QR Code Ref
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const countryCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('user-country='))
      ?.split('=')[1];
    
    setLocalPrice(getLocalPrice(countryCookie || 'US'));

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
      setUser(user);

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        if (!data.business_name) setShowSettings(true);
      }
    };
    fetchUser();
  }, []);

  const saveSettings = async () => {
    setLoading(true);
    const { error } = await supabase.from('profiles').update({
      business_name: profile.business_name,
      google_review_link: profile.google_review_link,
      review_gating: profile.review_gating
    }).eq('id', user.id);
    
    if (error) {
      alert("Error saving settings: " + error.message);
    } else {
      setShowSettings(false);
    }
    setLoading(false);
  };

  const sendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.business_name || !profile.google_review_link) {
      setShowSettings(true);
      return;
    }
    setLoading(true);
    setStatus(null);

    const res = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: customerPhone,
        businessName: profile.business_name,
        googleLink: profile.google_review_link,
        userId: user.id,
        reviewGating: profile.review_gating // Send gating setting to API
      }),
    });

    const data = await res.json();
    if (data.success) {
      setStatus({ type: 'success', msg: 'Review request sent! 🚀' });
      setCustomerPhone('');
      setUsage(prev => ({ ...prev, used: prev.used + 1 }));
    } else {
      setStatus({ type: 'error', msg: data.error || 'Failed to send.' });
    }
    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(profile.google_review_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      let downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${profile.business_name || 'store'}-qrcode.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  if (!user) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-12">
      <header className="border-b border-gray-800 p-4 flex justify-between items-center bg-gray-900 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <Star className="text-yellow-400 fill-yellow-400 w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">ReviewBoost</h1>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)} 
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition text-sm font-medium ${showSettings ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
        >
          <Settings className="w-4 h-4" /> Settings
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6 mt-6">
        {showSettings ? (
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" /> Business Settings
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Business Name</label>
                <input 
                  type="text" 
                  value={profile.business_name || ''} 
                  onChange={(e) => setProfile({...profile, business_name: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition"
                  placeholder="e.g. Joe's Barbershop"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Google Review Link</label>
                <input 
                  type="url" 
                  value={profile.google_review_link || ''} 
                  onChange={(e) => setProfile({...profile, google_review_link: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition"
                  placeholder="https://g.page/r/..."
                />
              </div>

              <div className="flex items-center justify-between bg-gray-950 p-4 rounded-lg border border-gray-800">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-400"/> Review Filtering</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-[250px]">Only send happy customers to Google. Route bad reviews to a private inbox.</p>
                </div>
                <button 
                  onClick={() => setProfile({...profile, review_gating: !profile.review_gating})}
                  className={`w-12 h-6 rounded-full transition-colors relative ${profile.review_gating ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${profile.review_gating ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <button 
                onClick={saveSettings} 
                disabled={loading} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition shadow-lg shadow-blue-900/50 disabled:opacity-50 mt-4"
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>

              {/* QR Code Section */}
              {profile.google_review_link && (
                <div className="mt-8 border-t border-gray-800 pt-6 flex flex-col items-center">
                  <h3 className="text-sm font-bold text-white mb-2">Your QR Code</h3>
                  <p className="text-xs text-gray-400 mb-4 text-center">Print this and place it on your counter. Customers scan it to leave a review.</p>
                  <div ref={qrRef} className="bg-white p-4 rounded-xl">
                    <QRCodeCanvas value={profile.google_review_link} size={150} />
                  </div>
                  <button onClick={downloadQR} className="mt-4 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                    <Download className="w-4 h-4" /> Download PNG
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 shadow-lg">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Monthly Usage</p>
                    <p className="text-2xl font-bold text-white">{usage.used} <span className="text-sm text-gray-500 font-normal">/ {usage.total}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-blue-400 font-bold bg-blue-900/30 px-2 py-1 rounded-md border border-blue-800 uppercase tracking-wide">Free Plan</p>
                  </div>
                </div>
                <div className="w-full bg-gray-950 rounded-full h-2 border border-gray-800">
                  <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(usage.used / usage.total) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 shadow-lg flex flex-col justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Your Public Review Link</p>
                  <p className="text-sm text-gray-300 truncate font-mono bg-gray-950 p-2 rounded-md border border-gray-800">{profile.google_review_link || 'Not set'}</p>
                </div>
                <button onClick={copyLink} className="mt-3 flex items-center justify-center gap-2 w-full text-blue-400 hover:text-white transition bg-gray-950 hover:bg-blue-600 px-3 py-2 rounded-md border border-gray-800 hover:border-blue-500 text-sm font-medium">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            <div className="bg-gray-900 p-6 sm:p-8 rounded-2xl border border-gray-800 shadow-xl text-center relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-800/50">
                  <Send className="text-blue-400 w-8 h-8 ml-1" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-white">Get More Google Reviews</h2>
                <p className="text-gray-400 mb-6 text-sm max-w-sm mx-auto">Enter a customer's phone number to send them your review link instantly.</p>
                
                <form onSubmit={sendSMS} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input 
                    type="tel" 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+27 82 123 4567" 
                    className="flex-1 bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition text-lg"
                    required
                  />
                  <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition shadow-lg shadow-blue-900/50 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? 'Sending...' : 'Send Link'}
                  </button>
                </form>

                {status && (
                  <div className={`mt-4 p-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium mx-auto max-w-md ${status.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                    {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                    {status.msg}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-gray-800 bg-gray-900/50">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-800">
                <div className="flex justify-between items-center p-4 text-sm hover:bg-gray-800/50 transition">
                  <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-green-400"/></div><span className="text-gray-300 font-mono">+27 82 123 4567</span></div>
                  <span className="text-green-400 font-medium text-xs bg-green-900/20 px-2 py-1 rounded border border-green-900/50">Delivered</span>
                </div>
                <div className="flex justify-between items-center p-4 text-sm hover:bg-gray-800/50 transition">
                  <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"><Send className="w-4 h-4 text-yellow-400"/></div><span className="text-gray-300 font-mono">+27 83 555 0192</span></div>
                  <span className="text-yellow-400 font-medium text-xs bg-yellow-900/20 px-2 py-1 rounded border border-yellow-900/50">Sent</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 rounded-2xl border border-blue-700 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500 rounded-full mix-blend-overlay filter blur-2xl opacity-50"></div>
              <div className="text-left relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Unlock Pro</h3>
                <p className="text-sm text-blue-200 mt-1 max-w-xs">Upgrade to send 500+ requests/month, get custom QR codes, and remove this banner.</p>
              </div>
              <button className="w-full sm:w-auto bg-white text-blue-900 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition shadow-lg relative z-10 whitespace-nowrap flex items-center justify-center gap-2">
                Upgrade for {localPrice.price}/mo
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}