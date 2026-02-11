const STORAGE_KEY = "offline-crm-records-v1";

const state = {
  records: loadRecords(),
};

const form = document.getElementById("record-form");
const recordsBody = document.getElementById("records-body");
const template = document.getElementById("row-template");
const exportBtn = document.getElementById("export-btn");
const clearBtn = document.getElementById("clear-btn");

form.addEventListener("submit", onSubmit);
recordsBody.addEventListener("click", onTableClick);
exportBtn.addEventListener("click", exportToCsv);
clearBtn.addEventListener("click", clearAllRecords);

render();

function onSubmit(event) {
  event.preventDefault();

  const record = {
    id: crypto.randomUUID(),
    fullName: document.getElementById("fullName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    company: document.getElementById("company").value.trim(),
    notes: document.getElementById("notes").value.trim(),
    createdAt: new Date().toLocaleString("he-IL"),
  };

  state.records.unshift(record);
  persistRecords();
  render();
  form.reset();
}

function onTableClick(event) {
  const button = event.target.closest("button[data-action='delete']");
  if (!button) {
    return;
  }

  const row = button.closest("tr");
  const id = row?.dataset.id;
  if (!id) {
    return;
  }

  state.records = state.records.filter((record) => record.id !== id);
  persistRecords();
  render();
}

function render() {
  recordsBody.innerHTML = "";

  if (state.records.length === 0) {
    recordsBody.innerHTML = `<tr><td colspan="7" class="empty-state">אין עדיין רשומות.</td></tr>`;
    return;
  }

  for (const record of state.records) {
    const row = template.content.firstElementChild.cloneNode(true);
    row.dataset.id = record.id;

    for (const field of ["fullName", "phone", "email", "company", "notes", "createdAt"]) {
      row.querySelector(`[data-field='${field}']`).textContent = record[field] || "-";
    }

    recordsBody.appendChild(row);
  }
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
}

function clearAllRecords() {
  if (!state.records.length) {
    return;
  }

  const ok = window.confirm("למחוק את כל הרשומות?");
  if (!ok) {
    return;
  }

  state.records = [];
  persistRecords();
  render();
}

function exportToCsv() {
  if (!state.records.length) {
    window.alert("אין רשומות לייצוא.");
    return;
  }

  const headers = ["שם מלא", "טלפון", "אימייל", "חברה", "הערות", "תאריך יצירה"];
  const rows = state.records.map((record) => [
    record.fullName,
    record.phone,
    record.email,
    record.company,
    record.notes,
    record.createdAt,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `crm-records-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value) {
  const normalized = String(value ?? "").replaceAll('"', '""');
  return `"${normalized}"`;
}
