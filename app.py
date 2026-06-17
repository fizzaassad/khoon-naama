from flask import Flask, request, jsonify, render_template, send_file
import pickle
import numpy as np
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import pandas as pd

# Train model if it doesn't exist
if not os.path.exists('anemia_model.pkl'):
    df = pd.read_csv('anemia.csv')
    X = df[['Gender', 'Hemoglobin', 'MCH', 'MCHC', 'MCV']]
    y = df['Result']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    import pickle
    with open('anemia_model.pkl', 'wb') as f:
        pickle.dump(model, f)
app = Flask(__name__)

with open('anemia_model.pkl', 'rb') as f:
    model = pickle.load(f)

NORMAL_RANGES = {
    'Hemoglobin': {'Male': (13.5, 17.5), 'Female': (12.0, 15.5)},
    'MCH':        {'Male': (27.0, 33.0), 'Female': (27.0, 33.0)},
    'MCHC':       {'Male': (31.5, 35.7), 'Female': (31.5, 35.7)},
    'MCV':        {'Male': (80.0, 100.0),'Female': (80.0, 100.0)},
}

DIET_PLANS = {
    "No Anemia": {
        "title": "Maintenance Diet",
        "description": "Your blood values are healthy. Keep maintaining this balance.",
        "foods": ["🥬 Spinach daily","🫘 Lentils 3×/week","🥩 Lean red meat 2×/week",
                  "🍳 Eggs every day","🌰 Nuts & seeds","🍊 Vitamin C fruits",
                  "🐟 Fish 2×/week","🥦 Broccoli & kale"],
        "avoid": ["Excess tea/coffee with meals","Too much dairy with iron foods"]
    },
    "Mild Anemia": {
        "title": "Iron Recovery Diet",
        "description": "Focus on iron-rich foods and Vitamin C to boost absorption.",
        "foods": ["🥩 Red meat 4×/week","🫘 Lentils (دال) twice daily",
                  "🥬 Spinach (پالک) every day","🍳 2–3 eggs daily",
                  "🌿 Fenugreek (میتھی)","🍊 Orange juice with every meal",
                  "🌰 Pumpkin & sesame seeds","🫐 Pomegranate juice daily",
                  "🌴 Dates (کھجور) 7/day","🐟 Fish 3×/week"],
        "avoid": ["Tea & coffee with meals","Calcium supplements with iron meals",
                  "Junk & processed food","Carbonated drinks"]
    },
    "Moderate Anemia": {
        "title": "Intensive Recovery Diet",
        "description": "You need urgent dietary changes and a doctor consultation.",
        "foods": ["🥩 Red meat daily","🫘 Lentils & chickpeas twice daily",
                  "🥬 Dark leafy greens every meal","🍳 3 eggs daily",
                  "🌱 Beetroot juice every morning","🍊 Vitamin C with every meal",
                  "🐟 Fish 3×/week","🫐 Pomegranate & dates daily",
                  "🌴 Dates (کھجور) 10/day","🥜 Iron-fortified cereals"],
        "avoid": ["All tea & coffee","Alcohol completely",
                  "All processed foods","High-fiber foods with iron supplements"]
    },
    "Severe Anemia": {
        "title": "Emergency Diet + Immediate Doctor Visit",
        "description": "Seek medical attention immediately. Diet alone is not enough.",
        "foods": ["Follow doctor prescription first","🥩 Red meat without exception",
                  "🫘 Iron-fortified foods only","🥬 Leafy greens every meal",
                  "🍊 Vitamin C with every meal","🫐 Pomegranate juice twice daily",
                  "🌴 Dates (کھجور) 10/day","🥚 Eggs 3×/day"],
        "avoid": ["Tea, coffee & all carbonated drinks","Do not self-medicate",
                  "No strenuous exercise until treated","Alcohol & smoking completely"]
    }
}

