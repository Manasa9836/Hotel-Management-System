// =====================================
// HOTEL REVENUE MANAGEMENT SYSTEM
// FRONTEND ONLY - SAMPLE DATA
// =====================================

// Format currency in Indian Rupees
const money = amount =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);

// Generate dates relative to today for demo records
function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

// =====================================
// SAMPLE DATA
// =====================================

let rooms = [
  { id: 1, number: "101", type: "Single", price: 1500, status: "Available" },
  { id: 2, number: "102", type: "Double", price: 2500, status: "Occupied" },
  { id: 3, number: "103", type: "Deluxe", price: 3500, status: "Available" },
  { id: 4, number: "104", type: "Suite", price: 5000, status: "Occupied" },
  { id: 5, number: "105", type: "Double", price: 2500, status: "Available" },
  { id: 6, number: "106", type: "Deluxe", price: 3500, status: "Available" }
];

let bookings = [
  {
    id: 1, customer: "Rahul Sharma", roomId: 2,
    checkIn: dateOffset(-3), checkOut: dateOffset(1),
    amount: 10000, payment: "Paid"
  },
  {
    id: 2, customer: "Priya Patel", roomId: 4,
    checkIn: dateOffset(-2), checkOut: dateOffset(2),
    amount: 20000, payment: "Pending"
  },
  {
    id: 3, customer: "Amit Kumar", roomId: 1,
    checkIn: dateOffset(-1), checkOut: dateOffset(1),
    amount: 3000, payment: "Paid"
  },
  {
    id: 4, customer: "Sneha Reddy", roomId: 3,
    checkIn: dateOffset(2), checkOut: dateOffset(4),
    amount: 7000, payment: "Pending"
  }
];

let expenses = [
  { id: 1, name: "Electricity Bill", date: dateOffset(-5), amount: 4500 },
  { id: 2, name: "Staff Salary", date: dateOffset(-4), amount: 12000 },
  { id: 3, name: "Cleaning Supplies", date: dateOffset(-2), amount: 1800 },
  { id: 4, name: "Maintenance", date: dateOffset(-1), amount: 2500 }
];

let currentModal = "";
let revenueChart = null;
let distributionChart = null;
let analyticsChart = null;

// =====================================
// NAVIGATION
// =====================================

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active-page");
  });

  document.querySelectorAll(".nav[data-page]").forEach(button => {
    button.classList.remove("active");
  });

  const page = document.getElementById(pageId);
  const navButton = document.querySelector(
    `.nav[data-page="${pageId}"]`
  );

  if (!page) return;

  page.classList.add("active-page");

  if (navButton) navButton.classList.add("active");

  const titles = {
    dashboard: "Dashboard",
    rooms: "Room Management",
    bookings: "Bookings",
    expenses: "Expenses",
    analytics: "Analytics",
    reports: "Reports"
  };

  document.getElementById("pageTitle").textContent =
    titles[pageId] || "Dashboard";
}

document.querySelectorAll(".nav[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

// =====================================
// DARK MODE
// =====================================

const themeBtn = document.getElementById("themeBtn");

if (localStorage.getItem("hotelTheme") === "dark") {
  document.body.classList.add("dark");
}

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  localStorage.setItem(
    "hotelTheme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
});

// =====================================
// TOAST MESSAGE
// =====================================

let toastTimeout;

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// =====================================
// SAFE HTML OUTPUT
// =====================================

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function getRoom(roomId) {
  return rooms.find(room => room.id === Number(roomId));
}

function roomName(roomId) {
  const room = getRoom(roomId);
  return room ? room.number : "Deleted room";
}

// =====================================
// MODAL
// =====================================

