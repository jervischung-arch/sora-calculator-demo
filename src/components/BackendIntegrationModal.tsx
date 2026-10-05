import React, { useState } from 'react';
import { BackendIntegrationConfig } from '../types/sora';
import { saveBackendConfig, fetchMasSoraRates } from '../services/masApiService';
import { X, Server, CheckCircle2, AlertCircle, Copy, Check, Code, Terminal } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestStatus('TESTING');
    setTestMessage('Pinging backend endpoint...');

    try {
      const res = await fetchMasSoraRates({
        ...formData,
        useLiveMasProxy: true,
      });

      if (res.source === 'CUSTOM_BACKEND') {
        setTestStatus('SUCCESS');
        setTestMessage(`Success! Connected to backend. Overnight SORA: ${res.summary.overnightSora}%`);
      } else {
        setTestStatus('ERROR');
        setTestMessage(res.message);
      }
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

  const sampleJson = `{
  "summary": {
    "publicationDate": "2026-10-02",
    "overnightSora": 2.7845,
    "compounded1M": 2.8120,
    "compounded3M": 2.8765,
    "compounded6M": 2.9430,
    "soraIndex": 1.16482
  },
  "dailyRates": [
    {
      "date": "2026-10-02",
      "rate": 2.7845,
      "dayCountWeight": 3,
      "volumeMillionSGD": 3200
    }
  ]
}`;

  const sampleExpressCode = `// Express.js / Node.js backend route
app.get('/api/mas/sora-rates', async (req, res) => {
  try {
    // 1. Fetch from MAS Open API or your internal financial database
    // MAS Datastore API: https://eservices.mas.gov.sg/api/action/datastore/search.json?resource_id=...
    const rates = await getLatestSoraRates();
    res.json({
      summary: rates.summary,
      dailyRates: rates.dailyRates
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="text-base font-bold">Backend Integration Connector</h3>
              <p className="text-xs text-slate-400">
                Configure your API endpoint to read live MAS rates once your backend is ready
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
          {/* Status info */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
            <strong>Architecture Note:</strong> The frontend currently operates seamlessly with the built-in, verified official MAS benchmark dataset. When you build your backend service later, simply point this connector to your endpoint.
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Backend Endpoint URL
              </label>
              <input
                type="text"
                placeholder="/api/mas/sora-rates or http://localhost:8080/api/mas/sora"
                value={formData.backendEndpointUrl}
                onChange={(e) => setFormData({ ...formData, backendEndpointUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-1 focus:ring-red-600"
              />
              <span className="text-[11px] text-slate-500">
                Your future server endpoint returning the SORA rates schema.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Optional Bearer Token / API Key
              </label>
              <input
                type="password"
                placeholder="Optional Bearer token"
                value={formData.apiKey || ''}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-1 focus:ring-red-600"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.useLiveMasProxy}
                  onChange={(e) => setFormData({ ...formData, useLiveMasProxy: e.target.checked })}
                  className="rounded text-red-600 focus:ring-red-600"
                />
                <span>Enable custom backend proxy mode</span>
              </label>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'TESTING'}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-50"
              >
                {testStatus === 'TESTING' ? 'Testing...' : 'Test Endpoint'}
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

          {/* Expected JSON Schema */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Code className="w-4 h-4 text-slate-600" />
                Expected JSON Contract (Response)
              </span>
              <button
                onClick={() => copyToClipboard(sampleJson, 'json')}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                {copiedTab === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'json' ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
              {sampleJson}
            </pre>
          </div>

          {/* Express Boilerplate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-slate-600" />
                Node / Express Example
              </span>
              <button
                onClick={() => copyToClipboard(sampleExpressCode, 'express')}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                {copiedTab === 'express' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'express' ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono overflow-x-auto max-h-40 border border-slate-800">
              {sampleExpressCode}
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
