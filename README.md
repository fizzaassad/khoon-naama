# خون نامہ — Khoon Naama

**AI-powered anemia risk assessment platform.**

Khoon Naama helps people understand their CBC blood test results, check anemia risk through symptoms, and get a personalized diet plan — without needing a medical degree to read a lab report.

Built after personally experiencing the confusion of being diagnosed with anemia and not finding a simple, honest tool to make sense of it.

🔗 **Live app:** [khoon-naama.up.railway.app](#)
📂 **Source code:** this repository

---

## Why I built this

Most health tools are built for doctors, not patients. When I was diagnosed with anemia, I had a lab report full of numbers — Hemoglobin, MCH, MCHC, MCV — and no idea what any of it meant for me. Khoon Naama is the tool I wish I'd had: it reads your blood values, tells you what they mean in plain language, and gives you a diet plan you can actually follow.

## Features

- **Blood Test Analyzer** — Enter CBC values (Hemoglobin, MCH, MCHC, MCV) and get an instant AI-powered anemia risk prediction with severity level, visual charts comparing your results to normal ranges, and a downloadable PDF report.
- **Symptom Checker** — No blood test handy? Select from common anemia symptoms and get a risk score instead.
- **BMI + Diet Planner** — Combines your BMI with anemia status (if provided) for a fully personalized nutrition plan, including foods to eat and avoid, with local/Urdu food names.
- **Health Articles** — Curated, linked articles from trusted medical sources (WHO, Mayo Clinic, Healthline, NHS) for further reading.

## How it works

The core model is a **Random Forest Classifier** trained on a real clinical dataset of 1,421 patients (Gender, Hemoglobin, MCH, MCHC, MCV → anemia diagnosis). Severity levels (No Anemia / Mild / Moderate / Severe) are derived from hemoglobin thresholds adjusted by gender, based on standard clinical ranges. Diet recommendations are mapped per severity level.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask |
| ML Model | scikit-learn (Random Forest) |
| Data | Pandas, NumPy |
| PDF Reports | ReportLab |
| Frontend | HTML, CSS, vanilla JavaScript |
| Charts | Chart.js |
| Deployment | Railway |

## Project structure

```
khoon-naama/
├── app.py                 # Flask app + routes + ML inference + PDF generation
├── model.py                # Model training script
├── anemia.csv               # Training dataset (1,421 patients)
├── anemia_model.pkl          # Trained Random Forest model
├── requirements.txt
├── Procfile
├── templates/
│   ├── index.html           # Landing page
│   ├── check.html            # Blood test analyzer
│   ├── symptoms.html          # Symptom checker
│   ├── bmi.html              # BMI + diet planner
│   ├── tips.html              # Health articles
│   ├── navbar.html
│   └── footer.html
└── static/
    ├── css/style.css
    └── js/
        ├── main.js
        ├── symptoms.js
        └── bmi.js
```

## Running locally

```bash
git clone https://github.com/fizzaassad/khoon-naama.git
cd khoon-naama
pip install -r requirements.txt
python model.py      # trains and saves the model (skip if anemia_model.pkl exists)
python app.py
```

Then open `http://127.0.0.1:5000` in your browser.

## Model performance

Trained on an 80/20 split of 1,421 patients using Hemoglobin, MCH, MCHC, MCV, and Gender as features. Achieves high accuracy on the held-out test set (precision, recall, and F1 reported in `model.py` output).

## Disclaimer

Khoon Naama is an awareness and educational tool only. It does not provide a medical diagnosis and is not a substitute for professional medical advice. Always consult a qualified doctor for diagnosis and treatment.

## Author

Built by **Fiza**.

---

*If you found this useful or have suggestions, feel free to open an issue or reach out.*