function openModal(type) {
  currentModal = type;

  const modal = document.getElementById("modal");
  const title = document.getElementById("modalTitle");
  const fields = document.getElementById("formFields");

  const templates = {
    room: {
      title: "Add New Room",
      html: `
        <div class="field">
          <label>Room Number</label>
          <input name="number" required maxlength="20" placeholder="Example: 107">
        </div>
        <div class="field">
          <label>Room Type</label>
          <select name="type" required>
            <option value="">Select room type</option>
            <option>Single</option>
            <option>Double</option>
            <option>Deluxe</option>
            <option>Suite</option>
          </select>
        </div>
        <div class="field">
          <label>Price Per Night (₹)</label>
          <input name="price" type="number" min="1" step="0.01" required>
        </div>`
    },

    booking: {
      title: "Add New Booking",
      html: `
        <div class="field">
          <label>Customer Name</label>
          <input name="customer" required maxlength="100" placeholder="Enter customer name">
        </div>
        <div class="field">
          <label>Select Room</label>
          <select name="roomId" required>
            <option value="">Choose available room</option>
            ${rooms.filter(room => room.status === "Available").map(room => `
              <option value="${room.id}">
                Room ${escapeHTML(room.number)} - ${escapeHTML(room.type)}
                (${money(room.price)}/night)
              </option>
            `).join("")}
          </select>
        </div>
        <div class="field">
          <label>Check-in Date</label>
          <input name="checkIn" type="date" required>
        </div>
        <div class="field">
          <label>Check-out Date</label>
          <input name="checkOut" type="date" required>
        </div>
        <div class="field">
          <label>Total Booking Amount (₹)</label>
          <input name="amount" type="number" min="1" step="0.01" required>
        </div>`
    },

    expense: {
      title: "Add New Expense",
      html: `
        <div class="field">
          <label>Expense Name</label>
          <input name="name" required maxlength="100" placeholder="Example: Water Bill">
        </div>
        <div class="field">
          <label>Expense Date</label>
          <input name="date" type="date" required value="${dateOffset(0)}">
        </div>
        <div class="field">
          <label>Amount (₹)</label>
          <input name="amount" type="number" min="1" step="0.01" required>
        </div>`
    }
  };

  if (!templates[type]) return;

  title.textContent = templates[type].title;
  fields.innerHTML = templates[type].html;
  modal.classList.add("show");
}

function closeModal() {
  document.getElementById("modal").classList.remove("show");
  document.getElementById("recordForm").reset();
  currentModal = "";
}

document.getElementById("modal").addEventListener("click", event => {
  if (event.target.id === "modal") closeModal();
});

// =====================================
// SAVE FORM DATA
// =====================================

document.getElementById("recordForm").addEventListener("submit", event => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());

  if (currentModal === "room") {
    const number = data.number.trim();

    if (rooms.some(room => room.number.toLowerCase() === number.toLowerCase())) {
      showToast("Room number already exists.");
      return;
    }

    rooms.push({
      id: Date.now(),
      number,
      type: data.type,
      price: Number(data.price),
      status: "Available"
    });

    showToast("Room added successfully!");
  }

  if (currentModal === "booking") {
    const room = getRoom(data.roomId);

    if (!room || room.status !== "Available") {
      showToast("Please select an available room.");
      return;
    }

    if (data.checkOut <= data.checkIn) {
      showToast("Check-out must be after check-in.");
      return;
    }

    bookings.push({
      id: Date.now(),
      customer: data.customer.trim(),
      roomId: Number(data.roomId),
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      amount: Number(data.amount),
      payment: "Pending"
    });

    room.status = "Occupied";

    showToast("Booking added successfully!");
  }

  if (currentModal === "expense") {
    expenses.push({
      id: Date.now(),
      name: data.name.trim(),
      date: data.date,
      amount: Number(data.amount)
    });

    showToast("Expense added successfully!");
  }

  closeModal();
  refreshApp();
});

// =====================================
// RENDER ROOMS
// =====================================

function renderRooms() {
  const grid = document.getElementById("roomGrid");

  grid.innerHTML = rooms.map(room => `
    <article class="room-card">
      <h3>Room ${escapeHTML(room.number)}</h3>
      <p>${escapeHTML(room.type)} Room</p>
      <p class="price">${money(room.price)} <small>/ night</small></p>
      <p>
        <span class="status ${room.status === "Available" ? "available" : "occupied"}">
          ${escapeHTML(room.status)}
        </span>
      </p>
      <button class="action-btn" onclick="deleteRoom(${room.id})">Delete room</button>
    </article>
  `).join("");

  if (rooms.length === 0) {
    grid.innerHTML = "<p>No rooms available. Add your first room.</p>";
  }
}

function deleteRoom(id) {
  const room = getRoom(id);

  if (!room) return;

  if (bookings.some(booking => booking.roomId === id)) {
    showToast("Cannot delete a room with booking records.");
    return;
  }

  if (!confirm(`Delete room ${room.number}?`)) return;

  rooms = rooms.filter(item => item.id !== id);

  showToast("Room deleted.");
  refreshApp();
}

