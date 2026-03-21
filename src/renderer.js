import { db } from "./firebase.js";
import { collection, getDocs, setDoc, deleteDoc, doc, writeBatch } from "firebase/firestore";

const STORAGE_KEY = "xe-tap-lai-desktop-v1";
const ALERT_DAYS = 30;
const seededVehicles = [
  {
    id: "1",
    hinhThuc: "Hợp đồng",
    hang: "B cơ khí",
    bienSo: "82A-141.05",
    hieu: "TOYOTA VIOS",
    imei: "862195051762362",
    serial: "522773",
    version: "v8.7.2",
    loaiXe: "Ô tô con",
    nhaDauTu: "Mai Minh Khánh",
    hanKiemDinh: "2026-04-07",
    hanGptl: "2026-04-07",
    hanHopDong: "",
  },
  {
    id: "2",
    hinhThuc: "Hợp đồng",
    hang: "B cơ khí",
    bienSo: "82A-043.18",
    hieu: "MAZDA",
    imei: "862195051777204",
    serial: "523265",
    version: "v8.7.2",
    loaiXe: "Ô tô con",
    nhaDauTu: "Hoàng Kim Xuân",
    hanKiemDinh: "2026-02-26",
    hanGptl: "2025-12-31",
    hanHopDong: "2028-12-31",
  },
  {
    id: "3",
    hinhThuc: "Hợp đồng",
    hang: "B cơ khí",
    bienSo: "82A-082.39",
    hieu: "TOYOTA VIOS",
    imei: "862195051713803",
    serial: "307314",
    version: "v8.7.2",
    loaiXe: "Ô tô con",
    nhaDauTu: "Nguyễn Văn Tường",
    hanKiemDinh: "2026-04-08",
    hanGptl: "2026-04-08",
    hanHopDong: "",
  },
  {
    id: "4",
    hinhThuc: "Hợp đồng",
    hang: "B cơ khí",
    bienSo: "82A-093.55",
    hieu: "TOYOTA VIOS",
    imei: "861394057065968",
    serial: "3520D3",
    version: "v8.7.2",
    loaiXe: "Ô tô con",
    nhaDauTu: "Nguyễn Đình Qua",
    hanKiemDinh: "2026-04-10",
    hanGptl: "2026-04-10",
    hanHopDong: "",
  },
];
const fields = [
  ["hinhThuc", "Hình thức", "text"],
  ["hang", "Hạng", "text"],
  ["bienSo", "Biển số", "text"],
  ["hieu", "Hiệu xe", "text"],
  ["imei", "IMEI", "text"],
  ["serial", "Serial", "text"],
  ["version", "Version", "text"],
  ["loaiXe", "Loại xe", "text"],
  ["nhaDauTu", "Nhà đầu tư / phụ trách", "text"],
  ["hanKiemDinh", "Hạn đăng kiểm", "date"],
  ["hanGptl", "Hạn GPTL", "date"],
  ["hanHopDong", "Hạn hợp đồng", "date"],
];
const state = {
  vehicles: [],
  search: "",
  hangFilter: "tat-ca",
  alertFilter: "tat-ca",
  currentTab: "list",
  editingId: null,
  loading: true,
};
const el = {
  statTotal: document.getElementById("statTotal"),
  statDK: document.getElementById("statDK"),
  statGPTL: document.getElementById("statGPTL"),
  statHD: document.getElementById("statHD"),
  alertSummary: document.getElementById("alertSummary"),
  vehicleList: document.getElementById("vehicleList"),
  alertList: document.getElementById("alertList"),
  reportBody: document.getElementById("reportBody"),
  reportMeta: document.getElementById("reportMeta"),
  searchInput: document.getElementById("searchInput"),
  hangFilter: document.getElementById("hangFilter"),
  alertFilter: document.getElementById("alertFilter"),
  modal: document.getElementById("vehicleModal"),
  formGrid: document.getElementById("formGrid"),
  modalTitle: document.getElementById("modalTitle"),
  btnSaveModal: document.getElementById("btnSaveModal"),
};
async function loadVehicles() {
  try {
    const querySnapshot = await getDocs(collection(db, "vehicles"));
    const vehiclesData = [];
    querySnapshot.forEach((document) => {
      vehiclesData.push(document.data());
    });
    if (vehiclesData.length > 0) {
      state.vehicles = vehiclesData;
    } else {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      state.vehicles = Array.isArray(parsed) && parsed.length ? parsed : seededVehicles;
    }
  } catch (err) {
    console.error("Lỗi tải từ Firebase:", err);
    alert("Không thể kết nối máy chủ. Đang tải dữ liệu lưu tạm.");
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    state.vehicles = Array.isArray(parsed) && parsed.length ? parsed : seededVehicles;
  }
  state.loading = false;
  rerender();
}
function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.vehicles));
}
async function saveVehicleToFirebase(vehicle) {
  try {
    await setDoc(doc(db, "vehicles", vehicle.id), vehicle);
    persist();
  } catch (err) {
    console.error("Lỗi lưu xe:", err);
    alert("Lỗi lưu lên Firebase!");
  }
}
async function deleteVehicleFromFirebase(id) {
  try {
    await deleteDoc(doc(db, "vehicles", id));
    persist();
  } catch (err) {
    console.error("Lỗi xóa xe:", err);
    alert("Lỗi xóa trên Firebase!");
  }
}
function normalizeDate(value) {
  if (!value) return "";
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return "";
    return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  const text = String(value).trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy)
    return `${dmy[3]}-${String(dmy[2]).padStart(2, "0")}-${String(dmy[1]).padStart(2, "0")}`;
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return "";
}
function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}
function daysUntil(value) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value + "T00:00:00");
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target - today) / 86400000);
}
function getStatus(value, emptyLabel = "Không áp dụng") {
  if (!value) return { label: emptyLabel, tone: "secondary" };
  const days = daysUntil(value);
  if (days === null) return { label: "Không hợp lệ", tone: "danger" };
  if (days < 0)
    return { label: `Quá hạn ${Math.abs(days)} ngày`, tone: "danger", days };
  if (days <= ALERT_DAYS)
    return { label: `Sắp hết hạn ${days} ngày`, tone: "warning", days };
  return { label: `Còn hạn ${days} ngày`, tone: "success", days };
}
function toneClass(tone) {
  return tone === "danger"
    ? "status-danger"
    : tone === "warning"
      ? "status-warning"
      : tone === "success"
        ? "status-success"
        : "status-secondary";
}
function alertsOf(vehicle) {
  return [
    { key: "hanKiemDinh", label: "Hết đăng kiểm" },
    { key: "hanGptl", label: "Hết giấy phép xe tập lái" },
    { key: "hanHopDong", label: "Hết hợp đồng" },
  ]
    .map((item) => {
      const status = getStatus(vehicle[item.key]);
      if (!["danger", "warning"].includes(status.tone)) return null;
      return { ...item, status, date: vehicle[item.key], vehicle };
    })
    .filter(Boolean);
}
function inferCell(row, variants) {
  const keys = Object.keys(row);
  const found = keys.find((k) => {
    const kStr = String(k).trim().toLowerCase();
    return variants.some((v) => kStr.includes(v));
  });
  return found ? row[found] : "";
}
function getFilteredVehicles() {
  return state.vehicles.filter((vehicle) => {
    const text = [
      vehicle.bienSo,
      vehicle.hieu,
      vehicle.nhaDauTu,
      vehicle.hang,
      vehicle.imei,
      vehicle.serial,
    ]
      .join(" ")
      .toLowerCase();
    const searchOk = text.includes(state.search.toLowerCase());
    const hangOk =
      state.hangFilter === "tat-ca" || vehicle.hang === state.hangFilter;
    const alertOk =
      state.alertFilter === "tat-ca" ||
      (state.alertFilter === "qua-han"
        ? ["hanKiemDinh", "hanGptl", "hanHopDong"].some(
            (key) => getStatus(vehicle[key]).tone === "danger",
          )
        : ["hanKiemDinh", "hanGptl", "hanHopDong"].some(
            (key) => getStatus(vehicle[key]).tone === "warning",
          ));
    return searchOk && hangOk && alertOk;
  });
}
function renderFilters() {
  const current = state.hangFilter;
  const unique = [
    "tat-ca",
    ...new Set(state.vehicles.map((v) => v.hang).filter(Boolean)),
  ];
  el.hangFilter.innerHTML = unique
    .map(
      (value) =>
        `<option value="${value}" ${value === current ? "selected" : ""}>${value === "tat-ca" ? "Tất cả hạng" : value}</option>`,
    )
    .join("");
}
function renderStats() {
  const total = state.vehicles.length;
  const countProblem = (key) =>
    state.vehicles.filter((v) =>
      ["danger", "warning"].includes(getStatus(v[key]).tone),
    ).length;
  el.statTotal.textContent = total;
  el.statDK.textContent = countProblem("hanKiemDinh");
  el.statGPTL.textContent = countProblem("hanGptl");
  el.statHD.textContent = countProblem("hanHopDong");
  const allAlerts = state.vehicles.flatMap(alertsOf);
  el.alertSummary.textContent = allAlerts.length
    ? `Có ${allAlerts.length} cảnh báo cần theo dõi trong vòng ${ALERT_DAYS} ngày hoặc đã quá hạn.`
    : "Hiện chưa có xe nào sắp hết hạn hoặc quá hạn trong vòng 30 ngày.";
}
function renderVehicles() {
  if (state.loading) {
    el.vehicleList.innerHTML =
      '<div class="card empty">Đang đồng bộ dữ liệu đám mây...</div>';
    return;
  }
  const vehicles = getFilteredVehicles();
  if (!vehicles.length) {
    el.vehicleList.innerHTML =
      '<div class="card empty">Không có xe phù hợp với bộ lọc hiện tại.</div>';
    return;
  }
  el.vehicleList.innerHTML = vehicles
    .map((vehicle) => {
      const dk = getStatus(vehicle.hanKiemDinh);
      const gptl = getStatus(vehicle.hanGptl);
      const hd = getStatus(vehicle.hanHopDong, "Không áp dụng");
      return `<div class="card vehicle-card"><div class="vehicle-top"><div><div style="margin-bottom:10px;"><span style="font-size:24px;font-weight:800;">${vehicle.bienSo || "-"}</span><span class="badge">${vehicle.hang || "Chưa phân hạng"}</span><span class="badge">${vehicle.hieu || "Chưa có hiệu xe"}</span></div><div class="meta"><div><b>Hình thức:</b> ${vehicle.hinhThuc || "-"}</div><div><b>Loại xe:</b> ${vehicle.loaiXe || "-"}</div><div><b>Phụ trách:</b> ${vehicle.nhaDauTu || "-"}</div><div><b>IMEI:</b> ${vehicle.imei || "-"}</div><div><b>Serial:</b> ${vehicle.serial || "-"}</div><div><b>Version:</b> ${vehicle.version || "-"}</div></div></div><div class="no-print" style="display:flex;gap:8px;"><button class="btn" onclick="openEdit('${vehicle.id}')">Sửa</button><button class="btn danger" onclick="removeVehicle('${vehicle.id}')">Xóa</button></div></div><div class="deadlines"><div class="deadline-box"><div class="deadline-label">Hạn đăng kiểm</div><div class="deadline-date">${formatDate(vehicle.hanKiemDinh)}</div><span class="status-pill ${toneClass(dk.tone)}">${dk.label}</span></div><div class="deadline-box"><div class="deadline-label">Hạn GPTL</div><div class="deadline-date">${formatDate(vehicle.hanGptl)}</div><span class="status-pill ${toneClass(gptl.tone)}">${gptl.label}</span></div><div class="deadline-box"><div class="deadline-label">Hạn hợp đồng</div><div class="deadline-date">${formatDate(vehicle.hanHopDong)}</div><span class="status-pill ${toneClass(hd.tone)}">${hd.label}</span></div></div></div>`;
    })
    .join("");
}
function renderAlerts() {
  const alerts = state.vehicles
    .flatMap(alertsOf)
    .sort(
      (a, b) => (daysUntil(a.date) ?? 99999) - (daysUntil(b.date) ?? 99999),
    );
  if (!alerts.length) {
    el.alertList.innerHTML =
      '<div class="card empty">Hiện chưa có cảnh báo hết hạn.</div>';
    return;
  }
  el.alertList.innerHTML = alerts
    .map(
      (item) =>
        `<div class="card alert-item"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;"><div><div style="font-weight:800;font-size:18px;">${item.vehicle.bienSo} • ${item.vehicle.hieu}</div><div class="subtitle">${item.vehicle.hang || "-"} • ${item.label} • ${item.vehicle.nhaDauTu || "-"}</div></div><span class="status-pill ${toneClass(item.status.tone)}">${item.status.label} • ${formatDate(item.date)}</span></div></div>`,
    )
    .join("");
}
function renderReport() {
  const rows = getFilteredVehicles();
  el.reportMeta.textContent = `Ngày in: ${new Date().toLocaleString("vi-VN")} • Tổng số xe trong báo cáo: ${rows.length}`;
  if (!rows.length) {
    el.reportBody.innerHTML =
      '<tr><td colspan="9" class="empty">Không có dữ liệu báo cáo.</td></tr>';
    return;
  }
  el.reportBody.innerHTML = rows
    .map((vehicle, idx) => {
      const dk = getStatus(vehicle.hanKiemDinh);
      const gptl = getStatus(vehicle.hanGptl);
      const hd = getStatus(vehicle.hanHopDong, "Không áp dụng");
      return `<tr><td>${idx + 1}</td><td><b>${vehicle.bienSo || "-"}</b></td><td>${vehicle.hieu || "-"}</td><td>${vehicle.hang || "-"}</td><td>${vehicle.nhaDauTu || "-"}</td><td>${formatDate(vehicle.hanKiemDinh)}</td><td>${formatDate(vehicle.hanGptl)}</td><td>${formatDate(vehicle.hanHopDong)}</td><td><div class="${toneClass(dk.tone)}" style="display:inline-block;padding:2px 6px;border-radius:10px;">DK: ${dk.label}</div><br><div class="${toneClass(gptl.tone)}" style="display:inline-block;padding:2px 6px;border-radius:10px;margin-top:4px;">GPTL: ${gptl.label}</div><br><div class="${toneClass(hd.tone)}" style="display:inline-block;padding:2px 6px;border-radius:10px;margin-top:4px;">HĐ: ${hd.label}</div></td></tr>`;
    })
    .join("");
}
function renderForm() {
  el.formGrid.innerHTML = fields
    .map(
      ([key, label, type]) =>
        `<div class="form-group"><label for="field-${key}">${label}</label><input id="field-${key}" type="${type}" /></div>`,
    )
    .join("");
}
function fillForm(data) {
  fields.forEach(([key]) => {
    document.getElementById("field-" + key).value = data?.[key] || "";
  });
}
function readForm() {
  const data = {};
  fields.forEach(([key]) => {
    data[key] = document.getElementById("field-" + key).value.trim();
  });
  return data;
}
function openModal(editing = null) {
  state.editingId = editing?.id || null;
  el.modalTitle.textContent = state.editingId
    ? "Cập nhật xe tập lái"
    : "Thêm xe tập lái";
  el.btnSaveModal.textContent = state.editingId ? "Lưu cập nhật" : "Lưu xe";
  fillForm(
    editing || { hinhThuc: "Hợp đồng", hang: "B cơ khí", loaiXe: "Ô tô con" },
  );
  el.modal.classList.add("open");
}
function closeModal() {
  state.editingId = null;
  el.modal.classList.remove("open");
}
function rerender() {
  renderFilters();
  renderStats();
  renderVehicles();
  renderAlerts();
  renderReport();
}
async function handleImport() {
  const fileInput = document.getElementById("fileInput");
  // Reset value before clicking so same file can be selected again
  fileInput.value = "";
  fileInput.click();
}
async function exportExcel() {
  const rows = getFilteredVehicles().map((vehicle, idx) => {
    const dk = getStatus(vehicle.hanKiemDinh);
    const gptl = getStatus(vehicle.hanGptl);
    const hd = getStatus(vehicle.hanHopDong, "Không áp dụng");
    return {
      STT: idx + 1,
      "Hình thức": vehicle.hinhThuc,
      Hạng: vehicle.hang,
      "Biển số": vehicle.bienSo,
      "Hiệu xe": vehicle.hieu,
      IMEI: vehicle.imei,
      Serial: vehicle.serial,
      Version: vehicle.version,
      "Loại xe": vehicle.loaiXe,
      "Nhà đầu tư / phụ trách": vehicle.nhaDauTu,
      "Hạn đăng kiểm": formatDate(vehicle.hanKiemDinh),
      "Hạn GPTL": formatDate(vehicle.hanGptl),
      "Hạn hợp đồng": formatDate(vehicle.hanHopDong),
      "Trạng thái đăng kiểm": dk.label,
      "Trạng thái GPTL": gptl.label,
      "Trạng thái hợp đồng": hd.label,
    };
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Danh sach xe");
  
  const fileName = "bao-cao-xe-tap-lai-" + new Date().toISOString().slice(0, 10) + ".xlsx";
  XLSX.writeFile(wb, fileName);
}
function printReport() {
  state.currentTab = "report";
  setActiveTab("report");
  setTimeout(() => window.print(), 150);
}
function setActiveTab(name) {
  state.currentTab = name;
  document
    .querySelectorAll(".tab")
    .forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === name));
  document
    .querySelectorAll(".tab-panel")
    .forEach((panel) => panel.classList.remove("active"));
  document.getElementById("panel-" + name).classList.add("active");
}

