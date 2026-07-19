/* ================================
   Firebase Configuration & Setup
   ================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDzcCb4zAkzvz2CawdbHRbrksDH9bu1g2Q",
  databaseURL: "https://kolam-ikan-iot-78dc2-default-rtdb.asia-southeast1.firebasedatabase.app",
  authDomain: "kolam-ikan-iot-78dc2.firebaseapp.com",
  projectId: "kolam-ikan-iot-78dc2",
  storageBucket: "kolam-ikan-iot-78dc2.firebasestorage.app",
  messagingSenderId: "943109178162",
  appId: "1:943109178162:web:a8e8753287151c89c14d2b"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* ================================
   Chart Configuration
   ================================ */
const chartConfigs = [
  { id: "chartPh", label: "pH", color: "#00ff99" },
  { id: "chartTurbidity", label: "Turbidity", color: "#00bfff" },
  { id: "chartAir", label: "Level Air", color: "#ffd700" },
  { id: "chartPakan", label: "Stok Pakan", color: "#ff6347" }
];

const charts = {};

function formatNumber(value, digits = 2) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(digits) : value;
}

// Initialize charts
chartConfigs.forEach((config) => {
  const canvas = document.getElementById(config.id);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  charts[config.id] = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: config.label,
          data: [],
          borderColor: config.color,
          backgroundColor: "transparent",
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: "white" },
          grid: { color: "rgba(255,255,255,0.08)" }
        },
        y: {
          ticks: {
            color: "white",
            callback: (value) => Number(value).toFixed(2)
          },
          grid: { color: "rgba(255,255,255,0.08)" }
        }
      }
    }
  });
});

/* ================================
   Sensor Data Listeners
   ================================ */

// pH Sensor
onValue(ref(db, "sensor/ph"), (snapshot) => {
  document.getElementById("ph").textContent = formatNumber(snapshot.val());
});

onValue(ref(db, "sensor/status_ph"), (snapshot) => {
  document.getElementById("statusPH").textContent = snapshot.val();
});

// Turbidity Sensor
onValue(ref(db, "sensor/turbidity"), (snapshot) => {
  document.getElementById("turbidity").textContent = formatNumber(snapshot.val());
});

onValue(ref(db, "sensor/status_turbidity"), (snapshot) => {
  document.getElementById("statusTurb").textContent = snapshot.val();
});

// Water Level
onValue(ref(db, "sensor/level_air"), (snapshot) => {
  document.getElementById("air").textContent = formatNumber(snapshot.val()) + " %";
});

// Feed Stock
onValue(ref(db, "sensor/stok_pakan"), (snapshot) => {
  document.getElementById("pakan").textContent = formatNumber(snapshot.val()) + " %";
});

/* ================================
   Control Button State Listeners
   ================================ */

onValue(ref(db, "control/auto_mode"), (snapshot) => {
  const mode = snapshot.val();
  if (mode !== null) {
    updateModeButtons(mode);
  }
});

onValue(ref(db, "relay/kuras"), (snapshot) => {
  const mode = snapshot.val();
  if (mode !== null) {
    updateKurasButtons(mode);
  }
});

onValue(ref(db, "relay/isi"), (snapshot) => {
  const mode = snapshot.val();
  if (mode !== null) {
    updateIsiButtons(mode);
  }
});

/* ================================
   Control Functions (Global)
   ================================ */

window.setMode = function(mode) {
  set(ref(db, "control/auto_mode"), mode);
  updateModeButtons(mode);
};

window.setKuras = function(mode) {
  set(ref(db, "relay/kuras"), mode);
  updateKurasButtons(mode);
};

window.setIsi = function(mode) {
  set(ref(db, "relay/isi"), mode);
  updateIsiButtons(mode);
};

window.feedFish = function() {
  const btn = event.target;
  btn.classList.add("active");
  set(ref(db, "servo/feed"), 1);
  setTimeout(() => {
    set(ref(db, "servo/feed"), 0);
    btn.classList.remove("active");
  }, 1000);
};

/* ================================
   Button State Update Functions
   ================================ */

function updateModeButtons(mode) {
  const autoBtn = document.querySelector(".card .controls button.auto");
  const manualBtn = document.querySelector(".card .controls button.manual");

  if (mode === 1) {
    autoBtn?.classList.add("active");
    manualBtn?.classList.remove("active");
  } else {
    autoBtn?.classList.remove("active");
    manualBtn?.classList.add("active");
  }
}

function updateKurasButtons(mode) {
  const cards = document.querySelectorAll(".card");
  let kurasCard = null;

  cards.forEach((card) => {
    if (card.querySelector("h2")?.textContent.includes("Pompa Kuras")) {
      kurasCard = card;
    }
  });

  if (!kurasCard) return;

  const buttons = kurasCard.querySelectorAll("button");
  const onBtn = buttons[0];
  const offBtn = buttons[1];

  if (mode === 1) {
    onBtn?.classList.add("active");
    offBtn?.classList.remove("active");
  } else {
    onBtn?.classList.remove("active");
    offBtn?.classList.add("active");
  }
}

function updateIsiButtons(mode) {
  const cards = document.querySelectorAll(".card");
  let isiCard = null;

  cards.forEach((card) => {
    if (card.querySelector("h2")?.textContent.includes("Pompa Isi")) {
      isiCard = card;
    }
  });

  if (!isiCard) return;

  const buttons = isiCard.querySelectorAll("button");
  const onBtn = buttons[0];
  const offBtn = buttons[1];

  if (mode === 1) {
    onBtn?.classList.add("active");
    offBtn?.classList.remove("active");
  } else {
    onBtn?.classList.remove("active");
    offBtn?.classList.add("active");
  }
}

/* ================================
   History Data Listener
   ================================ */

onValue(ref(db, "history"), (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  const labels = [];
  const phData = [];
  const turbData = [];
  const airData = [];
  const pakanData = [];

  const tbody = document.querySelector("#historyTable tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  // Get last 24 entries
  const keys = Object.keys(data).sort().slice(-24);

  keys.forEach((key) => {
    const item = data[key];
    let waktu = key;

    // Convert timestamp if applicable
    if (!isNaN(key)) {
      const d = new Date(Number(key));
      waktu = d.toLocaleString("id-ID");
    }

    labels.push(waktu);
    phData.push(item.ph);
    turbData.push(item.turbidity);
    airData.push(item.level_air);
    pakanData.push(item.stok_pakan);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${waktu}</td>
      <td>${formatNumber(item.ph)}</td>
      <td>${formatNumber(item.turbidity)}</td>
      <td>${formatNumber(item.level_air)} %</td>
      <td>${formatNumber(item.stok_pakan)} %</td>
    `;
    tbody.appendChild(row);
  });

  // Update charts
  Object.entries({
    chartPh: phData,
    chartTurbidity: turbData,
    chartAir: airData,
    chartPakan: pakanData
  }).forEach(([chartId, values]) => {
    if (charts[chartId]) {
      charts[chartId].data.labels = labels;
      charts[chartId].data.datasets[0].data = values;
      charts[chartId].update();
    }
  });
});
