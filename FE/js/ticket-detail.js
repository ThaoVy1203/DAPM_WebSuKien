"use strict";
// ticket-detail.js — Chi tiết vé điện tử
const API_BASE = "https://localhost:7160/api";
let ticket = null, qrTimer = null, qrSecs = 45, ciTimer = null;

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const id = new URLSearchParams(window.location.search).get("id")
          || new URLSearchParams(window.location.search).get("dangKyId");
  if (!id) { showError("Không tìm thấy mã vé trong URL."); return; }
  await loadTicket(id, token);
});

async function loadTicket(id, token) {
  try {
    let found = null;
    if (token) {
      const u = JSON.parse(localStorage.getItem("userData") || "{}");
      const idND = u.IdNguoiDung || u.idNguoiDung || u.id;
      if (idND) {
        try {
          const r = await fetch(`${API_BASE}/DangKy/nguoi-dung/${idND}`,
            { headers: { "Authorization": `Bearer ${token}` } });
          if (r.ok) {
            const arr = await r.json();
            const list = Array.isArray(arr) ? arr : (arr.data || arr.items || []);
            found = list.find(t => String(t.IdDangKy ?? t.idDangKy) === String(id));
          }
        } catch(e) {}
      }
    }
    if (!found) {
      try {
        const r2 = await fetch(`${API_BASE}/DangKy/public/${id}`);
        if (r2.ok) found = await r2.json();
      } catch(e) {}
    }
    if (!found) { showError("Không tìm thấy vé. Vui lòng đăng nhập lại."); return; }
    ticket = TicketBiz.normalizeTicket(found);
    renderAll();
    ciTimer = setInterval(() => { if (ticket) renderCiButtons(ticket); }, 30000);
  } catch(e) {
    console.error(e);
    showError("Lỗi kết nối. Vui lòng kiểm tra Backend đã chạy chưa.");
  }
}

function renderAll() {
  document.getElementById("tdLoading").style.display = "none";
  document.getElementById("tdMain").style.display    = "block";
  const t = ticket;
  const u = JSON.parse(localStorage.getItem("userData") || "{}");
  const hoTen   = u.HoTen   || u.hoTen   || t.hoTenNguoiDung || "—";
  const maSoSSO = u.MaSoSSO || u.maSoSSO || t.idNguoiDung    || "—";

  setText("tdEventName", t.tenSuKien || "Sự kiện");
  renderPill(t.trangThai);

  // NGÀY GIỜ — lấy từ ThoiGianBatDau/ThoiGianKetThuc của sự kiện
  if (t.thoiGianBatDau) {
    const s = new Date(t.thoiGianBatDau);
    const e = t.thoiGianKetThuc ? new Date(t.thoiGianKetThuc) : null;
    setText("tdDate", s.toLocaleDateString("vi-VN",
      { weekday:"long", day:"2-digit", month:"2-digit", year:"numeric" }));
    setText("tdTime", e ? `${hm(s)} – ${hm(e)}` : hm(s));
  } else {
    setText("tdDate", "Chưa có thông tin");
    setText("tdTime", "—");
  }

  // ĐỊA ĐIỂM
  setText("tdLocation", t.tenDiaDiem && t.tenDiaDiem.trim() ? t.tenDiaDiem : "Đang cập nhật");

  setText("tdAttendee",  hoTen);
  setText("tdMSSV",      maSoSSO);
  setText("tdRegDate",   t.thoiGianDangKy
    ? new Date(t.thoiGianDangKy).toLocaleString("vi-VN") : "—");
  setText("tdTrangThai", t.trangThai || "—");
  setText("tdTicketCode", TicketBiz.ticketCode(t.idDangKy));

  renderTimeline(t);
  renderQR(t);
  renderCiButtons(t);

  document.getElementById("btnCancel").style.display = TicketBiz.canCancel(t) ? "flex" : "none";
}

const PILLS = {
  "Đã xác nhận": {c:"pill-confirmed",i:"fa-check-circle", l:"Đã xác nhận"},
  "Chờ xác nhận":{c:"pill-pending",  i:"fa-clock",        l:"Chờ xác nhận"},
  "Đã tham gia": {c:"pill-attended", i:"fa-star",         l:"Đã tham gia"},
  "Vắng mặt":    {c:"pill-absent",   i:"fa-user-times",   l:"Vắng mặt"},
  "Đã hủy":      {c:"pill-cancelled",i:"fa-ban",          l:"Đã hủy"},
};
function renderPill(ts) {
  const p = document.getElementById("tdStatusPill");
  const cfg = PILLS[ts] || {c:"pill-pending",i:"fa-info-circle",l:ts};
  p.className = `th-status-pill ${cfg.c}`;
  p.innerHTML = `<i class="fas ${cfg.i}" style="font-size:9px"></i><span>${cfg.l}</span>`;
}