document.getElementById("btnDeleteAll")?.addEventListener("click", async () => {
  if (!state.vehicles || state.vehicles.length === 0) {
    alert("Hệ thống đang trống, không có dữ liệu để xóa.");
    return;
  }
  const code = Math.floor(1000 + Math.random() * 9000);
  const input = prompt(`CẢNH BÁO NGUY HIỂM!\nHành động này sẽ XÓA SẠCH toàn bộ ${state.vehicles.length} xe trên hệ thống máy chủ và máy tính này.\n\nĐể xác nhận xóa, hãy nhập chính xác 4 số sau: ${code}`);
  if (input !== String(code)) {
    if (input !== null) alert("Mã xác nhận không đúng. Đã hủy thao tác xóa.");
    return;
  }
  try {
    el.vehicleList.innerHTML = '<div class="card empty">Đang tiến hành dọn dẹp máy chủ, vui lòng không tắt trang...</div>';
    
    // Chunking to delete 400 docs at a time
    for (let i = 0; i < state.vehicles.length; i += 400) {
      const chunk = state.vehicles.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach(v => {
        batch.delete(doc(db, "vehicles", v.id));
      });
      await batch.commit();
    }
    
    state.vehicles = [];
    persist(); // Clear local storage state
    rerender();
    alert("Đã xóa sạch toàn bộ dữ liệu trên hệ thống!");
  } catch(err) {
    alert("Lỗi khi xóa trên hệ thống Cloud: " + err.message);
    loadVehicles(); // Reload to recover safely
  }
});
window.openEdit = function (id) {
  const vehicle = state.vehicles.find((v) => v.id === id);
  if (vehicle) openModal(vehicle);
};
window.removeVehicle = async function (id) {
  const vehicle = state.vehicles.find((v) => v.id === id);
  if (!vehicle) return;
  if (confirm("Xóa xe " + (vehicle.bienSo || "") + "?")) {
    state.vehicles = state.vehicles.filter((v) => v.id !== id);
    rerender();
    await deleteVehicleFromFirebase(id);
  }
};
document
  .querySelectorAll(".tab")
  .forEach((btn) =>
    btn.addEventListener("click", () => setActiveTab(btn.dataset.tab)),
  );
