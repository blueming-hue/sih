import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchQuestions, submitPHQ9, submitGAD7, submitGHQ12, fetchHistory } from '../utils/assessments';
import { Loader2, ClipboardList, CheckCircle2, History, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ASSESSMENT_TYPES = [
  { key: 'phq9', label: 'PHQ-9 (Depression)' },
  { key: 'gad7', label: 'GAD-7 (Anxiety)' },
  { key: 'ghq12', label: 'GHQ-12 (Self-Check)' },
];

// Fallback question sets in case backend is unavailable
const FALLBACK = {
  phq9: {
    type: 'PHQ-9',
    title: 'Depression Screening (PHQ-9)',
    description: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    scale: {
      '0': 'Not at all',
      '1': 'Several days',
      '2': 'More than half the days',
      '3': 'Nearly every day',
    },
    questions: [
      { id: 1, text: 'Little interest or pleasure in doing things' },
      { id: 2, text: 'Feeling down, depressed, or hopeless' },
      { id: 3, text: 'Trouble falling or staying asleep, or sleeping too much' },
      { id: 4, text: 'Feeling tired or having little energy' },
      { id: 5, text: 'Poor appetite or overeating' },
      { id: 6, text: 'Feeling bad about yourself - or that you are a failure or have let yourself or your family down' },
      { id: 7, text: 'Trouble concentrating on things, such as reading the newspaper or watching television' },
      { id: 8, text: 'Moving or speaking so slowly that other people could have noticed, or being so fidgety or restless' },
      { id: 9, text: 'Thoughts that you would be better off dead, or of hurting yourself' },
    ],
  },
  gad7: {
    type: 'GAD-7',
    title: 'Anxiety Screening (GAD-7)',
    description: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    scale: {
      '0': 'Not at all',
      '1': 'Several days',
      '2': 'More than half the days',
      '3': 'Nearly every day',
    },
    questions: [
      { id: 1, text: 'Feeling nervous, anxious, or on edge' },
      { id: 2, text: 'Not being able to stop or control worrying' },
      { id: 3, text: 'Worrying too much about different things' },
      { id: 4, text: 'Trouble relaxing' },
      { id: 5, text: 'Being so restless that it is hard to sit still' },
      { id: 6, text: 'Becoming easily annoyed or irritable' },
      { id: 7, text: 'Feeling afraid, as if something awful might happen' },
    ],
  },
  ghq12: {
    type: 'GHQ-12',
    title: 'Psychological Self-Check (GHQ-12)',
    description: 'Thinking about the last few weeks, please choose the option that best fits each statement.',
    scale: {
      '0': 'Better than usual',
      '1': 'Same as usual',
      '2': 'Less than usual',
      '3': 'Much less than usual',
    },
    questions: [
      { id: 1, text: "Been able to concentrate on what you're doing?" },
      { id: 2, text: 'Lost much sleep over worry?' },
      { id: 3, text: 'Felt that you are playing a useful part in things?' },
      { id: 4, text: 'Felt capable of making decisions about things?' },
      { id: 5, text: 'Felt constantly under strain?' },
      { id: 6, text: "Felt you couldn't overcome your difficulties?" },
      { id: 7, text: 'Been able to enjoy your normal day-to-day activities?' },
      { id: 8, text: 'Been able to face up to your problems?' },
      { id: 9, text: 'Been feeling unhappy and depressed?' },
      { id: 10, text: 'Been losing confidence in yourself?' },
      { id: 11, text: 'Been thinking of yourself as a worthless person?' },
      { id: 12, text: 'Been feeling reasonably happy, all things considered?' },
    ],
  },
};

const StepButton = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`btn-primary inline-flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

const Assessment = () => {
  const { user } = useAuth();
  const [type, setType] = useState('phq9');
  const [meta, setMeta] = useState(null); // questions + scale
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0); // 0 = choose, 1 = questions, 2 = result
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [perQuestionMode, setPerQuestionMode] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        const res = await fetchHistory(user.uid, 20);
        setHistory(res.items || []);
      } catch (e) {
        // history is optional
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [user]);

  const questionCount = useMemo(() => meta?.questions?.length || 0, [meta]);

  const startAssessment = async () => {
    try {
      setLoadingMeta(true);
      setResult(null);
      setAnswers({});
      setStep(1);
      try {
        const q = await fetchQuestions(type);
        if (q.error) throw new Error(q.error);
        setMeta(q);
      } catch (e) {
        // Fallback to client-side questions
        const fb = FALLBACK[type];
        if (fb) {
          setMeta(fb);
        } else {
          throw e;
        }
      }
    } catch (e) {
      toast.error('Failed to load questions');
      setStep(0);
    } finally {
      setLoadingMeta(false);
    }
  };

  const setAnswer = (qid, val) => {
    setAnswers(prev => ({ ...prev, [qid]: Number(val) }));
  };

  const canSubmit = useMemo(() => {
    if (!meta) return false;
    const ids = (meta.questions || []).map(q => q.id);
    return ids.every(id => Number.isFinite(answers[id]));
  }, [meta, answers]);

  const handleSubmit = async () => {
    if (!user) return toast.error('Please sign in');
    if (!canSubmit) return toast.error('Please answer all questions');

    try {
      setSubmitting(true);
      const responses = (meta.questions || []).map(q => Number(answers[q.id]));
      let res;
      if (type === 'phq9') res = await submitPHQ9(responses, user.uid);
      else if (type === 'gad7') res = await submitGAD7(responses, user.uid);
      else res = await submitGHQ12(responses, user.uid);
      setResult(res);
      setStep(2);
      toast.success('Assessment completed');
      // refresh history
      try {
        const h = await fetchHistory(user.uid, 20);
        setHistory(h.items || []);
      } catch {}
    } catch (e) {
      if (type === 'ghq12') {
        // Local fallback scoring for GHQ-12 (Likert 0-3) if backend unavailable
        const responses = (meta.questions || []).map(q => Number(answers[q.id]));
        const total = responses.reduce((a,b)=>a+(Number.isFinite(b)?b:0),0);
        const sev = total <= 12 ? 'minimal' : total <= 20 ? 'mild' : total <= 26 ? 'moderate' : 'severe';
        const descriptionMap = {
          minimal: 'Typical range of everyday stress',
          mild: 'Mild psychological distress',
          moderate: 'Moderate psychological distress',
          severe: 'High psychological distress',
        };
        const recsMap = {
          severe: [
            'Consider reaching out for professional support soon',
            'Short, regular check-ins with a counsellor can help',
            'Prioritize rest, hydration, and gentle routines',
            'Try brief grounding or breathing exercises daily',
          ],
          moderate: [
            'Talking with a counsellor could be helpful',
            'Practice daily stress-management (breathing, short walks)',
            'Break tasks into small, manageable steps',
            'Stay connected with supportive people',
          ],
          mild: [
            'Self-care and simple routines can make a difference',
            'Try short relaxation exercises and gentle movement',
            'Keep track of what helps you feel a bit better',
          ],
          minimal: [
            'Keep up your supportive routines',
            'Check in with yourself regularly',
            'Save helpful resources for future reference',
          ],
        };
        const localResult = {
          score: total,
          severity: sev,
          description: descriptionMap[sev],
          recommendations: recsMap[sev],
          assessment_type: 'GHQ-12',
          note: 'Local result shown because the server is unavailable; history was not saved.',
        };
        setResult(localResult);
        setStep(2);
        toast.success('Assessment completed (local)');
      } else {
        toast.error('Submission failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (q) => {
    const scale = meta?.scale || {};
    return (
      <div key={q.id} className="mb-4">
        <div className="font-medium text-gray-900 mb-2">{q.id}. {q.text}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {Object.entries(scale).map(([val, label]) => (
            <label key={val} className={`border rounded-lg p-3 cursor-pointer flex items-center gap-2 ${answers[q.id] === Number(val) ? 'border-primary-400 bg-primary-50' : 'border-gray-200'}`}>
              <input
                type="radio"
                name={`q_${q.id}`}
                value={val}
                checked={answers[q.id] === Number(val)}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                className="hidden"
              />
              <span className="text-sm text-gray-800">{label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => { setCurrentIndex(0); }, [meta]);

  const currentQuestion = useMemo(() => meta?.questions?.[currentIndex], [meta, currentIndex]);

  const severityColor = (sev) => {
    switch ((sev || '').toLowerCase()) {
      case 'severe': return 'text-red-600';
      case 'moderately_severe': return 'text-red-500';
      case 'moderate': return 'text-orange-600';
      case 'mild': return 'text-yellow-600';
      case 'minimal': return 'text-green-600';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary-100 rounded-lg"><ClipboardList className="w-5 h-5 text-primary-600" /></div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Self-Assessment</h2>
            <p className="text-sm text-gray-600">A gentle self-check to understand how you’ve been feeling. This isn’t a diagnosis.</p>
          </div>
        </div>

        {/* Step 0: Select type */}
        {step === 0 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ASSESSMENT_TYPES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={`p-3 rounded-lg border text-left ${type === key ? 'border-primary-400 bg-primary-50' : 'border-gray-200 bg-white'}`}
                >
                  <div className="font-medium text-gray-900">{label}</div>
                  <div className="text-sm text-gray-600 mt-1">Takes ~2-4 minutes</div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={perQuestionMode} onChange={() => setPerQuestionMode(v => !v)} />
                  Show one question at a time
                </label>
              </div>
              <StepButton onClick={startAssessment}>
                <ClipboardList className="w-4 h-4" /> Start
              </StepButton>
            </div>
          </div>
        )}

        {/* Step 1: Questions */}
        {step === 1 && (
          <div>
            {loadingMeta && (
              <div className="flex items-center gap-2 text-gray-700"><Loader2 className="w-4 h-4 animate-spin" /> Loading questions…</div>
            )}
            {meta && (
              <>
                <div className="mb-4">
                  <div className="text-sm text-gray-500">{meta?.type} • {questionCount} questions</div>
                  <div className="font-medium text-gray-900">{meta?.title}</div>
                  <div className="text-sm text-gray-600">{meta?.description}</div>
                </div>

                {perQuestionMode ? (
                  <div>
                    {currentQuestion && renderQuestion(currentQuestion)}
                    <div className="flex items-center justify-between mt-4">
                      <button
                        className="btn-secondary inline-flex items-center gap-2"
                        onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                        disabled={currentIndex === 0}
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous
                      </button>
                      <div className="text-sm text-gray-600">{currentIndex + 1} / {questionCount}</div>
                      {currentIndex < questionCount - 1 ? (
                        <button
                          className="btn-primary inline-flex items-center gap-2"
                          onClick={() => setCurrentIndex(i => Math.min(questionCount - 1, i + 1))}
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <StepButton onClick={handleSubmit} disabled={!canSubmit || submitting}>
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Submit
                        </StepButton>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    {(meta.questions || []).map(renderQuestion)}
                    <div className="mt-4 flex items-center justify-end">
                      <StepButton onClick={handleSubmit} disabled={!canSubmit || submitting}>
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Submit
                      </StepButton>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Results */}
        {step === 2 && result && (
          <div>
            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">Result</div>
              <div className={`text-2xl font-bold ${severityColor(result.severity)} capitalize`}>{result.severity || '—'}</div>
              <div className="text-gray-700 mt-1">{result.description}</div>
              <div className="text-sm text-gray-600 mt-2">Score: {result.score}</div>
              <div className="mt-4">
                <div className="font-medium text-gray-900 mb-2">Gentle suggestions</div>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm">
                  {(result.recommendations || []).slice(0,6).map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
                <div className="mt-3 text-sm text-gray-600 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5" />
                  This is a self-check to help you reflect. It’s not a diagnosis. If you’re concerned, consider speaking with a counsellor.
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button className="btn-secondary" onClick={() => { setStep(0); setResult(null); }}>Take another</button>
                <a className="btn-secondary" href="/chatbot">Discuss with AI assistant</a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="mt-8 card">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-gray-600" />
          <div className="font-semibold text-gray-900">Your recent self-checks</div>
        </div>
        {loadingHistory ? (
          <div className="text-gray-600 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : (
          <div className="space-y-2">
            {history.length === 0 && (
              <div className="text-gray-600 text-sm">No assessments yet. Try a quick self-check above.</div>
            )}
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">{h.type}</div>
                  <div className="text-sm text-gray-600">{new Date(h.timestamp || Date.now()).toLocaleString()}</div>
                </div>
                <div className={`font-semibold ${severityColor(h.severity)} capitalize`}>{h.severity}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Assessment;
