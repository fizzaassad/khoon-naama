from flask import Flask, request, jsonify, render_template, send_file
import pickle
import numpy as np
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet

app = Flask(__name__)

# Load model
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
        "title": "Maintenance Diet — Keep it up!",
        "foods": ["Spinach daily","Lentils 3x/week","Lean red meat 2x/week",
                  "Eggs every day","Nuts & seeds","Vitamin C fruits"],
        "avoid": ["Tea/coffee with meals","Excess dairy with iron foods"]
    },
    "Mild Anemia": {
        "title": "Iron Recovery Diet",
        "foods": ["Red meat 4x/week","Lentils (دال) twice daily",
                  "Spinach (پالک) every day","2-3 eggs daily",
                  "Fenugreek leaves (میتھی)","Orange juice with meals",
                  "Pumpkin & sesame seeds","Pomegranate juice daily",
                  "Dates (کھجور) 7/day"],
        "avoid": ["Tea & coffee with meals","Calcium with iron-rich meals","Junk food"]
    },
    "Moderate Anemia": {
        "title": "Intensive Recovery — Please See a Doctor",
        "foods": ["Red meat daily","Lentils & chickpeas twice daily",
                  "Dark greens every meal","3 eggs daily",
                  "Beetroot juice every morning","Vitamin C every meal",
                  "Fish 3x/week","Pomegranate & dates daily"],
        "avoid": ["All tea & coffee","Alcohol","Processed foods completely"]
    },
    "Severe Anemia": {
        "title": "URGENT — See a Doctor Immediately",
        "foods": ["Follow doctor prescription first","Red meat without exception",
                  "Iron-fortified foods","Leafy greens every meal",
                  "Vitamin C every meal","Pomegranate juice twice daily",
                  "Dates (کھجور) 7/day"],
        "avoid": ["Tea, coffee & carbonated drinks","Do not self-medicate",
                  "No strenuous exercise until treated"]
    }
}

def get_severity(hb, gender):
    lo = 13.5 if gender == "Male" else 12.0
    if hb >= lo:     return "No Anemia"
    elif hb >= 11.0: return "Mild Anemia"
    elif hb >= 8.0:  return "Moderate Anemia"
    else:            return "Severe Anemia"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data       = request.get_json()
    gender_num = 1 if data['gender'] == 'Male' else 0
    hb         = float(data['hemoglobin'])
    mch        = float(data['mch'])
    mchc       = float(data['mchc'])
    mcv        = float(data['mcv'])
    gender     = data['gender']

    input_arr  = np.array([[gender_num, hb, mch, mchc, mcv]])
    prediction = model.predict(input_arr)[0]
    severity   = get_severity(hb, gender)

    return jsonify({
        'prediction': int(prediction),
        'severity':   severity,
    })

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

    # Title
    story.append(Paragraph("AnemiaCheck — Risk Assessment Report", styles['Title']))
    story.append(Spacer(1, 12))

    # Patient info
    story.append(Paragraph("Patient Information", styles['Heading2']))
    t = Table(
        [['Name', name], ['Age', str(age)], ['Gender', gender]],
        colWidths=[140, 340]
    )
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#e8f0fe')),
        ('FONTNAME',   (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE',   (0,0), (-1,-1), 11),
        ('GRID',       (0,0), (-1,-1), 0.5, colors.HexColor('#c5cae9')),
        ('PADDING',    (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))

    # Blood values
    story.append(Paragraph("Blood Test Results", styles['Heading2']))

    def status(val, mn, mx):
        return "Normal" if mn <= val <= mx else "Below Normal"

    hb_mn,   hb_mx   = NORMAL_RANGES['Hemoglobin'][gender]
    mch_mn,  mch_mx  = NORMAL_RANGES['MCH'][gender]
    mchc_mn, mchc_mx = NORMAL_RANGES['MCHC'][gender]
    mcv_mn,  mcv_mx  = NORMAL_RANGES['MCV'][gender]

    blood = [
        ['Test', 'Your Value', 'Normal Range', 'Status'],
        ['Hemoglobin (g/dL)', str(hb),   f'{hb_mn}–{hb_mx}',     status(hb,   hb_mn,   hb_mx)],
        ['MCH (pg)',          str(mch),  f'{mch_mn}–{mch_mx}',   status(mch,  mch_mn,  mch_mx)],
        ['MCHC (g/dL)',       str(mchc), f'{mchc_mn}–{mchc_mx}', status(mchc, mchc_mn, mchc_mx)],
        ['MCV (fL)',          str(mcv),  f'{mcv_mn}–{mcv_mx}',   status(mcv,  mcv_mn,  mcv_mx)],
    ]
    t2 = Table(blood, colWidths=[140, 90, 120, 120])
    t2.setStyle(TableStyle([
        ('BACKGROUND',    (0,0),  (-1,0),  colors.HexColor('#1a73e8')),
        ('TEXTCOLOR',     (0,0),  (-1,0),  colors.white),
        ('FONTNAME',      (0,0),  (-1,-1), 'Helvetica'),
        ('FONTSIZE',      (0,0),  (-1,-1), 10),
        ('GRID',          (0,0),  (-1,-1), 0.5, colors.HexColor('#bbdefb')),
        ('PADDING',       (0,0),  (-1,-1), 7),
        ('ROWBACKGROUNDS',(0,1),  (-1,-1), [colors.white, colors.HexColor('#f3f4f6')]),
    ]))
    story.append(t2)
    story.append(Spacer(1, 14))

    # Diagnosis
    story.append(Paragraph(f"Diagnosis: {severity}", styles['Heading2']))
    story.append(Spacer(1, 6))

    # Diet
    story.append(Paragraph(f"Diet Plan: {diet['title']}", styles['Heading3']))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Recommended Foods:", styles['Heading3']))
    for food in diet['foods']:
        story.append(Paragraph(f"• {food}", styles['Normal']))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Foods to Avoid:", styles['Heading3']))
    for item in diet['avoid']:
        story.append(Paragraph(f"• {item}", styles['Normal']))
    story.append(Spacer(1, 20))

    # Disclaimer
    story.append(Paragraph(
        "Disclaimer: This report is for awareness only and does not replace professional medical advice. Always consult a qualified doctor.",
        styles['Italic']
    ))

    doc.build(story)
    buf.seek(0)

    return send_file(
        buf,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"AnemiaCheck_{name.replace(' ', '_')}.pdf"
    )

if __name__ == '__main__':
    app.run(debug=True)