document
  .getElementById("btnOpenAdd")
  .addEventListener("click", () => openModal());
document.getElementById("btnCancelModal").addEventListener("click", closeModal);
el.modal.addEventListener("click", (e) => {
  if (e.target === el.modal) closeModal();
});
el.btnSaveModal.addEventListener("click", async () => {
  const data = readForm();
  if (!data.bienSo || !data.hieu) {
    alert("Cần nhập ít nhất Biển số và Hiệu xe.");
    return;
  }
  let savedVehicle;
  if (state.editingId) {
    savedVehicle = { ...state.vehicles.find((v) => v.id === state.editingId), ...data };
    state.vehicles = state.vehicles.map((v) =>
      v.id === state.editingId ? savedVehicle : v,
    );
  } else {
    savedVehicle = { id: crypto.randomUUID(), ...data };
    state.vehicles.unshift(savedVehicle);
  }
  closeModal();
  rerender();
  await saveVehicleToFirebase(savedVehicle);
});
el.searchInput.addEventListener("input", (e) => {
  state.search = e.target.value;
  rerender();
});
el.hangFilter.addEventListener("change", (e) => {
  state.hangFilter = e.target.value;
  rerender();
});
el.alertFilter.addEventListener("change", (e) => {
  state.alertFilter = e.target.value;
  rerender();
});
document.getElementById("btnImport").addEventListener("click", handleImport);

