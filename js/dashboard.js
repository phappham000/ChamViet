// =========================================================
// TRANG CÁ NHÂN  (đặt ở js/dashboard.js)
// Đọc dữ liệu do checkout.js / detail.js lưu trong trình duyệt:
//   chamviet_orders, chamviet_booked, chamviet_points, chamviet_customer,
//   chamviet_liked; trang này tự lưu thêm chamviet_reviews, chamviet_profile
// =========================================================
(function () {
    "use strict";

    const ORDERS_KEY = "chamviet_orders";
    const BOOKED_KEY = "chamviet_booked";
    const POINTS_KEY = "chamviet_points";
    const CUSTOMER_KEY = "chamviet_customer";
    const LIKED_KEY = "chamviet_liked";
    const REVIEWS_KEY = "chamviet_reviews";
    const PROFILE_KEY = "chamviet_profile";
    const DEFAULT_AVATAR = "assets/avatar.webp";

    const STATUS_TEXT = { upcoming: "Đang tiến hành", done: "Đã hoàn thành", cancelled: "Đã hủy" };
    const VIEWS = ["overview", "orders", "reviews", "favorites", "profile", "settings"];

    // ---------- Tiện ích ----------
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
    // Chính sách hủy: >=3 ngày 100%, 2 ngày 50%, 1 ngày 25%, trong ngày 0%
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
    function starsHTML(n) {
        let s = '<div class="stars" aria-label="' + n + ' sao">';
        for (let i = 1; i <= 5; i++) s += '<i class="fa-solid fa-star' + (i > n ? " off" : "") + '"></i>';
        return s + "</div>";
    }
    function dateVN(iso) { return new Date(iso).toLocaleDateString("vi-VN"); }

    // ---------- Trạng thái ----------
    let orders = readJSON(ORDERS_KEY, []);
    let reviews = readJSON(REVIEWS_KEY, []);
    let filter = "all";
    const openCodes = new Set();

    function saveOrders() { writeJSON(ORDERS_KEY, orders); }
    function saveReviews() { writeJSON(REVIEWS_KEY, reviews); }

    function toast(text) {
        const old = document.querySelector(".db-toast");
        if (old) old.remove();
        const t = document.createElement("div");
        t.className = "db-toast";
        t.textContent = text;
        document.body.appendChild(t);
        setTimeout(function () { t.remove(); }, 2600);
    }

    // ---------- Hồ sơ ----------
    function getProfile() {
        const p = readJSON(PROFILE_KEY, null);
        if (p) return p;
        const c = readJSON(CUSTOMER_KEY, null);
        if (c) {
            return {
                name: ((c.last || "") + " " + (c.first || "")).trim(),
                email: c.email || "", phone: c.phone || "", city: ""
            };
        }
        return { name: "", email: "", phone: "", city: "" };
    }

    function tierOf(points) {
        if (points >= 20) return "Thành viên vàng";
        if (points >= 5) return "Thành viên bạc";
        return "Thành viên mới";
    }

    function renderProfile() {
        const p = getProfile();
        const points = Number(readJSON(POINTS_KEY, 0)) || 0;
        $("pf-name").textContent = p.name || "Khách ChamViet";
        $("pf-email").textContent = p.email || "Chưa cập nhật e-mail";
        $("pf-city").textContent = p.city || "Chưa cập nhật";
        $("pf-tier").textContent = tierOf(points) + (points ? " · " + points + " điểm" : "");
        $("pf-avatar").src = DEFAULT_AVATAR;
    }

    // ---------- Tổng quan ----------
    function renderStats() {
        const liked = readJSON(LIKED_KEY, []);
        $("st-count").textContent = orders.length;
        $("st-liked").textContent = Array.isArray(liked) ? liked.length : 0;
        if (reviews.length) {
            const avg = reviews.reduce(function (s, r) { return s + r.rating; }, 0) / reviews.length;
            $("st-rating").textContent = avg.toFixed(1);
            $("st-rating-note").textContent = "Đánh giá trung bình (" + reviews.length + " đánh giá)";
        } else {
            $("st-rating").textContent = "-";
            $("st-rating-note").textContent = "Chưa có đánh giá";
        }
    }

    function emptyOrders(text) {
        return '<div class="empty"><i class="fa-regular fa-calendar-xmark"></i><h3>' + esc(text) + "</h3>" +
            "<p>Hãy khám phá một trải nghiệm, hoặc thêm dữ liệu mẫu để xem thử trang này.</p>" +
            '<a class="green-btn" href="search.html">Khám phá trải nghiệm</a>' +
            '<button type="button" class="pill-btn" data-act="seed">Thêm dữ liệu mẫu</button></div>';
    }

    function orderHTML(o, compact) {
        const st = statusOf(o);
        const open = !compact && openCodes.has(o.code);
        const c = o.customer || {};
        const canCancel = !compact && st === "upcoming";
        const refundLine = st === "cancelled" && o.refund != null ? " · hoàn " + money(o.refund) : "";

        return '<article class="order' + (open ? " open" : "") + '" data-code="' + esc(o.code) + '">' +
            '<div class="order-main">' +
                '<img src="' + esc(o.image || "assets/logo.png") + '" alt="' + esc(o.name) + '" loading="lazy">' +
                '<div class="order-body">' +
                    '<h3 class="order-name">' + esc(o.name) + "</h3>" +
                    '<div class="order-meta">' +
                        '<span><i class="fa-solid fa-location-dot"></i>' + esc(o.location) + "</span>" +
                        '<span><i class="fa-regular fa-calendar"></i>' + esc(o.dateText || isoToVN(o.date)) + " · " + esc(o.slot) + "</span>" +
                        '<span><i class="fa-solid fa-user"></i>' + esc(o.quantity) + " người · " + money(o.total) + esc(refundLine) + "</span>" +
                    "</div>" +
                    '<div class="order-side">' +
                        '<span class="badge ' + st + '">' + STATUS_TEXT[st] + "</span>" +
                        '<div class="order-actions">' +
                            '<button type="button" class="pill-btn sm" data-act="' + (compact ? "goto" : "toggle") + '">' +
                                (compact ? "Xem chi tiết" : (open ? "Ẩn chi tiết" : "Xem chi tiết")) + " →</button>" +
                            (canCancel ? '<button type="button" class="pill-btn sm danger" data-act="cancel">Hủy đơn</button>' : "") +
                        "</div>" +
                    "</div>" +
                "</div>" +
            "</div>" +
            (compact ? "" :
            '<div class="order-detail">' +
                "<div><span>Mã đặt chỗ</span>" + esc(o.code) + "</div>" +
                "<div><span>Người đặt</span>" + esc(((c.last || "") + " " + (c.first || "")).trim() || "-") + "</div>" +
                "<div><span>Thanh toán</span>" + esc(o.method) + "</div>" +
                "<div><span>Liên hệ</span>" + esc((c.email || "-") + (c.phone ? " · " + (c.code || "") + " " + c.phone : "")) + "</div>" +
                "<div><span>Tạm tính</span>" + money(o.subtotal != null ? o.subtotal : o.total) + "</div>" +
                "<div><span>Giảm giá</span>" + (o.discount ? "-" + money(o.discount) + (o.coupon ? " (" + esc(o.coupon) + ")" : "") : "Không") + "</div>" +
                "<div><span>Điểm Chạm</span>+" + esc(o.points || 0) + "</div>" +
                "<div><span>Thời gian đặt</span>" + esc(o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "-") + "</div>" +
            "</div>") +
        "</article>";
    }

    function sortedOrders() {
        return orders.slice().sort(function (a, b) {
            return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
        });
    }

    function renderRecent() {
        const list = sortedOrders().slice(0, 3);
        $("recent-orders").innerHTML = list.length
            ? list.map(function (o) { return orderHTML(o, true); }).join("")
            : emptyOrders("Bạn chưa có đơn nào");

        const rv = reviews.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, 2);
        $("recent-reviews").innerHTML = rv.length
            ? rv.map(function (r) {
                return '<div class="mini-review"><img src="' + esc(r.image || "assets/logo.png") + '" alt="">' +
                    "<div><h4>" + esc(r.name) + "</h4>" + starsHTML(r.rating) +
                    "<p>\"" + esc(r.text || "Không có nhận xét") + "\"</p><small>" + esc(dateVN(r.date)) + "</small></div></div>";
            }).join("")
            : '<p class="none">Bạn chưa viết đánh giá nào.</p>';
    }

    // ---------- Tab Đơn đặt chỗ ----------
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
        const list = sortedOrders().filter(function (o) { return filter === "all" || statusOf(o) === filter; });
        $("order-list").innerHTML = list.length
            ? list.map(function (o) { return orderHTML(o, false); }).join("")
            : emptyOrders(orders.length ? "Không có đơn nào ở mục này" : "Bạn chưa có đơn nào");
    }

    // ---------- Tab Đánh giá ----------
    function renderReviews() {
        const reviewed = new Set(reviews.map(function (r) { return r.code; }));
        const pending = sortedOrders().filter(function (o) { return statusOf(o) === "done" && !reviewed.has(o.code); });

        $("pending-reviews").innerHTML = pending.map(function (o) {
            return '<div class="pending-card" data-code="' + esc(o.code) + '" data-rating="0">' +
                '<div class="pending-head"><b>Chờ đánh giá: ' + esc(o.name) + "</b>" +
                '<button type="button" class="pill-btn sm" data-act="rate-open">Viết đánh giá</button></div>' +
                '<div class="rate-form">' +
                    '<div class="star-pick">' + [1, 2, 3, 4, 5].map(function (i) {
                        return '<button type="button" data-star="' + i + '" aria-label="' + i + ' sao"><i class="fa-solid fa-star"></i></button>';
                    }).join("") + "</div>" +
                    '<textarea placeholder="Chia sẻ cảm nhận của bạn về trải nghiệm..." maxlength="300"></textarea>' +
                    '<button type="button" class="green-btn" data-act="rate-send">Gửi đánh giá</button>' +
                "</div></div>";
        }).join("");

        $("my-reviews").innerHTML = reviews.length
            ? reviews.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).map(function (r) {
                return '<article class="review-card"><img src="' + esc(r.image || "assets/logo.png") + '" alt="">' +
                    "<div><h4>" + esc(r.name) + "</h4>" + starsHTML(r.rating) +
                    "<p>" + esc(r.text || "Không có nhận xét") + "</p><small>" + esc(dateVN(r.date)) + "</small></div></article>";
            }).join("")
            : (pending.length ? "" : '<div class="empty"><i class="fa-regular fa-star"></i><h3>Chưa có đánh giá nào</h3>' +
                "<p>Sau khi hoàn thành một trải nghiệm, bạn có thể đánh giá tại đây.</p></div>");
    }

    // ---------- Tab Yêu thích ----------
    function renderFavorites() {
        const liked = readJSON(LIKED_KEY, []);
        const items = (typeof experiences !== "undefined" ? experiences : []).filter(function (e) {
            return Array.isArray(liked) && liked.indexOf(e.id) !== -1;
        });
        $("fav-grid").innerHTML = items.length
            ? items.map(function (e) {
                return '<article class="fav-card"><img src="' + esc(e.image || "assets/logo.png") + '" alt="' + esc(e.name) + '" loading="lazy">' +
                    "<div><h4>" + esc(e.name) + "</h4><small>" + esc(e.location) + " · " + money(e.price) + "/người</small>" +
                    '<a class="pill-btn sm" href="detail.html?id=' + encodeURIComponent(e.id) + '">Xem chi tiết →</a></div></article>';
            }).join("")
            : '<div class="empty" style="grid-column:1/-1"><i class="fa-regular fa-heart"></i><h3>Chưa có trải nghiệm yêu thích</h3>' +
                '<p>Bấm biểu tượng trái tim trên thẻ trải nghiệm để lưu vào đây.</p><a class="green-btn" href="search.html">Khám phá trải nghiệm</a></div>';
    }

    // ---------- Tab Thông tin cá nhân ----------
    function fillProfileForm() {
        const p = getProfile();
        $("p-name").value = p.name || "";
        $("p-city").value = p.city || "";
        $("p-email").value = p.email || "";
        $("p-phone").value = p.phone || "";
    }

    $("profile-form").addEventListener("submit", function (e) {
        e.preventDefault();
        const email = $("p-email").value.trim();
        const err = $("p-email-err");
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
            err.textContent = "E-mail chưa đúng định dạng";
            return;
        }
        err.textContent = "";
        writeJSON(PROFILE_KEY, {
            name: $("p-name").value.trim(),
            city: $("p-city").value.trim(),
            email: email,
            phone: $("p-phone").value.replace(/[\s.\-]/g, "")
        });
        renderProfile();
        toast("Đã lưu thông tin cá nhân");
    });

    // ---------- Chuyển tab theo #hash ----------
    function currentView() {
        const h = window.location.hash.replace("#", "");
        return VIEWS.indexOf(h) !== -1 ? h : "overview";
    }

    function showView() {
        const v = currentView();
        VIEWS.forEach(function (name) { $("view-" + name).hidden = name !== v; });
        document.querySelectorAll("#db-menu .menu-item").forEach(function (a) {
            a.classList.toggle("active", a.dataset.view === (v === "favorites" ? "overview" : v));
        });
        if (v === "profile") fillProfileForm();
        window.scrollTo({ top: 0 });
    }
    window.addEventListener("hashchange", showView);

    function renderAll() {
        renderProfile();
        renderStats();
        renderRecent();
        renderTabs();
        renderOrders();
        renderReviews();
        renderFavorites();
    }

    // ---------- Hành động ----------
    $("db-tabs").addEventListener("click", function (e) {
        const tab = e.target.closest(".tab");
        if (!tab) return;
        filter = tab.dataset.filter;
        renderTabs();
        renderOrders();
    });

    function cancelOrder(o) {
        const pct = refundPercent(o);
        const refund = Math.round(o.total * pct / 100);
        if (!window.confirm("Hủy đơn " + o.code + "?\nTheo chính sách, bạn được hoàn " + pct + "% (" + money(refund) + ").")) return;

        o.status = "cancelled";
        o.refund = refund;
        saveOrders();

        const booked = readJSON(BOOKED_KEY, {});
        const key = o.id + "|" + o.date + "|" + o.slotIndex;
        if (booked[key]) {
            booked[key] = Math.max(0, booked[key] - o.quantity);
            if (!booked[key]) delete booked[key];
            writeJSON(BOOKED_KEY, booked);
        }
        writeJSON(POINTS_KEY, Math.max(0, (Number(readJSON(POINTS_KEY, 0)) || 0) - (o.points || 0)));

        toast("Đã hủy đơn " + o.code + ", hoàn " + pct + "%");
        renderAll();
    }

    function onClick(e) {
        const btn = e.target.closest("[data-act]");
        if (!btn) return;
        const act = btn.dataset.act;
        if (act === "seed") { seed(); return; }

        const card = btn.closest(".order");
        if (card) {
            const o = orders.find(function (x) { return x.code === card.dataset.code; });
            if (!o) return;
            if (act === "toggle") {
                if (openCodes.has(o.code)) openCodes.delete(o.code); else openCodes.add(o.code);
                renderOrders();
            } else if (act === "goto") {
                openCodes.add(o.code);
                filter = "all";
                renderTabs();
                renderOrders();
                window.location.hash = "#orders";
                showView();
            } else if (act === "cancel") {
                cancelOrder(o);
            }
            return;
        }

        const pend = btn.closest(".pending-card");
        if (!pend) return;
        if (act === "rate-open") {
            pend.classList.toggle("open");
        } else if (act === "rate-send") {
            const rating = Number(pend.dataset.rating) || 0;
            if (!rating) { toast("Vui lòng chọn số sao"); return; }
            const o = orders.find(function (x) { return x.code === pend.dataset.code; });
            if (!o) return;
            reviews.push({
                code: o.code, id: o.id, name: o.name, image: o.image, rating: rating,
                text: pend.querySelector("textarea").value.trim(), date: new Date().toISOString()
            });
            saveReviews();
            toast("Cảm ơn bạn đã đánh giá!");
            renderAll();
        }
    }
    document.querySelector(".db-page").addEventListener("click", onClick);

    // chọn sao
    $("pending-reviews").addEventListener("click", function (e) {
        const star = e.target.closest("[data-star]");
        if (!star) return;
        const card = star.closest(".pending-card");
        card.dataset.rating = star.dataset.star;
        card.querySelectorAll("[data-star]").forEach(function (b) {
            b.classList.toggle("on", Number(b.dataset.star) <= Number(star.dataset.star));
        });
    });

    // ---------- Dữ liệu mẫu / xóa ----------
    function seed() {
        if (typeof experiences === "undefined" || !experiences.length) {
            toast("Không tìm thấy dữ liệu trải nghiệm (data.js)");
            return;
        }
        const offsets = [-12, 5, -40];
        const sample = offsets.map(function (off, i) {
            const e = experiences[i % experiences.length];
            const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
            const iso = toISO(d);
            const qty = i + 1;
            const total = e.price * qty;
            return {
                code: "CV" + Math.random().toString(36).slice(2, 8).toUpperCase(),
                id: e.id, name: e.name, image: e.image, location: e.location, duration: e.duration,
                date: iso, dateText: isoToVN(iso), slotIndex: 0, slot: "8:00 - 11:00",
                quantity: qty, price: e.price, subtotal: total, discount: 0, coupon: null, total: total,
                points: Math.floor(total / 100000), method: "VietQR",
                customer: { last: "Phạm Thị", first: "Thương", country: "Việt Nam", email: "demo@chamviet.vn", code: "+84", phone: "901234567" },
                status: "confirmed",
                createdAt: new Date(Date.now() - (i + 1) * 86400000 * 3).toISOString()
            };
        });
        orders = sample.concat(orders);
        saveOrders();

        const done = sample[0];
        reviews.push({
            code: done.code, id: done.id, name: done.name, image: done.image, rating: 5,
            text: "Trải nghiệm thú vị, nghệ nhân hướng dẫn nhiệt tình, không gian làng nghề rất đẹp.",
            date: new Date(Date.now() - 86400000 * 2).toISOString()
        });
        saveReviews();

        toast("Đã thêm dữ liệu mẫu");
        renderAll();
    }
    $("seed-btn").addEventListener("click", seed);

    $("reset-btn").addEventListener("click", function () {
        if (!window.confirm("Xóa toàn bộ đơn, đánh giá, điểm Chạm và thông tin đã lưu trong trình duyệt này?")) return;
        [ORDERS_KEY, BOOKED_KEY, POINTS_KEY, CUSTOMER_KEY, REVIEWS_KEY, PROFILE_KEY, "chamviet_booking"].forEach(removeKey);
        orders = []; reviews = [];
        openCodes.clear();
        filter = "all";
        toast("Đã xóa dữ liệu demo");
        renderAll();
    });

    renderAll();
    showView();
})();