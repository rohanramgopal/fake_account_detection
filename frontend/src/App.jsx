import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, ShieldCheck, Activity, Users, Settings, Terminal, 
  UserCheck, UploadCloud, AlertTriangle, Play, Pause, RefreshCw, 
  Sliders, Database, Bot, FileText, CheckCircle, XCircle, Info, ChevronRight, HelpCircle, Lock, LogOut, Radio
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

export default function App() {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [userRole, setUserRole] = useState('Security Officer');

  // Navigation and health state
  const [activeTab, setActiveTab] = useState('live');
  const [apiOnline, setApiOnline] = useState(false);
  
  // Model state
  const [modelConfig, setModelConfig] = useState({
    classifier_type: 'random_forest',
    n_estimators: 100,
    max_depth: 8,
    test_size: 0.2
  });
  const [modelMetrics, setModelMetrics] = useState({
    accuracy: 0.0,
    precision: 0.0,
    recall: 0.0,
    f1_score: 0.0,
    auc: 0.0,
    confusion_matrix: { tn: 0, fp: 0, fn: 0, tp: 0 },
    roc_curve: [],
    feature_importances: []
  });
  const [isTraining, setIsTraining] = useState(false);

  // Live simulation state
  const [simActive, setSimActive] = useState(false);
  const [streamedProfiles, setStreamedProfiles] = useState([]);
  const [simStats, setSimStats] = useState({
    scanned: 0,
    bots: 0,
    genuine: 0,
    mitigations: { Allow: 0, Flag: 0, Suspend: 0, Shadowban: 0, Captcha: 0, Lock: 0 }
  });
  const [subtypeCounts, setSubtypeCounts] = useState({
    'Genuine User': 0,
    'Commercial Spambot': 0,
    'Inactive Follower Bot': 0,
    'Celebrity Impersonator': 0,
    'Data Harvester / Scraper': 0,
    'Political Astroturfer': 0,
    'Compromised / Hijacked Account': 0
  });
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [selectedFeedProfile, setSelectedFeedProfile] = useState(null);
  
  const eventSourceRef = useRef(null);
  const terminalBottomRef = useRef(null);

  // Single inspector state
  const [inspectorForm, setInspectorForm] = useState({
    username: 'crypto_guru99',
    display_name: '⚡ Crypto Guru ⚡',
    bio: 'Earn money working from home! Click the link below! 100% legit giveaway!',
    has_profile_pic: 1,
    has_link_in_bio: 1,
    followers_count: 85,
    following_count: 2400,
    posts_count: 650,
    posts_frequency: 18.5,
    recent_posts: [
      'CLAIM YOUR $10,000 CASH NOW! LINK IN BIO!',
      'Passive income is real. Double your Bitcoin in 24 hours!',
      'Follow me for daily signals and financial freedom.'
    ]
  });
  const [inspectorResult, setInspectorResult] = useState(null);
  const [inspectorLoading, setInspectorLoading] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('spambot');

  // Batch scan state
  const [batchCsvText, setBatchCsvText] = useState(
    "username,followers_count,following_count,posts_count,posts_frequency,has_profile_pic,has_link_in_bio,bio\n" +
    "legit_user_12,1200,850,420,1.2,1,0,\"Tech lover, mountain biker, developer.\"\n" +
    "elonmusk_giveaway,150,4500,89,12.5,1,1,\"Official BTC & ETH community support page. DM!\"\n" +
    "ghost_acct3,0,650,0,0.0,0,0,\"\"\n" +
    "patriot_trump,420,1500,2400,28.5,1,0,\"PROUD CITIZEN. Standing for the TRUTH. Down with the corrupt media!\"\n" +
    "fashion_influencer,42000,480,1800,2.5,1,1,\"Business inquiries: collabs@fashion.com\""
  );
  const [batchResults, setBatchResults] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);

  // API play area state
  const [apiConsoleEndpoint, setApiConsoleEndpoint] = useState('/api/analyze');
  const [apiConsoleResponse, setApiConsoleResponse] = useState(null);

  // Load Session & Initial Metrics
  useEffect(() => {
    const token = localStorage.getItem('sybilguard_token');
    const role = localStorage.getItem('sybilguard_role');
    if (token) {
      setIsLoggedIn(true);
      if (role) setUserRole(role);
    }
    checkApiHealth();
    fetchModelMetrics();
  }, []);

  // Auto-scroll terminal log
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  const checkApiHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/`);
      if (res.ok) {
        setApiOnline(true);
      } else {
        setApiOnline(false);
      }
    } catch (e) {
      setApiOnline(false);
    }
  };

  const fetchModelMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/model/metrics`);
      if (res.ok) {
        const data = await res.json();
        setModelMetrics(data.metrics);
        setModelConfig(data.config);
      }
    } catch (e) {
      console.error('Error fetching model metrics', e);
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginCredentials)
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('sybilguard_token', data.token);
        localStorage.setItem('sybilguard_role', data.user.role);
        setUserRole(data.user.role);
        setIsLoggedIn(true);
      } else {
        const errorData = await res.json();
        setLoginError(errorData.detail || 'Access Denied: Invalid credentials');
      }
    } catch (err) {
      setLoginError('Server error: Could not reach authentication endpoint.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('sybilguard_token');
    localStorage.removeItem('sybilguard_role');
    setIsLoggedIn(false);
    setSimActive(false);
    stopSimulator();
  };

  // Control Live SSE Stream
  useEffect(() => {
    if (simActive) {
      startSimulator();
    } else {
      stopSimulator();
    }
    return () => stopSimulator();
  }, [simActive]);

  const startSimulator = () => {
    if (eventSourceRef.current) return;
    
    // Add systems log entry
    setTerminalLogs(prev => [...prev, {
      type: 'system',
      text: `[SYSTEM] ${new Date().toLocaleTimeString()} - Launching live platform threat simulation...`
    }]);

    eventSourceRef.current = new EventSource(`${API_BASE_URL}/api/stream`);
    
    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      setStreamedProfiles(prev => {
        const updated = [data, ...prev];
        return updated.slice(0, 15); // Keep last 15
      });
      
      // Update statistics
      setSimStats(prev => {
        const isBot = data.analysis.is_fake === 1;
        const action = data.action_taken;
        
        let normalizedAction = 'Allow';
        if (action.toLowerCase().includes('suspend')) normalizedAction = 'Suspend';
        else if (action.toLowerCase().includes('flag')) normalizedAction = 'Flag';
        else if (action.toLowerCase().includes('shadow')) normalizedAction = 'Shadowban';
        else if (action.toLowerCase().includes('captcha')) normalizedAction = 'Captcha';
        else if (action.toLowerCase().includes('lock') || action.toLowerCase().includes('reset')) normalizedAction = 'Lock';
        
        const nextMitigations = { ...prev.mitigations };
        nextMitigations[normalizedAction] = (nextMitigations[normalizedAction] || 0) + 1;
        
        return {
          scanned: prev.scanned + 1,
          bots: prev.bots + (isBot ? 1 : 0),
          genuine: prev.genuine + (isBot ? 0 : 1),
          mitigations: nextMitigations
        };
      });

      // Update multi-class subtype counts
      const subtype = data.analysis.risk_classification;
      setSubtypeCounts(prev => {
        const nextCounts = { ...prev };
        nextCounts[subtype] = (nextCounts[subtype] || 0) + 1;
        return nextCounts;
      });

      // Generate Terminal Log Line
      const timestamp = new Date().toLocaleTimeString();
      if (data.analysis.is_fake === 0) {
        setTerminalLogs(prev => [...prev, {
          type: 'info',
          text: `[${timestamp}] [VERIFIED] @${data.profile.username} - Organic user. Action: Allow.`
        }]);
      } else {
        setTerminalLogs(prev => [...prev, {
          type: 'alert',
          text: `[${timestamp}] [ALERT] @${data.profile.username} flagged as [${subtype.toUpperCase()}]. Action: ${data.action_taken}.`
        }]);
      }
    };

    eventSourceRef.current.onerror = (err) => {
      console.error("SSE connection error", err);
      setTerminalLogs(prev => [...prev, {
        type: 'system',
        text: `[SYSTEM] ${new Date().toLocaleTimeString()} - Warning: Stream connection interrupted. Reconnecting...`
      }]);
      stopSimulator();
    };
  };

  const stopSimulator = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setTerminalLogs(prev => [...prev, {
        type: 'system',
        text: `[SYSTEM] ${new Date().toLocaleTimeString()} - Live simulator paused.`
      }]);
    }
  };

  const resetSimulator = () => {
    setStreamedProfiles([]);
    setTerminalLogs([]);
    setSimStats({
      scanned: 0,
      bots: 0,
      genuine: 0,
      mitigations: { Allow: 0, Flag: 0, Suspend: 0, Shadowban: 0, Captcha: 0, Lock: 0 }
    });
    setSubtypeCounts({
      'Genuine User': 0,
      'Commercial Spambot': 0,
      'Inactive Follower Bot': 0,
      'Celebrity Impersonator': 0,
      'Data Harvester / Scraper': 0,
      'Political Astroturfer': 0,
      'Compromised / Hijacked Account': 0
    });
    setSelectedFeedProfile(null);
  };

  // Inspect Form Submission
  const handleInspect = async (e) => {
    if (e) e.preventDefault();
    setInspectorLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inspectorForm)
      });
      if (res.ok) {
        const data = await res.json();
        setInspectorResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInspectorLoading(false);
    }
  };

  // Load Preset Archetypes (7 distinct categories)
  const loadTemplate = (type) => {
    setActiveTemplate(type);
    let templateData = {};
    
    if (type === 'genuine') {
      templateData = {
        username: 'sarah_codes',
        display_name: 'Sarah Jenkins',
        bio: 'Software engineer and UI designer. Building open source security tools. Cat mom 🐈.',
        has_profile_pic: 1,
        has_link_in_bio: 0,
        followers_count: 1420,
        following_count: 890,
        posts_count: 512,
        posts_frequency: 1.2,
        recent_posts: [
          'Just pushed a major feature to my open source CSS dashboard. Loving CSS grid!',
          'Coffee in hand, ready for a productive planning session.',
          'Look at this gorgeous sunset from my balcony tonight.'
        ]
      };
    } else if (type === 'spambot') {
      templateData = {
        username: 'crypto_guru99',
        display_name: '⚡ Crypto Guru ⚡',
        bio: 'Earn money working from home! Click the link below! 100% legit giveaway!',
        has_profile_pic: 1,
        has_link_in_bio: 1,
        followers_count: 85,
        following_count: 2400,
        posts_count: 650,
        posts_frequency: 18.5,
        recent_posts: [
          'CLAIM YOUR $10,000 CASH NOW! LINK IN BIO!',
          'Passive income is real. Double your Bitcoin in 24 hours!',
          'Follow me for daily signals and financial freedom.'
        ]
      };
    } else if (type === 'inactive') {
      templateData = {
        username: 'zx9834h2l',
        display_name: '',
        bio: '',
        has_profile_pic: 0,
        has_link_in_bio: 0,
        followers_count: 1,
        following_count: 850,
        posts_count: 0,
        posts_frequency: 0.0,
        recent_posts: []
      };
    } else if (type === 'impersonator') {
      templateData = {
        username: 'elonmusk_support_x',
        display_name: 'Elon Musk (Support)',
        bio: 'Official backup support account. DM me if you are facing payment delays.',
        has_profile_pic: 1,
        has_link_in_bio: 1,
        followers_count: 110,
        following_count: 3200,
        posts_count: 18,
        posts_frequency: 4.5,
        recent_posts: [
          'If you need support, send direct message now. I will verify your wallet.',
          'Warning! Fake accounts are pretending to be me. This is my only help desk.',
          'Let me know if your transaction went through.'
        ]
      };
    } else if (type === 'harvester') {
      templateData = {
        username: 'harvester_node_84',
        display_name: 'Data Bot 42',
        bio: 'Automated data collection agent. Archiving public social media metrics for academic research.',
        has_profile_pic: 1,
        has_link_in_bio: 0,
        followers_count: 4,
        following_count: 6500,
        posts_count: 12500,
        posts_frequency: 45.0,
        recent_posts: [
          'Data checkpoint: ID 827439. Average word length: 4.82. Common tag: #tech.',
          'Sentiment analysis results: Positive 42.1%, Neutral 38.2%, Negative 19.7%.',
          'Index table updated successfully. Total records recorded: 5,429,812 rows.'
        ]
      };
    } else if (type === 'astroturfer') {
      templateData = {
        username: 'truth_warrior_99',
        display_name: 'Patriot John',
        bio: 'PROUD PATRIOT. Standing for the TRUTH. Down with the corrupt media! 🇺🇸',
        has_profile_pic: 1,
        has_link_in_bio: 1,
        followers_count: 350,
        following_count: 1800,
        posts_count: 4200,
        posts_frequency: 30.0,
        recent_posts: [
          'THE CORRUPT MEDIA IS LYING! This whole campaign is a rigged hoax to deceive you!',
          'We must stand up and VOTE out the corrupt politicians! Spread the truth now! 📢🇺🇸',
          'Another massive SCANDAL exposed today. When will the corrupt government be held accountable?'
        ]
      };
    } else if (type === 'hijacked') {
      templateData = {
        username: 'chloe_fit',
        display_name: 'Chloe Jenkins',
        bio: 'Runner, coffee explorer. Views my own. ☕ Check out this link for cash: bit.ly/spam',
        has_profile_pic: 1,
        has_link_in_bio: 1,
        followers_count: 12500,
        following_count: 350,
        posts_count: 1800,
        posts_frequency: 32.5,
        recent_posts: [
          'CLAIM YOUR FREE $10,000 NOW! EXCLUSIVE OFFER! 👇',
          'Double your crypto coins in 2 hours! 100% legal!',
          'Had a great run this morning in the park. Perfect weather.'
        ]
      };
    }
    
    setInspectorForm(templateData);
    // Auto submit to evaluate
    setInspectorLoading(true);
    fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData)
    })
      .then(res => res.json())
      .then(data => {
        setInspectorResult(data);
        setInspectorLoading(false);
      })
      .catch(() => setInspectorLoading(false));
  };

  // Batch CSV Scanning
  const handleBatchScan = async () => {
    setBatchLoading(true);
    
    const lines = batchCsvText.trim().split('\n');
    if (lines.length <= 1) {
      alert("Invalid CSV format. Please include headers and data rows.");
      setBatchLoading(false);
      return;
    }
    
    const headers = lines[0].split(',');
    const profiles = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;
      
      const record = {};
      headers.forEach((h, idx) => {
        let val = values[idx].trim().replace(/^"|"$/g, '');
        if (!isNaN(val) && val !== "") {
          val = Number(val);
        }
        record[h.trim()] = val;
      });
      
      profiles.push({
        username: record.username || `user_${i}`,
        display_name: record.display_name || String(record.username || '').toUpperCase(),
        bio: record.bio || '',
        has_profile_pic: record.has_profile_pic !== undefined ? Number(record.has_profile_pic) : 1,
        has_link_in_bio: record.has_link_in_bio !== undefined ? Number(record.has_link_in_bio) : 0,
        followers_count: record.followers_count !== undefined ? Number(record.followers_count) : 150,
        following_count: record.following_count !== undefined ? Number(record.following_count) : 100,
        posts_count: record.posts_count !== undefined ? Number(record.posts_count) : 50,
        posts_frequency: record.posts_frequency !== undefined ? Number(record.posts_frequency) : 1.0,
        recent_posts: record.recent_posts ? [record.recent_posts] : []
      });
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profiles)
      });
      if (res.ok) {
        const data = await res.json();
        setBatchResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setBatchLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/upload-csv`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setBatchResults(data);
      } else {
        alert("Upload failed. Ensure headers are present.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBatchLoading(false);
    }
  };

  // Model training
  const handleRetrain = async () => {
    setIsTraining(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/model/retrain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelConfig)
      });
      if (res.ok) {
        const data = await res.json();
        setModelMetrics(data.metrics);
        alert(`Successfully retrained model with validation accuracy of ${(data.metrics.accuracy * 100).toFixed(1)}%!`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTraining(false);
    }
  };

  // Developers API Console
  const triggerApiPlayground = async () => {
    let payload = null;
    if (apiConsoleEndpoint === '/api/analyze') {
      payload = inspectorForm;
    } else if (apiConsoleEndpoint === '/api/model/retrain') {
      payload = modelConfig;
    } else if (apiConsoleEndpoint === '/api/batch') {
      payload = [inspectorForm];
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}${apiConsoleEndpoint}`, {
        method: apiConsoleEndpoint.includes('metrics') ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined
      });
      const data = await res.json();
      setApiConsoleResponse(data);
    } catch (err) {
      setApiConsoleResponse({ error: err.message });
    }
  };

  // Statistics summaries
  const currentBotRatio = simStats.scanned > 0 ? (simStats.bots / simStats.scanned) * 100 : 0;
  const threatLevel = currentBotRatio > 45 ? 'CRITICAL ALERT' : currentBotRatio > 20 ? 'ELEVATED RISK' : 'NORMAL / STABLE';

  // LOGIN PAGE GATE
  if (!isLoggedIn) {
    return (
      <div className="login-screen-overlay">
        <div className="login-card">
          <div className="login-logo-glow">
            <ShieldAlert size={28} />
          </div>
          <div className="login-header">
            <h2>SybilGuard SOC Portal</h2>
            <p>Enterprise Deception & Threat Intelligence Suite</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Authentication Username</label>
              <input 
                type="text" 
                placeholder="Enter username" 
                required 
                value={loginCredentials.username}
                onChange={e => setLoginCredentials({...loginCredentials, username: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Security Key / Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                required 
                value={loginCredentials.password}
                onChange={e => setLoginCredentials({...loginCredentials, password: e.target.value})}
              />
            </div>

            {loginError && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', gap: '6px', alignItems: 'center' }}>
                <AlertTriangle size={14} />
                {loginError}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loginLoading}>
              {loginLoading ? 'Verifying Credentials...' : 'Authenticate & Unlock'}
            </button>
          </form>

          <div className="login-credentials-helper">
            <strong>Demonstration Access:</strong> Use <code>admin</code> as username and <code>sybilguard2026</code> as the security password key.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header Navigation */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo-container">
            <ShieldAlert size={22} color="#fff" />
          </div>
          <div>
            <span className="brand-name">SybilGuard</span>
            <span className="brand-tag">AI SOC</span>
          </div>
        </div>
        
        <nav className="nav-tabs">
          <button 
            className={`nav-tab-btn ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            <Activity size={16} /> Live Simulation
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === 'inspector' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('inspector');
              if (!inspectorResult) loadTemplate('spambot');
            }}
          >
            <UserCheck size={16} /> Profile Inspector
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === 'batch' ? 'active' : ''}`}
            onClick={() => setActiveTab('batch')}
          >
            <Users size={16} /> Batch Scanner
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === 'model' ? 'active' : ''}`}
            onClick={() => setActiveTab('model')}
          >
            <Settings size={16} /> Model Hub
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            <Terminal size={16} /> Developers API
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="api-status-badge">
            <span className={`api-status-dot ${apiOnline ? '' : 'offline'}`} />
            {apiOnline ? 'Engine Connected' : 'Engine Disconnected'}
          </div>

          <button className="logout-btn" onClick={handleLogout} title="Log out of panel">
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="main-content">
        
        {/* TAB 1: LIVE SIMULATION */}
        {activeTab === 'live' && (
          <div className="dashboard-grid">
            
            {/* Left Column: Feed List */}
            <div className="glass-card live-stream-panel" style={{height: '680px'}}>
              <div className="panel-header">
                <h2>
                  <Radio className={simActive ? "animate-pulse" : ""} size={20} style={{color: simActive ? '#f87171' : 'var(--color-primary)'}} />
                  Live Platform Audit Feed
                  {simActive && <span style={{fontSize: '0.8rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', marginLeft: '8px'}}>Active Stream</span>}
                </h2>
                <div className="sim-controls">
                  <button 
                    className={`btn ${simActive ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => setSimActive(!simActive)}
                  >
                    {simActive ? <Pause size={16} /> : <Play size={16} />}
                    {simActive ? 'Pause Sim' : 'Start Feed'}
                  </button>
                  <button className="btn" onClick={resetSimulator}>
                    Clear logs
                  </button>
                </div>
              </div>

              {streamedProfiles.length === 0 ? (
                <div className="empty-feed-placeholder">
                  <Bot size={48} />
                  <p>Click <strong>Start Feed</strong> to simulate social media feed streams in real-time.<br />Our model will scan, classify, and mitigate bots instantly.</p>
                </div>
              ) : (
                <div className="feed-items-container">
                  {streamedProfiles.map((p, idx) => {
                    const isFake = p.analysis.is_fake === 1;
                    const action = p.action_taken;
                    const isSelected = selectedFeedProfile?.profile?.username === p.profile.username;
                    
                    return (
                      <div 
                        key={idx} 
                        className={`stream-item ${isFake ? 'fake' : 'genuine'} ${isSelected ? 'selected' : ''}`}
                        style={{cursor: 'pointer', borderColor: isSelected ? '#8b5cf6' : ''}}
                        onClick={() => setSelectedFeedProfile(p)}
                      >
                        <div className={`avatar-wrapper ${isFake ? 'bot' : 'genuine'}`}>
                          <div className="avatar-default">
                            {p.profile.username.slice(0, 2).toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="profile-info">
                          <div className="profile-names">
                            <span className="disp-name">{p.profile.display_name || p.profile.username}</span>
                            <span className="user-handle">@{p.profile.username}</span>
                          </div>
                          <span className="profile-bio-text">{p.profile.bio || "No biography provided."}</span>
                          <div className="profile-metrics-mini">
                            <span><strong>Followers:</strong> {p.profile.followers_count.toLocaleString()}</span>
                            <span><strong>Following:</strong> {p.profile.following_count.toLocaleString()}</span>
                            <span><strong>Posts/Day:</strong> {p.profile.posts_frequency}</span>
                          </div>
                        </div>
                        
                        <div className="risk-verdict-section">
                          <span className={`risk-percentage-badge ${isFake ? 'danger' : 'success'}`}>
                            {isFake ? <Bot size={13} /> : <UserCheck size={13} />}
                            {(p.analysis.risk_probability * 100).toFixed(0)}% Bot
                          </span>
                          
                          <span className={`mitigation-badge ${
                            action.includes('Allow') ? 'allow' : 
                            action.includes('Verified') ? 'verified' :
                            action.includes('Suspend') ? 'block' :
                            action.includes('Shadow') ? 'block' : 'flag'
                          }`}>
                            {action}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Sim Analytics & Terminal Log */}
            <div className="dashboard-sidebar-grid">
              
              {/* Platforms Health Dashboard */}
              <div className="glass-card">
                <div className="panel-header" style={{border: 'none', padding: '0', marginBottom: '14px'}}>
                  <h3 style={{fontSize: '1rem', fontWeight: 700}}>Platform Security Intelligence</h3>
                </div>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                    <div style={{background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)'}}>
                      <div style={{fontSize: '0.7rem', color: 'var(--text-secondary)'}}>AUDITED PROFILES</div>
                      <div style={{fontSize: '1.3rem', fontWeight: 800}}>{simStats.scanned}</div>
                    </div>
                    <div style={{background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)'}}>
                      <div style={{fontSize: '0.7rem', color: 'var(--text-secondary)'}}>MALICIOUS RATIO</div>
                      <div style={{fontSize: '1.3rem', fontWeight: 800, color: currentBotRatio > 45 ? 'var(--color-danger)' : currentBotRatio > 20 ? 'var(--color-warning)' : 'var(--color-success)'}}>
                        {currentBotRatio.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Threat Level status box */}
                  <div style={{
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    background: currentBotRatio > 45 ? 'rgba(239, 68, 68, 0.1)' : currentBotRatio > 20 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid',
                    borderColor: currentBotRatio > 45 ? 'rgba(239, 68, 68, 0.2)' : currentBotRatio > 20 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{fontSize: '0.78rem', fontWeight: 600}}>PLATFORM SOC STATE:</span>
                    <span style={{
                      fontWeight: 800, 
                      fontSize: '0.85rem', 
                      color: currentBotRatio > 45 ? 'var(--color-danger)' : currentBotRatio > 20 ? 'var(--color-warning)' : 'var(--color-success)'
                    }}>{threatLevel}</span>
                  </div>

                  {/* Ring Indicator & Subtype legend breakdown */}
                  <div className="donut-wrapper">
                    <span style={{fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, width: '100%'}}>THREAT DIVERSITY MIX</span>
                    
                    <div className="donut-legend">
                      {[
                        { name: 'Spambots', count: subtypeCounts['Commercial Spambot'] || 0, color: 'var(--color-danger)' },
                        { name: 'Inactive Bots', count: subtypeCounts['Inactive Follower Bot'] || 0, color: '#f59e0b' },
                        { name: 'Impersonators', count: subtypeCounts['Celebrity Impersonator'] || 0, color: '#ff7849' },
                        { name: 'Scrapers', count: subtypeCounts['Data Harvester / Scraper'] || 0, color: '#3b82f6' },
                        { name: 'Astroturfers', count: subtypeCounts['Political Astroturfer'] || 0, color: '#ec4899' },
                        { name: 'Hijacked Accounts', count: subtypeCounts['Compromised / Hijacked Account'] || 0, color: '#8b5cf6' }
                      ].map((item, idx) => (
                        <div key={idx} className="legend-item">
                          <span className="legend-dot" style={{backgroundColor: item.color}} />
                          <span style={{flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'}}>{item.name}</span>
                          <strong>{item.count}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live SOC Monitor Terminal Box */}
              <div className="soc-terminal-panel">
                <div className="soc-terminal-header">
                  <span>Security Operations Center Log</span>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <span className="soc-terminal-status-glow" />
                    <span>Real-Time Monitor</span>
                  </div>
                </div>
                <div className="soc-terminal-lines">
                  {terminalLogs.length === 0 ? (
                    <div style={{color: '#4b5563', fontStyle: 'italic', fontSize: '0.75rem', padding: '10px 0'}}>
                      System idle. Awaiting feed simulation startup...
                    </div>
                  ) : (
                    terminalLogs.map((log, logIdx) => (
                      <div key={logIdx} className={`soc-line ${log.type}`}>
                        {log.text}
                      </div>
                    ))
                  )}
                  <div ref={terminalBottomRef} />
                </div>
              </div>

              {/* Mini-inspector */}
              <div className="glass-card" style={{padding: '18px'}}>
                <div className="panel-header" style={{border: 'none', padding: '0', marginBottom: '8px'}}>
                  <h3 style={{fontSize: '0.9rem', fontWeight: 700}}>Profile Alert Card</h3>
                </div>
                {selectedFeedProfile ? (
                  <div style={{fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <strong>@{selectedFeedProfile.profile.username}</strong>
                      <span style={{color: selectedFeedProfile.analysis.is_fake ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 'bold'}}>
                        {(selectedFeedProfile.analysis.risk_probability * 100).toFixed(0)}% Risk
                      </span>
                    </div>
                    <div>
                      <div style={{color: 'var(--text-secondary)'}}>Category: {selectedFeedProfile.analysis.risk_classification}</div>
                      <div style={{color: 'var(--text-secondary)'}}>Mitigation: {selectedFeedProfile.action_taken}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{fontSize: '0.76rem', color: 'var(--text-secondary)', textAlign: 'center'}}>
                    Select any profile in the feed to pin here.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* TAB 2: PROFILE INSPECTOR */}
        {activeTab === 'inspector' && (
          <div className="inspector-layout">
            
            {/* Left: Input Form */}
            <div className="glass-card">
              <div className="panel-header" style={{border: 'none', padding: 0, marginBottom: '14px'}}>
                <h2>Profile Inspection & Threat Assessment</h2>
              </div>
              
              <div className="preset-templates-row">
                <button 
                  type="button"
                  className={`template-btn ${activeTemplate === 'genuine' ? 'active' : ''}`}
                  onClick={() => loadTemplate('genuine')}
                >
                  Genuine User
                </button>
                <button 
                  type="button"
                  className={`template-btn ${activeTemplate === 'spambot' ? 'active' : ''}`}
                  onClick={() => loadTemplate('spambot')}
                >
                  Commercial Spambot
                </button>
                <button 
                  type="button"
                  className={`template-btn ${activeTemplate === 'inactive' ? 'active' : ''}`}
                  onClick={() => loadTemplate('inactive')}
                >
                  Inactive Follower
                </button>
                <button 
                  type="button"
                  className={`template-btn ${activeTemplate === 'impersonator' ? 'active' : ''}`}
                  onClick={() => loadTemplate('impersonator')}
                >
                  Celeb Impersonator
                </button>
                <button 
                  type="button"
                  className={`template-btn ${activeTemplate === 'harvester' ? 'active' : ''}`}
                  onClick={() => loadTemplate('harvester')}
                >
                  Data Harvester
                </button>
                <button 
                  type="button"
                  className={`template-btn ${activeTemplate === 'astroturfer' ? 'active' : ''}`}
                  onClick={() => loadTemplate('astroturfer')}
                >
                  Political Astroturfer
                </button>
                <button 
                  type="button"
                  className={`template-btn ${activeTemplate === 'hijacked' ? 'active' : ''}`}
                  onClick={() => loadTemplate('hijacked')}
                >
                  Hijacked Account
                </button>
              </div>

              <form onSubmit={handleInspect}>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Username handle</label>
                    <input 
                      type="text" 
                      value={inspectorForm.username}
                      onChange={e => setInspectorForm({...inspectorForm, username: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Display name</label>
                    <input 
                      type="text" 
                      value={inspectorForm.display_name}
                      onChange={e => setInspectorForm({...inspectorForm, display_name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group" style={{marginBottom: '16px'}}>
                  <label>Bio text</label>
                  <textarea 
                    rows="3" 
                    value={inspectorForm.bio}
                    onChange={e => setInspectorForm({...inspectorForm, bio: e.target.value})}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Followers Count</label>
                    <input 
                      type="number" 
                      value={inspectorForm.followers_count}
                      onChange={e => setInspectorForm({...inspectorForm, followers_count: parseInt(e.target.value) || 0})}
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Following Count</label>
                    <input 
                      type="number" 
                      value={inspectorForm.following_count}
                      onChange={e => setInspectorForm({...inspectorForm, following_count: parseInt(e.target.value) || 0})}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Total Posts Count</label>
                    <input 
                      type="number" 
                      value={inspectorForm.posts_count}
                      onChange={e => setInspectorForm({...inspectorForm, posts_count: parseInt(e.target.value) || 0})}
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Posts per Day Frequency</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={inspectorForm.posts_frequency}
                      onChange={e => setInspectorForm({...inspectorForm, posts_frequency: parseFloat(e.target.value) || 0})}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Has Avatar Photo?</label>
                    <select 
                      value={inspectorForm.has_profile_pic}
                      onChange={e => setInspectorForm({...inspectorForm, has_profile_pic: parseInt(e.target.value)})}
                    >
                      <option value={1}>Yes (Default)</option>
                      <option value={0}>No (Avatar Blank)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Has Hyperlink in Bio?</label>
                    <select 
                      value={inspectorForm.has_link_in_bio}
                      onChange={e => setInspectorForm({...inspectorForm, has_link_in_bio: parseInt(e.target.value)})}
                    >
                      <option value={1}>Yes (Links Present)</option>
                      <option value={0}>No (None)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{marginBottom: '20px'}}>
                  <label>Recent Posts (New line separated)</label>
                  <textarea 
                    rows="3" 
                    value={inspectorForm.recent_posts.join('\n')}
                    onChange={e => setInspectorForm({...inspectorForm, recent_posts: e.target.value.split('\n')})}
                    placeholder="Enter recent posts text..."
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={inspectorLoading}>
                  {inspectorLoading ? 'Analyzing Account...' : 'Run Account Inspection'}
                </button>
              </form>
            </div>

            {/* Right: Inspection Report */}
            <div className="glass-card" style={{display: 'flex', flexDirection: 'column'}}>
              <div className="panel-header" style={{border: 'none', padding: 0, marginBottom: '14px'}}>
                <h2>Security Risk Assessment</h2>
              </div>

              {inspectorResult ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '20px', flex: 1}}>
                  <div className="risk-gauge-container">
                    <svg className="gauge-svg">
                      <circle className="gauge-bg" cx="90" cy="90" r="70" />
                      <circle 
                        className={`gauge-bar ${
                          inspectorResult.analysis.is_fake ? 'danger' : 'safe'
                        }`} 
                        cx="90" 
                        cy="90" 
                        r="70" 
                        strokeDasharray="439.8"
                        strokeDashoffset={439.8 - (439.8 * inspectorResult.analysis.risk_probability)}
                      />
                    </svg>
                    <div className="gauge-center-text">
                      <span className="gauge-percentage">{(inspectorResult.analysis.risk_probability * 100).toFixed(0)}%</span>
                      <span className="gauge-label">Risk Score</span>
                    </div>
                  </div>

                  <div className={`verdict-box ${inspectorResult.analysis.is_fake ? 'danger' : 'success'}`}>
                    {inspectorResult.analysis.is_fake ? (
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                        <Bot size={22} />
                        SUSPICIOUS PROFILE ({inspectorResult.analysis.risk_classification.toUpperCase()})
                      </div>
                    ) : (
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                        <ShieldCheck size={22} />
                        GENUINE USER CONFIRMED
                      </div>
                    )}
                  </div>

                  <div>
                    <span style={{fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600}}>EXTRACTED NLP FEATURE METRICS</span>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '8px'}}>
                      {[
                        { label: 'Spam keywords', value: `${(inspectorResult.extracted_features.spam_ratio*100).toFixed(1)}%` },
                        { label: 'All caps ratio', value: `${(inspectorResult.extracted_features.caps_ratio*100).toFixed(1)}%` },
                        { label: 'Sentiment', value: inspectorResult.extracted_features.sentiment.toFixed(2) },
                        { label: 'Unique Words', value: `${(inspectorResult.extracted_features.lexical_diversity*100).toFixed(1)}%` }
                      ].map((item, idx) => (
                        <div key={idx} style={{background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', textAlign: 'center'}}>
                          <div style={{fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '4px'}}>{item.label}</div>
                          <div style={{fontSize: '0.9rem', fontWeight: 700}}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span style={{fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600}}>RISK CLASSIFICATION REPORT EXPLANATIONS</span>
                    <div className="explanations-list">
                      {inspectorResult.analysis.explanations.map((exp, idx) => (
                        <div key={idx} className={`explanation-item ${exp.severity}`}>
                          <div className="explanation-icon">
                            {exp.severity === 'high' ? <AlertTriangle size={15} /> : exp.severity === 'medium' ? <Info size={15} /> : <CheckCircle size={15} />}
                          </div>
                          <div>
                            {exp.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-secondary)', gap: '14px'}}>
                  <Bot size={40} color="var(--text-muted)" />
                  <span>Configure the profile settings on the left and click **Run Account Inspection** to load the security report.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BATCH SCANNER */}
        {activeTab === 'batch' && (
          <div className="glass-card">
            <div className="panel-header">
              <h2>Batch Platform Audit</h2>
              <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                <label className="btn btn-primary" style={{cursor: 'pointer'}}>
                  <UploadCloud size={16} /> Upload profiles CSV
                  <input 
                    type="file" 
                    accept=".csv" 
                    style={{display: 'none'}} 
                    onChange={handleCsvUpload} 
                  />
                </label>
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginTop: '16px'}}>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <div className="form-group">
                  <label>Audit CSV Records (Comma Separated)</label>
                  <textarea 
                    rows="12"
                    style={{fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.4'}}
                    value={batchCsvText}
                    onChange={e => setBatchCsvText(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" onClick={handleBatchScan} disabled={batchLoading} style={{width: '100%'}}>
                  {batchLoading ? 'Scanning Bulk Profiles...' : 'Run Audit Scans'}
                </button>
              </div>

              <div>
                {batchResults ? (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                    
                    {/* Batch Summary */}
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px'}}>
                      <div style={{background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)'}}>
                        <div style={{fontSize: '0.78rem', color: 'var(--text-secondary)'}}>TOTAL ACCOUNTS AUDITED</div>
                        <div style={{fontSize: '1.6rem', fontWeight: 800}}>{batchResults.summary.total_scanned}</div>
                      </div>
                      <div style={{background: 'rgba(239,68,68,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)'}}>
                        <div style={{fontSize: '0.78rem', color: 'var(--color-danger)'}}>DETECTED BOTS</div>
                        <div style={{fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-danger)'}}>{batchResults.summary.detected_bots}</div>
                      </div>
                      <div style={{background: 'rgba(16,185,129,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.15)'}}>
                        <div style={{fontSize: '0.78rem', color: 'var(--color-success)'}}>GENUINE USERS</div>
                        <div style={{fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success)'}}>{batchResults.summary.detected_genuine}</div>
                      </div>
                    </div>

                    {/* Table Results */}
                    <div className="bulk-table-container" style={{maxHeight: '400px', overflowY: 'auto'}}>
                      <table className="bulk-table">
                        <thead>
                          <tr>
                            <th>Username</th>
                            <th>Followers</th>
                            <th>Following</th>
                            <th>Risk Score</th>
                            <th>Classification</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batchResults.results.map((res, idx) => {
                            const isFake = res.analysis.is_fake === 1;
                            return (
                              <tr key={idx}>
                                <td><strong>@{res.profile.username}</strong></td>
                                <td>{res.profile.followers_count.toLocaleString()}</td>
                                <td>{res.profile.following_count.toLocaleString()}</td>
                                <td style={{
                                  fontWeight: 700, 
                                  color: isFake ? 'var(--color-danger)' : 'var(--color-success)'
                                }}>
                                  {(res.analysis.risk_probability * 100).toFixed(0)}%
                                </td>
                                <td>
                                  <span className={`tag ${isFake ? 'tag-method' : 'badge-safe'}`} style={{
                                    background: isFake ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                                    color: isFake ? 'var(--color-danger)' : 'var(--color-success)',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontWeight: 700
                                  }}>
                                    {res.analysis.risk_classification}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', gap: '14px', padding: '40px 0'}}>
                    <Bot size={40} color="var(--text-muted)" />
                    <span>Upload a CSV file or modify the CSV data on the left to start bulk platform classification.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MODEL HUB */}
        {activeTab === 'model' && (
          <div className="model-hub-layout">
            
            {/* Left: Hyperparameters Retraining Controls */}
            <div className="glass-card">
              <div className="panel-header" style={{border: 'none', padding: 0, marginBottom: '14px'}}>
                <h2>Model Training Controls</h2>
              </div>

              <div className="form-group" style={{marginBottom: '16px'}}>
                <label>Classifier Architecture</label>
                <select 
                  value={modelConfig.classifier_type}
                  onChange={e => setModelConfig({...modelConfig, classifier_type: e.target.value})}
                >
                  <option value="random_forest">Random Forest Classifier</option>
                  <option value="gradient_boosting">Gradient Boosting Classifier</option>
                  <option value="logistic_regression">Logistic Regression Classifier</option>
                </select>
              </div>

              {modelConfig.classifier_type !== 'logistic_regression' && (
                <>
                  <div className="slider-group">
                    <div className="slider-labels">
                      <span>Estimators (Trees)</span>
                      <span className="slider-val">{modelConfig.n_estimators}</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="300" 
                      step="10"
                      className="slider-input"
                      value={modelConfig.n_estimators}
                      onChange={e => setModelConfig({...modelConfig, n_estimators: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="slider-group">
                    <div className="slider-labels">
                      <span>Max Tree Depth</span>
                      <span className="slider-val">{modelConfig.max_depth}</span>
                    </div>
                    <input 
                      type="range" 
                      min="2" 
                      max="20" 
                      step="1"
                      className="slider-input"
                      value={modelConfig.max_depth}
                      onChange={e => setModelConfig({...modelConfig, max_depth: parseInt(e.target.value)})}
                    />
                  </div>
                </>
              )}

              <div className="slider-group" style={{marginBottom: '24px'}}>
                <div className="slider-labels">
                  <span>Validation Test Split</span>
                  <span className="slider-val">{(modelConfig.test_size * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="0.5" 
                  step="0.05"
                  className="slider-input"
                  value={modelConfig.test_size}
                  onChange={e => setModelConfig({...modelConfig, test_size: parseFloat(e.target.value)})}
                />
              </div>

              <button className="btn btn-primary" style={{width: '100%'}} onClick={handleRetrain} disabled={isTraining}>
                {isTraining ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} /> Retraining Classifier...
                  </>
                ) : 'Retrain Classifier Model'}
              </button>
            </div>

            {/* Right: Validation Metrics Visualizations */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
              
              {/* Metrics Board */}
              <div className="glass-card">
                <div className="panel-header" style={{border: 'none', padding: 0, marginBottom: '14px'}}>
                  <h3 style={{fontSize: '1.1rem'}}>Algorithmic Test Metrics</h3>
                </div>
                
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px'}}>
                  {[
                    { label: 'Accuracy', val: `${(modelMetrics.accuracy * 100).toFixed(1)}%` },
                    { label: 'Precision', val: `${(modelMetrics.precision * 100).toFixed(1)}%` },
                    { label: 'Recall', val: `${(modelMetrics.recall * 100).toFixed(1)}%` },
                    { label: 'F1 Score', val: `${(modelMetrics.f1_score * 100).toFixed(1)}%` },
                    { label: 'ROC AUC', val: modelMetrics.auc.toFixed(3) }
                  ].map((m, idx) => (
                    <div key={idx} style={{background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', textAlign: 'center'}}>
                      <div style={{fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px'}}>{m.label}</div>
                      <div style={{fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)'}}>{m.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ROC & Confusion Matrix */}
              <div style={{display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px'}}>
                
                {/* Custom SVG ROC Curve */}
                <div className="glass-card" style={{display: 'flex', flexDirection: 'column', height: '340px'}}>
                  <div className="panel-header" style={{border: 'none', padding: 0, marginBottom: '10px'}}>
                    <h3 style={{fontSize: '0.95rem', fontWeight: 700}}>ROC (Receiver Operating Characteristic) Curve</h3>
                  </div>
                  
                  <div style={{flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <svg viewBox="-10 -5 120 115" style={{width: '90%', height: '90%'}}>
                      {/* Grid background */}
                      <line x1="0" y1="0" x2="100" y2="0" stroke="rgba(255,255,255,0.05)" />
                      <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" />
                      <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" />
                      <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.05)" />
                      <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.15)" />
                      
                      <line x1="0" y1="0" x2="0" y2="100" stroke="rgba(255,255,255,0.15)" />
                      <line x1="25" y1="0" x2="25" y2="100" stroke="rgba(255,255,255,0.05)" />
                      <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.05)" />
                      <line x1="75" y1="0" x2="75" y2="100" stroke="rgba(255,255,255,0.05)" />
                      <line x1="100" y1="0" x2="100" y2="100" stroke="rgba(255,255,255,0.05)" />
                      
                      {/* Diagonal Guess Line */}
                      <line x1="0" y1="100" x2="100" y2="0" stroke="rgba(255,255,255,0.12)" strokeDasharray="3" />
                      
                      {/* ROC Line path */}
                      {modelMetrics.roc_curve && modelMetrics.roc_curve.length > 0 && (
                        <>
                          <path 
                            d={`M 0 100 ${modelMetrics.roc_curve.map(pt => `L ${pt.fpr * 100} ${100 - pt.tpr * 100}`).join(' ')}`}
                            fill="none"
                            stroke="url(#rocGrad)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Translucent area under ROC */}
                          <path 
                            d={`M 0 100 ${modelMetrics.roc_curve.map(pt => `L ${pt.fpr * 100} ${100 - pt.tpr * 100}`).join(' ')} L 100 100 Z`}
                            fill="url(#rocAreaGrad)"
                            opacity="0.15"
                          />
                        </>
                      )}
                      
                      {/* Gradients */}
                      <defs>
                        <linearGradient id="rocGrad" x1="0" y1="1" x2="1" y2="0">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a78bfa" />
                        </linearGradient>
                        <linearGradient id="rocAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>

                      {/* Labels */}
                      <text x="-5" y="105" fill="var(--text-muted)" fontSize="5">0</text>
                      <text x="45" y="109" fill="var(--text-secondary)" fontSize="5.5">FPR (1 - Spec)</text>
                      <text x="96" y="105" fill="var(--text-muted)" fontSize="5">1.0</text>
                      
                      <text x="-12" y="52" fill="var(--text-secondary)" fontSize="5.5" transform="rotate(-90 -12 52)">TPR (Sensitivity)</text>
                      <text x="-8" y="4" fill="var(--text-muted)" fontSize="5">1.0</text>
                    </svg>
                  </div>
                </div>

                {/* Confusion Matrix cells */}
                <div className="glass-card" style={{display: 'flex', flexDirection: 'column', height: '340px'}}>
                  <div className="panel-header" style={{border: 'none', padding: 0, marginBottom: '16px'}}>
                    <h3 style={{fontSize: '0.95rem', fontWeight: 700}}>Validation Confusion Matrix</h3>
                  </div>
                  
                  <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <div className="cm-grid">
                      <div className="cm-cell correct">
                        <span className="cm-cell-val">{modelMetrics.confusion_matrix.tn}</span>
                        <span className="cm-cell-label">True Negatives</span>
                      </div>
                      <div className="cm-cell incorrect">
                        <span className="cm-cell-val">{modelMetrics.confusion_matrix.fp}</span>
                        <span className="cm-cell-label">False Positives</span>
                      </div>
                      <div className="cm-cell incorrect">
                        <span className="cm-cell-val">{modelMetrics.confusion_matrix.fn}</span>
                        <span className="cm-cell-label">False Negatives</span>
                      </div>
                      <div className="cm-cell correct">
                        <span className="cm-cell-val">{modelMetrics.confusion_matrix.tp}</span>
                        <span className="cm-cell-label">True Positives</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Feature Importances */}
              <div className="glass-card">
                <div className="panel-header" style={{border: 'none', padding: 0, marginBottom: '14px'}}>
                  <h3 style={{fontSize: '1.05rem'}}>Algorithmic Feature Weights Importance</h3>
                </div>
                
                {modelMetrics.feature_importances && modelMetrics.feature_importances.length > 0 ? (
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                    {/* Left list */}
                    <div className="feature-list">
                      {modelMetrics.feature_importances.slice(0, 7).map((item, idx) => (
                        <div key={idx} className="feature-bar-row">
                          <div className="feature-bar-info">
                            <span className="feature-bar-name">{item.feature.replace(/_/g, ' ')}</span>
                            <span className="feature-bar-val">{(item.importance * 100).toFixed(1)}%</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{width: `${item.importance * 100}%`}} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Right list */}
                    <div className="feature-list">
                      {modelMetrics.feature_importances.slice(7).map((item, idx) => (
                        <div key={idx} className="feature-bar-row">
                          <div className="feature-bar-info">
                            <span className="feature-bar-name">{item.feature.replace(/_/g, ' ')}</span>
                            <span className="feature-bar-val">{(item.importance * 100).toFixed(1)}%</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{width: `${item.importance * 100}%`}} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0'}}>
                    No feature weights data available. Retrain the model to compute weights.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: DEVELOPERS API */}
        {activeTab === 'api' && (
          <div className="glass-card">
            <div className="panel-header">
              <h2>SybilGuard REST Engine API Playground</h2>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px'}}>
              
              {/* Endpoint Documentation */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', maxHeight: '600px'}}>
                
                <div className="api-endpoint-card">
                  <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                    <span className="tag tag-method">POST</span>
                    <span className="api-route">/api/login</span>
                  </div>
                  <p style={{fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '12px'}}>
                    Validates user credentials and returns session token with user permissions. Gated landing credentials.
                  </p>
                  <button className="btn" onClick={() => {
                    setApiConsoleEndpoint('/api/login');
                    setApiConsoleResponse(null);
                  }}>
                    Load in Console
                  </button>
                </div>

                <div className="api-endpoint-card">
                  <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                    <span className="tag tag-method">POST</span>
                    <span className="api-route">/api/analyze</span>
                  </div>
                  <p style={{fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '12px'}}>
                    Analyzes a single profile payload. Extracts all NLP and metadata parameters, running inference against both the binary risk and multi-class classification pipelines.
                  </p>
                  <button className="btn" onClick={() => {
                    setApiConsoleEndpoint('/api/analyze');
                    setApiConsoleResponse(null);
                  }}>
                    Load in Console
                  </button>
                </div>

                <div className="api-endpoint-card">
                  <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                    <span className="tag tag-method" style={{background: '#3b82f6'}}>GET</span>
                    <span className="api-route">/api/model/metrics</span>
                  </div>
                  <p style={{fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '12px'}}>
                    Retrieves active classifier configuration and metrics, including standard validation scores, ROC coordinates, and coefficients.
                  </p>
                  <button className="btn" onClick={() => {
                    setApiConsoleEndpoint('/api/model/metrics');
                    setApiConsoleResponse(null);
                  }}>
                    Load in Console
                  </button>
                </div>

                <div className="api-endpoint-card">
                  <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                    <span className="tag tag-method">POST</span>
                    <span className="api-route">/api/model/retrain</span>
                  </div>
                  <p style={{fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '12px'}}>
                    Dynamically retrains both Scikit-learn models (binary risk classifier and multiclass subtype classifier) using chosen algorithm types and validation split sizing.
                  </p>
                  <button className="btn" onClick={() => {
                    setApiConsoleEndpoint('/api/model/retrain');
                    setApiConsoleResponse(null);
                  }}>
                    Load in Console
                  </button>
                </div>
              </div>

              {/* Interactive Request Console */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <div style={{
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--glass-border)',
                  padding: '16px', 
                  borderRadius: '10px'
                }}>
                  <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '10px'}}>CONSOLE REQUEST TARGET</div>
                  <div style={{display: 'flex', gap: '8px', alignItems: 'center', background: '#03050a', padding: '10px', borderRadius: '6px'}}>
                    <span className="tag tag-method" style={{
                      background: apiConsoleEndpoint.includes('metrics') ? '#3b82f6' : '#10b981',
                      fontSize: '0.68rem'
                    }}>{apiConsoleEndpoint.includes('metrics') ? 'GET' : 'POST'}</span>
                    <span style={{fontFamily: 'monospace', fontSize: '0.85rem', color: '#fff'}}>{apiConsoleEndpoint}</span>
                  </div>

                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', marginBottom: '8px'}}>
                    <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600}}>AUTO PAYLOAD COMPILER</span>
                    <button className="btn" onClick={triggerApiPlayground} style={{padding: '5px 12px', fontSize: '0.78rem'}}>
                      Execute Request
                    </button>
                  </div>

                  <div className="code-block-wrapper" style={{maxHeight: '140px'}}>
                    {apiConsoleEndpoint === '/api/analyze' && (
                      JSON.stringify(inspectorForm, null, 2)
                    )}
                    {apiConsoleEndpoint === '/api/model/retrain' && (
                      JSON.stringify(modelConfig, null, 2)
                    )}
                    {apiConsoleEndpoint === '/api/login' && (
                      JSON.stringify(loginCredentials, null, 2)
                    )}
                    {apiConsoleEndpoint === '/api/model/metrics' && (
                      "// GET Request - No Body payload required"
                    )}
                  </div>
                </div>

                <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                  <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px'}}>RESPONSE PAYLOAD</span>
                  <div className="code-block-wrapper" style={{flex: 1, maxHeight: '280px', color: '#34d399', background: '#020306'}}>
                    {apiConsoleResponse ? (
                      <pre style={{whiteSpace: 'pre-wrap'}}>{JSON.stringify(apiConsoleResponse, null, 2)}</pre>
                    ) : (
                      "// No response payload loaded. Execute the request above."
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