TIPS = [
    {
        "icon": "01",
        "tag": "Basics",
        "title": "What is Anemia?",
        "body": "Anemia occurs when your blood lacks enough healthy red blood cells or hemoglobin. Learn the complete overview from the World Health Organization.",
        "read": "5 min read",
        "link": "https://www.who.int/news-room/fact-sheets/detail/anaemia"
    },
    {
        "icon": "02",
        "tag": "Symptoms",
        "title": "Signs and Symptoms of Anemia",
        "body": "Persistent fatigue, pale skin, shortness of breath, dizziness and cold hands are all warning signs. Read the full clinical breakdown from Mayo Clinic.",
        "read": "4 min read",
        "link": "https://www.mayoclinic.org/diseases-conditions/anemia/symptoms-causes/syc-20351360"
    },
    {
        "icon": "03",
        "tag": "Nutrition",
        "title": "Iron-Rich Foods That Fight Anemia",
        "body": "Red meat, spinach, lentils, tofu and pumpkin seeds are among the best iron sources. Pair with Vitamin C for maximum absorption.",
        "read": "5 min read",
        "link": "https://www.healthline.com/nutrition/iron-rich-foods"
    },
    {
        "icon": "04",
        "tag": "Nutrition",
        "title": "Foods and Drinks That Block Iron Absorption",
        "body": "Tea, coffee, calcium-rich dairy and high-fiber foods can reduce iron absorption when eaten with iron-rich meals.",
        "read": "4 min read",
        "link": "https://www.healthline.com/nutrition/increase-iron-absorption"
    },
    {
        "icon": "05",
        "tag": "Treatment",
        "title": "Anemia Diagnosis and Treatment Options",
        "body": "From iron supplements to dietary changes to medical treatment — understand all your options from Cleveland Clinic.",
        "read": "6 min read",
        "link": "https://my.clevelandclinic.org/health/diseases/3929-anemia"
    },
    {
        "icon": "06",
        "tag": "Women's Health",
        "title": "Anemia in Women and During Pregnancy",
        "body": "Women are at higher risk due to menstruation. During pregnancy iron needs double. Read the full guide from NHS.",
        "read": "6 min read",
        "link": "https://www.nhs.uk/conditions/iron-deficiency-anaemia/"
    }
]

def get_severity(hb, gender):
    lo = 13.5 if gender == "Male" else 12.0
    if hb >= lo:     return "No Anemia"
    elif hb >= 11.0: return "Mild Anemia"
    elif hb >= 8.0:  return "Moderate Anemia"
    else:            return "Severe Anemia"

def get_bmi_category(bmi):
    if bmi < 18.5:   return "Underweight"
    elif bmi < 25.0: return "Normal"
    elif bmi < 30.0: return "Overweight"
    else:            return "Obese"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/check')
def check():
    return render_template('check.html')

@app.route('/symptoms')
def symptoms():
    return render_template('symptoms.html')

@app.route('/bmi')
def bmi():
    return render_template('bmi.html')

@app.route('/tips')
def tips():
    return render_template('tips.html', tips=TIPS)

@app.route('/predict', methods=['POST'])
def predict():
    data       = request.get_json()
    gender_num = 1 if data['gender'] == 'Male' else 0
    hb         = float(data['hemoglobin'])
    mch        = float(data['mch'])
    mchc       = float(data['mchc'])
    mcv        = float(data['mcv'])
    gender     = data['gender']
    prediction = model.predict(np.array([[gender_num, hb, mch, mchc, mcv]]))[0]
    severity   = get_severity(hb, gender)
    diet       = DIET_PLANS[severity]
    return jsonify({'prediction': int(prediction), 'severity': severity, 'diet': diet})

@app.route('/predict_symptoms', methods=['POST'])
def predict_symptoms():
    data     = request.get_json()
    symptoms = data.get('symptoms', [])
    score    = len(symptoms)
    if score <= 2:   risk = "Low Risk"
    elif score <= 5: risk = "Moderate Risk"
    elif score <= 8: risk = "High Risk"
    else:            risk = "Very High Risk"
    return jsonify({'score': score, 'total': 10, 'risk': risk})

@app.route('/predict_bmi', methods=['POST'])
def predict_bmi():
    data     = request.get_json()
    weight   = float(data['weight'])
    height   = float(data['height']) / 100
    gender   = data['gender']
    hb       = float(data.get('hemoglobin', 0))
    bmi      = round(weight / (height ** 2), 1)
    bmi_cat  = get_bmi_category(bmi)
    severity = get_severity(hb, gender) if hb > 0 else None
    diet     = DIET_PLANS.get(severity, DIET_PLANS["No Anemia"]) if severity else None
    return jsonify({'bmi': bmi, 'category': bmi_cat, 'severity': severity, 'diet': diet})

