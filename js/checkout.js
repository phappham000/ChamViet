(function () {
    "use strict";

    const BOOKING_KEY = "chamviet_booking";
    const ORDERS_KEY = "chamviet_orders";
    const BOOKED_KEY = "chamviet_booked";
    const POINTS_KEY = "chamviet_points";
    const CUSTOMER_KEY = "chamviet_customer";

    const COUPONS = {
        CHAMVIET10: { type: "percent", value: 10, text: "Giảm 10%" },
        WELCOME50: { type: "amount", value: 50000, text: "Giảm 50.000đ" },
        LANGNGHE: { type: "percent", value: 15, text: "Giảm 15%" }
    };

    const METHODS = [
        { id: "vietqr", name: "VietQR", icon: "fa-qrcode", color: "#1d4ed8",
        notes: ["Đảm bảo bạn có ví điện tử hoặc ứng dụng ngân hàng hỗ trợ thanh toán bằng VietQR.",
        "Mã QR hiện sau khi bạn bấm \"Thanh toán ngay\". Chỉ cần lưu hoặc chụp màn hình mã QR để hoàn tất thanh toán trong thời hạn.",
        "Vui lòng dùng mã QR mới nhất được cung cấp để hoàn tất thanh toán."] },
        { id: "bank", name: "Ngân hàng di động", icon: "fa-mobile-screen", color: "#312e81", notes: [] },
        { id: "card", name: "Thẻ tín dụng/thẻ ghi nợ", icon: "fa-credit-card", color: "#7f1d1d", notes: [] },
        { id: "momo", name: "Ví điện tử Momo", icon: "fa-wallet", color: "#a50064", notes: [] },
        { id: "gpay", name: "Google Pay", icon: "fa-brands fa-google-pay", color: "#374151", notes: [] }
    ];

    function $(id) { return document.getElementById(id); }
    function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }
    function money(n) { return Number(n || 0).toLocaleString("vi-VN") + "đ"; }
    function readJSON(key, fallback) {
        try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch (e) { return fallback; }
    }
    function writeJSON(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    }
    function removeKey(key) { try { localStorage.removeItem(key); } catch (e) {} }

    const orders = readJSON(ORDERS_KEY, []);
    const doneCode = new URLSearchParams(window.location.search).get("done");
    const booking = readJSON(BOOKING_KEY, null);

    const state = {
        step: 1,
        customer: null,
        method: "vietqr",
        coupon: null
    };

    const panels = { 1: $("panel-1"), 2: $("panel-2"), 3: $("panel-3") };

    function showStep(n) {
        state.step = n;
        Object.keys(panels).forEach(function (k) { panels[k].hidden = Number(k) !== n; });
        document.querySelectorAll(".ck-step").forEach(function (li) {
            const s = Number(li.dataset.step);
            li.classList.toggle("active", s === n);
            li.classList.toggle("done", s < n);
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (doneCode) {
        const found = orders.find(function (o) { return o.code === doneCode; });
        if (found) { renderDone(found); showStep(3); return; }
    }

    if (!booking || !booking.id) {
        panels[1].hidden = true;
        $("ck-steps").hidden = true;
        $("ck-empty").hidden = false;
        return;
    }

    $("sum-img").src = booking.image || "assets/logo.png";
    $("sum-img").alt = booking.name;
    $("sum-name").textContent = booking.name;
    $("sum-guests").textContent = "Người lớn x" + booking.quantity;
    $("sum-date").textContent = booking.dateText;
    $("sum-slot").textContent = booking.slot;
    $("sum-total").textContent = money(booking.total);
    $("back-detail").href = "detail.html?id=" + encodeURIComponent(booking.id);
    document.title = "Đặt chỗ " + booking.name + " - ChamViet";

    const form = $("info-form");
    const saved = readJSON(CUSTOMER_KEY, null);
    if (saved) {
        $("f-last").value = saved.last || "";
        $("f-first").value = saved.first || "";
        $("f-country").value = saved.country || "Việt Nam";
        $("f-email").value = saved.email || "";
        $("f-code").value = saved.code || "+84";
        $("f-phone").value = saved.phone || "";
    }

    function setError(inputId, message) {
        const field = $(inputId).closest(".field");
        field.classList.toggle("invalid", !!message);
        const err = field.querySelector(".err");
        if (err) err.textContent = message || "";
        return !message;
    }

    function validateInfo() {
        let ok = true;
        const last = $("f-last").value.trim();
        const first = $("f-first").value.trim();
        const email = $("f-email").value.trim();
        const phone = $("f-phone").value.replace(/[\s.\-]/g, "");

        ok = setError("f-last", last ? "" : "Vui lòng nhập họ") && ok;
        ok = setError("f-first", first ? "" : "Vui lòng nhập tên") && ok;
        ok = setError("f-email", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? "" : "E-mail chưa đúng định dạng") && ok;
        ok = setError("f-phone", /^\d{8,11}$/.test(phone) ? "" : "Số điện thoại gồm 8-11 chữ số") && ok;
        return ok;
    }

    form.addEventListener("input", function (e) {
        const field = e.target.closest(".field");
        if (field && field.classList.contains("invalid")) validateInfo();
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validateInfo()) {
            const bad = form.querySelector(".field.invalid input");
            if (bad) bad.focus();
            return;
        }
        state.customer = {
            last: $("f-last").value.trim(),
            first: $("f-first").value.trim(),
            country: $("f-country").value,
            email: $("f-email").value.trim(),
            code: $("f-code").value,
            phone: $("f-phone").value.replace(/[\s.\-]/g, "")
        };
        writeJSON(CUSTOMER_KEY, state.customer);
        renderPay();
        showStep(2);
    });

    function discountAmount() {
        if (!state.coupon) return 0;
        const c = COUPONS[state.coupon];
        const d = c.type === "percent" ? Math.round(booking.total * c.value / 100) : c.value;
        return Math.min(d, booking.total);
    }
    function finalTotal() { return booking.total - discountAmount(); }
    function pointsFor(total) { return Math.floor(total / 100000); }

    const methodListEl = $("method-list");

    function renderMethods() {
        methodListEl.innerHTML = METHODS.map(function (m) {
            const notes = m.notes.length
                ? '<div class="method-note"><ul>' + m.notes.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div>"
                : "";
            return '<li class="method' + (m.id === state.method ? " selected" : "") + '" data-id="' + m.id + '">' +
                '<button type="button" class="method-head" aria-pressed="' + (m.id === state.method) + '">' +
                    '<span class="radio"></span><span class="name">' + esc(m.name) + "</span>" +
                    '<span class="logo" style="background:' + m.color + '"><i class="' + (m.icon.indexOf("fa-brands") === 0 ? m.icon : "fa-solid " + m.icon) + '"></i></span>' +
                "</button>" + notes + "</li>";
        }).join("");
    }

    methodListEl.addEventListener("click", function (e) {
        const li = e.target.closest(".method");
        if (!li) return;
        state.method = li.dataset.id;
        renderMethods();
        renderPanel();
    });

    function drawFakeQR(canvas, seedText) {
        const N = 29, S = 8;
        canvas.width = N * S; canvas.height = N * S;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        let seed = 0;
        for (let i = 0; i < seedText.length; i++) seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
        function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }

        function finder(cx, cy) {
            return cx < 8 && cy < 8 || cx >= N - 8 && cy < 8 || cx < 8 && cy >= N - 8;
        }
        ctx.fillStyle = "#000";
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
                if (!finder(x, y) && rnd() > 0.52) ctx.fillRect(x * S, y * S, S, S);
            }
        }
        [[0, 0], [N - 7, 0], [0, N - 7]].forEach(function (p) {
            ctx.fillStyle = "#000"; ctx.fillRect(p[0] * S, p[1] * S, 7 * S, 7 * S);
            ctx.fillStyle = "#fff"; ctx.fillRect((p[0] + 1) * S, (p[1] + 1) * S, 5 * S, 5 * S);
            ctx.fillStyle = "#000"; ctx.fillRect((p[0] + 2) * S, (p[1] + 2) * S, 3 * S, 3 * S);
        });
    }

    const BANKS = ["Vietcombank", "VietinBank", "BIDV", "Techcombank", "MB Bank", "ACB"];
    const panelEl = $("pay-panel");
    const qrSeed = "CV" + booking.id + booking.date + booking.quantity;

    function renderPanel() {
        let html = "";
        if (state.method === "vietqr" || state.method === "momo") {
            const isMomo = state.method === "momo";
            html =
                '<div class="panel-head"><span>' + (isMomo ? "MoMo" : "VIETQR") + '</span>' +
                    '<button type="button" id="save-qr">Lưu mã QR</button></div>' +
                '<div class="panel-body">' +
                    '<div class="qr-box"><canvas id="qr-canvas" aria-label="Mã QR thanh toán"></canvas></div>' +
                    '<div class="panel-text"><h4>Cách thanh toán bằng ' + (isMomo ? "MoMo" : "VietQR") + "</h4>" +
                    "<ol><li>Chụp màn hình hoặc lưu mã QR bên trái, sau đó mở ứng dụng " + (isMomo ? "MoMo" : "ngân hàng hoặc ví điện tử hỗ trợ QR") + ".</li>" +
                    "<li>Nếu đang thanh toán bằng thiết bị khác, bạn có thể quét trực tiếp mã QR.</li>" +
                    "<li>Đảm bảo số tiền và người nhận khớp với chi tiết bên dưới, rồi hoàn tất thanh toán.</li>" +
                    "<li>Đặt chỗ sẽ được xác nhận sau khi thanh toán thành công.</li></ol>" +
                    '<span class="demo-tag">Demo: mã QR minh họa, không phát sinh giao dịch thật</span></div>' +
                "</div>";
        } else if (state.method === "card") {
            html =
                '<div class="panel-head"><span>THẺ TÍN DỤNG / GHI NỢ</span></div>' +
                '<div class="panel-body single"><div class="card-form">' +
                    '<div class="field full"><label for="c-number">Số thẻ</label><input id="c-number" inputmode="numeric" placeholder="1234 5678 9012 3456" maxlength="19" autocomplete="cc-number"><small class="err"></small></div>' +
                    '<div class="field full"><label for="c-name">Tên in trên thẻ</label><input id="c-name" placeholder="NGUYEN VAN A" autocomplete="cc-name"><small class="err"></small></div>' +
                    '<div class="field"><label for="c-exp">Hết hạn (MM/YY)</label><input id="c-exp" inputmode="numeric" placeholder="09/28" maxlength="5" autocomplete="cc-exp"><small class="err"></small></div>' +
                    '<div class="field"><label for="c-cvv">CVV</label><input id="c-cvv" inputmode="numeric" placeholder="123" maxlength="4" autocomplete="cc-csc"><small class="err"></small></div>' +
                    '<span class="demo-tag full">Demo: vui lòng không nhập thông tin thẻ thật, hãy nhập số bất kỳ</span>' +
                "</div></div>";
        } else if (state.method === "bank") {
            html =
                '<div class="panel-head"><span>NGÂN HÀNG DI ĐỘNG</span></div>' +
                '<div class="panel-body single"><div class="panel-text"><h4>Chọn ngân hàng của bạn</h4>' +
                    '<p>Bạn sẽ được chuyển sang ứng dụng ngân hàng để xác nhận giao dịch.</p>' +
                    '<div class="bank-pick">' + BANKS.map(function (b, i) {
                        return '<label><input type="radio" name="bank" value="' + b + '"' + (i === 0 ? " checked" : "") + "> " + b + "</label>";
                    }).join("") + "</div>" +
                    '<span class="demo-tag">Demo: không chuyển hướng thật</span></div></div>';
        } else {
            html =
                '<div class="panel-head"><span>GOOGLE PAY</span></div>' +
                '<div class="panel-body single"><div class="panel-text"><h4>Thanh toán nhanh bằng Google Pay</h4>' +
                    "<p>Bấm \"Thanh toán ngay\" để xác nhận bằng tài khoản Google Pay đã liên kết trên thiết bị của bạn.</p>" +
                    '<span class="demo-tag">Demo: không phát sinh giao dịch thật</span></div></div>';
        }
        panelEl.innerHTML = html;

        const canvas = $("qr-canvas");
        if (canvas) drawFakeQR(canvas, qrSeed + state.method);

        const saveBtn = $("save-qr");
        if (saveBtn) {
            saveBtn.addEventListener("click", function () {
                const a = document.createElement("a");
                a.href = canvas.toDataURL("image/png");
                a.download = "chamviet-qr.png";
                a.click();
            });
        }

        const num = $("c-number");
        if (num) {
            num.addEventListener("input", function () {
                const d = num.value.replace(/\D/g, "").slice(0, 16);
                num.value = d.replace(/(.{4})/g, "$1 ").trim();
            });
            $("c-exp").addEventListener("input", function (e) {
                let d = e.target.value.replace(/\D/g, "").slice(0, 4);
                if (d.length > 2) d = d.slice(0, 2) + "/" + d.slice(2);
                e.target.value = d;
            });
        }
    }

    function validateCard() {
        const n = $("c-number").value.replace(/\s/g, "");
        const name = $("c-name").value.trim();
        const exp = $("c-exp").value;
        const cvv = $("c-cvv").value;
        const m = exp.match(/^(\d{2})\/(\d{2})$/);
        const monthOk = m && +m[1] >= 1 && +m[1] <= 12;
        let ok = true;
        ok = setError("c-number", /^\d{13,16}$/.test(n) ? "" : "Số thẻ gồm 13-16 chữ số") && ok;
        ok = setError("c-name", name ? "" : "Vui lòng nhập tên trên thẻ") && ok;
        ok = setError("c-exp", monthOk ? "" : "Ngày hết hạn không hợp lệ") && ok;
        ok = setError("c-cvv", /^\d{3,4}$/.test(cvv) ? "" : "CVV gồm 3-4 chữ số") && ok;
        return ok;
    }

    function renderTotals() {
        const discount = discountAmount();
        $("t-sub").textContent = money(booking.total);
        $("t-discount-row").hidden = !discount;
        $("t-discount").textContent = "-" + money(discount);
        $("t-total").textContent = money(finalTotal());
        $("t-points").textContent = pointsFor(finalTotal());
    }

    function renderPay() {
        renderMethods();
        renderPanel();
        renderTotals();
    }

    $("coupon-toggle").addEventListener("click", function () {
        const body = $("coupon-body");
        body.hidden = !body.hidden;
        this.setAttribute("aria-expanded", String(!body.hidden));
        if (!body.hidden) $("coupon-input").focus();
    });

    function applyCoupon() {
        const code = $("coupon-input").value.trim().toUpperCase();
        const msg = $("coupon-msg");
        if (!code) { msg.className = "bad"; msg.textContent = "Vui lòng nhập mã."; return; }
        if (!COUPONS[code]) {
            state.coupon = null;
            msg.className = "bad"; msg.textContent = "Mã không hợp lệ hoặc đã hết hạn.";
        } else {
            state.coupon = code;
            msg.className = "ok"; msg.textContent = "Đã áp dụng " + code + ": " + COUPONS[code].text + ".";
        }
        renderTotals();
    }
    $("coupon-apply").addEventListener("click", applyCoupon);
    $("coupon-input").addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); applyCoupon(); }
    });

    $("back-info").addEventListener("click", function () { showStep(1); });

    function makeCode() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let s = "CV";
        for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
        return s;
    }

    $("pay-btn").addEventListener("click", function () {
        if (state.method === "card" && !validateCard()) return;

        const btn = this;
        btn.disabled = true;
        $("ck-loading").hidden = false;

        setTimeout(function () {
            const total = finalTotal();
            const methodName = METHODS.find(function (m) { return m.id === state.method; }).name;
            const bankEl = document.querySelector('input[name="bank"]:checked');

            const order = {
                code: makeCode(),
                id: booking.id,
                name: booking.name,
                image: booking.image,
                location: booking.location,
                duration: booking.duration,
                date: booking.date,
                dateText: booking.dateText,
                slotIndex: booking.slotIndex,
                slot: booking.slot,
                quantity: booking.quantity,
                price: booking.price,
                subtotal: booking.total,
                discount: discountAmount(),
                coupon: state.coupon,
                total: total,
                points: pointsFor(total),
                method: state.method === "bank" && bankEl ? methodName + " (" + bankEl.value + ")" : methodName,
                customer: state.customer,
                status: "confirmed",
                createdAt: new Date().toISOString()
            };

            orders.unshift(order);
            const ok = writeJSON(ORDERS_KEY, orders);

            const booked = readJSON(BOOKED_KEY, {});
            const key = order.id + "|" + order.date + "|" + order.slotIndex;
            booked[key] = (Number(booked[key]) || 0) + order.quantity;
            writeJSON(BOOKED_KEY, booked);

            writeJSON(POINTS_KEY, (Number(readJSON(POINTS_KEY, 0)) || 0) + order.points);

            removeKey(BOOKING_KEY);
            $("ck-loading").hidden = true;
            btn.disabled = false;

            if (!ok) {
                alert("Trình duyệt đang chặn lưu dữ liệu nên đơn sẽ không hiện ở trang \"Đơn của tôi\".");
            }

            try { history.replaceState(null, "", "checkout.html?done=" + order.code); } catch (e) { /* bỏ qua */ }
            renderDone(order);
            showStep(3);
        }, 1400);
    });

    function renderDone(o) {
        $("done-code").textContent = o.code;
        $("done-name").textContent = o.name;
        $("done-when").textContent = o.dateText + " · " + o.slot;
        $("done-guests").textContent = "Người lớn x" + o.quantity;
        $("done-who").textContent = o.customer.last + " " + o.customer.first;
        $("done-method").textContent = o.method;
        $("done-total").textContent = money(o.total);
        $("done-points").textContent = "+" + o.points;
    }

    showStep(1);
})();