// =====================================
// RENDER BOOKINGS
// =====================================

function renderBookings() {
  const table = document.getElementById("bookingTable");
  const search = document.getElementById("bookingSearch").value.toLowerCase();

  const filtered = bookings.filter(booking => {
    const room = roomName(booking.roomId).toLowerCase();

    return booking.customer.toLowerCase().includes(search) ||
      room.includes(search);
  });

  table.innerHTML = filtered.map(booking => `
    <tr>
      <td>${escapeHTML(booking.customer)}</td>
      <td>${escapeHTML(roomName(booking.roomId))}</td>
      <td>${escapeHTML(booking.checkIn)}</td>
      <td>${escapeHTML(booking.checkOut)}</td>
      <td>${money(booking.amount)}</td>
      <td>
        <span class="status ${booking.payment === "Paid" ? "paid" : "pending"}">
          ${booking.payment}
        </span>
      </td>
      <td>
        ${booking.payment === "Pending"
          ? `<button class="action-btn" onclick="markPaid(${booking.id})">Mark paid</button>`
          : ""}
        <button class="action-btn" onclick="deleteBooking(${booking.id})">Delete</button>
      </td>
    </tr>
  `).join("");

  if (filtered.length === 0) {
    table.innerHTML = `<tr><td colspan="7">No bookings found.</td></tr>`;
  }

  renderRecentBookings();
}

function renderRecentBookings() {
  const table = document.getElementById("recentBookings");

  const recent = [...bookings]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  table.innerHTML = recent.map(booking => `
    <tr>
      <td>${escapeHTML(booking.customer)}</td>
      <td>${escapeHTML(roomName(booking.roomId))}</td>
      <td>${escapeHTML(booking.checkIn)}</td>
      <td>${money(booking.amount)}</td>
      <td>
        <span class="status ${booking.payment === "Paid" ? "paid" : "pending"}">
          ${booking.payment}
        </span>
      </td>
    </tr>
  `).join("");

  if (recent.length === 0) {
    table.innerHTML = `<tr><td colspan="5">No bookings yet.</td></tr>`;
  }
}

function markPaid(id) {
  const booking = bookings.find(item => item.id === id);

  if (!booking) return;

  booking.payment = "Paid";
  showToast("Payment marked as paid.");
  refreshApp();
}

function deleteBooking(id) {
  const booking = bookings.find(item => item.id === id);

  if (!booking || !confirm("Delete this booking?")) return;

  const room = getRoom(booking.roomId);

  if (room) room.status = "Available";

  bookings = bookings.filter(item => item.id !== id);

  showToast("Booking deleted.");
  refreshApp();
}

// =====================================
// RENDER EXPENSES
// =====================================

function renderExpenses() {
  const table = document.getElementById("expenseTable");

  table.innerHTML = expenses.map(expense => `
    <tr>
      <td>${escapeHTML(expense.name)}</td>
      <td>${escapeHTML(expense.date)}</td>
      <td>${money(expense.amount)}</td>
      <td>
        <button class="action-btn" onclick="deleteExpense(${expense.id})">Delete</button>
      </td>
    </tr>
  `).join("");

  if (expenses.length === 0) {
    table.innerHTML = `<tr><td colspan="4">No expenses recorded.</td></tr>`;
  }
}

function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;

  expenses = expenses.filter(expense => expense.id !== id);

  showToast("Expense deleted.");
  refreshApp();
}

// =====================================
// DASHBOARD CALCULATIONS
// =====================================

function updateDashboard() {
  const paidRevenue = bookings
    .filter(booking => booking.payment === "Paid")
    .reduce((sum, booking) => sum + booking.amount, 0);

  const totalExpenses = expenses
    .reduce((sum, expense) => sum + expense.amount, 0);

  const profit = paidRevenue - totalExpenses;

  const occupiedRooms = rooms.filter(
    room => room.status === "Occupied"
  ).length;

  const occupancyRate = rooms.length
    ? Math.round((occupiedRooms / rooms.length) * 100)
    : 0;

  document.getElementById("revenue").textContent = money(paidRevenue);
  document.getElementById("expense").textContent = money(totalExpenses);
  document.getElementById("profit").textContent = money(profit);
  document.getElementById("occupancy").textContent = occupancyRate + "%";
  document.getElementById("roomCount").textContent =
    `${occupiedRooms} occupied out of ${rooms.length} rooms`;

  const average = bookings.length
    ? bookings.reduce((sum, booking) => sum + booking.amount, 0) / bookings.length
    : 0;

  document.getElementById("averageBooking").textContent = money(average);
  document.getElementById("totalBookings").textContent = bookings.length;
  document.getElementById("paidBookings").textContent =
    bookings.filter(booking => booking.payment === "Paid").length;
}