document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const data = evt.target.result;
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const imported = rows
        .map((row, index) => ({
          id: `${Date.now()}-${index}`,
          hinhThuc:
            inferCell(row, ["hình thức", "hinh thuc", "lh", "hđ"]) || "Hợp đồng",
          hang: inferCell(row, ["hạng", "hang"]) || "",
          bienSo: inferCell(row, ["biển số", "bien so", "bienso"]) || "",
          hieu: inferCell(row, ["hiệu", "hieu"]) || "",
          imei: String(inferCell(row, ["imei"]) || ""),
          serial: String(inferCell(row, ["serial"]) || ""),
          version: inferCell(row, ["version"]) || "",
          loaiXe: inferCell(row, ["loại xe", "loai xe"]) || "",
          nhaDauTu:
            inferCell(row, ["nhà đầu tư", "nhà giáo phụ trách", "nhadautu"]) ||
            "",
          hanKiemDinh: normalizeDate(
            inferCell(row, [
              "hạn kiểm định",
              "han kiem dinh",
              "hạn đăng kiểm",
              "han dang kiem",
            ]),
          ),
          hanGptl: normalizeDate(
            inferCell(row, ["hạn gptl", "han gptl", "hạn giấy phép xe tập lái"]),
          ),
          hanHopDong: normalizeDate(
            inferCell(row, ["hạn hợp đồng", "han hop dong"]),
          ),
        }))
        .filter((x) => x.bienSo || x.hieu);
      if (imported.length) {
        let addedCount = 0;
        let skippedCount = 0;
        
        const newVehicles = [];
        for (const v of imported) {
          if (!v.bienSo) continue; // Bỏ qua xe không có biển số
          
          const vBienSo = String(v.bienSo).toLowerCase();
          const exists = state.vehicles.some(
            (sv) => String(sv.bienSo).toLowerCase() === vBienSo
          );
          
          if (!exists) {
            newVehicles.push(v);
            addedCount++;
          } else {
            skippedCount++;
          }
        }
        
        if (newVehicles.length > 0) {
          state.vehicles = [...newVehicles, ...state.vehicles];
          rerender();
          try {
            // Push chunks of max 400 docs
            for (let i = 0; i < newVehicles.length; i += 400) {
              const chunk = newVehicles.slice(i, i + 400);
              const batch = writeBatch(db);
              chunk.forEach(v => {
                 batch.set(doc(db, "vehicles", v.id), v);
              });
              await batch.commit();
            }
            persist();
            alert(`Nạp file thành công!\n- Thêm mới: ${addedCount} xe\n- Bỏ qua do trùng biển số: ${skippedCount} xe`);
          } catch(err) {
            alert("Lỗi khi đồng bộ lên Firebase: " + err.message);
          }
        } else {
          alert(`Không có xe nào được thêm mới.\n- Bỏ qua do trùng biển số: ${skippedCount} xe`);
        }
      } else {
        alert("Không tìm thấy dữ liệu hợp lệ trong file Excel. Vui lòng kiểm tra lại định dạng cột (Biển số, Hiệu xe...).");
      }
    } catch (err) {
      alert("Không đọc được file Excel: " + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
});
document.getElementById("btnExportTop").addEventListener("click", exportExcel);
document
  .getElementById("btnExportReport")
  .addEventListener("click", exportExcel);
