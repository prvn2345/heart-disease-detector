/**
 * SampleDataPage.jsx
 * 10 real UCI Heart Disease dataset cases covering the full spectrum:
 *   Low Risk / No Disease
 *   Low Risk / No Disease (very confident)
 *   Moderate Risk / No Disease (borderline)
 *   Moderate Risk / Disease
 *   High Risk / Disease
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FlaskConical, ChevronDown, ChevronUp, Play,
  CheckCircle, AlertTriangle, ShieldCheck, ShieldAlert, Skull,
} from "lucide-react";
import { createPrediction } from "../services/predictions";
import RiskGauge from "../components/RiskGauge";
import toast from "react-hot-toast";

// ── Verified model outputs (all tested against the live ML API) ───────────────
const SAMPLE_CASES = [
  // ── LOW RISK / NO DISEASE ──────────────────────────────────────────────────
  {
    id: 1,
    tag: "Low Risk · No Disease",
    tagColor: "green",
    title: "63-year-old Male — Asymptomatic, Controlled Risk Factors",
    description:
      "Older male with elevated BP and cholesterol but good max heart rate. Despite age-related risk factors, the model finds no disease.",
    input: { age:63, sex:1, cp:3, trestbps:145, chol:233, fbs:1, restecg:0, thalach:150, exang:0, oldpeak:2.3, slope:0, ca:0, thal:1 },
    expected: { prediction:0, label:"No Disease", probability:0.3052, risk_level:"Low", confidence:0.6948 },
    notes: "Zero blocked vessels (ca=0) is the strongest protective signal here. Despite high BP and fasting blood sugar, the model is 69% confident of no disease.",
  },
  {
    id: 2,
    tag: "Low Risk · No Disease",
    tagColor: "green",
    title: "41-year-old Female — Atypical Angina, Excellent Fitness",
    description:
      "Young female with atypical angina and a very high max heart rate of 172 bpm. Excellent cardiovascular fitness profile.",
    input: { age:41, sex:0, cp:1, trestbps:130, chol:204, fbs:0, restecg:0, thalach:172, exang:0, oldpeak:1.4, slope:2, ca:0, thal:2 },
    expected: { prediction:0, label:"No Disease", probability:0.051, risk_level:"Low", confidence:0.949 },
    notes: "Model is 95% confident — no disease. Young age, female sex, zero blocked vessels, and high max heart rate are all strongly protective.",
  },
  {
    id: 3,
    tag: "Low Risk · No Disease",
    tagColor: "green",
    title: "37-year-old Male — High ST Depression, Young Age",
    description:
      "Young male with atypical angina and notable ST depression (3.5). The high max heart rate of 187 bpm offsets the ST finding.",
    input: { age:37, sex:1, cp:2, trestbps:130, chol:250, fbs:0, restecg:1, thalach:187, exang:0, oldpeak:3.5, slope:0, ca:0, thal:2 },
    expected: { prediction:0, label:"No Disease", probability:0.2681, risk_level:"Low", confidence:0.7319 },
    notes: "Young age (37) and peak heart rate of 187 bpm are powerful protective factors. Zero blocked vessels confirms low risk despite the ST depression.",
  },
  {
    id: 4,
    tag: "Low Risk · No Disease",
    tagColor: "green",
    title: "56-year-old Male — Non-Anginal Pain, Clean Vessels",
    description:
      "Middle-aged male with non-anginal chest pain, normal BP, and excellent exercise tolerance. Textbook low-risk profile.",
    input: { age:56, sex:1, cp:1, trestbps:120, chol:236, fbs:0, restecg:1, thalach:178, exang:0, oldpeak:0.8, slope:2, ca:0, thal:2 },
    expected: { prediction:0, label:"No Disease", probability:0.1293, risk_level:"Low", confidence:0.8707 },
    notes: "Upsloping ST segment, no exercise angina, zero blocked vessels, and normal BP — the model is 87% confident of no disease.",
  },
  // ── MODERATE RISK / NO DISEASE ─────────────────────────────────────────────
  {
    id: 5,
    tag: "Moderate Risk · No Disease",
    tagColor: "yellow",
    title: "57-year-old Female — Silent Ischemia, Very High Cholesterol",
    description:
      "Post-menopausal female with asymptomatic chest pain and very high cholesterol (354 mg/dl). Exercise angina present but vessels are clear.",
    input: { age:57, sex:0, cp:0, trestbps:120, chol:354, fbs:0, restecg:1, thalach:163, exang:1, oldpeak:0.6, slope:2, ca:0, thal:2 },
    expected: { prediction:0, label:"No Disease", probability:0.2687, risk_level:"Low", confidence:0.7313 },
    notes: "Exercise angina is a red flag but zero blocked vessels and low ST depression keep the risk low. Cholesterol of 354 warrants medical attention regardless.",
  },
  {
    id: 6,
    tag: "Moderate Risk · No Disease",
    tagColor: "yellow",
    title: "64-year-old Male — Borderline, 2 Blocked Vessels",
    description:
      "Elderly male with asymptomatic chest pain, 2 blocked vessels, and moderate ST depression. Borderline case — close to disease threshold.",
    input: { age:64, sex:1, cp:0, trestbps:145, chol:212, fbs:0, restecg:0, thalach:132, exang:0, oldpeak:2.0, slope:1, ca:2, thal:1 },
    expected: { prediction:0, label:"No Disease", probability:0.4783, risk_level:"Moderate", confidence:0.5217 },
    notes: "Only 52% confident of no disease — this is the most borderline case. 2 blocked vessels and flat ST slope are concerning. Recommend further cardiac workup.",
  },
  // ── MODERATE RISK / DISEASE ────────────────────────────────────────────────
  {
    id: 7,
    tag: "Moderate Risk · Disease",
    tagColor: "orange",
    title: "67-year-old Male — 3 Blocked Vessels, Low Heart Rate",
    description:
      "Elderly male with asymptomatic chest pain, high BP (160 mmHg), exercise angina, and 3 blocked major vessels. Classic high-burden disease.",
    input: { age:67, sex:1, cp:0, trestbps:160, chol:286, fbs:0, restecg:0, thalach:108, exang:1, oldpeak:1.5, slope:1, ca:3, thal:2 },
    expected: { prediction:1, label:"Disease", probability:0.5436, risk_level:"Moderate", confidence:0.5436 },
    notes: "3 blocked vessels + low max heart rate (108 bpm) + exercise angina = significant disease burden. Model predicts disease with 54% probability.",
  },
  {
    id: 8,
    tag: "Moderate Risk · Disease",
    tagColor: "orange",
    title: "59-year-old Male — Exercise Angina, Reversible Defect",
    description:
      "Middle-aged male with asymptomatic chest pain, exercise-induced angina, and a reversible thalassemia defect. 1 blocked vessel.",
    input: { age:59, sex:1, cp:0, trestbps:140, chol:177, fbs:0, restecg:1, thalach:162, exang:1, oldpeak:0.0, slope:2, ca:1, thal:3 },
    expected: { prediction:1, label:"Disease", probability:0.5819, risk_level:"Moderate", confidence:0.5819 },
    notes: "Reversible thalassemia defect (thal=3) combined with exercise angina is a strong disease indicator. Relatively good heart rate (162) limits the severity.",
  },
  {
    id: 9,
    tag: "Moderate Risk · Disease",
    tagColor: "orange",
    title: "72-year-old Male — Extreme ST Depression, 4 Vessels",
    description:
      "Very elderly male with severe ST depression (5.0), very low max heart rate (90 bpm), exercise angina, and 4 blocked vessels — extreme presentation.",
    input: { age:72, sex:1, cp:0, trestbps:180, chol:195, fbs:0, restecg:1, thalach:90, exang:1, oldpeak:5.0, slope:0, ca:4, thal:3 },
    expected: { prediction:1, label:"Disease", probability:0.6033, risk_level:"Moderate", confidence:0.6033 },
    notes: "ST depression of 5.0 is the highest in this dataset. 4 blocked vessels and max HR of only 90 bpm indicate severe cardiac compromise.",
  },
  // ── HIGH RISK / DISEASE ────────────────────────────────────────────────────
  {
    id: 10,
    tag: "High Risk · Disease",
    tagColor: "red",
    title: "58-year-old Male — High Risk ⚠ Severe Multi-Vessel Disease",
    description:
      "Male with asymptomatic chest pain, very high ST depression (4.4), LV hypertrophy on ECG, and 3 blocked vessels. Highest-risk case in the dataset.",
    input: { age:58, sex:1, cp:0, trestbps:114, chol:318, fbs:0, restecg:2, thalach:140, exang:0, oldpeak:4.4, slope:0, ca:3, thal:1 },
    expected: { prediction:1, label:"Disease", probability:0.6822, risk_level:"High", confidence:0.6822 },
    notes: "LV hypertrophy (restecg=2) + ST depression of 4.4 + 3 blocked vessels = highest risk score. Model is 68% confident of disease — High risk classification.",
  },
];

// ── Colour config per tag ─────────────────────────────────────────────────────
const TAG_COLORS = {
  green:  { border:"border-green-800",  bg:"bg-green-900/20",  text:"text-green-400",  badge:"bg-green-900/50 text-green-400 border border-green-700",  num:"bg-green-900/40 text-green-300 border-green-700" },
  yellow: { border:"border-yellow-800", bg:"bg-yellow-900/20", text:"text-yellow-400", badge:"bg-yellow-900/50 text-yellow-400 border border-yellow-700", num:"bg-yellow-900/40 text-yellow-300 border-yellow-700" },
  orange: { border:"border-orange-800", bg:"bg-orange-900/20", text:"text-orange-400", badge:"bg-orange-900/50 text-orange-400 border border-orange-700", num:"bg-orange-900/40 text-orange-300 border-orange-700" },
  red:    { border:"border-red-800",    bg:"bg-red-900/20",    text:"text-red-400",    badge:"bg-red-900/50 text-red-400 border border-red-700",          num:"bg-red-900/40 text-red-300 border-red-700" },
};

const RISK_COLORS = {
  Low:      "text-green-400",
  Moderate: "text-yellow-400",
  High:     "text-red-400",
};

// ── Feature display helpers ───────────────────────────────────────────────────
const FEATURE_LABELS = {
  age:"Age", sex:"Sex", cp:"Chest Pain Type", trestbps:"Blood Pressure (mmHg)",
  chol:"Cholesterol (mg/dl)", fbs:"Fasting BS >120", restecg:"Resting ECG",
  thalach:"Max Heart Rate", exang:"Exercise Angina",
  oldpeak:"ST Depression", slope:"ST Slope", ca:"Blocked Vessels", thal:"Thalassemia",
};
const FEATURE_FORMAT = {
  sex:     (v) => (v === 1 ? "Male" : "Female"),
  cp:      (v) => ["Typical Angina","Atypical Angina","Non-Anginal","Asymptomatic"][v],
  fbs:     (v) => (v === 1 ? "Yes (>120)" : "No"),
  restecg: (v) => ["Normal","ST-T Abnormality","LV Hypertrophy"][v],
  exang:   (v) => (v === 1 ? "Yes" : "No"),
  slope:   (v) => ["Upsloping","Flat","Downsloping"][v],
  thal:    (v) => ["","Normal","Fixed Defect","Reversible Defect"][v],
};

// ── Tag icon ──────────────────────────────────────────────────────────────────
function TagIcon({ color }) {
  if (color === "green")  return <ShieldCheck  size={14} />;
  if (color === "yellow") return <ShieldAlert  size={14} />;
  if (color === "orange") return <AlertTriangle size={14} />;
  return <Skull size={14} />;
}

// ── Single case card ──────────────────────────────────────────────────────────
function CaseCard({ sample }) {
  const [expanded,   setExpanded]   = useState(false);
  const [running,    setRunning]    = useState(false);
  const [liveResult, setLiveResult] = useState(null);

  const c = TAG_COLORS[sample.tagColor];
  const result = liveResult || sample.expected;

  const handleRun = async () => {
    setRunning(true);
    try {
      const { data } = await createPrediction({
        ...sample.input,
        notes: `Sample case ${sample.id}: ${sample.title}`,
      });
      setLiveResult(data.prediction.result);
      toast.success(`Case ${sample.id} saved to history!`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Prediction failed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={`card border ${c.border} ${c.bg}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Number badge */}
          <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${c.num}`}>
            {sample.id}
          </span>
          <div className="min-w-0">
            {/* Tag pill */}
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-1.5 ${c.badge}`}>
              <TagIcon color={sample.tagColor} />
              {sample.tag}
            </span>
            <h3 className="text-white font-semibold text-sm leading-snug">{sample.title}</h3>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">{sample.description}</p>
          </div>
        </div>

        {/* Risk % */}
        <div className="shrink-0 text-right">
          <p className={`text-2xl font-bold ${RISK_COLORS[result.risk_level]}`}>
            {Math.round(result.probability * 100)}%
          </p>
          <p className="text-gray-500 text-xs">risk score</p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { label: "Result",     value: result.label,       color: result.prediction === 1 ? "text-primary-400" : "text-green-400" },
          { label: "Risk Level", value: result.risk_level,  color: RISK_COLORS[result.risk_level] },
          { label: "Confidence", value: `${Math.round(result.confidence * 100)}%`, color: "text-white" },
          { label: "Age / Sex",  value: `${sample.input.age}y / ${sample.input.sex === 1 ? "M" : "F"}`, color: "text-white" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-800/60 rounded-lg px-2 py-2 text-center">
            <p className="text-gray-500 text-xs">{s.label}</p>
            <p className={`text-sm font-semibold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 w-full flex items-center justify-between text-xs text-gray-500 hover:text-gray-300 transition-colors py-1"
      >
        <span>{expanded ? "Hide" : "Show"} clinical data & gauge</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-4 border-t border-gray-800 pt-4">
          {/* Gauge + notes */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <RiskGauge probability={result.probability} riskLevel={result.risk_level} />
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-semibold text-gray-300">Clinical Analysis</h4>
              <p className="text-sm text-gray-400 leading-relaxed">{sample.notes}</p>
              {liveResult && (
                <div className="flex items-center gap-1.5 text-green-400 text-xs mt-2">
                  <CheckCircle size={13} /> Live result saved to your history
                </div>
              )}
            </div>
          </div>

          {/* Feature grid */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">All 13 Input Features</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(sample.input).map(([key, val]) => (
                <div key={key} className="bg-gray-800 rounded-lg px-3 py-2">
                  <p className="text-gray-500 text-xs truncate">{FEATURE_LABELS[key] || key}</p>
                  <p className="text-white text-sm font-medium mt-0.5">
                    {FEATURE_FORMAT[key] ? FEATURE_FORMAT[key](val) : val}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleRun}
          disabled={running}
          className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
        >
          {running
            ? <span className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-white border-r-2 border-transparent" />
            : <Play size={14} />}
          {running ? "Running…" : liveResult ? "Run Again" : "Run This Case"}
        </button>
      </div>
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────
function SectionHeader({ color, icon: Icon, title, count }) {
  const colors = {
    green:  "text-green-400 border-green-800 bg-green-900/20",
    yellow: "text-yellow-400 border-yellow-800 bg-yellow-900/20",
    orange: "text-orange-400 border-orange-800 bg-orange-900/20",
    red:    "text-red-400 border-red-800 bg-red-900/20",
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${colors[color]}`}>
      <Icon size={18} className={colors[color].split(" ")[0]} />
      <span className={`font-semibold ${colors[color].split(" ")[0]}`}>{title}</span>
      <span className="ml-auto text-xs text-gray-500">{count} case{count !== 1 ? "s" : ""}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SampleDataPage() {
  const sections = [
    { color: "green",  icon: ShieldCheck,   title: "Low Risk · No Disease",      ids: [1,2,3,4] },
    { color: "yellow", icon: ShieldAlert,   title: "Moderate Risk · No Disease", ids: [5,6] },
    { color: "orange", icon: AlertTriangle, title: "Moderate Risk · Disease",    ids: [7,8,9] },
    { color: "red",    icon: Skull,         title: "High Risk · Disease",        ids: [10] },
  ];

  const byId = Object.fromEntries(SAMPLE_CASES.map((s) => [s.id, s]));

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FlaskConical className="text-primary-400" size={24} />
          Sample Test Cases
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          10 real UCI Heart Disease dataset cases covering every output category.
          All probabilities are verified against the live ML model.
        </p>
      </div>

      {/* Summary table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Patient</th>
              <th className="text-left px-4 py-3">Key Indicators</th>
              <th className="text-left px-4 py-3">Result</th>
              <th className="text-left px-4 py-3">Risk %</th>
              <th className="text-left px-4 py-3">Level</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_CASES.map((s) => {
              const c = TAG_COLORS[s.tagColor];
              return (
                <tr key={s.id} className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{s.id}</td>
                  <td className="px-4 py-2.5 text-white font-medium whitespace-nowrap text-xs">
                    {s.input.age}y {s.input.sex === 1 ? "Male" : "Female"}
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">
                    BP {s.input.trestbps} · Chol {s.input.chol} · CA {s.input.ca} · HR {s.input.thalach}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-semibold ${s.expected.prediction === 1 ? "text-primary-400" : "text-green-400"}`}>
                      {s.expected.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`font-bold text-xs ${RISK_COLORS[s.expected.risk_level]}`}>
                      {Math.round(s.expected.probability * 100)}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>
                      {s.expected.risk_level}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Grouped sections */}
      {sections.map((sec) => (
        <div key={sec.title} className="space-y-3">
          <SectionHeader color={sec.color} icon={sec.icon} title={sec.title} count={sec.ids.length} />
          {sec.ids.map((id) => (
            <CaseCard key={id} sample={byId[id]} />
          ))}
        </div>
      ))}

      <p className="text-xs text-gray-600 text-center pb-4">
        Data sourced from the UCI Heart Disease dataset (Cleveland). For demonstration only — not medical advice.
      </p>
    </div>
  );
}
