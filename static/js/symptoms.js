function toggleMobileNav() {
  const menu = document.getElementById('navMobile');
  const burger = document.querySelector('.nav-burger');
  if (menu) menu.classList.toggle('open');
  if (burger) burger.classList.toggle('open');
}

// Wait for page to fully load
window.addEventListener('load', () => {
  const cards = document.querySelectorAll('.symptom-card');
  
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      card.classList.toggle('selected');
      
      // Force background change directly
      if (card.classList.contains('selected')) {
        card.style.background = '#111318';
        card.style.color = 'white';
        card.style.borderColor = '#111318';
        card.querySelector('.sc-check').style.opacity = '1';
        card.querySelector('.sc-desc').style.color = 'rgba(255,255,255,0.6)';
      } else {
        card.style.background = 'white';
        card.style.color = '#111318';
        card.style.borderColor = '#e5e7eb';
        card.querySelector('.sc-check').style.opacity = '0';
        card.querySelector('.sc-desc').style.color = '#6b7280';
      }
      
      updateCount();
    });
  });
});

function updateCount() {
  const count = document.querySelectorAll('.symptom-card.selected').length;
  const counter = document.getElementById('selectedCount');
  if (counter) counter.textContent = count;
}

async function checkSymptoms() {
  const selected = Array.from(document.querySelectorAll('.symptom-card.selected'))
    .map(c => c.dataset.symptom);

  if (selected.length === 0) {
    alert("Please select at least one symptom.");
    return;
  }

  const btn = document.getElementById('checkSymptomsBtn');
  btn.textContent = 'Analyzing...';
  btn.disabled = true;

  try {
    const res  = await fetch("/predict_symptoms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms: selected }),
    });
    const data = await res.json();

    const riskMap = {
      "Low Risk":       { cls:"banner-green",  msg:"Your symptoms suggest a low risk of anemia. Maintain a balanced iron-rich diet." },
      "Moderate Risk":  { cls:"banner-orange", msg:"You have several anemia symptoms. Consider getting a blood test to confirm." },
      "High Risk":      { cls:"banner-red",    msg:"You have many anemia symptoms. Please get a CBC blood test and see a doctor soon." },
      "Very High Risk": { cls:"banner-red",    msg:"You have almost all anemia symptoms. Seek medical attention immediately." },
    };

    const { cls, msg } = riskMap[data.risk];
    const banner = document.getElementById("symptomBanner");
    banner.className = `result-banner ${cls}`;
    banner.innerHTML = `<h2>${data.risk}</h2><p>${msg}</p>`;

    document.getElementById("scoreNum").textContent  = data.score;
    document.getElementById("scoreRisk").textContent = data.risk;
    document.getElementById("scoreMessage").textContent = msg;

    const offset = 314 - (314 * data.score / data.total);
    const arc = document.getElementById("scoreArc");
    arc.style.strokeDashoffset = offset;

    const colorMap = {
      "Low Risk":       "#15803d",
      "Moderate Risk":  "#c2410c",
      "High Risk":      "#b91c1c",
      "Very High Risk": "#7f1d1d"
    };
    arc.style.stroke = colorMap[data.risk];
    document.getElementById("scoreRisk").style.color = colorMap[data.risk];

    const result = document.getElementById("symptomResult");
    result.classList.remove("hidden");
    result.scrollIntoView({ behavior: "smooth" });

  } catch(err) {
    alert("Something went wrong. Make sure Flask is running.");
  } finally {
    btn.textContent = 'Check My Risk Score';
    btn.disabled = false;
  }
}