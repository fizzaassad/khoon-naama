const NORMAL_RANGES = {
  Hemoglobin: { Male: [13.5, 17.5], Female: [12.0, 15.5] },
  MCH:        { Male: [27.0, 33.0], Female: [27.0, 33.0] },
  MCHC:       { Male: [31.5, 35.7], Female: [31.5, 35.7] },
  MCV:        { Male: [80.0, 100.0],Female: [80.0, 100.0] },
};

const DIET_PLANS = {
  "No Anemia": {
    title: "Maintenance Diet — Keep it up!",
    foods: ["🥬 Spinach daily","🫘 Lentils 3×/week","🥩 Lean red meat 2×/week","🍳 Eggs every day","🌰 Nuts & seeds","🍊 Vitamin C fruits"],
    avoid: ["Tea/coffee with meals","Excess dairy with iron foods"]
  },
  "Mild Anemia": {
    title: "Iron Recovery Diet",
    foods: ["🥩 Red meat 4×/week","🫘 Lentils (دال) twice daily","🥬 Spinach (پالک) every day","🍳 2–3 eggs daily","🌿 Fenugreek (میتھی)","🍊 Orange juice with meals","🌰 Pumpkin & sesame seeds","🫐 Pomegranate juice daily","🌴 Dates (کھجور) 7/day"],
    avoid: ["Tea & coffee with meals","Calcium with iron-rich meals","Junk food"]
  },
  "Moderate Anemia": {
    title: "Intensive Recovery — Please See a Doctor",
    foods: ["🥩 Red meat daily","🫘 Lentils & chickpeas twice daily","🥬 Dark greens every meal","🍳 3 eggs daily","🌱 Beetroot juice every morning","🍊 Vitamin C every meal","🐟 Fish 3×/week","🫐 Pomegranate & dates daily"],
    avoid: ["All tea & coffee","Alcohol","Processed foods completely"]
  },
  "Severe Anemia": {
    title: "⚠️ URGENT — See a Doctor Immediately",
    foods: ["Follow doctor prescription first","🥩 Red meat without exception","🫘 Iron-fortified foods","🥬 Leafy greens every meal","🍊 Vitamin C every meal","🫐 Pomegranate juice twice daily","🌴 Dates (کھجور) 7/day"],
    avoid: ["Tea, coffee & carbonated drinks completely","Do not self-medicate","No strenuous exercise until treated"]
  }
};

function getSeverity(hb, gender) {
  const lo = gender === "Male" ? 13.5 : 12.0;
  if (hb >= lo)    return "No Anemia";
  if (hb >= 11.0)  return "Mild Anemia";
  if (hb >= 8.0)   return "Moderate Anemia";
  return "Severe Anemia";
}

function getMetricStatus(label, val, gender) {
  const [min, max] = NORMAL_RANGES[label][gender];
  if (val < min) return "low";
  if (val > max) return "high";
  return "ok";
}

let chartInstance = null;

function renderChart(hb, mch, mchc, mcv, gender) {
  const labels  = ["Hemoglobin", "MCH", "MCHC", "MCV"];
  const values  = [hb, mch, mchc, mcv];
  const mins    = labels.map(l => NORMAL_RANGES[l][gender][0]);
  const maxs    = labels.map(l => NORMAL_RANGES[l][gender][1]);
  const barColors = labels.map((l, i) => {
    const [mn, mx] = NORMAL_RANGES[l][gender];
    return values[i] >= mn && values[i] <= mx ? "#1a73e8" : "#e53935";
  });

  if (chartInstance) chartInstance.destroy();

  const ctx = document.getElementById("valuesChart").getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Your Value",
          data: values,
          backgroundColor: barColors,
          borderRadius: 8,
          borderSkipped: false,
          order: 1,
        },
        {
          label: "Normal Min",
          data: mins,
          type: "line",
          borderColor: "#2e7d32",
          borderWidth: 2,
          borderDash: [6, 4],
          pointStyle: false,
          fill: false,
          order: 0,
        },
        {
          label: "Normal Max",
          data: maxs,
          type: "line",
          borderColor: "#f57f17",
          borderWidth: 2,
          borderDash: [6, 4],
          pointStyle: false,
          fill: false,
          order: 0,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            afterLabel: (ctx) => {
              const label = ctx.chart.data.labels[ctx.dataIndex];
              const [mn, mx] = NORMAL_RANGES[label]?.[gender] || [];
              return mn !== undefined ? `Normal: ${mn} – ${mx}` : "";
            },
          },
        },
      },
      scales: {
        y: { beginAtZero: false, grid: { color: "#f0f0f0" } },
        x: { grid: { display: false } },
      },
    },
  });
}