function renderTimeline(t) {
  step("tlReg","done");
  setText("tlRegTime", t.thoiGianDangKy ? short(t.thoiGianDangKy) : "");
  if (t.thoiGianCheckin) {
    step("tlCI","done"); setText("tlCITime", short(t.thoiGianCheckin));
  } else if (t.trangThai === "Đã xác nhận") {
    step("tlCI","active"); setText("tlCITime","Chờ check-in");
  } else { step("tlCI",""); setText("tlCITime",""); }
  if (t.thoiGianCheckout) {
    step("tlCO","done"); setText("tlCOTime", short(t.thoiGianCheckout));
  } else if (t.thoiGianCheckin && !t.thoiGianCheckout) {
    step("tlCO","active"); setText("tlCOTime","Chờ check-out");
  } else { step("tlCO",""); setText("tlCOTime",""); }
}
function step(id, s) {
  const el = document.getElementById(id);
  if (el) el.className = "tl-step" + (s ? " "+s : "");
}

function renderQR(t) {
  const active = document.getElementById("qrActive");
  const msg    = document.getElementById("qrMsg");
  const sub    = document.getElementById("qrSub");
  if (TicketBiz.canShowQr(t.trangThai)) {
    active.style.display = "block"; msg.style.display = "none";
    sub.textContent = "Đưa mã này cho BTC quét tại cổng sự kiện";
    buildQR(t); startQrTimer(t);
  } else if (t.trangThai === "Chờ xác nhận") {
    active.style.display = "none"; msg.style.display = "block";
    msg.className = "qr-msg pending";
    msg.innerHTML = `<i class="fas fa-clock"></i> Đăng ký đang chờ BTC xác nhận. QR sẽ hiện sau khi được duyệt.`;
    stopQrTimer();
  } else if (t.trangThai === "Đã tham gia") {
    active.style.display = "none"; msg.style.display = "block";
    msg.className = "qr-msg attended";
    msg.innerHTML = `<i class="fas fa-check-circle"></i> Đã check-in lúc <strong>${short(t.thoiGianCheckin)}</strong>. Cảm ơn bạn đã tham gia!`;
    stopQrTimer();
  } else {
    active.style.display = "none"; msg.style.display = "block";
    msg.className = "qr-msg cancelled";
    msg.innerHTML = `<i class="fas fa-ban"></i> Vé không còn hiệu lực (${t.trangThai}).`;
    stopQrTimer();
  }
}

function buildQR(t) {
  const data = TicketBiz.buildQrPayload(t.idDangKy);
  const url  = TicketBiz.qrImageUrl(data);
  const img  = document.getElementById("qrImg");
  img.style.opacity = "0.4"; img.src = url;
  img.onload  = () => { img.style.opacity = "1"; };
  img.onerror = () => { img.src="https://via.placeholder.com/180x180/e2e8f0/555?text=QR"; img.style.opacity="1"; };
}
function startQrTimer(t) {
  stopQrTimer(); qrSecs = TicketBiz.QR_REFRESH_SEC; setText("qrCountdown", qrSecs);
  qrTimer = setInterval(() => {
    qrSecs--; setText("qrCountdown", qrSecs);
    if (qrSecs <= 0) { buildQR(t); qrSecs = TicketBiz.QR_REFRESH_SEC; }
  }, 1000);
}
function stopQrTimer() { if (qrTimer) { clearInterval(qrTimer); qrTimer = null; } }
function refreshQR() {
  if (!ticket || !TicketBiz.canShowQr(ticket.trangThai)) return;
  buildQR(ticket); qrSecs = TicketBiz.QR_REFRESH_SEC; setText("qrCountdown", qrSecs);
  toast("Đã làm mới mã QR.", "info");
}