@app.route('/generate_pdf', methods=['POST'])
def generate_pdf():
    data     = request.get_json()
    name     = data['name']
    age      = data['age']
    gender   = data['gender']
    hb       = float(data['hemoglobin'])
    mch      = float(data['mch'])
    mchc     = float(data['mchc'])
    mcv      = float(data['mcv'])
    severity = data['severity']
    diet     = DIET_PLANS[severity]

    buf    = io.BytesIO()
    doc    = SimpleDocTemplate(buf, pagesize=letter,
                               leftMargin=50, rightMargin=50,
                               topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    story  = []

    story.append(Paragraph("خون نامہ — Khoon Naama", styles['Title']))
    story.append(Paragraph("Anemia Risk Assessment Report", styles['Heading2']))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Patient Information", styles['Heading2']))
    t = Table([['Name', name],['Age', str(age)],['Gender', gender]],
              colWidths=[140, 340])
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(0,-1),colors.HexColor('#fce4ec')),
        ('FONTNAME',(0,0),(-1,-1),'Helvetica'),
        ('FONTSIZE',(0,0),(-1,-1),11),
        ('GRID',(0,0),(-1,-1),0.5,colors.HexColor('#f48fb1')),
        ('PADDING',(0,0),(-1,-1),8),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Blood Test Results", styles['Heading2']))
    def status(val, mn, mx): return "Normal" if mn <= val <= mx else "Abnormal"
    hb_mn, hb_mx     = NORMAL_RANGES['Hemoglobin'][gender]
    mch_mn, mch_mx   = NORMAL_RANGES['MCH'][gender]
    mchc_mn, mchc_mx = NORMAL_RANGES['MCHC'][gender]
    mcv_mn, mcv_mx   = NORMAL_RANGES['MCV'][gender]
    blood = [
        ['Test','Your Value','Normal Range','Status'],
        ['Hemoglobin (g/dL)', str(hb),   f'{hb_mn}–{hb_mx}',     status(hb,   hb_mn,   hb_mx)],
        ['MCH (pg)',          str(mch),  f'{mch_mn}–{mch_mx}',   status(mch,  mch_mn,  mch_mx)],
        ['MCHC (g/dL)',       str(mchc), f'{mchc_mn}–{mchc_mx}', status(mchc, mchc_mn, mchc_mx)],
        ['MCV (fL)',          str(mcv),  f'{mcv_mn}–{mcv_mx}',   status(mcv,  mcv_mn,  mcv_mx)],
    ]
    t2 = Table(blood, colWidths=[140,90,120,120])
    t2.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e91e63')),
        ('TEXTCOLOR',(0,0),(-1,0),colors.white),
        ('FONTNAME',(0,0),(-1,-1),'Helvetica'),
        ('FONTSIZE',(0,0),(-1,-1),10),
        ('GRID',(0,0),(-1,-1),0.5,colors.HexColor('#f48fb1')),
        ('PADDING',(0,0),(-1,-1),7),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#fff0f5')]),
    ]))
    story.append(t2)
    story.append(Spacer(1, 14))

    story.append(Paragraph(f"Diagnosis: {severity}", styles['Heading2']))
    story.append(Paragraph(diet['description'], styles['Normal']))
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"Diet Plan: {diet['title']}", styles['Heading3']))
    for food in diet['foods']:
        story.append(Paragraph(f"• {food}", styles['Normal']))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Foods to Avoid:", styles['Heading3']))
    for item in diet['avoid']:
        story.append(Paragraph(f"• {item}", styles['Normal']))
    story.append(Spacer(1, 20))
    story.append(Paragraph(
        "Disclaimer: Khoon Naama is for awareness only. Always consult a qualified doctor.",
        styles['Italic']))
    doc.build(story)
    buf.seek(0)
    return send_file(buf, mimetype='application/pdf', as_attachment=True,
                     download_name=f"KhoonNaama_{name.replace(' ','_')}.pdf")

if __name__ == '__main__':
    app.run(debug=True)