document.getElementById("btnPrintTop").addEventListener("click", printReport);
document
  .getElementById("btnPrintReport")
  .addEventListener("click", printReport);
async function syncLocalToFirebase() {
  if (!confirm("Bạn có chắc chắn muốn lấy dữ liệu ở máy này đẩy lên máy chủ Cloud?\nĐiều này giúp các máy khác có thể thấy được dữ liệu mới nhất nếu dữ liệu trước đó chưa đồng bộ.")) return;
  
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? JSON.parse(raw) : null;
  const localData = Array.isArray(parsed) && parsed.length ? parsed : state.vehicles;
  
  if (!localData || localData.length === 0) {
    alert("Không có liệu cục bộ để đồng bộ.");
    return;
  }
  
  try {
    el.vehicleList.innerHTML = '<div class="card empty">Đang đẩy dữ liệu lên máy chủ, vui lòng đợi...</div>';
    
    // Push chunks of max 400 docs
    for (let i = 0; i < localData.length; i += 400) {
      const chunk = localData.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach(v => {
        batch.set(doc(db, "vehicles", v.id), v);
      });
      await batch.commit();
    }
    
    persist();
    alert(`Đã đồng bộ thành công ${localData.length} xe lên máy chủ Cloud!`);
    await loadVehicles();
  } catch(err) {
    alert("Lỗi khi đồng bộ lên Cloud: " + err.message);
    rerender();
  }
}

document.getElementById("btnSyncLocal")?.addEventListener("click", syncLocalToFirebase);

renderForm();
rerender();
loadVehicles();
// Thiết lập title
document.title = "Quản lý xe tập lái Web";