// =====================================
// CHARTS
// =====================================

function monthLabel(date) {
  return new Date(date + "T00:00:00").toLocaleString("en-IN", {
    month: "short",
    year: "2-digit"
  });
}

function getMonthlyTotals(records, dateField, amountField) {
  const totals = {};

  records.forEach(record => {
    const key = monthLabel(record[dateField]);
    totals[key] = (totals[key] || 0) + Number(record[amountField]);
  });

  return totals;
}

function drawCharts() {
  if (typeof Chart === "undefined") {
    console.warn("Chart.js could not be loaded.");
    return;
  }

  const paidBookings = bookings.filter(
    booking => booking.payment === "Paid"
  );

  const revenueTotals = getMonthlyTotals(
    paidBookings, "checkIn", "amount"
  );

  const expenseTotals = getMonthlyTotals(
    expenses, "date", "amount"
  );

  const labels = [...new Set([
    ...Object.keys(revenueTotals),
    ...Object.keys(expenseTotals)
  ])];

  if (revenueChart) revenueChart.destroy();
  if (distributionChart) distributionChart.destroy();
  if (analyticsChart) analyticsChart.destroy();

  const revenueCanvas = document.getElementById("revenueChart");

  revenueChart = new Chart(revenueCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Revenue",
        data: labels.map(label => revenueTotals[label] || 0),
        borderColor: "#087f8c",
        backgroundColor: "rgba(8,127,140,.12)",
        fill: true,
        tension: .35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } }
    }
  });

  const distributionCanvas = document.getElementById("distributionChart");

  distributionChart = new Chart(distributionCanvas, {
    type: "doughnut",
    data: {
      labels: ["Paid Booking Revenue", "Expenses"],
      datasets: [{
        data: [
          paidBookings.reduce((sum, item) => sum + item.amount, 0),
          expenses.reduce((sum, item) => sum + item.amount, 0)
        ],
        backgroundColor: ["#087f8c", "#e6a23c"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  const analyticsCanvas = document.getElementById("analyticsChart");

  analyticsChart = new Chart(analyticsCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: labels.map(label => revenueTotals[label] || 0),
          backgroundColor: "#087f8c"
        },
        {
          label: "Expenses",
          data: labels.map(label => expenseTotals[label] || 0),
          backgroundColor: "#e6a23c"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// =====================================
// CSV EXPORT
// =====================================

function exportCSV(type) {
  let headers = [];
  let rows = [];

  if (type === "bookings") {
    headers = [
      "Customer", "Room", "Check In", "Check Out", "Amount", "Payment"
    ];

    rows = bookings.map(booking => [
      booking.customer,
      roomName(booking.roomId),
      booking.checkIn,
      booking.checkOut,
      booking.amount,
      booking.payment
    ]);
  }

  if (type === "expenses") {
    headers = ["Expense", "Date", "Amount"];

    rows = expenses.map(expense => [
      expense.name,
      expense.date,
      expense.amount
    ]);
  }

  if (type === "rooms") {
    headers = ["Room Number", "Room Type", "Price", "Status"];

    rows = rooms.map(room => [
      room.number,
      room.type,
      room.price,
      room.status
    ]);
  }

  if (!rows.length) {
    showToast("There are no records to export.");
    return;
  }

  const escapeCSV = value =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [headers, ...rows]
    .map(row => row.map(escapeCSV).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `hotel_${type}_report.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  showToast("CSV report downloaded.");
}

// =====================================
// REFRESH ALL SECTIONS
// =====================================

function refreshApp() {
  renderRooms();
  renderBookings();
  renderExpenses();
  updateDashboard();
  drawCharts();
}

// =====================================
// INITIALIZE APPLICATION
// =====================================

document.addEventListener("DOMContentLoaded", () => {
  refreshApp();
});