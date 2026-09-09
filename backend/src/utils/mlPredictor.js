/**
 * mlPredictor.js
 * Executes the Python Heart Disease ML inference script via child_process.spawn.
 * Streams JSON via stdin and parses stdout.
 * Includes an automated JavaScript heuristic fallback to ensure 100% uptime.
 */

const { spawn } = require("child_process");
const path = require("path");

const PYTHON_SCRIPT_PATH = path.join(__dirname, "../../ml/predict.py");

/**
 * Runs the Python ML model via child process stdin/stdout
 * @param {Object} patientData - Patient features
 * @returns {Promise<Object>}
 */
const runPythonPrediction = (patientData) => {
  return new Promise((resolve, reject) => {
    const pythonCmd = process.env.PYTHON_PATH || (process.platform === "win32" ? "python" : "python3");
    const py = spawn(pythonCmd, [PYTHON_SCRIPT_PATH]);

    let stdoutData = "";
    let stderrData = "";

    py.stdin.write(JSON.stringify(patientData));
    py.stdin.end();

    py.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString();
    });

    py.stderr.on("data", (chunk) => {
      stderrData += chunk.toString();
    });

    py.on("error", (err) => {
      reject(err);
    });

    py.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(`Python process exited with code ${code}: ${stderrData || stdoutData}`)
        );
      }

      try {
        const parsed = JSON.parse(stdoutData.trim());
        if (parsed.success === false) {
          return reject(new Error(parsed.error || "Python inference error"));
        }
        resolve({
          prediction: parsed.prediction,
          label: parsed.label,
          probability: parsed.probability,
          risk_level: parsed.risk_level,
          confidence: parsed.confidence,
          source: "python_ml",
        });
      } catch (err) {
        reject(
          new Error(`Failed to parse Python ML output: ${err.message}. Raw output: ${stdoutData}`)
        );
      }
    });
  });
};

/**
 * Heuristic JavaScript clinical fallback if Python environment is unreachable.
 * Implements clinical risk scoring based on Cleveland heart study indicators:
 * (fluoroscopy vessels, ST depression, angina, resting BP, cholesterol, max heart rate).
 */
const runJsFallbackPrediction = (data) => {
  let score = 0;

  // Major vessel involvement (ca: 0 - 4)
  score += (Number(data.ca) || 0) * 1.5;

  // Exercise ST depression (oldpeak)
  const oldpeak = Number(data.oldpeak) || 0;
  if (oldpeak >= 2.0) score += 2.0;
  else if (oldpeak >= 1.0) score += 1.0;

  // Exercise-induced angina
  if (Number(data.exang) === 1) score += 1.2;

  // Chest pain type (0: typical angina is highest risk)
  if (Number(data.cp) === 0) score += 1.0;

  // Thalassemia (3: reversible defect is high risk)
  if (Number(data.thal) === 3) score += 1.2;

  // Max heart rate deficit: (220 - age) vs thalach
  const maxExpected = 220 - (Number(data.age) || 50);
  const actualThalach = Number(data.thalach) || 150;
  if (actualThalach < maxExpected * 0.75) score += 0.8;

  // Age & Blood pressure & Cholesterol baseline
  if (Number(data.age) > 55) score += 0.5;
  if (Number(data.trestbps) > 140) score += 0.5;
  if (Number(data.chol) > 240) score += 0.5;

  // Logistic mapping to probability (0 - 1)
  const probability = Math.min(0.95, Math.max(0.05, 1 / (1 + Math.exp(-(score - 3.2)))));
  const prediction = probability >= 0.5 ? 1 : 0;

  let risk_level = "Low";
  if (probability >= 0.65) risk_level = "High";
  else if (probability >= 0.35) risk_level = "Moderate";

  const confidence = Number((prediction === 1 ? probability : 1 - probability).toFixed(4));

  return {
    prediction,
    label: prediction === 1 ? "Disease" : "No Disease",
    probability: Number(probability.toFixed(4)),
    risk_level,
    confidence,
    source: "js_fallback",
  };
};

/**
 * Main prediction wrapper: tries Python ML engine first, falls back to JS if needed.
 */
const predictHeartDisease = async (patientData) => {
  try {
    return await runPythonPrediction(patientData);
  } catch (pythonErr) {
    console.warn(`[ML Engine] Python process unavailable (${pythonErr.message}). Using JS fallback.`);
    return runJsFallbackPrediction(patientData);
  }
};

module.exports = {
  predictHeartDisease,
  runPythonPrediction,
  runJsFallbackPrediction,
};
