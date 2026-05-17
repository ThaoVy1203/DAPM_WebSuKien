const API_BASE = "https://localhost:7160/api";

let currentTicket = null;
let countdown = 45;

// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", async function () {
    await loadMyTicket();

    startQrCountdown();
    setupWalletButtons();
    setupShareButton();
    setupHelpButton();
    setupHistoryLink();
    setupVerifiedBadge();
});

// ==========================
// LOAD TICKET
// ==========================
async function loadMyTicket() {
    try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_BASE}/VeCuaToi`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        currentTicket = await res.json();

        renderTicket();

    } catch (error) {
        console.error("Lỗi load vé:", error);
        alert("Không tải được thông tin vé");
    }
}

// ==========================
// RENDER
// ==========================
function renderTicket() {
    if (!currentTicket) return;

    document.querySelector(".event-title")?.textContent =
        currentTicket.tenSuKien;

    document.querySelector(".ticket-date")?.textContent =
        formatDate(currentTicket.ngayBatDau);

    document.querySelector(".ticket-location")?.textContent =
        currentTicket.diaDiem;

    document.querySelector(".ticket-id")?.textContent =
        currentTicket.maVe;

    const qrImage = document.querySelector(".qr-code img");
    if (qrImage) {
        qrImage.src = currentTicket.qrCodeUrl;
    }
}

// ==========================
// QR REFRESH
// ==========================
function startQrCountdown() {
    const ticketCodeElement = document.querySelector(".ticket-code strong");

    setInterval(async () => {
        if (!ticketCodeElement) return;

        ticketCodeElement.textContent = `${countdown}s`;
        countdown--;

        if (countdown < 0) {
            countdown = 45;
            await refreshQrCode();
        }

    }, 1000);
}

async function refreshQrCode() {
    if (!currentTicket) return;

    try {
        const token = localStorage.getItem("token");

        const res = await fetch(
            `${API_BASE}/VeCuaToi/${currentTicket.id}/refresh-qr`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await res.json();

        document.querySelector(".qr-code img").src = data.qrCodeUrl;

    } catch (error) {
        console.error("Lỗi refresh QR:", error);
    }
}

// ==========================
// WALLET
// ==========================
function setupWalletButtons() {
    document.querySelector(".btn-wallet.apple")
        ?.addEventListener("click", () => {
            downloadWalletPass("apple");
        });

    document.querySelector(".btn-wallet.google")
        ?.addEventListener("click", () => {
            downloadWalletPass("google");
        });
}

async function downloadWalletPass(type) {
    if (!currentTicket) return;

    window.open(
        `${API_BASE}/VeCuaToi/${currentTicket.id}/wallet/${type}`,
        "_blank"
    );
}

// ==========================
// SHARE
// ==========================
function setupShareButton() {
    document.querySelector(".btn-share")
        ?.addEventListener("click", async function () {

            if (!currentTicket) return;

            if (navigator.share) {
                await navigator.share({
                    title: currentTicket.tenSuKien,
                    text: `Vé tham gia sự kiện ${currentTicket.tenSuKien}`,
                    url: window.location.href
                });
            } else {
                alert("Trình duyệt không hỗ trợ chia sẻ");
            }
        });
}

// ==========================
// HELP
// ==========================
function setupHelpButton() {
    document.querySelector(".btn-help")
        ?.addEventListener("click", () => {
            window.location.href = "support.html";
        });
}

// ==========================
// HISTORY
// ==========================
function setupHistoryLink() {
    document.querySelector(".view-all-link")
        ?.addEventListener("click", function (e) {
            e.preventDefault();
            window.location.href = "history.html";
        });
}

// ==========================
// VERIFIED EFFECT
// ==========================
function setupVerifiedBadge() {
    const verifiedBtn = document.querySelector(".btn-verified");

    verifiedBtn?.addEventListener("click", function () {
        this.style.transform = "scale(1.2)";
        setTimeout(() => {
            this.style.transform = "scale(1)";
        }, 200);
    });
}

// ==========================
// CANCEL TICKET
// ==========================
async function cancelTicket() {
    if (!currentTicket) return;

    if (!confirm("Bạn chắc chắn muốn hủy vé?")) return;

    try {
        const token = localStorage.getItem("token");

        await fetch(`${API_BASE}/VeCuaToi/${currentTicket.id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        alert("Đã hủy vé thành công");

        window.location.href = "events.html";

    } catch (error) {
        console.error("Lỗi hủy vé:", error);
        alert("Không thể hủy vé");
    }
}

// ==========================
// HELPERS
// ==========================
function formatDate(date) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("vi-VN");
}