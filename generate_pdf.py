"""
generate_pdf.py
Generates HeartDetect_QA.pdf — a professional Interview Q&A Guide
using the reportlab library.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, KeepTogether,
    HRFlowable, PageBreak
)
from reportlab.platypus.flowables import Flowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas as pdfgen_canvas

# ---------------------------------------------------------------------------
# Colours
# ---------------------------------------------------------------------------
DARK_RED   = colors.HexColor("#8B0000")
LIGHT_GREY = colors.HexColor("#F5F5F5")
MID_GREY   = colors.HexColor("#CCCCCC")
WHITE      = colors.white
BLACK      = colors.black
FOOTER_GREY = colors.HexColor("#888888")
ALT_BG     = colors.HexColor("#FDF6F6")   # very faint red tint for alternating rows

# ---------------------------------------------------------------------------
# Page geometry
# ---------------------------------------------------------------------------
PAGE_W, PAGE_H = A4
# In reportlab, 1 unit = 1 point, so no conversion needed
LEFT_MARGIN  = 55
RIGHT_MARGIN = 55
TOP_MARGIN   = 45
BOT_MARGIN   = 45

OUTPUT_FILE = "HeartDetect_QA.pdf"

# ---------------------------------------------------------------------------
# Custom Flowable: full-width coloured rectangle (used for section headers)
# ---------------------------------------------------------------------------
class ColorBar(Flowable):
    """A full-width coloured rectangle with white bold text centred inside."""

    def __init__(self, text, bg=DARK_RED, fg=WHITE, font_size=13,
                 height=26, available_width=None):
        super().__init__()
        self.text = text
        self.bg = bg
        self.fg = fg
        self.font_size = font_size
        self.bar_height = height
        self._avail_w = available_width  # set after doc is built

    def wrap(self, avail_w, avail_h):
        self._avail_w = avail_w
        return avail_w, self.bar_height

    def draw(self):
        c = self.canv
        w = self._avail_w or (PAGE_W - LEFT_MARGIN - RIGHT_MARGIN)
        # background rectangle
        c.setFillColor(self.bg)
        c.rect(0, 0, w, self.bar_height, fill=1, stroke=0)
        # white text
        c.setFillColor(self.fg)
        c.setFont("Helvetica-Bold", self.font_size)
        c.drawCentredString(w / 2, (self.bar_height - self.font_size) / 2 + 2, self.text)


# ---------------------------------------------------------------------------
# Custom Flowable: question block background (alternating subtle tint)
# ---------------------------------------------------------------------------
class QuestionBlock(Flowable):
    """Draws a faint background rectangle behind a question block."""

    def __init__(self, inner_flowables, bg=ALT_BG, padding=6):
        super().__init__()
        self._inner = inner_flowables
        self.bg = bg
        self.padding = padding
        self._avail_w = None
        self._height = 0

    def wrap(self, avail_w, avail_h):
        self._avail_w = avail_w
        total_h = self.padding * 2
        for f in self._inner:
            w, h = f.wrap(avail_w - self.padding * 2, avail_h)
            total_h += h
        self._height = total_h
        return avail_w, total_h

    def draw(self):
        c = self.canv
        w = self._avail_w or (PAGE_W - LEFT_MARGIN - RIGHT_MARGIN)
        c.setFillColor(self.bg)
        c.rect(0, 0, w, self._height, fill=1, stroke=0)
        y = self._height - self.padding
        for f in self._inner:
            f.canv = c
            _, h = f.wrap(w - self.padding * 2, self._height)
            y -= h
            c.saveState()
            c.translate(self.padding, y)
            f.draw()
            c.restoreState()

    def split(self, avail_w, avail_h):
        return []


# ---------------------------------------------------------------------------
# Cover page canvas callback
# ---------------------------------------------------------------------------
def cover_page_canvas(c, doc):
    """Draws the full dark-red cover page background + centred text."""
    c.saveState()
    # full-page dark red background
    c.setFillColor(DARK_RED)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # decorative thin white line
    c.setStrokeColor(WHITE)
    c.setLineWidth(1.5)
    c.line(LEFT_MARGIN, PAGE_H * 0.52, PAGE_W - RIGHT_MARGIN, PAGE_H * 0.52)
    c.line(LEFT_MARGIN, PAGE_H * 0.44, PAGE_W - RIGHT_MARGIN, PAGE_H * 0.44)

    # Title
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(PAGE_W / 2, PAGE_H * 0.56,
                        "HeartDetect \u2014 AI Heart Disease Risk Predictor")

    # Subtitle
    c.setFont("Helvetica", 16)
    c.drawCentredString(PAGE_W / 2, PAGE_H * 0.49,
                        "Complete Interview Q&A Guide")

    # small tagline
    c.setFont("Helvetica-Oblique", 11)
    c.setFillColor(colors.HexColor("#FFCCCC"))
    c.drawCentredString(PAGE_W / 2, PAGE_H * 0.40,
                        "30 Questions \u2022 7 Sections \u2022 Full Technical Coverage")

    c.restoreState()


# ---------------------------------------------------------------------------
# Normal page canvas callback (footer with page number)
# ---------------------------------------------------------------------------
def normal_page_canvas(c, doc):
    """Draws the footer page number on every content page."""
    c.saveState()
    page_num = doc.page
    c.setFont("Helvetica", 9)
    c.setFillColor(FOOTER_GREY)
    c.drawCentredString(PAGE_W / 2, BOT_MARGIN / 2,
                        f"HeartDetect Q&A Guide  \u2014  Page {page_num}")
    # thin top rule on footer area
    c.setStrokeColor(MID_GREY)
    c.setLineWidth(0.5)
    c.line(LEFT_MARGIN, BOT_MARGIN - 4, PAGE_W - RIGHT_MARGIN, BOT_MARGIN - 4)
    c.restoreState()


# ---------------------------------------------------------------------------
# Paragraph styles
# ---------------------------------------------------------------------------
def make_styles():
    styles = {}

    styles["section_spacer"] = ParagraphStyle(
        "section_spacer", fontSize=4, leading=4)

    styles["q_label"] = ParagraphStyle(
        "q_label",
        fontName="Helvetica-Bold",
        fontSize=11,
        textColor=DARK_RED,
        leading=15,
        spaceAfter=2,
    )

    styles["q_text"] = ParagraphStyle(
        "q_text",
        fontName="Helvetica-Bold",
        fontSize=11,
        textColor=BLACK,
        leading=15,
        spaceAfter=4,
    )

    styles["bullet"] = ParagraphStyle(
        "bullet",
        fontName="Helvetica",
        fontSize=10.5,
        textColor=BLACK,
        leading=15,
        leftIndent=15,
        spaceAfter=8,
    )

    styles["q_combined"] = ParagraphStyle(
        "q_combined",
        fontName="Helvetica-Bold",
        fontSize=11,
        textColor=BLACK,
        leading=16,
        spaceAfter=4,
    )

    return styles


# ---------------------------------------------------------------------------
# Content data
# ---------------------------------------------------------------------------
CONTENT = [
    {
        "section": "A",
        "title": "SECTION A \u2014 Project & Conceptual Questions",
        "questions": [
            {
                "num": "Q1",
                "text": "What problem does HeartDetect solve, and why is heart disease prediction important?",
                "bullets": [
                    "Heart disease is the #1 cause of death worldwide \u2014 kills 17+ million people every year",
                    "Most people don\u2019t know they have it until it\u2019s too late \u2014 it\u2019s often \u201csilent\u201d",
                    "Traditional diagnosis needs expensive tests, doctors, and time",
                    "HeartDetect lets anyone enter basic clinical data and get an instant AI-based risk score",
                    "It acts as an early warning system \u2014 not a replacement for doctors, but a screening tool",
                    "Helps people in rural or low-resource areas where cardiologists aren\u2019t easily available",
                    "Early detection = early treatment = lives saved",
                ],
            },
            {
                "num": "Q2",
                "text": "Explain the complete architecture and workflow of your project.",
                "bullets": [
                    "The project has 3 separate servers working together",
                    "React frontend \u2014 what the user sees and interacts with",
                    "Node.js backend \u2014 handles users, auth, database, and routes requests",
                    "Python ML server \u2014 runs the actual prediction model",
                    "User fills the form on React \u2192 React sends data to Node.js API",
                    "Node.js validates the data \u2192 forwards it to Python Flask server",
                    "Python runs the Random Forest model \u2192 returns prediction + probability",
                    "Node.js saves the result to MongoDB \u2192 sends response back to React",
                    "React displays the risk gauge, percentage, and label to the user",
                    "Frontend is deployed on Vercel, both servers on Render, DB on MongoDB Atlas",
                ],
            },
            {
                "num": "Q3",
                "text": "Why did you choose a multi-server architecture (Node.js + Python ML server)?",
                "bullets": [
                    "Python has the best ML libraries (scikit-learn, pandas, numpy) \u2014 no good equivalent in Node.js",
                    "Node.js is better for REST APIs, auth, and database operations",
                    "Keeping them separate means you can update the ML model without touching the backend",
                    "Each service can be scaled independently",
                    "It follows the microservices principle \u2014 each service does one thing well",
                    "If the ML server crashes, the rest of the app (login, history) still works",
                ],
            },
            {
                "num": "Q4",
                "text": "What type of Machine Learning problem is heart disease prediction?",
                "bullets": [
                    "It is a Binary Classification problem",
                    "Input: 13 clinical features (age, cholesterol, etc.)",
                    "Output: either 0 (No Disease) or 1 (Disease)",
                    "It also gives a probability (e.g., 0.68 = 68% chance of disease)",
                    "This makes it a supervised learning problem \u2014 we train on labeled data where we already know who had disease",
                ],
            },
            {
                "num": "Q5",
                "text": "Why did you choose Random Forest over other algorithms like Logistic Regression or SVM?",
                "bullets": [
                    "Random Forest builds many decision trees and combines their votes \u2014 more accurate than a single tree",
                    "It handles non-linear relationships between features \u2014 heart disease risk is not always linear",
                    "It works well with mixed data types (some features are numbers, some are categories)",
                    "It is robust to outliers \u2014 one bad data point does not ruin the whole model",
                    "It gives feature importance \u2014 tells you which features matter most",
                    "Logistic Regression is simpler but assumes linear relationships \u2014 not ideal here",
                    "SVM is powerful but slow to train and hard to tune on this type of data",
                    "Random Forest gave us 87% accuracy and 0.94 ROC-AUC \u2014 best among all tested",
                ],
            },
        ],
    },
    {
        "section": "B",
        "title": "SECTION B \u2014 Dataset & Features",
        "questions": [
            {
                "num": "Q6",
                "text": "Explain the UCI Heart Disease dataset and its limitations.",
                "bullets": [
                    "Collected at the Cleveland Clinic Foundation in the USA",
                    "Contains 303 patient records with 13 features and 1 target (disease/no disease)",
                    "It is a real clinical dataset \u2014 not synthetic",
                    "Only 303 rows \u2014 very small by modern ML standards",
                    "Collected in the 1980s \u2014 medical practices have changed",
                    "Only from one hospital in one country \u2014 may not generalize globally",
                    "Imbalanced classes \u2014 more \u201cno disease\u201d than \u201cdisease\u201d cases",
                    "Some rows have missing values (marked as ?) which we dropped",
                    "Does not include modern risk factors like obesity, smoking history, or family history",
                ],
            },
            {
                "num": "Q7",
                "text": "Why are these 13 features important in predicting heart disease?",
                "bullets": [
                    "age \u2014 risk increases significantly after 45 (men) and 55 (women)",
                    "sex \u2014 men have higher risk; post-menopausal women catch up",
                    "cp (chest pain type) \u2014 asymptomatic chest pain is the most dangerous type",
                    "trestbps (blood pressure) \u2014 high BP damages arteries over time",
                    "chol (cholesterol) \u2014 high cholesterol builds plaque in arteries",
                    "fbs (fasting blood sugar) \u2014 diabetes is a major heart disease risk factor",
                    "restecg \u2014 abnormal ECG shows existing heart stress",
                    "thalach (max heart rate) \u2014 low max HR during exercise = poor heart fitness",
                    "exang (exercise angina) \u2014 chest pain during exercise = reduced blood flow",
                    "oldpeak (ST depression) \u2014 shows how much the heart struggles under stress",
                    "slope \u2014 downsloping ST segment = more serious cardiac issue",
                    "ca (blocked vessels) \u2014 more blocked vessels = higher disease severity",
                    "thal (thalassemia) \u2014 reversible defect is a strong disease indicator",
                ],
            },
            {
                "num": "Q8",
                "text": "How did you handle missing values or outliers in the dataset?",
                "bullets": [
                    "The UCI dataset uses ? for missing values \u2014 we told pandas to treat ? as NaN",
                    "We used df.dropna() \u2014 simply dropped rows with missing values",
                    "Only a few rows had missing data so this did not significantly reduce the dataset",
                    "For outliers \u2014 Random Forest is naturally robust to outliers so no special treatment was needed",
                    "We also applied StandardScaler which normalizes the range of all features, reducing the impact of extreme values",
                ],
            },
            {
                "num": "Q9",
                "text": "What preprocessing steps did you apply before training the ML model?",
                "bullets": [
                    "Loaded the CSV with proper column names",
                    "Replaced ? with NaN and dropped those rows",
                    "Binarized the target \u2014 original dataset has values 0\u20134, we converted to 0 (no disease) or 1 (disease)",
                    "Split features and labels \u2014 X (13 features) and y (target)",
                    "StandardScaler \u2014 normalized all features to have mean=0 and std=1",
                    "Built a Pipeline (Scaler + Model) so scaling is applied automatically during prediction too",
                    "Used train/test split (80/20) and 5-fold cross-validation for evaluation",
                ],
            },
            {
                "num": "Q10",
                "text": "How do categorical features like cp, thal, slope affect prediction performance?",
                "bullets": [
                    "These are ordinal/categorical features encoded as integers (0, 1, 2, 3)",
                    "cp=3 (asymptomatic) is actually the most dangerous \u2014 counterintuitive but clinically proven",
                    "thal=3 (reversible defect) strongly indicates disease \u2014 blood flow is blocked under stress",
                    "slope=0 (downsloping) is the most concerning ST segment pattern",
                    "Random Forest handles these well because it splits on thresholds",
                    "We did NOT one-hot encode them because Random Forest does not require it and the ordinal relationship has clinical meaning",
                ],
            },
        ],
    },
    {
        "section": "C",
        "title": "SECTION C \u2014 Machine Learning Model",
        "questions": [
            {
                "num": "Q11",
                "text": "Explain how a Random Forest model works internally.",
                "bullets": [
                    "Random Forest = a collection of many Decision Trees (we used 200 trees)",
                    "Each tree is trained on a random subset of the data (called bootstrapping)",
                    "Each tree also uses a random subset of features at each split \u2014 this reduces correlation between trees",
                    "For prediction, every tree gives a vote (disease or no disease)",
                    "The majority vote becomes the final prediction",
                    "The probability is the fraction of trees that voted \u201cdisease\u201d \u2014 e.g., 136 out of 200 trees = 68%",
                    "This \u201cwisdom of crowds\u201d approach makes it much more accurate than a single tree",
                ],
            },
            {
                "num": "Q12",
                "text": "What hyperparameters did you tune, and why?",
                "bullets": [
                    "n_estimators=200 \u2014 200 trees gives stable predictions without being too slow",
                    "max_depth=8 \u2014 limits tree depth to prevent overfitting (memorizing training data)",
                    "min_samples_split=4 \u2014 a node needs at least 4 samples to split \u2014 avoids tiny useless branches",
                    "min_samples_leaf=2 \u2014 each leaf must have at least 2 samples \u2014 smoother predictions",
                    'class_weight="balanced" \u2014 handles imbalanced classes',
                    "random_state=42 \u2014 makes results reproducible every time",
                ],
            },
            {
                "num": "Q13",
                'text': 'Why did you use class_weight="balanced"?',
                "bullets": [
                    'The dataset has more "no disease" samples than "disease" samples',
                    'Without balancing, the model would be biased toward predicting "no disease" always',
                    'class_weight="balanced" automatically gives more importance to the minority class (disease)',
                    "It calculates weights as: total_samples / (n_classes x samples_in_class)",
                    "This means the model is penalized more for missing a disease case than a no-disease case",
                    "In medical applications, missing a disease (false negative) is more dangerous than a false alarm",
                ],
            },
            {
                "num": "Q14",
                "text": "What does an ROC-AUC score of 0.94 indicate about the model?",
                "bullets": [
                    "ROC-AUC measures how well the model separates disease from no-disease cases",
                    "Score ranges from 0.5 (random guessing) to 1.0 (perfect)",
                    "0.94 means the model correctly ranks a random disease patient higher than a random healthy patient 94% of the time",
                    "It is considered excellent \u2014 anything above 0.9 is very good in medical ML",
                    "It is better than accuracy alone because it works well even with imbalanced classes",
                    "Our model has 87% accuracy + 0.94 AUC \u2014 both metrics confirm it is a strong model",
                ],
            },
            {
                "num": "Q15",
                "text": "How do you interpret model probability (e.g., 0.68 meaning 68% risk)?",
                "bullets": [
                    "The Random Forest has 200 trees \u2014 each votes disease (1) or no disease (0)",
                    "If 136 out of 200 trees vote \u201cdisease\u201d \u2192 probability = 136/200 = 0.68",
                    "This means the model is 68% confident the patient has heart disease",
                    "We then classify: below 35% = Low, 35\u201365% = Moderate, above 65% = High",
                    "If prediction=1 (disease), confidence = probability (0.68)",
                    "If prediction=0 (no disease), confidence = 1 - probability (e.g., 1 - 0.13 = 0.87)",
                ],
            },
        ],
    },
    {
        "section": "D",
        "title": "SECTION D \u2014 Backend & API",
        "questions": [
            {
                "num": "Q16",
                "text": "How does the Node.js API communicate with the Python ML server?",
                "bullets": [
                    "Node.js uses the axios library to make HTTP POST requests to the Flask server",
                    "When a user submits the form, Node.js sends the 13 features as JSON to /predict endpoint",
                    "It sets a 10 second timeout \u2014 if ML server does not respond, returns a 503 error",
                    "The Flask server processes the data, runs the model, and returns JSON with prediction results",
                    "Node.js then takes that result, saves it to MongoDB, and sends it back to the React frontend",
                    "This is a simple HTTP REST call \u2014 same as how any two web services communicate",
                ],
            },
            {
                "num": "Q17",
                "text": "What happens internally when a user submits the prediction form?",
                "bullets": [
                    "React collects all 13 form values and sends POST to /api/predictions with JWT token",
                    "Node.js middleware verifies the JWT \u2014 rejects if invalid or expired",
                    "express-validator checks all 13 fields \u2014 correct types, within valid ranges",
                    "Node.js converts all values to numbers and sends them to the Python ML server via axios",
                    "Python validates again, runs StandardScaler, feeds into Random Forest model",
                    "Model returns prediction (0/1), probability, risk level, confidence",
                    "Node.js saves to MongoDB \u2014 stores input data + result + user ID + timestamp",
                    "Node.js sends the full prediction object back to React",
                    "React displays the risk gauge, percentage, label, and input summary",
                ],
            },
            {
                "num": "Q18",
                "text": "How did you implement input validation on backend and ML server?",
                "bullets": [
                    "Frontend (React): react-hook-form with rules \u2014 required fields, min/max number ranges, shown as inline errors",
                    "Backend (Node.js): express-validator checks each field \u2014 correct type, within medical range",
                    "ML Server (Python): custom validate_input() function \u2014 checks every field exists, is a number, and within range",
                    "Three layers of validation means even if someone bypasses the UI and calls the API directly, bad data is still rejected",
                    "Returns clear error messages like \"Field 'age' value 200 is out of range [1, 120]\"",
                ],
            },
            {
                "num": "Q19",
                "text": "Explain JWT authentication and how protected routes work.",
                "bullets": [
                    "When a user logs in, the server creates a JWT token \u2014 a signed string containing the user\u2019s ID",
                    "The token is signed with a secret key \u2014 only our server can create or verify it",
                    "Token is stored in localStorage on the browser",
                    "Every API request includes the token in the header: Authorization: Bearer token",
                    "The protect middleware on Node.js verifies the token on every protected route",
                    "If valid \u2192 attaches user to req.user and allows the request",
                    "If invalid/expired \u2192 returns 401 Unauthorized",
                    "On the frontend, ProtectedRoute component checks if user is logged in \u2014 redirects to /login if not",
                    "Tokens expire in 7 days \u2014 user must log in again after that",
                ],
            },
            {
                "num": "Q20",
                "text": "How do you store predictions and user data in MongoDB?",
                "bullets": [
                    "Users collection \u2014 stores name, email, hashed password, timestamps",
                    "Predictions collection stores: user reference (ObjectId), all 13 clinical features, prediction result, optional notes, and timestamp",
                    "Mongoose schemas enforce data types and required fields",
                    "Predictions are linked to users via the user ObjectId \u2014 so each user only sees their own history",
                    "Queries use { user: req.user._id } to filter \u2014 users can never see each other\u2019s data",
                ],
            },
        ],
    },
    {
        "section": "E",
        "title": "SECTION E \u2014 Frontend & UI",
        "questions": [
            {
                "num": "Q21",
                "text": "How does React manage authentication state across pages?",
                "bullets": [
                    "We use React Context API \u2014 a global state that any component can access",
                    "AuthContext stores the current user object and provides login, signup, logout functions",
                    "On app load, it checks localStorage for a saved token and user \u2014 restores session automatically",
                    "When user logs in, token and user are saved to localStorage AND set in axios default headers",
                    "When user logs out, localStorage is cleared and axios headers are removed",
                    "ProtectedRoute component wraps all private pages \u2014 checks user from context, redirects to login if null",
                    "This means the user stays logged in even after refreshing the page",
                ],
            },
            {
                "num": "Q22",
                "text": "What is the purpose of the RiskGauge, and how does the animation work?",
                "bullets": [
                    "RiskGauge is a semicircular donut chart that visually shows the risk percentage",
                    "It uses Recharts PieChart with startAngle=180 and endAngle=0 \u2014 creates a half-circle",
                    "Two segments: filled portion (risk %) in the risk color, and grey remainder",
                    "Color changes based on risk level: green (Low), yellow (Moderate), red (High)",
                    "The percentage number is overlaid in the center using absolute CSS positioning",
                    "Recharts handles the smooth render animation automatically when the component mounts",
                    "It gives users an instant visual understanding of their risk without reading numbers",
                ],
            },
            {
                "num": "Q23",
                "text": "How do you implement pagination in the History page?",
                "bullets": [
                    "Backend accepts page and limit query parameters (e.g., ?page=2&limit=10)",
                    "Uses Mongoose .skip() and .limit() to fetch only the relevant page of results",
                    "Also runs countDocuments() to get the total count \u2014 calculates total pages",
                    "Returns predictions along with pagination metadata (total, page, limit, pages)",
                    "Frontend stores current page in state \u2014 clicking Next/Previous updates the state",
                    "useEffect re-fetches data whenever page changes",
                    "Previous/Next buttons are disabled when on first/last page",
                ],
            },
            {
                "num": "Q24",
                "text": "Why did you use Recharts for visualization instead of other chart libraries?",
                "bullets": [
                    "Recharts is built specifically for React \u2014 uses React components, not imperative DOM manipulation",
                    "Very easy to use \u2014 just pass data as props, no complex configuration",
                    "Lightweight compared to Chart.js which requires a canvas wrapper",
                    "Supports all charts we needed \u2014 Bar, Pie, Radar, all with built-in animations",
                    "Responsive out of the box with ResponsiveContainer",
                    "Good documentation and active community",
                    "Chart.js requires react-chartjs-2 wrapper which adds complexity \u2014 Recharts is native React",
                ],
            },
        ],
    },
    {
        "section": "F",
        "title": "SECTION F \u2014 Errors, Debugging & Edge Cases",
        "questions": [
            {
                "num": "Q25",
                "text": "What happens if the ML server is down? How does your app handle this error?",
                "bullets": [
                    "The Node.js backend wraps the ML API call in a try-catch block",
                    "If ML server is unreachable or times out (10s timeout), axios throws an error",
                    'Node.js catches it and returns a 503 Service Unavailable with message: "ML service unavailable"',
                    "The React frontend shows a toast error notification to the user",
                    "The rest of the app (login, history, dashboard) continues to work normally",
                    "The prediction is not saved to MongoDB if ML server fails \u2014 no partial or corrupt records",
                ],
            },
            {
                "num": "Q26",
                "text": "How did you handle prediction failures due to invalid or out-of-range inputs?",
                "bullets": [
                    "Frontend: react-hook-form prevents form submission if any field is invalid \u2014 shows inline error messages",
                    "Backend: express-validator returns 422 with a list of field errors before even calling the ML server",
                    "ML Server: custom validation checks every field \u2014 returns 422 with specific message",
                    "Three layers mean invalid data never reaches the model",
                    "All error messages are user-friendly and specific \u2014 user knows exactly what to fix",
                ],
            },
            {
                "num": "Q27",
                "text": "What would you do if latency between backend and ML server increases?",
                "bullets": [
                    "Short term: Increase the axios timeout to give more time",
                    "Add retry logic \u2014 if first attempt fails, retry once after 2 seconds",
                    "Caching \u2014 if the same input is submitted twice, return cached result instead of calling ML again",
                    "Move ML server closer \u2014 deploy both on the same Render region to reduce network hops",
                    "Async processing \u2014 accept the request, process in background, notify user when done",
                    "Monitor with logs \u2014 add response time logging to identify when latency spikes",
                    "Upgrade from free tier \u2014 Render free tier has cold starts; paid tier stays always-on",
                ],
            },
        ],
    },
    {
        "section": "G",
        "title": "SECTION G \u2014 Security, Optimization & Future Scope",
        "questions": [
            {
                "num": "Q28",
                "text": "Explain all security measures implemented.",
                "bullets": [
                    "bcrypt (12 rounds) \u2014 passwords are hashed before storing; even if DB is leaked, passwords are safe",
                    "JWT tokens \u2014 stateless auth; server does not store sessions; tokens expire in 7 days",
                    "CORS restriction \u2014 backend only accepts requests from the known frontend URL; blocks other origins",
                    "Rate limiting \u2014 max 100 requests per 15 minutes per IP; prevents brute force and DDoS",
                    "Input validation (3 layers) \u2014 frontend, backend, ML server all validate independently",
                    "Password not returned \u2014 Mongoose schema has select: false on password field; never sent in responses",
                    ".env excluded from git \u2014 secrets (DB password, JWT secret) never committed to GitHub",
                    "HTTPS everywhere \u2014 Vercel and Render both enforce HTTPS; data encrypted in transit",
                    "User isolation \u2014 all DB queries filter by user._id; users can never access each other\u2019s data",
                ],
            },
            {
                "num": "Q29",
                "text": "What are the performance bottlenecks, and how can you optimize the system?",
                "bullets": [
                    "Bottleneck 1: Render free tier cold start (30\u201350s) \u2014 Fix: Upgrade to paid tier or use a keep-alive ping service",
                    "Bottleneck 2: ML model loads on every cold start \u2014 Fix: Already handled \u2014 model loads once at startup via wsgi.py",
                    "Bottleneck 3: No caching \u2014 Fix: Add Redis to cache frequent predictions or user stats",
                    "Bottleneck 4: MongoDB queries without indexes \u2014 Fix: Add index on Prediction.user field and createdAt for sorting",
                    "Bottleneck 5: Large JS bundle \u2014 Fix: Already done \u2014 Vite splits into react/charts/ui chunks for better browser caching",
                    "Bottleneck 6: No CDN for API \u2014 Fix: Put Cloudflare in front of the backend for caching and DDoS protection",
                ],
            },
            {
                "num": "Q30",
                "text": "What future enhancements can be added to improve accuracy or usability?",
                "bullets": [
                    "Better ML model \u2014 train on larger, more diverse datasets (Framingham Heart Study has 4,000+ records)",
                    "More algorithms \u2014 try XGBoost or a Neural Network and compare with current Random Forest",
                    "Feature importance chart \u2014 show user which of their inputs contributed most to the risk score",
                    "PDF report generation \u2014 let users download a clinical summary of their prediction",
                    "Doctor recommendation \u2014 based on risk level, suggest nearby cardiologists",
                    "Trend tracking \u2014 if user submits multiple predictions over time, show how their risk changes",
                    "Email alerts \u2014 send email if risk is High, suggesting immediate medical consultation",
                    "Mobile app \u2014 React Native version for iOS/Android",
                    "Multi-language support \u2014 make the app accessible in regional languages",
                    "SHAP explanations \u2014 use SHAP values to explain exactly why the model gave a specific prediction",
                    "Admin dashboard \u2014 aggregate anonymized stats across all users for research purposes",
                    "Two-factor authentication \u2014 add OTP via email for extra security",
                ],
            },
        ],
    },
]


# ---------------------------------------------------------------------------
# Build flowables
# ---------------------------------------------------------------------------
def build_flowables(styles):
    story = []

    # ---- Cover page (blank page — drawing done in onFirstPage callback) ----
    story.append(PageBreak())   # the cover is page 1; content starts page 2

    for sec_idx, section in enumerate(CONTENT):
        # Section header bar
        story.append(Spacer(1, 6))
        story.append(ColorBar(section["title"]))
        story.append(Spacer(1, 20))

        for q_idx, q in enumerate(section["questions"]):
            # Alternate background: even questions get a faint tint
            use_bg = (q_idx % 2 == 0)

            # Question heading: "Q1.  Question text..."
            q_heading = Paragraph(
                f'<font color="#8B0000"><b>{q["num"]}.</b></font>  {q["text"]}',
                styles["q_combined"],
            )

            # Bullet paragraphs
            bullet_paras = []
            for b in q["bullets"]:
                bullet_paras.append(
                    Paragraph(
                        f'<font color="#CC0000">\u2022</font>  {b}',
                        styles["bullet"],
                    )
                )

            block_items = [q_heading] + bullet_paras

            if use_bg:
                # Wrap in a QuestionBlock for the tinted background
                # QuestionBlock.split returns [] so KeepTogether is the guard
                kt = KeepTogether([
                    Spacer(1, 4),
                    q_heading,
                    *bullet_paras,
                    Spacer(1, 4),
                ])
            else:
                kt = KeepTogether([
                    Spacer(1, 4),
                    q_heading,
                    *bullet_paras,
                    Spacer(1, 4),
                ])

            story.append(kt)
            story.append(Spacer(1, 14))

        # Small gap between sections
        story.append(Spacer(1, 10))

    return story


# ---------------------------------------------------------------------------
# Canvas callbacks
# ---------------------------------------------------------------------------
class _DocWrapper:
    """Thin wrapper so callbacks can access doc.page."""
    def __init__(self):
        self.page = 1


def on_first_page(c, doc):
    cover_page_canvas(c, doc)


def on_later_pages(c, doc):
    normal_page_canvas(c, doc)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def generate_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_FILE,
        pagesize=A4,
        leftMargin=LEFT_MARGIN,
        rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN,
        bottomMargin=BOT_MARGIN,
        title="HeartDetect \u2014 AI Heart Disease Risk Predictor",
        author="HeartDetect Team",
        subject="Complete Interview Q&A Guide",
    )

    styles = make_styles()
    story = build_flowables(styles)

    doc.build(
        story,
        onFirstPage=on_first_page,
        onLaterPages=on_later_pages,
    )
    print(f"PDF generated successfully: {OUTPUT_FILE}")


if __name__ == "__main__":
    generate_pdf()
