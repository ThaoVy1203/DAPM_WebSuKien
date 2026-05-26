/**
 * ticket-business.js — Logic nghiệp vụ thống nhất (người tham gia)
 * QR: UTE-CHECKIN-{idDangKy}-{timestamp} — refresh 45s
 */
"use strict";

const TicketBiz = (function () {
    const QR_REFRESH_SEC = 45;
    const QR_MAX_AGE_MS = 45 * 1000;
    const QR_PREFIX = "UTE-CHECKIN";

    function buildQrPayload(idDangKy) {
        return `${QR_PREFIX}-${idDangKy}-${Date.now()}`;
    }

    function parseQrPayload(raw) {
        if (!raw || typeof raw !== "string") return null;
        const s = raw.trim();
        const m = s.match(/^UTE-CHECKIN-(\d+)-(\d+)$/i);
        if (m) return { idDangKy: parseInt(m[1], 10), timestamp: parseInt(m[2], 10) };
        const parts = s.split("|");
        if (parts.length >= 5 && parts[0] === "UTE" && parts[1] === "CHECKIN") {
            return {
                idDangKy: parseInt(parts[2], 10),
                idSuKien: parseInt(parts[3], 10),
                timestamp: parseInt(parts[4], 10)
            };
        }
        return null;
    }

    function isQrExpired(timestamp) {
        if (!timestamp || Number.isNaN(timestamp)) return true;
        return Math.abs(Date.now() - timestamp) > QR_MAX_AGE_MS;
    }

    function canShowQr(trangThai) {
        return trangThai === "Đã xác nhận";
    }

    function canCancel(ticket) {
        if (!ticket) return false;
        const ts = ticket.trangThai || "";
        if (!["Đã xác nhận", "Chờ xác nhận"].includes(ts)) return false;
        if (ticket.thoiGianCheckin) return false;
        const ketThuc = ticket.thoiGianKetThuc ? new Date(ticket.thoiGianKetThuc) : null;
        if (ketThuc && new Date() > ketThuc) return false;
        return true;
    }

    function getCheckinWindow(ticket) {
        const batDau = ticket?.thoiGianBatDau ? new Date(ticket.thoiGianBatDau) : null;
        const ketThuc = ticket?.thoiGianKetThuc ? new Date(ticket.thoiGianKetThuc) : null;
        const open = batDau ? new Date(batDau.getTime() - 30 * 60 * 1000) : null;
        const now = new Date();
        const inWindow = open && ketThuc
            ? now >= open && now <= ketThuc
            : open ? now >= open : true;
        return {
            open,
            close: ketThuc,
            started: batDau ? now >= batDau : true,
            inWindow,
            now
        };
    }

    function canSelfCheckin(ticket) {
        if (!ticket || ticket.trangThai !== "Đã xác nhận" || ticket.thoiGianCheckin) return false;
        return getCheckinWindow(ticket).inWindow;
    }

    function canSelfCheckout(ticket) {
        if (!ticket || !ticket.thoiGianCheckin || ticket.thoiGianCheckout) return false;
        return getCheckinWindow(ticket).started;
    }

    function normalizeTicket(t) {
        return {
            idDangKy: t.IdDangKy ?? t.idDangKy,
            idSuKien: t.IdSuKien ?? t.idSuKien,
            tenSuKien: t.TenSuKien ?? t.tenSuKien ?? "",
            idNguoiDung: t.IdNguoiDung ?? t.idNguoiDung ?? "",
            hoTenNguoiDung: t.HoTenNguoiDung ?? t.hoTenNguoiDung ?? "",
            trangThai: t.TrangThai ?? t.trangThai ?? "",
            thoiGianDangKy: t.ThoiGianDangKy ?? t.thoiGianDangKy ?? null,
            thoiGianHuy: t.ThoiGianHuy ?? t.thoiGianHuy ?? null,
            thoiGianCheckin: t.ThoiGianCheckin ?? t.thoiGianCheckin ?? null,
            thoiGianCheckout: t.ThoiGianCheckout ?? t.thoiGianCheckout ?? null,
            thoiGianBatDau: t.ThoiGianBatDau ?? t.thoiGianBatDau ?? null,
            thoiGianKetThuc: t.ThoiGianKetThuc ?? t.thoiGianKetThuc ?? null,
            tenDiaDiem: t.TenDiaDiem ?? t.tenDiaDiem ?? ""
        };
    }

    function ticketDetailUrl(idDangKy) {
        return `ticket-detail.html?id=${idDangKy}`;
    }

    function ticketCode(idDangKy) {
        return `UTE-${String(idDangKy).padStart(6, "0")}`;
    }

    function qrImageUrl(payload) {
        return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(payload)}&bgcolor=ffffff&color=0D5A9C&margin=8`;
    }

    function eventEnded(batDau, ketThuc) {
        const now = new Date();
        if (ketThuc && now > new Date(ketThuc)) return { ended: true, message: "Sự kiện đã kết thúc. Không thể đăng ký." };
        if (batDau && now >= new Date(batDau)) return { ended: false, started: true, message: "Sự kiện đã bắt đầu. Không thể đăng ký mới." };
        return { ended: false, started: false };
    }

    return {
        QR_REFRESH_SEC,
        buildQrPayload,
        parseQrPayload,
        isQrExpired,
        canShowQr,
        canCancel,
        getCheckinWindow,
        canSelfCheckin,
        canSelfCheckout,
        normalizeTicket,
        ticketDetailUrl,
        ticketCode,
        qrImageUrl,
        eventEnded
    };
})();
