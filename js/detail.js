(function () {
    "use strict";

    if (typeof experiences === "undefined" || !experiences.length) {
        console.error("detail.js: thiếu mảng experiences. Hãy nhúng data.js trước detail.js.");
        return;
    }

    const LIKED_KEY = "chamviet_liked";
    const BOOKED_KEY = "chamviet_booked";
    const BOOKING_KEY = "chamviet_booking";
    const FALLBACK_IMAGE = "assets/logo.png";
    const AVATAR = "assets/avatar.webp";
    const REVIEWS_COLLAPSED = 2;

    const SAMPLE_REVIEWS = [
        { name: "Nguyễn Minh Anh", time: "2 tuần trước", score: 5, photos: ["assets/images1.jpg", "assets/images2.jpg"],
            text: "Trải nghiệm rất tuyệt vời tại {place}. Nghệ nhân nhiệt tình, hướng dẫn từng bước, mình làm ra được sản phẩm của riêng mình." },
        { name: "Trần Quốc Bảo", time: "1 tháng trước", score: 5, photos: ["assets/images3.jpg"],
            text: "Không gian thoáng đãng, con người thân thiện. Cả nhà mình đều thích, chắc chắn sẽ quay lại {place} lần nữa." },
        { name: "Lê Thu Hà", time: "1 tháng trước", score: 4, photos: [],
            text: "Hoạt động ý nghĩa, phù hợp đi cùng bạn bè và gia đình. Nên đến sớm một chút để có nhiều thời gian trải nghiệm hơn." },
        { name: "Phạm Đức Long", time: "2 tháng trước", score: 5, photos: ["assets/images5.jpg", "assets/images6.jpeg"],
            text: "Mình rất ấn tượng với cách mọi người giữ gìn nghề truyền thống ở {place}. Đáng đồng tiền bỏ ra." },
        { name: "Vũ Hải Yến", time: "3 tháng trước", score: 5, photos: [],
            text: "Lịch trình rõ ràng, nhân viên hỗ trợ nhiệt tình. Các bé nhà mình chơi rất vui và học được nhiều điều." },
        { name: "Đỗ Khánh Linh", time: "4 tháng trước", score: 4, photos: ["assets/images7.jpg"],
            text: "Trải nghiệm đáng nhớ, cảnh đẹp và đồ ăn ngon. Mong có thêm nhiều khung giờ vào cuối tuần." }
    ];

    const DEFAULT_SERVICES = [
        "Nguyên liệu tự nhiên",
        "Không gian thoáng mát",
        "Hướng dẫn tận tình từ nghệ nhân bản địa",
        "Hỗ trợ chụp ảnh kỷ niệm",
        "Mang sản phẩm về làm quà"
    ];

    function $(id) { return document.getElementById(id); }

    function esc(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    function money(n) { return Number(n || 0).toLocaleString("vi-VN") + "đ"; }
    function pad(n) { return n < 10 ? "0" + n : String(n); }
    function toISO(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
    function isoToVN(iso) { const p = iso.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }

    function readJSON(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) { return fallback; }
    }
    function writeJSON(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    }

    function todayStart() {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function parseDateText(text) {
        const s = String(text).trim();
        let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (m) return m[1] + "-" + pad(+m[2]) + "-" + pad(+m[3]);
        m = s.match(/(\d{1,2})\s*[\/\-.]\s*(\d{1,2})(?:\s*[\/\-.]\s*(\d{4}))?/);
        if (!m) return null;
        const now = todayStart();
        let year = m[3] ? +m[3] : now.getFullYear();
        let d = new Date(year, +m[2] - 1, +m[1]);
        if (!m[3] && d < now) d = new Date(year + 1, +m[2] - 1, +m[1]);
        return toISO(d);
    }

    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    const raw = idParam === null
        ? experiences[0]
        : experiences.find(function (e) { return String(e.id) === idParam; });

    if (!raw) {
        const page = $("detail-page");
        if (page) {
            page.innerHTML =
                '<div class="not-found">' +
                    "<h1>Không tìm thấy trải nghiệm</h1>" +
                    "<p>Trải nghiệm bạn tìm có thể đã bị gỡ hoặc đường dẫn không đúng.</p>" +
                    '<a class="outline-btn" href="search.html">Xem tất cả trải nghiệm</a>' +
                "</div>";
        }
        return;
    }

    function withDefaults(e) {
        const spots = Number(e.spotsLeft) || 0;
        return Object.assign({}, e, {
            intro: e.intro || ("Hòa mình vào không gian làng nghề tại " + e.location + ", tự tay thực hành cùng nghệ nhân và mang về những kỷ niệm khó quên."),
            highlights: e.highlights || [
                "Tự tay trải nghiệm: được nghệ nhân hướng dẫn từng bước, phù hợp cả người mới.",
                "Không gian làng nghề: hiểu thêm về lịch sử và câu chuyện của địa phương.",
                "Mang quà về: sản phẩm bạn làm ra sẽ là món quà đặc biệt."
            ],
            address: e.address || e.location,
            language: e.language || "Tiếng Việt",
            maxGuests: Number(e.maxGuests) || 10,
            schedule: e.schedule || "Thứ 2 - Chủ nhật (8:00 - 18:00)",
            included: e.included || DEFAULT_SERVICES,
            slots: e.slots || [
                { time: "8:00 - 11:00", spots: spots },
                { time: "14:00 - 17:00", spots: Math.ceil(spots / 3) }
            ]
        });
    }

    const exp = withDefaults(raw);
    const liked = new Set(readJSON(LIKED_KEY, []));

    document.title = exp.name + " - ChamViet";

    const heroImg = $("hero-img");
    heroImg.src = exp.image || FALLBACK_IMAGE;
    heroImg.alt = exp.name;

    const backLink = $("back-link");
    try {
        if (document.referrer && new URL(document.referrer).origin === window.location.origin) {
            backLink.addEventListener("click", function (e) {
                e.preventDefault();
                history.back();
            });
        }
    } catch (e) {}

    $("exp-title").textContent = exp.name;

    $("exp-meta").innerHTML =
        "<span>" + esc(exp.location) + ' <i class="fa-solid fa-location-dot"></i></span>' +
        "<span>" + esc(exp.duration) + ' <i class="fa-solid fa-stopwatch"></i></span>' +
        "<span>" + esc(exp.language) + ' <i class="fa-solid fa-language"></i></span>';

    (function renderRating() {
        const full = Math.round(Number(exp.rating) || 0);
        let stars = '<span class="stars">';
        for (let i = 1; i <= 5; i++) {
            stars += '<i class="fa-solid fa-star' + (i > full ? " off" : "") + '"></i>';
        }
        stars += "</span>";
        $("exp-rating").innerHTML = stars +
            "<strong>" + esc(exp.rating != null ? exp.rating : "-") + "</strong>" +
            '<span class="count">(' + esc(exp.reviews || 0) + " đánh giá)</span>";
    })();

    $("exp-intro").textContent = exp.intro;

    $("exp-highlights").innerHTML = exp.highlights.map(function (h) {
        const text = String(h);
        const i = text.indexOf(":");
        if (i > 0 && i < 60) {
            return "<li><strong>" + esc(text.slice(0, i)) + ":</strong>" + esc(text.slice(i + 1)) + "</li>";
        }
        return "<li>" + esc(text) + "</li>";
    }).join("");

    const infoRows = [
        ["fa-regular fa-clock", "Thời lượng", exp.duration],
        ["fa-solid fa-language", "Ngôn ngữ", exp.language],
        ["fa-solid fa-user-group", "Số người tối đa", exp.maxGuests + " người / nhóm"],
        ["fa-regular fa-calendar", "Lịch hoạt động", exp.schedule],
        ["fa-solid fa-location-dot", "Địa điểm", exp.address]
    ];
    $("info-table").innerHTML = infoRows.map(function (r) {
        return '<li><i class="' + r[0] + '"></i><span class="k">' + esc(r[1]) + '</span><span class="v">' + esc(r[2]) + "</span></li>";
    }).join("");

    $("service-list").innerHTML = exp.included.map(function (t) {
        return '<li><i class="fa-solid fa-check"></i>' + esc(t) + "</li>";
    }).join("");

    const dateInput = $("date-input");
    const slotListEl = $("slot-list");
    const qtyValueEl = $("qty-value");
    const qtyMinus = $("qty-minus");
    const qtyPlus = $("qty-plus");
    const qtyHint = $("qty-hint");
    const totalEl = $("total-value");
    const msgEl = $("booking-msg");
    const bookBtn = $("book-btn");
    const suggestEl = $("date-suggest");

    $("price-big").textContent = money(exp.price);
    $("cta-price").textContent = money(exp.price);

    const today = todayStart();
    const tomorrow = new Date(today.getTime() + 86400000);
    dateInput.min = toISO(today);

    const state = { date: "", slot: -1, qty: 2 };

    const suggestDates = [];
    (exp.dates || []).forEach(function (t) {
        const iso = parseDateText(t);
        if (iso && iso >= toISO(today) && suggestDates.indexOf(iso) === -1) suggestDates.push(iso);
    });
    suggestDates.sort();

    state.date = suggestDates.length ? suggestDates[0] : toISO(tomorrow);
    dateInput.value = state.date;

    function bookedCount(date, slotIndex) {
        const store = readJSON(BOOKED_KEY, {});
        return Number(store[exp.id + "|" + date + "|" + slotIndex]) || 0;
    }

    function available(slotIndex) {
        const slot = exp.slots[slotIndex];
        if (!slot) return 0;
        return Math.max(0, (Number(slot.spots) || 0) - bookedCount(state.date, slotIndex));
    }

    function maxQty() {
        if (state.slot < 0) return exp.maxGuests;
        return Math.min(exp.maxGuests, available(state.slot));
    }

    function renderSuggest() {
        suggestEl.innerHTML = suggestDates.slice(0, 4).map(function (iso) {
            return '<button type="button" class="date-chip' + (iso === state.date ? " active" : "") +
                '" data-date="' + iso + '">' + esc(isoToVN(iso).slice(0, 5)) + "</button>";
        }).join("");
    }

    function renderSlots() {
        slotListEl.innerHTML = exp.slots.map(function (s, i) {
            const left = available(i);
            const label = left > 0 ? "(còn " + left + " chỗ trống)" : "(hết chỗ)";
            return '<button type="button" class="slot' + (i === state.slot ? " selected" : "") + '"' +
                ' data-index="' + i + '"' + (left === 0 ? " disabled" : "") + ">" +
                "<span>" + esc(s.time) + "</span><small>" + label + "</small></button>";
        }).join("");
    }

    function renderQty() {
        const max = maxQty();
        if (state.qty > max) state.qty = max;
        if (state.qty < 1 && max >= 1) state.qty = 1;

        qtyValueEl.textContent = state.qty;
        qtyMinus.disabled = state.qty <= 1;
        qtyPlus.disabled = state.qty >= max;
        qtyHint.textContent = state.slot < 0
            ? "Tối đa " + exp.maxGuests + " người / nhóm"
            : "Còn " + available(state.slot) + " chỗ cho khung giờ này";
        totalEl.textContent = money(exp.price * state.qty);
    }

    function renderBooking() {
        renderSuggest();
        renderSlots();
        renderQty();
    }

    function showMsg(text) { msgEl.textContent = text; }

    dateInput.addEventListener("change", function () {
        if (!dateInput.value || dateInput.value < toISO(today)) {
            dateInput.value = state.date;
            showMsg("Vui lòng chọn ngày từ hôm nay trở đi.");
            return;
        }
        state.date = dateInput.value;
        state.slot = -1;
        showMsg("");
        renderBooking();
    });

    suggestEl.addEventListener("click", function (e) {
        const chip = e.target.closest(".date-chip");
        if (!chip) return;
        state.date = chip.dataset.date;
        dateInput.value = state.date;
        state.slot = -1;
        showMsg("");
        renderBooking();
    });

    slotListEl.addEventListener("click", function (e) {
        const btn = e.target.closest(".slot");
        if (!btn || btn.disabled) return;
        state.slot = Number(btn.dataset.index);
        showMsg("");
        renderBooking();
    });

    qtyMinus.addEventListener("click", function () {
        if (state.qty > 1) { state.qty--; renderQty(); }
    });
    qtyPlus.addEventListener("click", function () {
        if (state.qty < maxQty()) { state.qty++; renderQty(); }
    });

    bookBtn.addEventListener("click", function () {
        if (!state.date) { showMsg("Vui lòng chọn ngày."); return; }
        if (state.slot < 0) { showMsg("Vui lòng chọn khung giờ."); return; }
        if (available(state.slot) < state.qty || state.qty < 1) {
            showMsg("Khung giờ này không đủ chỗ cho " + state.qty + " người.");
            return;
        }

        const slot = exp.slots[state.slot];
        const order = {
            id: exp.id,
            name: exp.name,
            image: exp.image || FALLBACK_IMAGE,
            location: exp.location,
            duration: exp.duration,
            date: state.date,
            dateText: isoToVN(state.date),
            slotIndex: state.slot,
            slot: slot.time,
            quantity: state.qty,
            price: exp.price,
            total: exp.price * state.qty
        };

        if (!writeJSON(BOOKING_KEY, order)) {
            showMsg("Trình duyệt đang chặn lưu dữ liệu, không thể đặt lịch.");
            return;
        }
        window.location.href = "checkout.html";
    });

    $("cta-btn").addEventListener("click", function () {
        const box = $("booking");
        if (box && box.scrollIntoView) box.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    renderBooking();

    const reviews = SAMPLE_REVIEWS.map(function (r) {
        return Object.assign({}, r, { text: r.text.replace(/\{place\}/g, exp.location) });
    });
    const gridEl = $("reviews-grid");
    const toggleBtn = $("reviews-toggle");
    let expanded = false;

    $("reviews-score").innerHTML =
        '<i class="fa-solid fa-star"></i> ' + esc(exp.rating != null ? exp.rating : "-") +
        " (" + esc(exp.reviews || 0) + " đánh giá)";

    function reviewHTML(r) {
        let stars = "";
        for (let i = 1; i <= 5; i++) {
            stars += '<i class="fa-solid fa-star' + (i > r.score ? " off" : "") + '"></i>';
        }
        const photos = r.photos.length
            ? '<div class="review-photos">' + r.photos.map(function (p) {
                return '<img src="' + esc(p) + '" alt="Ảnh đánh giá" loading="lazy">';
            }).join("") + "</div>"
            : "";
        return '<article class="review-card">' +
            '<div class="review-head">' +
                '<img class="avatar" src="' + AVATAR + '" alt="">' +
                '<div class="who"><strong>' + esc(r.name) + "</strong><small>" + esc(r.time) + "</small></div>" +
                '<span class="review-score">' + stars + "</span>" +
            "</div>" +
            "<p>" + esc(r.text) + "</p>" + photos +
        "</article>";
    }

    function renderReviews() {
        const list = expanded ? reviews : reviews.slice(0, REVIEWS_COLLAPSED);
        gridEl.innerHTML = list.map(reviewHTML).join("");
        toggleBtn.textContent = expanded ? "Thu gọn" : "Xem tất cả đánh giá";
    }

    toggleBtn.addEventListener("click", function () {
        expanded = !expanded;
        renderReviews();
    });
    renderReviews();

    $("location-text").textContent = exp.address;
    $("map-frame").src = "https://www.google.com/maps?q=" + encodeURIComponent(exp.address) + "&output=embed&hl=vi";

    function byRating(a, b) { return (b.rating || 0) - (a.rating || 0); }

    function pickRelated() {
        const others = experiences.filter(function (e) { return e.id !== exp.id; });
        const same = others.filter(function (e) { return e.type === exp.type; }).sort(byRating);
        const rest = others.filter(function (e) { return e.type !== exp.type; }).sort(byRating);
        return same.concat(rest).slice(0, 3);
    }

    function createCard(e) {
        const isLiked = liked.has(e.id);
        const dates = (e.dates || []).map(function (d) { return "<span>" + esc(d) + "</span>"; }).join("");
        const rating = e.rating != null
            ? '<p class="rating">' + esc(e.rating) + ' <i class="fa-solid fa-star"></i></p>' : "";
        const meta =
            '<div class="sub-title">' +
                '<p class="address">' + esc(e.location) + ' <i class="fa-solid fa-location-dot"></i></p>' +
                rating +
                '<p class="datetime">' + esc(e.duration) + ' <i class="fa-solid fa-stopwatch"></i></p>' +
            "</div>";

        return '<div class="box-item" data-id="' + esc(e.id) + '">' +
            '<div class="light"></div>' +
            '<div class="image-cell">' +
                '<button type="button" class="fav-btn' + (isLiked ? " liked" : "") + '" data-id="' + esc(e.id) + '"' +
                    ' aria-label="Yêu thích" aria-pressed="' + isLiked + '"><i class="fa-solid fa-heart"></i></button>' +
                '<img src="' + esc(e.image || FALLBACK_IMAGE) + '" alt="' + esc(e.name) + '" loading="lazy">' +
                '<div class="sub-content-cell">' +
                    '<p class="box-title">' + esc(e.name) + "</p>" + meta +
                    '<div class="date">' + dates + "</div>" +
                    '<div class="price">' +
                        '<div class="left"><p>Giá từ</p><p>' + money(e.price) + "/người</p></div>" +
                        '<div class="right"><button type="button">Tìm hiểu thêm</button></div>' +
                    "</div>" +
                "</div>" +
            "</div>" +
            '<div class="content-cell"><p class="box-title">' + esc(e.name) + "</p>" + meta + "</div>" +
        "</div>";
    }

    const relatedEl = $("related-list");
    const relatedItems = pickRelated();
    if (relatedItems.length) {
        relatedEl.innerHTML = relatedItems.map(createCard).join("");
    } else {
        $("related").hidden = true;
    }

    relatedEl.addEventListener("click", function (e) {
        const fav = e.target.closest(".fav-btn");
        if (fav) {
            e.stopPropagation();
            const target = experiences.find(function (x) { return String(x.id) === fav.dataset.id; });
            if (!target) return;
            if (liked.has(target.id)) liked.delete(target.id); else liked.add(target.id);
            const now = liked.has(target.id);
            fav.classList.toggle("liked", now);
            fav.setAttribute("aria-pressed", String(now));
            writeJSON(LIKED_KEY, Array.from(liked));
            return;
        }
        const card = e.target.closest(".box-item");
        if (card) window.location.href = "detail.html?id=" + encodeURIComponent(card.dataset.id);
    });
})();