const NORMAL_RANGES = {
  Hemoglobin: { Male: [13.5, 17.5], Female: [12.0, 15.5] },
  MCH:        { Male: [27.0, 33.0], Female: [27.0, 33.0] },
  MCHC:       { Male: [31.5, 35.7], Female: [31.5, 35.7] },
  MCV:        { Male: [80.0, 100.0],Female: [80.0, 100.0] },
};

function toggleMenu() {
  const m = document.getElementById('navMobile');
  m.classList.toggle('open');
}

let chartInstance = null;

function renderBanner(severity) {
  const map = {
    "No Anemia":       { cls:"banner-green",  icon:"✅", sub:"Your blood values are within the healthy range." },
    "Mild Anemia":     { cls:"banner-orange", icon:"⚠️", sub:"Consider improving your diet and consult a doctor." },
    "Moderate Anemia": { cls:"banner-red",    icon:"🚨", sub:"Please visit a doctor soon for proper diagnosis." },
    "Severe Anemia":   { cls:"banner-red",    icon:"🆘", sub:"Seek immediate medical attention." },
  };
  const { cls, icon, sub } = map[severity];
  const banner = document.getElementById("resultBanner");
  banner.className = `result-banner ${cls}`;
  banner.innerHTML = `<h2>${icon} ${severity}</h2><p>${sub}</p>`;
}

function renderMetrics(hb, mch, mchc, mcv, gender) {
  const labels = ["Hemoglobin","MCH","MCHC","MCV"];
  const values = [hb, mch, mchc, mcv];
  const units  = ["g/dL","pg","g/dL","fL"];
  const grid   = document.getElementById("metricsGrid");
  grid.innerHTML = "";
  labels.forEach((label, i) => {
    const [mn, mx] = NORMAL_RANGES[label][gender];
    const val = values[i];
    const status = val < mn ? "low" : val > mx ? "high" : "ok";
    const tagMap = {
      ok:   { cls:"tag-ok",   txt:"✓ Normal" },
      low:  { cls:"tag-low",  txt:"↓ Below Normal" },
      high: { cls:"tag-high", txt:"↑ Above Normal" },
    };
    grid.innerHTML += `
      <div class="metric-box ${status === "ok" ? "" : status}">
        <div class="metric-name">${label}</div>
        <div class="metric-val">${val}</div>
        <div class="metric-norm">${units[i]} · ${mn}–${mx}</div>
        <span class="metric-tag ${tagMap[status].cls}">${tagMap[status].txt}</span>
      </div>`;
  });
}

function renderChart(hb, mch, mchc, mcv, gender) {
  const labels  = ["Hemoglobin","MCH","MCHC","MCV"];
  const values  = [hb, mch, mchc, mcv];
  const mins    = labels.map(l => NORMAL_RANGES[l][gender][0]);
  const maxs    = labels.map(l => NORMAL_RANGES[l][gender][1]);
  const barColors = labels.map((l,i) => {
    const [mn,mx] = NORMAL_RANGES[l][gender];
    return values[i] >= mn && values[i] <= mx ? "#e91e63" : "#b71c1c";
  });
  if (chartInstance) chartInstance.destroy();
  const ctx = document.getElementById("valuesChart").getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label:"Your Value", data:values, backgroundColor:barColors, borderRadius:8, borderSkipped:false, order:1 },
        { label:"Normal Min", data:mins, type:"line", borderColor:"#2e7d32", borderWidth:2, borderDash:[6,4], pointStyle:false, fill:false, order:0 },
        { label:"Normal Max", data:maxs, type:"line", borderColor:"#f57f17", borderWidth:2, borderDash:[6,4], pointStyle:false, fill:false, order:0 },
      ],
    },
    options: {
      responsive:true,
      plugins: {
        legend:{ position:"top" },
        tooltip:{
          callbacks:{
            afterLabel: (ctx) => {
              const l = ctx.chart.data.labels[ctx.dataIndex];
              const [mn,mx] = NORMAL_RANGES[l]?.[gender] || [];
              return mn !== undefined ? `Normal: ${mn}–${mx}` : "";
            }
          }
        }
      },
      scales:{
        y:{ beginAtZero:false, grid:{ color:"#f0f0f0" } },
        x:{ grid:{ display:false } }
      }
    }
  });
}

function renderDiet(diet) {
  const card = document.getElementById("dietCard");
  const foodPills  = diet.foods.map(f  => `<span class="pill pill-green">${f}</span>`).join("");
  const avoidPills = diet.avoid.map(a  => `<span class="pill pill-red">${a}</span>`).join("");
  card.innerHTML = `
    <div class="rc-title">🥗 Your Personalized Diet Plan</div>
    <p class="diet-subtitle">${diet.title} — ${diet.description}</p>
    <div class="diet-cols">
      <div class="diet-col">
        <h4>✅ Eat More</h4>
        <div>${foodPills}</div>
      </div>
      <div class="diet-col">
        <h4>❌ Avoid</h4>
        <div>${avoidPills}</div>
      </div>
    </div>`;
}

// ── Blood Test Form ──────────────────────────────────
const anemiaForm = document.getElementById("anemiaForm");
if (anemiaForm) {
  anemiaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name   = document.getElementById("name").value.trim();
    const age    = document.getElementById("age").value;
    const gender = document.getElementById("gender").value;
    const hb     = parseFloat(document.getElementById("hemoglobin").value);
    const mch    = parseFloat(document.getElementById("mch").value);
    const mchc   = parseFloat(document.getElementById("mchc").value);
    const mcv    = parseFloat(document.getElementById("mcv").value);

    const btn = document.getElementById("btnText");
    btn.textContent = "Analyzing...";

   try {
      const res  = await fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age, gender, hemoglobin: hb, mch, mchc, mcv }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Please check your input values.");
        return;
      }

      renderBanner(data.severity);
      renderMetrics(hb, mch, mchc, mcv, gender);
      renderChart(hb, mch, mchc, mcv, gender);
      renderDiet(data.diet);

      document.getElementById("results").classList.remove("hidden");
      document.getElementById("results").scrollIntoView({ behavior: "smooth" });
      const data = await res.json();

      renderBanner(data.severity);
      renderMetrics(hb, mch, mchc, mcv, gender);
      renderChart(hb, mch, mchc, mcv, gender);
      renderDiet(data.diet);

      document.getElementById("results").classList.remove("hidden");
      document.getElementById("results").scrollIntoView({ behavior:"smooth" });

      document.getElementById("pdfBtn").onclick = async () => {
        const pdfRes = await fetch("/generate_pdf", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ name, age, gender, hemoglobin:hb, mch, mchc, mcv, severity:data.severity }),
        });
        const blob = await pdfRes.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href = url; a.download = `KhoonNaama_${name.replace(/\s+/g,"_")}.pdf`;
        a.click();
      };

    } catch(err) {
      alert("Something went wrong. Make sure Flask is running.");
    } finally {
      btn.textContent = "🔍 Analyze My Results";
    }
  });
}
// Mobile nav toggle
function toggleMobileNav() {
  const menu   = document.getElementById('navMobile');
  const burger = document.querySelector('.nav-burger');
  menu.classList.toggle('open');
  burger.classList.toggle('open');
}

// Active nav link highlight
document.querySelectorAll('.nav-links a').forEach(link => {
  if (link.href === window.location.href) {
    link.classList.add('active');
  }
});