function renderMetrics(hb, mch, mchc, mcv, gender) {
  const labels = ["Hemoglobin", "MCH", "MCHC", "MCV"];
  const values = [hb, mch, mchc, mcv];
  const units  = ["g/dL", "pg", "g/dL", "fL"];
  const grid   = document.getElementById("metricsGrid");
  grid.innerHTML = "";

  labels.forEach((label, i) => {
    const status = getMetricStatus(label, values[i], gender);
    const [mn, mx] = NORMAL_RANGES[label][gender];
    const tagMap = {
      ok:   { cls: "tag-ok",   txt: "✓ Normal" },
      low:  { cls: "tag-low",  txt: "↓ Below Normal" },
      high: { cls: "tag-high", txt: "↑ Above Normal" },
    };
    grid.innerHTML += `
      <div class="metric-box ${status === "ok" ? "" : status}">
        <div class="metric-name">${label}</div>
        <div class="metric-val">${values[i]}</div>
        <div class="metric-norm">${units[i]} | Normal: ${mn}–${mx}</div>
        <span class="metric-tag ${tagMap[status].cls}">${tagMap[status].txt}</span>
      </div>`;
  });
}

function renderDiet(severity) {
  const plan = DIET_PLANS[severity];
  const card = document.getElementById("dietCard");
  const foodPills  = plan.foods.map(f => `<span class="pill pill-green">${f}</span>`).join("");
  const avoidPills = plan.avoid.map(a => `<span class="pill pill-red">${a}</span>`).join("");
  card.innerHTML = `
    <h3>🥗 Personalized Diet Plan</h3>
    <p class="diet-subtitle">${plan.title}</p>
    <div class="diet-cols">
      <div class="diet-col">
        <h4>✅ Eat More:</h4>
        <div>${foodPills}</div>
      </div>
      <div class="diet-col">
        <h4>❌ Avoid:</h4>
        <div>${avoidPills}</div>
      </div>
    </div>`;
}

function renderBanner(severity) {
  const banner = document.getElementById("resultBanner");
  const map = {
    "No Anemia":       { cls: "banner-green",  icon: "✅", sub: "Your blood values are within the healthy range." },
    "Mild Anemia":     { cls: "banner-orange", icon: "⚠️", sub: "Consider improving your diet and consult a doctor." },
    "Moderate Anemia": { cls: "banner-red",    icon: "🚨", sub: "Please visit a doctor soon for proper diagnosis." },
    "Severe Anemia":   { cls: "banner-red",    icon: "🆘", sub: "Seek immediate medical attention." },
  };
  const { cls, icon, sub } = map[severity];
  banner.className = `result-banner ${cls}`;
  banner.innerHTML = `<h2>${icon} ${severity}</h2><p>${sub}</p>`;
}

// ── Form submit ──────────────────────────────────────
document.getElementById("anemiaForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name   = document.getElementById("name").value.trim();
  const age    = document.getElementById("age").value;
  const gender = document.getElementById("gender").value;
  const hb     = parseFloat(document.getElementById("hemoglobin").value);
  const mch    = parseFloat(document.getElementById("mch").value);
  const mchc   = parseFloat(document.getElementById("mchc").value);
  const mcv    = parseFloat(document.getElementById("mcv").value);

  const btn = document.querySelector(".btn-analyze");
  btn.textContent = "Analyzing...";
  btn.disabled = true;

  try {
    const res  = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, age, gender, hemoglobin: hb, mch, mchc, mcv }),
    });
    const data = await res.json();
    const severity = data.severity;

    renderBanner(severity);
    renderMetrics(hb, mch, mchc, mcv, gender);
    renderChart(hb, mch, mchc, mcv, gender);
    renderDiet(severity);

    document.getElementById("results").classList.remove("hidden");
    document.getElementById("results").scrollIntoView({ behavior: "smooth" });

    // PDF button
    document.getElementById("pdfBtn").onclick = async () => {
      const pdfRes = await fetch("/generate_pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age, gender, hemoglobin: hb, mch, mchc, mcv, severity }),
      });
      const blob = await pdfRes.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `AnemiaCheck_${name.replace(/\s+/g,"_")}.pdf`;
      a.click();
    };

  } catch (err) {
    alert("Something went wrong. Make sure Flask is running.");
  } finally {
    btn.textContent = "🔍 Analyze My Results";
    btn.disabled = false;
  }
});