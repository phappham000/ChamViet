(function () {
    "use strict";

    const ORDERS_KEY = "chamviet_orders";
    const BOOKED_KEY = "chamviet_booked";
    const POINTS_KEY = "chamviet_points";

    const TYPE_LABELS = {
        "di-san-lang-nghe": "Di sản làng nghề",
        "workshop": "Workshop thủ công",
        "nong-nghiep": "Nông nghiệp & chữa lành",
        "tuoi-tho": "Vé tuổi thơ 8x 9x",
        "am-thuc": "Ẩm thực",
        "nep-song": "Nếp sống bản địa"
    };
    const STATUS_TEXT = { upcoming: "Sắp diễn ra", done: "Đã hoàn thành", cancelled: "Đã hủy" };

    function $(id) { return document.getElementById(id); }
    function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }
    function money(n) { return Number(n || 0).toLocaleString("vi-VN") + "đ"; }
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    function toISO(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
    function isoToVN(iso) { const p = iso.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
    function readJSON(key, fallback) {
        try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch (e) { return fallback; }
    }
    function writeJSON(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    }
    function removeKey(key) { try { localStorage.removeItem(key); } catch (e) { /* bỏ qua */ } }

    function daysUntil(iso) {
        const p = iso.split("-");
        const target = new Date(+p[0], +p[1] - 1, +p[2]);
        const now = new Date(); now.setHours(0, 0, 0, 0);
        return Math.round((target - now) / 86400000);
    }
    function statusOf(o) {
        if (o.status === "cancelled") return "cancelled";
        return daysUntil(o.date) < 0 ? "done" : "upcoming";
    }
    
    function refundPercent(o) {
        const d = daysUntil(o.date);
        if (d >= 3) return 100;
        if (d === 2) return 50;
        if (d === 1) return 25;
        return 0;
    }
    function expById(id) {
        if (typeof experiences === "undefined") return null;
        return experiences.find(function (e) { return String(e.id) === String(id); }) || null;
    }

    let orders = readJSON(ORDERS_KEY, []);
    let filter = "all";
    const openCodes = new Set();

    function save() { writeJSON(ORDERS_KEY, orders); }

    function toast(text) {
        const old = document.querySelector(".db-toast");
        if (old) old.remove();
        const t = document.createElement("div");
        t.className = "db-toast";
        t.textContent = text;
        document.body.appendChild(t);
        setTimeout(function () { t.remove(); }, 2600);
    }

    function renderStats() {
        const alive = orders.filter(function (o) { return o.status !== "cancelled"; });
        $("st-count").textContent = orders.length;
        $("st-upcoming").textContent = orders.filter(function (o) { return statusOf(o) === "upcoming"; }).length;
        $("st-spent").textContent = money(alive.reduce(function (s, o) { return s + o.total; }, 0));
        $("st-points").textContent = Number(readJSON(POINTS_KEY, 0)) || 0;

        const byType = {};
        alive.forEach(function (o) {
            const e = expById(o.id);
            const label = e && TYPE_LABELS[e.type] ? TYPE_LABELS[e.type] : "Khác";
            byType[label] = (byType[label] || 0) + o.total;
        });
        const rows = Object.keys(byType).sort(function (a, b) { return byType[b] - byType[a]; });
        const max = rows.length ? byType[rows[0]] : 1;
        $("spend-bars").innerHTML = rows.length
            ? rows.map(function (k) {
                return '<div class="bar-row"><div class="top"><span>' + esc(k) + "</span><b>" + money(byType[k]) +
                    '</b></div><div class="track"><div class="fill" style="width:' + Math.round(byType[k] / max * 100) + '%"></div></div></div>';
            }).join("")
            : '<p class="none">Chưa có chi tiêu nào.</p>';
    }

    function orderHTML(o) {
        const st = statusOf(o);
        const open = openCodes.has(o.code);
        const c = o.customer || {};
        const canCancel = st === "upcoming";
        const refundNote = st === "cancelled" && o.refund != null
            ? "<small>Hoàn " + money(o.refund) + "</small>" : "";

        return '<article class="order' + (open ? " open" : "") + '" data-code="' + esc(o.code) + '">' +
            '<div class="order-main">' +
                '<img src="' + esc(o.image || "assets/logo.png") + '" alt="' + esc(o.name) + '" loading="lazy">' +
                '<div class="order-body">' +
                    '<div class="order-top"><h3 class="order-name">' + esc(o.name) + "</h3>" +
                        '<span class="badge ' + st + '">' + STATUS_TEXT[st] + "</span></div>" +
                    '<div class="order-meta">' +
                        '<span><i class="fa-regular fa-calendar"></i>' + esc(o.dateText || isoToVN(o.date)) + "</span>" +
                        '<span><i class="fa-regular fa-clock"></i>' + esc(o.slot) + "</span>" +
                        '<span><i class="fa-regular fa-user"></i>Người lớn x' + esc(o.quantity) + "</span>" +
                        '<span><i class="fa-solid fa-location-dot"></i>' + esc(o.location) + "</span>" +
                    "</div>" +
                    '<div class="order-foot">' +
                        '<div><div class="order-code">Mã: ' + esc(o.code) + "</div>" +
                        '<div class="order-actions" style="margin-top:8px">' +
                            '<button type="button" class="db-btn sm" data-act="toggle">' + (open ? "Ẩn chi tiết" : "Chi tiết") + "</button>" +
                            '<a class="db-btn sm" href="detail.html?id=' + encodeURIComponent(o.id) + '">Xem trải nghiệm</a>' +
                            (canCancel ? '<button type="button" class="db-btn sm danger" data-act="cancel">Hủy đơn</button>' : "") +
                        "</div></div>" +
                        '<div class="order-price">' + money(o.total) + refundNote + "</div>" +
                    "</div>" +
                "</div>" +
            "</div>" +
            '<div class="order-detail">' +
                "<div><span>Người đặt</span>" + esc((c.last || "") + " " + (c.first || "")) + "</div>" +
                "<div><span>Thanh toán</span>" + esc(o.method) + "</div>" +
                "<div><span>E-mail</span>" + esc(c.email || "-") + "</div>" +
                "<div><span>Điện thoại</span>" + esc((c.code || "") + " " + (c.phone || "-")) + "</div>" +
                "<div><span>Tạm tính</span>" + money(o.subtotal != null ? o.subtotal : o.total) + "</div>" +
                "<div><span>Giảm giá</span>" + (o.discount ? "-" + money(o.discount) + (o.coupon ? " (" + esc(o.coupon) + ")" : "") : "Không") + "</div>" +
                "<div><span>Điểm Chạm</span>+" + esc(o.points || 0) + "</div>" +
                "<div><span>Thời gian đặt</span>" + esc(o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "-") + "</div>" +
            "</div>" +
        "</article>";
    }

    function renderTabs() {
        document.querySelectorAll("#db-tabs .tab").forEach(function (btn) {
            const f = btn.dataset.filter;
            const n = f === "all" ? orders.length : orders.filter(function (o) { return statusOf(o) === f; }).length;
            const base = btn.dataset.label || (btn.dataset.label = btn.textContent.trim());
            btn.innerHTML = esc(base) + ' <span class="n">' + n + "</span>";
            btn.classList.toggle("active", f === filter);
        });
    }

    function renderOrders() {
        const list = orders.filter(function (o) { return filter === "all" || statusOf(o) === filter; });
        const el = $("order-list");
        if (!list.length) {
            el.innerHTML = '<div class="empty"><i class="fa-regular fa-calendar-xmark"></i>' +
                "<h3>" + (orders.length ? "Không có đơn nào ở mục này" : "Bạn chưa có đơn nào") + "</h3>" +
                "<p>Hãy khám phá một trải nghiệm, hoặc thêm đơn mẫu để xem thử trang này.</p>" +
                '<a class="db-btn solid" href="search.html">Khám phá trải nghiệm</a>' +
                '<button type="button" class="db-btn" data-act="seed">Thêm đơn mẫu</button></div>';
            return;
        }
        el.innerHTML = list.map(orderHTML).join("");
    }

    function renderAll() {
        renderStats();
        renderTabs();
        renderOrders();
    }

    $("db-tabs").addEventListener("click", function (e) {
        const tab = e.target.closest(".tab");
        if (!tab) return;
        filter = tab.dataset.filter;
        renderAll();
    });

    function cancelOrder(o) {
        const pct = refundPercent(o);
        const refund = Math.round(o.total * pct / 100);
        const msg = "Hủy đơn " + o.code + "?\nTheo chính sách, bạn được hoàn " + pct + "% (" + money(refund) + ").";
        if (!window.confirm(msg)) return;

        o.status = "cancelled";
        o.refund = refund;
        save();

        const booked = readJSON(BOOKED_KEY, {});
        const key = o.id + "|" + o.date + "|" + o.slotIndex;
        if (booked[key]) {
            booked[key] = Math.max(0, booked[key] - o.quantity);
            if (!booked[key]) delete booked[key];
            writeJSON(BOOKED_KEY, booked);
        }

        const pts = Math.max(0, (Number(readJSON(POINTS_KEY, 0)) || 0) - (o.points || 0));
        writeJSON(POINTS_KEY, pts);

        toast("Đã hủy đơn " + o.code + ", hoàn " + pct + "%");
        renderAll();
    }

    function handleClick(e) {
        const btn = e.target.closest("[data-act]");
        if (!btn) return;
        const act = btn.dataset.act;
        if (act === "seed") { seed(); return; }

        const card = btn.closest(".order");
        if (!card) return;
        const o = orders.find(function (x) { return x.code === card.dataset.code; });
        if (!o) return;

        if (act === "toggle") {
            if (openCodes.has(o.code)) openCodes.delete(o.code); else openCodes.add(o.code);
            renderOrders();
        } else if (act === "cancel") {
            cancelOrder(o);
        }
    }
    $("order-list").addEventListener("click", handleClick);

    function seed() {
        if (typeof experiences === "undefined" || !experiences.length) {
            toast("Không tìm thấy dữ liệu trải nghiệm (data.js)");
            return;
        }
        const offsets = [-12, 5, 18];
        const sample = [];
        offsets.forEach(function (off, i) {
            const e = experiences[i % experiences.length];
            const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
            const iso = toISO(d);
            const qty = i + 1;
            const total = e.price * qty;
            sample.push({
                code: "CV" + Math.random().toString(36).slice(2, 8).toUpperCase(),
                id: e.id, name: e.name, image: e.image, location: e.location, duration: e.duration,
                date: iso, dateText: isoToVN(iso), slotIndex: 0, slot: "8:00 - 11:00",
                quantity: qty, price: e.price, subtotal: total, discount: 0, coupon: null, total: total,
                points: Math.floor(total / 100000), method: "VietQR",
                customer: { last: "Nguyễn", first: "An", country: "Việt Nam", email: "demo@chamviet.vn", code: "+84", phone: "901234567" },
                status: "confirmed",
                createdAt: new Date(Date.now() - (i + 1) * 86400000).toISOString()
            });
        });
        orders = sample.concat(orders);
        save();
        toast("Đã thêm " + sample.length + " đơn mẫu");
        renderAll();
    }
    $("seed-btn").addEventListener("click", seed);

    $("reset-btn").addEventListener("click", function () {
        if (!window.confirm("Xóa toàn bộ đơn đặt, điểm Chạm và dữ liệu đặt chỗ demo trong trình duyệt này?")) return;
        [ORDERS_KEY, BOOKED_KEY, POINTS_KEY, "chamviet_booking", "chamviet_customer"].forEach(removeKey);
        orders = [];
        openCodes.clear();
        filter = "all";
        toast("Đã xóa dữ liệu demo");
        renderAll();
    });

    renderAll();
})();