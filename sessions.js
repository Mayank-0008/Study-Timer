// Utility: format seconds to hh:mm:ss or shorter
function formatDuration(sec) {
  if (sec < 60) {
    return `${sec}s`;
  } else if (sec < 3600) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  } else {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  }
}

const sessionList = document.getElementById("sessionList");
const clearBtn = document.getElementById("clearBtn");
const weeklyCtx = document.getElementById("weeklyChart").getContext("2d");
const dailyCtx = document.getElementById("dailyChart").getContext("2d");

function loadSessions() {
  const sessions = JSON.parse(localStorage.getItem("sessions") || "[]");
  sessionList.innerHTML = "";

  if (sessions.length === 0) {
    sessionList.innerHTML = "<li>No sessions yet!</li>";
    return;
  }

  // --- 1. Display session list ---
  sessions.forEach(session => {
    const li = document.createElement("li");
    li.textContent = `${session.label} — ${formatDuration(session.lengthSec)} on ${new Date(session.timestamp).toLocaleString()}`;
    sessionList.appendChild(li);
  });

  // --- 2. Weekly summary ---
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday start

  const weekData = [0, 0, 0, 0, 0, 0, 0]; // Sun..Sat
  sessions.forEach(s => {
    const date = new Date(s.timestamp);
    if (date >= startOfWeek) {
      weekData[date.getDay()] += s.lengthSec; // store seconds
    }
  });

  const weekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  new Chart(weeklyCtx, {
    type: "bar",
    data: {
      labels: weekLabels,
      datasets: [{
        label: "This week",
        data: weekData.map(formatDuration),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => formatDuration(weekData[ctx.dataIndex])
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (val) => formatDuration(val)
          },
          title: { display: true, text: "Time" }
        }
      }
    }
  });

  // --- 3. All-time daily chart ---
  const dailyTotals = {};
  sessions.forEach(s => {
    const date = new Date(s.timestamp).toLocaleDateString();
    dailyTotals[date] = (dailyTotals[date] || 0) + s.lengthSec;
  });

  const labels = Object.keys(dailyTotals).reverse();
  const data = Object.values(dailyTotals).reverse();

  new Chart(dailyCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Focus Time (All Time)",
        data: data,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.2,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => formatDuration(ctx.raw)
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: val => formatDuration(val)
          },
          title: { display: true, text: "Time" }
        },
        x: {
          title: { display: true, text: "Date" }
        }
      }
    }
  });
}

clearBtn.addEventListener("click", () => {
  localStorage.removeItem("sessions");
  loadSessions();
});

loadSessions();