function renderCiButtons(t) {
  const btnCI = document.getElementById("btnCI");
  const btnCO = document.getElementById("btnCO");
  const info  = document.getElementById("ciTimeInfo");
  if (!btnCI || !btnCO) return;

  const win = TicketBiz.getCheckinWindow(t);
  const { open: ciOpen, close: ketThuc, inWindow: inWin, started, now } = win;
  const batDau = t.thoiGianBatDau ? new Date(t.thoiGianBatDau) : null;

  const canCI = TicketBiz.canSelfCheckin(t);
  btnCI.disabled = !canCI;
  if (t.thoiGianCheckin) {
    btnCI.className = "btn-ci ci-done";
    btnCI.innerHTML = `<i class="fas fa-check"></i> ĐÃ CHECK-IN lúc ${hm(new Date(t.thoiGianCheckin))}`;
  } else if (t.trangThai === "Chờ xác nhận") {
    btnCI.className = "btn-ci ci-off";
    btnCI.innerHTML = `<i class="fas fa-clock"></i> CHỜ BTC XÁC NHẬN`;
  } else if (["Đã hủy","Vắng mặt"].includes(t.trangThai)) {
    btnCI.className = "btn-ci ci-off";
    btnCI.innerHTML = `<i class="fas fa-ban"></i> KHÔNG THỂ CHECK-IN`;
  } else if (ciOpen && now < ciOpen) {
    const mins = Math.ceil((ciOpen - now)/60000);
    const h = Math.floor(mins/60), m = mins%60;
    btnCI.className = "btn-ci ci-off";
    btnCI.innerHTML = `<i class="fas fa-hourglass-half"></i> MỞ SAU ${h>0?h+"h":""}${m}p`;
  } else if (ketThuc && now > ketThuc) {
    btnCI.className = "btn-ci ci-off";
    btnCI.innerHTML = `<i class="fas fa-times-circle"></i> ĐÃ HẾT GIỜ CHECK-IN`;
  } else if (canCI) {
    btnCI.className = "btn-ci ci-on";
    btnCI.innerHTML = `<i class="fas fa-sign-in-alt"></i> CHECK-IN NGAY`;
  } else {
    btnCI.className = "btn-ci ci-off";
    btnCI.innerHTML = `<i class="fas fa-sign-in-alt"></i> CHECK-IN`;
  }

  // Nút Check-out
  const canCO = TicketBiz.canSelfCheckout(t);
  btnCO.disabled = !canCO;
  if (t.thoiGianCheckout) {
    btnCO.className = "btn-ci co-done";
    btnCO.innerHTML = `<i class="fas fa-check"></i> ĐÃ CHECK-OUT lúc ${hm(new Date(t.thoiGianCheckout))}`;
  } else if (!t.thoiGianCheckin) {
    btnCO.className = "btn-ci co-off";
    btnCO.innerHTML = `<i class="fas fa-lock"></i> CHECK-OUT (cần check-in trước)`;
  } else if (canCO) {
    btnCO.className = "btn-ci co-on";
    btnCO.innerHTML = `<i class="fas fa-sign-out-alt"></i> CHECK-OUT`;
  } else {
    btnCO.className = "btn-ci co-off";
    btnCO.innerHTML = `<i class="fas fa-sign-out-alt"></i> CHECK-OUT`;
  }

  // Thông tin cửa sổ thời gian
  info.className = "ci-time-info";
  if (batDau) {
    if (ciOpen && now < ciOpen) {
      info.classList.add("waiting");
      info.innerHTML = `<i class="fas fa-clock"></i> Check-in mở lúc <strong>${hm(ciOpen)}</strong> ngày <strong>${batDau.toLocaleDateString("vi-VN")}</strong>`;
    } else if (inWin) {
      info.classList.add("open");
      info.innerHTML = `<i class="fas fa-door-open"></i> Cửa sổ check-in đang mở — Sự kiện bắt đầu lúc <strong>${hm(batDau)}</strong>`;
    } else if (ketThuc && now > ketThuc) {
      info.classList.add("closed");
      info.innerHTML = `<i class="fas fa-door-closed"></i> Sự kiện đã kết thúc lúc <strong>${hm(ketThuc)}</strong>`;
    }
  }
}

