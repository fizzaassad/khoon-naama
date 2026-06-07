function toggleMenu() {
  const m = document.getElementById('navMobile');
  m.classList.toggle('open');
}

document.getElementById("bmiForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const gender = document.getElementById("bmiGender").value;
  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);
  const hb     = parseFloat(document.getElementById("bmiHemoglobin").value) || 0;
  const age    = document.getElementById("bmiAge").value;

  const res  = await fetch("/predict_bmi", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ gender, weight, height, hemoglobin:hb }),
  });
  const data = await res.json();

  const bmiMap = {
    "Underweight": { cls:"banner-orange", icon:"⚠️", msg:"You are underweight. This increases your anemia risk. Focus on nutrient-dense foods." },
    "Normal":      { cls:"banner-green",  icon:"✅", msg:"Your BMI is in the healthy range. Keep maintaining a balanced diet." },
    "Overweight":  { cls:"banner-orange", icon:"⚠️", msg:"You are overweight. Focus on whole foods, less processed carbs, and regular activity." },
    "Obese":       { cls:"banner-red",    icon:"🚨", msg:"Your BMI indicates obesity. Please consult a doctor for a personalized health plan." },
  };

  const { cls, icon, msg } = bmiMap[data.category];
  const banner = document.getElementById("bmiBanner");
  banner.className = `result-banner ${cls}`;
  banner.innerHTML = `
    <div style="display:flex;align-items:center;gap:2rem;flex-wrap:wrap">
      <div>
        <h2>${icon} BMI: ${data.bmi} — ${data.category}</h2>
        <p>${msg}</p>
      </div>
    </div>`;

  // BMI marker position
  document.getElementById("bmiValueDisplay").textContent = data.bmi;
  const pct = Math.min(Math.max((data.bmi - 10) / 30 * 100, 0), 100);
  document.getElementById("bmiMarker").style.left = `${pct}%`;

  // Combined analysis
  const combined = document.getElementById("combinedCard");
  if (data.severity) {
    const combo = {
      "Underweight + No Anemia":       "Your weight is low but blood is healthy. Focus on calorie-dense iron-rich foods.",
      "Underweight + Mild Anemia":     "Underweight + mild anemia is a serious combination. Prioritize iron and calorie intake.",
      "Underweight + Moderate Anemia": "Urgent: Underweight + moderate anemia. See a doctor immediately.",
      "Underweight + Severe Anemia":   "Critical: Seek medical attention now. Do not manage this alone.",
      "Normal + No Anemia":            "Excellent! Maintain your current lifestyle and balanced diet.",
      "Normal + Mild Anemia":          "Weight is healthy but hemoglobin is low. Add more iron-rich foods to your diet.",
      "Normal + Moderate Anemia":      "Normal weight but moderate anemia detected. Doctor visit recommended soon.",
      "Normal + Severe Anemia":        "Normal weight but severe anemia. Seek medical attention immediately.",
      "Overweight + No Anemia":        "Focus on reducing processed foods and increasing physical activity.",
      "Overweight + Mild Anemia":      "Overweight with mild anemia — reduce junk food and add iron-rich whole foods.",
      "Overweight + Moderate Anemia":  "Overweight with moderate anemia — consult a doctor for a combined health plan.",
      "Overweight + Severe Anemia":    "Serious combination. Seek immediate medical care.",
      "Obese + No Anemia":             "Focus on sustainable weight loss through whole foods and exercise.",
      "Obese + Mild Anemia":           "Obese with anemia — see a nutritionist and doctor together.",
      "Obese + Moderate Anemia":       "This combination needs professional medical guidance urgently.",
      "Obese + Severe Anemia":         "Critical combination. Seek immediate medical attention.",
    };
    const key     = `${data.category} + ${data.severity}`;
    const message = combo[key] || "Please consult a doctor for a combined analysis.";
    combined.innerHTML = `
      <div class="rc-title">🔬 Combined Analysis</div>
      <div class="combined-result">
        <div class="cr-item">
          <div class="cr-label">BMI Status</div>
          <div class="cr-val">${data.category}</div>
        </div>
        <div class="cr-plus">+</div>
        <div class="cr-item">
          <div class="cr-label">Anemia Status</div>
          <div class="cr-val">${data.severity}</div>
        </div>
      </div>
      <p class="combined-msg">${message}</p>`;
  } else {
    combined.innerHTML = `
      <div class="rc-title">💡 Add Hemoglobin for Combined Analysis</div>
      <p style="color:var(--text-soft);margin-top:0.5rem">Enter your hemoglobin value above to get a combined BMI + anemia analysis and personalized diet plan.</p>`;
  }

  // Diet
  if (data.diet) {
    const foodPills  = data.diet.foods.map(f => `<span class="pill pill-green">${f}</span>`).join("");
    const avoidPills = data.diet.avoid.map(a => `<span class="pill pill-red">${a}</span>`).join("");
    document.getElementById("bmiDietCard").innerHTML = `
      <div class="rc-title">🥗 Your Personalized Diet Plan</div>
      <p class="diet-subtitle">${data.diet.title} — ${data.diet.description}</p>
      <div class="diet-cols">
        <div class="diet-col"><h4>✅ Eat More</h4><div>${foodPills}</div></div>
        <div class="diet-col"><h4>❌ Avoid</h4><div>${avoidPills}</div></div>
      </div>`;
  }

  document.getElementById("bmiResults").classList.remove("hidden");
  document.getElementById("bmiResults").scrollIntoView({ behavior:"smooth" });
});
function toggleMobileNav() {
  const menu   = document.getElementById('navMobile');
  const burger = document.querySelector('.nav-burger');
  menu.classList.toggle('open');
  burger.classList.toggle('open');
}