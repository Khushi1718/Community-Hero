"use client";

import { useState, useEffect } from "react";
import { Save, Play, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function IntegrationsSettingsPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  
  const [cityId, setCityId] = useState("");
  const [config, setConfig] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  
  const [enabled, setEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [authType, setAuthType] = useState("none");
  const [authToken, setAuthToken] = useState("");
  
  const [pubSubEnabled, setPubSubEnabled] = useState(false);
  const [pubSubTopic, setPubSubTopic] = useState("");
  const [pubSubServiceAccountKey, setPubSubServiceAccountKey] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingPubSub, setIsTestingPubSub] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [pubSubTestResult, setPubSubTestResult] = useState<any>(null);

  useEffect(() => {
    if (!loading && (!user || role !== "super_admin")) {
      router.push("/login");
    }
  }, [user, role, loading, router]);

  const loadConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityId) return;
    
    try {
      const res = await fetch(`/api/admin/integrations?cityId=${encodeURIComponent(cityId)}`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setLogs(data.logs || []);
        
        if (data.config) {
          setEnabled(data.config.enabled);
          setWebhookUrl(data.config.webhookUrl);
          setAuthType(data.config.authType);
          setAuthToken(""); // Don't show existing token
          setPubSubEnabled(data.config.pubSubEnabled || false);
          setPubSubTopic(data.config.pubSubTopic || "");
          setPubSubServiceAccountKey(""); // Don't show existing key
        } else {
          // Reset form for new city
          setEnabled(false);
          setWebhookUrl("");
          setAuthType("none");
          setAuthToken("");
          setPubSubEnabled(false);
          setPubSubTopic("");
          setPubSubServiceAccountKey("");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (pubSubEnabled && pubSubTopic) {
      const topicRegex = /^projects\/[^/]+\/topics\/[^/]+$/;
      if (!topicRegex.test(pubSubTopic)) {
        alert("Invalid Pub/Sub topic format. Must be projects/{project}/topics/{topic}");
        return;
      }
    }
    
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId,
          enabled,
          webhookUrl,
          authType,
          authToken,
          pubSubEnabled,
          pubSubTopic,
          pubSubServiceAccountKey,
          lastModifiedBy: user?.primaryEmailAddress?.emailAddress || "Admin"
        })
      });
      
      if (res.ok) {
        alert("Configuration saved successfully!");
        setAuthToken(""); // clear token input after save
        // Reload config to get updated hasAuthToken state
        const e = new Event("submit") as unknown as React.FormEvent;
        loadConfig(e);
      } else {
        const err = await res.json();
        alert("Error saving: " + err.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPing = async (type: 'webhook' | 'pubsub' = 'webhook') => {
    if (type === 'webhook') {
      setIsTesting(true);
      setTestResult(null);
    } else {
      setIsTestingPubSub(true);
      setPubSubTestResult(null);
    }
    
    try {
      const payload: any = { type };
      
      if (type === 'webhook') {
        payload.webhookUrl = webhookUrl;
        payload.authType = authType;
        payload.authToken = authToken;
        payload.existingEncryptedToken = config?.hasAuthToken && !authToken ? "use_existing" : undefined;
      } else {
        payload.pubSubTopic = pubSubTopic;
        payload.pubSubServiceAccountKey = pubSubServiceAccountKey;
        payload.existingPubSubKeyEncrypted = config?.hasPubSubKey && !pubSubServiceAccountKey ? "use_existing" : undefined;
      }

      const res = await fetch("/api/admin/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (type === 'webhook') {
        setTestResult(data);
      } else {
        setPubSubTestResult(data);
      }
    } catch (err: any) {
      if (type === 'webhook') {
        setTestResult({ success: false, error: err.message });
      } else {
        setPubSubTestResult({ success: false, error: err.message });
      }
    } finally {
      if (type === 'webhook') setIsTesting(false);
      else setIsTestingPubSub(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">External CRM Integrations</h1>
        <p className="text-slate-600 mt-2">Configure webhooks to push issues to external municipal CRM systems.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={loadConfig} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">City ID (e.g., 'San Francisco', 'New York')</label>
            <input 
              type="text" 
              value={cityId} 
              onChange={e => setCityId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="Enter City Name or ID"
              required
            />
          </div>
          <button type="submit" className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800">
            Load Config
          </button>
        </form>
      </div>

      {(config !== null || cityId) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Configuration: {cityId}</h2>
            
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="enabled" 
                checked={enabled} 
                onChange={e => setEnabled(e.target.checked)}
                className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <label htmlFor="enabled" className="text-sm font-medium text-slate-700">Enable Webhook Sync</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Webhook URL</label>
              <input 
                type="url" 
                value={webhookUrl} 
                onChange={e => setWebhookUrl(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="https://crm.city.gov/api/v1/tickets"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Authentication Type</label>
              <select 
                value={authType} 
                onChange={e => setAuthType(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="none">None</option>
                <option value="bearer">Bearer Token</option>
                <option value="apiKey">API Key (x-api-key)</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>

            {authType !== "none" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Auth Token/Credential 
                  {config?.hasAuthToken && <span className="text-green-600 ml-2">(Saved)</span>}
                </label>
                <input 
                  type="password" 
                  value={authToken} 
                  onChange={e => setAuthToken(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder={config?.hasAuthToken ? "Enter new token to overwrite" : "Enter auth token"}
                />
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Config"}
              </button>
              
              <button 
                onClick={() => handleTestPing('webhook')} 
                disabled={isTesting || !webhookUrl}
                className="flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 border border-slate-300 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {isTesting ? "Testing..." : "Send Webhook Test Ping"}
              </button>
            </div>
            
            {testResult && (
              <div className={`p-4 rounded-lg mt-4 border ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 font-bold mb-2">
                  {testResult.success ? <CheckCircle2 className="w-5 h-5 text-green-600"/> : <XCircle className="w-5 h-5 text-red-600"/>}
                  <span className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                    Webhook Test {testResult.success ? 'Successful' : 'Failed'}
                  </span>
                  {testResult.status && <span className="text-sm font-normal text-slate-600 ml-auto">HTTP {testResult.status}</span>}
                  {testResult.durationMs && <span className="text-sm font-normal text-slate-600 ml-2">{testResult.durationMs}ms</span>}
                </div>
                <div className="text-sm font-mono bg-white p-2 rounded border border-slate-200 text-slate-800 max-h-32 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-all">
                  {testResult.body || testResult.error || "No response body"}
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Google Cloud Pub/Sub</h2>
            
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="pubSubEnabled" 
                checked={pubSubEnabled} 
                onChange={e => setPubSubEnabled(e.target.checked)}
                className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <label htmlFor="pubSubEnabled" className="text-sm font-medium text-slate-700">Enable Pub/Sub Sync</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Topic Name</label>
              <input 
                type="text" 
                value={pubSubTopic} 
                onChange={e => setPubSubTopic(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="projects/my-gcp-project/topics/my-topic"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Service Account JSON Key
                {config?.hasPubSubKey && <span className="text-green-600 ml-2">(Key configured ✓)</span>}
              </label>
              <textarea 
                value={pubSubServiceAccountKey} 
                onChange={e => setPubSubServiceAccountKey(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                placeholder={config?.hasPubSubKey ? "•••••••••••••••••••••••••••• (Enter new JSON key to overwrite)" : "Paste full JSON key here"}
                rows={4}
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Config"}
              </button>
              
              <button 
                onClick={() => handleTestPing('pubsub')} 
                disabled={isTestingPubSub || !pubSubTopic}
                className="flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 border border-slate-300 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {isTestingPubSub ? "Testing..." : "Send Pub/Sub Test Ping"}
              </button>
            </div>

            {pubSubTestResult && (
              <div className={`p-4 rounded-lg mt-4 border ${pubSubTestResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 font-bold mb-2">
                  {pubSubTestResult.success ? <CheckCircle2 className="w-5 h-5 text-green-600"/> : <XCircle className="w-5 h-5 text-red-600"/>}
                  <span className={pubSubTestResult.success ? 'text-green-800' : 'text-red-800'}>
                    Pub/Sub Test {pubSubTestResult.success ? 'Successful' : 'Failed'}
                  </span>
                  {pubSubTestResult.durationMs && <span className="text-sm font-normal text-slate-600 ml-auto">{pubSubTestResult.durationMs}ms</span>}
                </div>
                <div className="text-sm font-mono bg-white p-2 rounded border border-slate-200 text-slate-800 max-h-32 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-all">
                  {pubSubTestResult.body || pubSubTestResult.error || "No response body"}
                </div>
              </div>
            )}
            
            {config?.lastModifiedAt && (
              <p className="text-xs text-slate-400 mt-4 text-right border-t border-slate-100 pt-2">
                Last modified by {config.lastModifiedBy} at {new Date(config.lastModifiedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Recent Sync Logs</h2>
              <button onClick={(e) => loadConfig(e as any)} className="text-sm text-blue-600 hover:underline">Refresh</button>
            </div>
            
            {logs.length === 0 ? (
              <div className="text-center text-slate-500 py-8">No sync logs found for this city.</div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log._id} className="p-4 border border-slate-100 rounded-lg bg-slate-50 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-500">{log.ticketId}</span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {log.status === 'success' ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">SUCCESS</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">FAILED</span>
                      )}
                      <span className="text-sm font-medium text-slate-700 truncate">{log.endpoint}</span>
                    </div>
                    {log.errorMessage && <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-1 border border-red-100 break-all">{log.errorMessage}</div>}
                    {log.responseCode && <div className="text-xs text-slate-600 mt-1">HTTP {log.responseCode}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