async function doCheckin() {
  if (!ticket || ticket.thoiGianCheckin) return;
  const token = localStorage.getItem("token");
  const btn = document.getElementById("btnCI");
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Đang check-in...`;
  try {
    const r = await fetch(`${API_BASE}/DangKy/check-in`, {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
      body: JSON.stringify({IdSuKien:ticket.idSuKien, IdNguoiDung:ticket.idNguoiDung})
    });
    const d = await r.json().catch(()=>({}));
    if (r.ok && (d.Success ?? d.success) !== false) {
      ticket.thoiGianCheckin = d.ThoiGianCheckin || d.thoiGianCheckin || new Date().toISOString();
      ticket.trangThai = "Đã tham gia";
      renderAll(); stopQrTimer();
      toast("✅ Check-in thành công! Chào mừng bạn đến sự kiện.", "success");
    } else {
      toast(d.Message || d.message || "Check-in thất bại.", "error");
      renderCiButtons(ticket);
    }
  } catch(e) { toast("Không thể kết nối máy chủ.", "error"); renderCiButtons(ticket); }
}

async function doCheckout() {
  if (!ticket || !ticket.thoiGianCheckin || ticket.thoiGianCheckout) return;
  const token = localStorage.getItem("token");
  const btn = document.getElementById("btnCO");
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Đang check-out...`;
  try {
    const r = await fetch(`${API_BASE}/DangKy/check-out`, {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
      body: JSON.stringify({IdSuKien:ticket.idSuKien, IdNguoiDung:ticket.idNguoiDung})
    });
    const d = await r.json().catch(()=>({}));
    if (r.ok && (d.Success ?? d.success) !== false) {
      ticket.thoiGianCheckout = d.ThoiGianCheckout || d.thoiGianCheckout || new Date().toISOString();
      renderAll();
      toast("👋 Check-out thành công! Cảm ơn bạn đã tham gia.", "success");
    } else {
      toast(d.Message || d.message || "Check-out thất bại.", "error");
      renderCiButtons(ticket);
    }
  } catch(e) { toast("Không thể kết nối máy chủ.", "error"); renderCiButtons(ticket); }
}

function openCancelModal()  { document.getElementById("cancelModal").classList.add("open"); }
function closeCancelModal() { document.getElementById("cancelModal").classList.remove("open"); }

async function confirmCancel() {
  if (!ticket) return;
  closeCancelModal();
  const token = localStorage.getItem("token");
  const btn = document.getElementById("btnCancel");
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Đang hủy...`;
  try {
    const r = await fetch(`${API_BASE}/DangKy/huy-dang-ky`, {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
      body: JSON.stringify({IdSuKien:ticket.idSuKien, IdNguoiDung:ticket.idNguoiDung})
    });
    const d = await r.json().catch(()=>({}));
    if (r.ok && (d.Success ?? d.success) !== false) {
      ticket.trangThai = "Đã hủy"; ticket.thoiGianHuy = new Date().toISOString();
      renderAll(); stopQrTimer();
      toast("Đã hủy đăng ký thành công.", "success");
    } else {
      toast(d.Message || d.message || "Hủy thất bại.", "error");
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-times-circle"></i> Hủy đăng ký`;
    }
  } catch(e) {
    toast("Không thể kết nối máy chủ.", "error");
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-times-circle"></i> Hủy đăng ký`;
  }
}

function shareTicket() {
  const url = window.location.href;
  if (navigator.share) navigator.share({title: ticket?.tenSuKien || "Vé UTE Events", url});
  else navigator.clipboard.writeText(url).then(() => toast("Đã sao chép link vé.", "info"));
}
function copyCode() {
  const code = document.getElementById("tdTicketCode")?.textContent || "";
  navigator.clipboard.writeText(code).then(() => toast("Đã sao chép mã vé.", "info"));
}

function showError(msg) {
  document.getElementById("tdLoading").style.display = "none";
  document.getElementById("tdError").style.display   = "flex";
  const p = document.querySelector("#tdError p");
  if (p && msg) p.textContent = msg;
}
function setText(id, v) { const el=document.getElementById(id); if(el) el.textContent=v; }
function hm(d)    { return new Date(d).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"}); }
function short(d) {
  const dt = new Date(d);
  return dt.toLocaleString("vi-VN",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
}
function toast(msg, type="success") {
  const c={success:"#059669",error:"#dc2626",info:"#0D5A9C"};
  const i={success:"check-circle",error:"times-circle",info:"info-circle"};
  const el = document.createElement("div");
  el.className = "td-toast";
  el.style.cssText = `position:fixed;bottom:28px;right:28px;z-index:99999;padding:14px 20px;
    border-radius:12px;font-size:14px;font-weight:600;color:#fff;background:${c[type]};
    box-shadow:0 8px 24px rgba(0,0,0,.2);display:flex;align-items:center;gap:10px;max-width:380px;`;
  el.innerHTML = `<i class="fas fa-${i[type]}"></i><span>${msg}</span>`;
  document.body.appendChild(el);
  setTimeout(()=>{ el.style.opacity="0"; el.style.transition="opacity .3s";
    setTimeout(()=>el.remove(),300); }, 4000);
}
