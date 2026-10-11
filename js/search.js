(function () {
    "use strict";

    if (typeof experiences === "undefined") {
        console.error("search.js: thiếu mảng experiences. Hãy nhúng data.js trước search.js.");
        return;
    }

    const LIKED_KEY = "chamviet_liked";
    const FALLBACK_IMAGE = "assets/logo.png";

    const MAIN_LOCATIONS = ["Hà Nội", "Ninh Bình", "Hòa Bình"];

    const priceRanges = {
        low:  function (p) { return p < 200000; },
        mid:  function (p) { return p >= 200000 && p <= 400000; },
        high: function (p) { return p > 400000; }
    };

    const durationRanges = {
        short:  function (h) { return h < 4; },
        medium: function (h) { return h >= 4 && h <= 8; },
        long:   function (h) { return h > 8; }
    };

    const sorters = {
        "popular":    function (a, b) { return (b.reviews || 0) - (a.reviews || 0); },
        "rating":     function (a, b) { return (b.rating || 0) - (a.rating || 0); },
        "price-asc":  function (a, b) { return a.price - b.price; },
        "price-desc": function (a, b) { return b.price - a.price; }
    };

    const layout      = document.getElementById("search-layout");
    const panel       = document.getElementById("filter-panel");
    const listEl      = document.getElementById("result-list");
    const countEl     = document.getElementById("result-count");
    const sortEl      = document.getElementById("sort-select");
    const keywordEl   = document.getElementById("keyword");
    const heroForm    = document.getElementById("hero-search");
    const dateEl      = document.getElementById("date-input");
    const guestsEl    = document.getElementById("guests-input");
    const availableEl = document.getElementById("only-available");
    const toggleBtn   = document.getElementById("filter-toggle");
    const clearBtn    = document.getElementById("clear-filters");
    const chips       = document.querySelectorAll(".chip");
    const mobileQuery = window.matchMedia("(max-width: 900px)");

    function normalize(text) {
        return String(text || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d");
    }

    function escapeHTML(text) {
        return String(text).replace(/[&<>"']/g, function (ch) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
    }

    function durationToHours(value) {
        if (typeof value === "number") return value;
        const text = normalize(value);
        const days = text.match(/(\d+)\s*n/);
        if (days) return Number(days[1]) * 24;
        const hours = text.match(/(\d+(?:[.,]\d+)?)\s*(gio|h|tieng)/);
        if (hours) return parseFloat(hours[1].replace(",", "."));
        return 0;
    }

    function isoToVN(iso) {
        if (!iso) return "";
        const parts = iso.split("-");
        return parts.length === 3 ? parts[2] + "/" + parts[1] + "/" + parts[0] : "";
    }

    function matchLocation(location, selected) {
        const key = normalize(location);
        const isMain = MAIN_LOCATIONS.some(function (m) { return normalize(m) === key; });
        return selected.some(function (s) {
            if (s === "other") return !isMain;
            return normalize(s) === key;
        });
    }

    function checkedValues(name) {
        return Array.from(panel.querySelectorAll('input[name="' + name + '"]:checked'))
            .map(function (input) { return input.value; });
    }

    function loadLiked() {
        try {
            const raw = localStorage.getItem(LIKED_KEY);
            if (raw) return new Set(JSON.parse(raw));
        } catch (e) { /* bỏ qua, dùng dữ liệu mẫu */ }
        return new Set(experiences.filter(function (e) { return e.liked; }).map(function (e) { return e.id; }));
    }

    function saveLiked() {
        try {
            localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(liked)));
        } catch (e) { /* bỏ qua */ }
    }

    const liked = loadLiked();

    function getFilteredList() {
        const types         = checkedValues("type");
        const locations     = checkedValues("location");
        const prices        = checkedValues("price");
        const durations     = checkedValues("duration");
        const keyword       = normalize(keywordEl.value.trim());
        const dateText      = isoToVN(dateEl.value);
        const guests        = parseInt(guestsEl.value, 10) || 0;
        const onlyAvailable = availableEl.checked;

        return experiences.filter(function (exp) {
            if (types.length && types.indexOf(exp.type) === -1) return false;

            if (locations.length && !matchLocation(exp.location, locations)) return false;

            if (prices.length && !prices.some(function (k) { return priceRanges[k](exp.price); })) return false;

            if (durations.length) {
                const hours = durationToHours(exp.duration);
                if (!durations.some(function (k) { return durationRanges[k](hours); })) return false;
            }

            if (keyword && normalize(exp.name + " " + exp.location).indexOf(keyword) === -1) return false;

            if (dateText && (exp.dates || []).indexOf(dateText) === -1) return false;

            if (guests && !(exp.spotsLeft >= guests)) return false;

            if (onlyAvailable && !(exp.spotsLeft > 0)) return false;

            return true;
        });
    }

    function createCard(exp) {
        const name     = escapeHTML(exp.name);
        const location = escapeHTML(exp.location);
        const duration = escapeHTML(exp.duration);
        const image    = escapeHTML(exp.image || FALLBACK_IMAGE);
        const price    = Number(exp.price).toLocaleString("vi-VN") + "đ/người";
        const isLiked  = liked.has(exp.id);
        const dates    = (exp.dates || []).map(function (d) {
            return "<span>" + escapeHTML(d) + "</span>";
        }).join("");

        const rating = exp.rating != null
            ? '<p class="rating">' + escapeHTML(exp.rating) + ' <i class="fa-solid fa-star"></i></p>'
            : "";

        const meta =
            '<div class="sub-title">' +
                '<p class="address">' + location + ' <i class="fa-solid fa-location-dot"></i></p>' +
                rating +
                '<p class="datetime">' + duration + ' <i class="fa-solid fa-stopwatch"></i></p>' +
            "</div>";

        return '' +
        '<div class="box-item" data-id="' + escapeHTML(exp.id) + '">' +
            '<div class="light"></div>' +
            '<div class="image-cell">' +
                '<button type="button" class="fav-btn' + (isLiked ? " liked" : "") + '"' +
                        ' data-id="' + escapeHTML(exp.id) + '" aria-label="Yêu thích" aria-pressed="' + isLiked + '">' +
                    '<i class="fa-solid fa-heart"></i>' +
                '</button>' +
                '<img src="' + image + '" alt="' + name + '" loading="lazy">' +
                '<div class="sub-content-cell">' +
                    '<p class="box-title">' + name + '</p>' +
                    meta +
                    '<div class="date">' + dates + '</div>' +
                    '<div class="price">' +
                        '<div class="left"><p>Giá từ</p><p>' + price + '</p></div>' +
                        '<div class="right"><button type="button">Tìm hiểu thêm</button></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="content-cell">' +
                '<p class="box-title">' + name + '</p>' +
                meta +
            '</div>' +
        '</div>';
    }

    function isGroupActive(group) {
        return Array.from(group.querySelectorAll("input")).some(function (input) {
            return input.type === "checkbox" ? input.checked : input.value !== "";
        });
    }

    function updateChips() {
        chips.forEach(function (chip) {
            const group = document.getElementById(chip.dataset.target);
            chip.classList.toggle("has-filter", !!group && isGroupActive(group));
        });
    }

    function render() {
        const sorter = sorters[sortEl.value] || sorters.popular;
        const list = getFilteredList().sort(sorter);

        countEl.textContent = list.length + " kết quả";

        if (list.length === 0) {
            listEl.innerHTML =
                '<div class="no-result">' +
                    '<i class="fa-regular fa-face-frown"></i>' +
                    "<p>Chưa có trải nghiệm nào phù hợp với bộ lọc của bạn.</p>" +
                    '<button type="button" class="no-result-btn">Xóa bộ lọc</button>' +
                "</div>";
        } else {
            listEl.innerHTML = list.map(createCard).join("");
        }

        listEl.scrollTop = 0;
        updateChips();
    }

    function clearFilters() {
        panel.querySelectorAll('input[type="checkbox"]').forEach(function (input) {
            input.checked = false;
        });
        dateEl.value = "";
        guestsEl.value = "";
        keywordEl.value = "";
        render();
    }

    function checkByParam(name, raw) {
        if (!raw) return;
        const wanted = raw.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
        panel.querySelectorAll('input[name="' + name + '"]').forEach(function (input) {
            if (wanted.indexOf(input.value) !== -1) input.checked = true;
        });
    }

    function applyUrlParams() {
        const params = new URLSearchParams(window.location.search);
        checkByParam("type", params.get("type"));
        checkByParam("location", params.get("location"));
        checkByParam("price", params.get("price"));
        checkByParam("duration", params.get("duration"));
        if (params.get("q")) keywordEl.value = params.get("q");
    }

    function isPanelVisible() {
        return mobileQuery.matches
            ? layout.classList.contains("filters-open")
            : !layout.classList.contains("filters-collapsed");
    }

    function syncToggle() {
        const visible = isPanelVisible();
        toggleBtn.classList.toggle("is-open", visible);
        toggleBtn.setAttribute("aria-expanded", String(visible));
    }

    function showPanel() {
        layout.classList.remove("filters-collapsed");
        layout.classList.add("filters-open");
        syncToggle();
    }

    toggleBtn.addEventListener("click", function () {
        layout.classList.toggle(mobileQuery.matches ? "filters-open" : "filters-collapsed");
        syncToggle();
    });

    mobileQuery.addEventListener("change", syncToggle);

    chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
            const group = document.getElementById(chip.dataset.target);
            if (!group) return;

            showPanel();

            requestAnimationFrame(function () {
                if (mobileQuery.matches) {
                    group.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                    panel.scrollTo({ top: Math.max(group.offsetTop - 4, 0), behavior: "smooth" });
                }
                group.classList.add("flash");
                setTimeout(function () { group.classList.remove("flash"); }, 1200);
            });
        });
    });

    panel.addEventListener("input", render);
    sortEl.addEventListener("change", render);
    keywordEl.addEventListener("input", render);
    clearBtn.addEventListener("click", clearFilters);

    heroForm.addEventListener("submit", function (e) {
        e.preventDefault();
        render();
        keywordEl.blur();
    });

    listEl.addEventListener("click", function (e) {
        if (e.target.closest(".no-result-btn")) {
            clearFilters();
            return;
        }

        const favBtn = e.target.closest(".fav-btn");
        if (favBtn) {
            const exp = experiences.find(function (x) { return String(x.id) === favBtn.dataset.id; });
            if (!exp) return;
            if (liked.has(exp.id)) liked.delete(exp.id); else liked.add(exp.id);
            const nowLiked = liked.has(exp.id);
            favBtn.classList.toggle("liked", nowLiked);
            favBtn.setAttribute("aria-pressed", String(nowLiked));
            saveLiked();
            return;
        }

        const card = e.target.closest(".box-item");
        if (card) {
            window.location.href = "detail.html?id=" + encodeURIComponent(card.dataset.id);
        }
    });

    applyUrlParams();
    syncToggle();
    render();
})();