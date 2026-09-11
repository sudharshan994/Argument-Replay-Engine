import { useEffect, useMemo, useRef, useState } from 'react';
import GraphCanvas from './components/GraphCanvas';
import InsightPanel from './components/InsightPanel';
import SpeakerPanel from './components/SpeakerPanel';
import axios from 'axios';
import './App.css';



















// Navigation and sidebar removed per user request – UI simplified.



const PRESETS = {
  climate: `Alice: Climate change is primarily caused by human activity and carbon emissions
Bob: The climate has always changed naturally over millions of years, so humans are not the main cause
Carol: Natural cycles exist, but the current rate of warming is unusually fast in geological history
Dave: The scientific consensus strongly supports human-caused warming
Eve: Scientists just say what gets them funding
Frank: Can someone explain why temperatures rose so sharply after industrialization?
Bob: Solar activity could explain the warming instead of carbon emissions
Carol: Solar activity has declined since the 1980s while temperatures continued rising
Dave: The greenhouse effect has been understood since the 1800s
Alice: Fossil fuel carbon has a measurable isotopic signature in the atmosphere
Frank: Both sides raised points, but the evidence seems stronger for human causation`,
  aiEthics: `Alex: AI systems should be open-sourced to democratize technology.
Sam: Open-sourcing powerful AI is dangerous and could be weaponized by bad actors.
Jordan: We need a middle ground with gated releases and safety audits.
Casey: How do you even define 'powerful AI' objectively?
Alex: Most safety concerns are just regulatory capture by big tech.
Sam: That's an ad hominem. Regulatory capture exists, but the risks of bioweapons are real.
Casey: Open source allows independent researchers to actually find and patch vulnerabilities.
Jordan: Agreed, open source improves security in the long run.`,
  vaccine: `Sarah: Vaccines should be mandatory for all public school children to achieve herd immunity.
Mike: Mandates violate personal bodily autonomy and parental rights.
Elena: But your autonomy ends when it puts immunocompromised children at risk.
David: What are the long-term side effects of the newer vaccines?
Sarah: The side effects are overwhelmingly minor compared to the diseases they prevent.
Mike: Big pharma just wants forced customers.
Elena: Focusing on profit motives doesn't invalidate the epidemiological data.
David: I support vaccines, but mandates make people more hesitant, not less.`
};

export default function App() {
  const [rawText, setRawText] = useState('');
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Replay state
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef(null);

  // Theme state
  const [darkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const inputStats = useMemo(() => {
    const lines = rawText.split('\n').map(line => line.trim()).filter(Boolean);
    const valid = lines.filter(line => /^([^:]{1,80}):\s+(.+)$/.test(line));
    return {
      lines: lines.length,
      valid: valid.length,
      ready: valid.length >= 2,
    };
  }, [rawText]);

  useEffect(() => {
    if (playing && graph) {
      const max = graph.nodes.length - 1;
      intervalRef.current = setInterval(() => {
        setStep(prev => {
          if (prev >= max) {
            setPlaying(false);
            clearInterval(intervalRef.current);
            return max;
          }
          return prev + 1;
        });
      }, 1200); // 1.2s per step
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, graph]);

  async function analyze(textToAnalyze = rawText) {
    const lines = textToAnalyze.split('\n').map(line => line.trim()).filter(Boolean);
    const validCount = lines.filter(line => /^([^:]{1,80}):\s+(.+)$/.test(line)).length;

    if (validCount < 2) {
      setError('Add at least two comments in "name: message" format.');
      return;
    }

    setLoading(true);
    setError(null);
    setGraph(null);
    setStep(0);
    setPlaying(false);

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const { data } = await axios.post(`${API_URL}/api/analyze`, { rawText: textToAnalyze }, { timeout: 120000 });
      if (data.error) {
        setError(data.error);
        return;
      }
      setGraph(data);
      document.getElementById('replay')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Server error.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function loadPreset(key) {
    const preset = PRESETS[key];
    setRawText(preset);
    setTimeout(() => analyze(preset), 0);
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200 flex">
      <main className="w-full max-w-6xl mx-auto p-4 md:p-6">
            <div className="mb-8">
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                Turn noisy debate threads into an elegant live map of claims, attacks, support, and questions.
              </p>
              
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <span className="text-sm text-slate-500 py-2">Presets:</span>
                <button onClick={() => loadPreset('climate')} className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200">Climate Change</button>
                <button onClick={() => loadPreset('aiEthics')} className="px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-200">AI Ethics</button>
                <button onClick={() => loadPreset('vaccine')} className="px-3 py-1 text-sm bg-green-50 text-green-700 rounded-full hover:bg-green-100 dark:bg-green-900 dark:text-green-200">Vaccine Policy</button>
              </div>

              <textarea
                className="w-full h-64 p-4 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 resize-y"
                placeholder="Alice: I think X is true.&#10;Bob: No, X is false because of Y."
                value={rawText}
                onChange={e => setRawText(e.target.value)}
              />
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-slate-500">
                  {inputStats.valid} valid comments / {inputStats.lines} total lines
                </div>
                <button 
                  id="analyze-btn"
                  onClick={analyze}
                  disabled={!inputStats.ready || loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Analyzing...' : 'Analyze Thread'}
                </button>
              </div>
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}
            </div>

            {graph && (
              <div id="replay" className="space-y-8 animate-fade-in">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Argument Map</h2>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setPlaying(!playing)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600 font-medium"
                      >
                        {playing ? '⏸ Pause' : '▶ Play'}
                      </button>
                      <span className="text-sm font-medium w-16 text-right">
                        {step + 1} / {graph.nodes.length}
                      </span>
                    </div>
                  </div>
                  
                  <GraphCanvas graph={graph} replayStep={step} />
                </div>

                <InsightPanel graph={graph} />
                <SpeakerPanel graph={graph} />
              </div>
            )}
      </main>
    </div>
  );
}
