import React, { useState, useEffect } from 'react';
import { BackendIntegrationConfig } from '../types/sora';
import { saveBackendConfig, fetchMasSoraRates, checkServerHealth } from '../services/masApiService';
import { X, Server, CheckCircle2, AlertCircle, Copy, Check, Code, Terminal, Activity, ShieldAlert, Key } from 'lucide-react';

interface BackendIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BackendIntegrationConfig;
  onSaveConfig: (newConfig: BackendIntegrationConfig) => void;
  onRefreshData: () => void;
}

export const BackendIntegrationModal: React.FC<BackendIntegrationModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onRefreshData,
}) => {
  const [formData, setFormData] = useState<BackendIntegrationConfig>(config);
  const [testStatus, setTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [testMessage, setTestMessage] = useState<string>('');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<{
    checked: boolean;
    ok: boolean;
    masKeyConfigured: boolean;
    uptimeSeconds: number;
  }>({ checked: false, ok: false, masKeyConfigured: false, uptimeSeconds: 0 });

  useEffect(() => {
    if (isOpen) {
      checkServerHealth().then((h) => {
        setHealthStatus({
          checked: true,
          ok: h.ok,
          masKeyConfigured: h.masKeyConfigured,
          uptimeSeconds: h.uptimeSeconds,
        });
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestStatus('TESTING');
    setTestMessage('Testing /api/sora endpoint and MAS APIM Gateway connection...');

    try {
      const res = await fetchMasSoraRates({
        ...formData,
        useLiveMasProxy: true,
      });

      if (res.source === 'MAS_LIVE_API') {
        setTestStatus('SUCCESS');
        setTestMessage(`Success! Live MAS APIM data received. 3M SORA: ${res.summary.compounded3M.toFixed(4)}%`);
      } else if (res.source === 'MAS_OFFICIAL_DATA' && !res.masKeyConfigured) {
        setTestStatus('ERROR');
        setTestMessage('Serverless endpoint /api/sora is reachable, but MAS_KEY_ID is not configured in .env yet.');
      } else {
        setTestStatus(res.source === 'FALLBACK' ? 'ERROR' : 'SUCCESS');
        setTestMessage(res.message);
      }

      // Re-check health
      const h = await checkServerHealth();
      setHealthStatus({
        checked: true,
        ok: h.ok,
        masKeyConfigured: h.masKeyConfigured,
        uptimeSeconds: h.uptimeSeconds,
      });
    } catch (e: any) {
      setTestStatus('ERROR');
      setTestMessage(e.message || 'Connection failed');
    }
  };

  const handleSave = () => {
    saveBackendConfig(formData);
    onSaveConfig(formData);
    onRefreshData();
    onClose();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const sampleEnvConfig = `# In your root .env file:
MAS_KEY_ID="your_mas_key_id_here"`;

  const sampleCurl = `# Test health endpoint
curl -s http://localhost:3000/api/health

# Test SORA endpoint (proxies to MAS APIM Gateway with KeyId header)
curl -s http://localhost:3000/api/sora`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="text-base font-bold">MAS Serverless API Connection</h3>
              <p className="text-xs text-slate-400">
                Serverless endpoints configured at project root: /api/sora.ts & /api/health.ts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Serverless Status Badge Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                <Activity className="w-3.5 h-3.5 text-slate-500" />
                Endpoint (/api/health)
              </span>
              <span className={`px-2 py-0.5 rounded font-bold ${
                healthStatus.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {healthStatus.ok ? 'ONLINE (200 OK)' : 'STANDBY'}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                MAS_KEY_ID Header
              </span>
              <span className={`px-2 py-0.5 rounded font-bold ${
                healthStatus.masKeyConfigured
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-900'
              }`}>
                {healthStatus.masKeyConfigured ? 'CONFIGURED' : 'NOT SET IN .ENV'}
              </span>
            </div>
          </div>

          {/* Upstream MAS Documentation Note */}
          <div className="p-4 bg-slate-900 text-white rounded-xl text-xs space-y-2 border border-slate-800">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span>Upstream MAS APIM Gateway</span>
              <span className="text-emerald-400 font-mono">Header: KeyId</span>
            </div>
            <p className="text-slate-400 font-mono text-[11px] break-all bg-slate-800/80 p-2 rounded border border-slate-700">
              https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
            </p>
            <p className="text-slate-400 text-[11px]">
              No API keys are hardcoded in the codebase. The serverless route reads <code className="text-amber-300">process.env.MAS_KEY_ID</code> and injects the <code className="text-amber-300">KeyId: &lt;MAS_KEY_ID&gt;</code> request header securely on the server side.
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Active Client Endpoint
              </label>
              <input
                type="text"
                placeholder="/api/sora"
                value={formData.backendEndpointUrl}
                onChange={(e) => setFormData({ ...formData, backendEndpointUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-1 focus:ring-red-600"
              />
              <span className="text-[11px] text-slate-500">
                Default serverless route: <code className="text-slate-700 font-bold">/api/sora</code>
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.useLiveMasProxy}
                  onChange={(e) => setFormData({ ...formData, useLiveMasProxy: e.target.checked })}
                  className="rounded text-red-600 focus:ring-red-600"
                />
                <span>Enable Serverless Gateway Proxy</span>
              </label>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'TESTING'}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 disabled:opacity-50 transition-colors shadow-xs"
              >
                {testStatus === 'TESTING' ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            {/* Test result message */}
            {testStatus !== 'IDLE' && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  testStatus === 'SUCCESS'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : testStatus === 'ERROR'
                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {testStatus === 'SUCCESS' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <span>{testMessage}</span>
              </div>
            )}
          </div>

          {/* Configuration Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Code className="w-4 h-4 text-slate-600" />
                1. Configure Environment Variable (.env)
              </span>
              <button
                onClick={() => copyToClipboard(sampleEnvConfig, 'env')}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                {copiedTab === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'env' ? 'Copied' : 'Copy .env'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto border border-slate-800">
              {sampleEnvConfig}
            </pre>
          </div>

          {/* cURL Verification Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-slate-600" />
                2. Verify Endpoints via Terminal
              </span>
              <button
                onClick={() => copyToClipboard(sampleCurl, 'curl')}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                {copiedTab === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'curl' ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono overflow-x-auto border border-slate-800">
              {sampleCurl}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
