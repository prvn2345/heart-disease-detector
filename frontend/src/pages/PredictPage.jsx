import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Activity, Info } from "lucide-react";
import { createPrediction } from "../services/predictions";
import RiskGauge from "../components/RiskGauge";
import toast from "react-hot-toast";

// ── Form field definitions ────────────────────────────────────────────────────
const FIELDS = [
  {
    name: "age", label: "Age", type: "number", placeholder: "e.g. 52",
    hint: "Patient age in years",
    validation: { required: "Required", min: { value: 1, message: "Min 1" }, max: { value: 120, message: "Max 120" } },
  },
  {
    name: "sex", label: "Sex", type: "select",
    options: [{ value: 1, label: "Male" }, { value: 0, label: "Female" }],
    hint: "Biological sex",
    validation: { required: "Required" },
  },
  {
    name: "cp", label: "Chest Pain Type", type: "select",
    options: [
      { value: 0, label: "Typical Angina" },
      { value: 1, label: "Atypical Angina" },
      { value: 2, label: "Non-anginal Pain" },
      { value: 3, label: "Asymptomatic" },
    ],
    hint: "Type of chest pain experienced",
    validation: { required: "Required" },
  },
  {
    name: "trestbps", label: "Resting Blood Pressure", type: "number", placeholder: "e.g. 120",
    hint: "Resting blood pressure in mm Hg",
    validation: { required: "Required", min: { value: 50, message: "Min 50" }, max: { value: 250, message: "Max 250" } },
  },
  {
    name: "chol", label: "Cholesterol", type: "number", placeholder: "e.g. 200",
    hint: "Serum cholesterol in mg/dl",
    validation: { required: "Required", min: { value: 100, message: "Min 100" }, max: { value: 600, message: "Max 600" } },
  },
  {
    name: "fbs", label: "Fasting Blood Sugar > 120 mg/dl", type: "select",
    options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }],
    hint: "Is fasting blood sugar > 120 mg/dl?",
    validation: { required: "Required" },
  },
  {
    name: "restecg", label: "Resting ECG", type: "select",
    options: [
      { value: 0, label: "Normal" },
      { value: 1, label: "ST-T Wave Abnormality" },
      { value: 2, label: "Left Ventricular Hypertrophy" },
    ],
    hint: "Resting electrocardiographic results",
    validation: { required: "Required" },
  },
  {
    name: "thalach", label: "Max Heart Rate", type: "number", placeholder: "e.g. 150",
    hint: "Maximum heart rate achieved",
    validation: { required: "Required", min: { value: 50, message: "Min 50" }, max: { value: 250, message: "Max 250" } },
  },
  {
    name: "exang", label: "Exercise Induced Angina", type: "select",
    options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }],
    hint: "Angina induced by exercise",
    validation: { required: "Required" },
  },
  {
    name: "oldpeak", label: "ST Depression (Oldpeak)", type: "number", placeholder: "e.g. 1.0", step: "0.1",
    hint: "ST depression induced by exercise relative to rest",
    validation: { required: "Required", min: { value: 0, message: "Min 0" }, max: { value: 10, message: "Max 10" } },
  },
  {
    name: "slope", label: "Slope of ST Segment", type: "select",
    options: [
      { value: 0, label: "Upsloping" },
      { value: 1, label: "Flat" },
      { value: 2, label: "Downsloping" },
    ],
    hint: "Slope of the peak exercise ST segment",
    validation: { required: "Required" },
  },
  {
    name: "ca", label: "Major Vessels (CA)", type: "select",
    options: [0, 1, 2, 3, 4].map((v) => ({ value: v, label: String(v) })),
    hint: "Number of major vessels coloured by fluoroscopy (0-4)",
    validation: { required: "Required" },
  },
  {
    name: "thal", label: "Thalassemia", type: "select",
    options: [
      { value: 1, label: "Normal" },
      { value: 2, label: "Fixed Defect" },
      { value: 3, label: "Reversible Defect" },
    ],
    hint: "Thalassemia type",
    validation: { required: "Required" },
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function PredictPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (formData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, Number(v)])
      );
      const { data } = await createPrediction(payload);
      setResult(data.prediction);
      toast.success("Prediction complete!");
    } catch (err) {
      const msg = err.response?.data?.error || "Prediction failed. Please try again.";
      toast.error(msg);
    }
  };

  const handleReset = () => {
    reset();
    setResult(null);
  };

  // ── Result view ─────────────────────────────────────────────────────────────
  if (result) {
    const { result: r, inputData, createdAt, _id } = result;
    const isDisease = r.prediction === 1;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Prediction Result</h1>

        <div className="card text-center space-y-4">
          <RiskGauge probability={r.probability} riskLevel={r.risk_level} />

          <div className={`text-xl font-bold mt-2 ${isDisease ? "text-primary-400" : "text-green-400"}`}>
            {isDisease ? "⚠ Heart Disease Detected" : "✓ No Heart Disease Detected"}
          </div>

          <p className="text-gray-400 text-sm">
            Confidence: <span className="text-white font-medium">{Math.round(r.confidence * 100)}%</span>
          </p>

          <p className="text-xs text-gray-500 italic">
            This is a screening tool only. Always consult a qualified medical professional.
          </p>
        </div>

        {/* Input summary */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-300 mb-3">Input Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {Object.entries(inputData).map(([k, v]) => (
              <div key={k} className="bg-gray-800 rounded-lg px-3 py-2">
                <span className="text-gray-500 text-xs uppercase tracking-wide">{k}</span>
                <div className="text-white font-medium">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleReset} className="btn-primary flex-1">
            New Prediction
          </button>
          <button onClick={() => navigate("/history")} className="btn-secondary flex-1">
            View History
          </button>
        </div>
      </div>
    );
  }

  // ── Form view ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="text-primary-400" size={24} />
          Heart Disease Risk Assessment
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Fill in the patient&apos;s clinical data below. All fields are required.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="card space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FIELDS.map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name} className="label flex items-center gap-1.5">
                  {field.label}
                  <span title={field.hint} className="text-gray-500 cursor-help">
                    <Info size={13} />
                  </span>
                </label>

                {field.type === "select" ? (
                  <select
                    id={field.name}
                    className="input-field"
                    {...register(field.name, field.validation)}
                  >
                    <option value="">Select…</option>
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.name}
                    type="number"
                    step={field.step || "1"}
                    placeholder={field.placeholder}
                    className="input-field"
                    {...register(field.name, {
                      ...field.validation,
                      valueAsNumber: true,
                    })}
                  />
                )}

                {errors[field.name] && (
                  <p className="text-primary-400 text-xs mt-1">
                    {errors[field.name].message}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="label">Notes (optional)</label>
            <textarea
              id="notes"
              rows={2}
              className="input-field resize-none"
              placeholder="Any additional clinical notes…"
              {...register("notes")}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white border-r-2 border-transparent" />
                Analysing…
              </>
            ) : (
              <>
                <Activity size={16} /> Run Prediction
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
