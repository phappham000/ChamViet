// Tạo HTML cho 1 card (giữ nguyên cấu trúc để CSS cũ của bạn vẫn chạy)
function createCard(exp, showSales) {
    const price = exp.price.toLocaleString("vi-VN") + "đ/người";

    const salesBadge = showSales && exp.weekend
        ? `<div class="sales">
                <p><i class="fa-solid fa-fire"></i> CÒN ${exp.spotsLeft} CHỖ - ${exp.weekend}</p>
            </div>`
        : "";

    const dateSpans = exp.dates.map(d => `<span>${d}</span>`).join("");

    return `
    <div class="box-item">
        <div class="light"></div>
        <div class="image-cell">
            ${salesBadge}
            <img src="${exp.image}" alt="${exp.name}">
            <div class="sub-content-cell">
                <p class="box-title">${exp.name}</p>
                <div class="sub-title">
                    <p class="address">${exp.location} <i class="fa-solid fa-location-dot"></i></p>
                    <p class="datetime">${exp.duration} <i class="fa-solid fa-stopwatch"></i></p>
                </div>
                <div class="date">${dateSpans}</div>
                <div class="price">
                    <div class="left">
                        <p>Giá từ</p>
                        <p>${price}</p>
                    </div>
                    <div class="right">
                        <button data-id="${exp.id}">Tìm hiểu thêm</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="content-cell">
            <p class="box-title">${exp.name}</p>
            <div class="sub-title">
                <p class="address">${exp.location} <i class="fa-solid fa-location-dot"></i></p>
                <p class="rating">${exp.rating} <i class="fa-solid fa-star"></i></p>
                <p class="datetime">${exp.duration} <i class="fa-solid fa-stopwatch"></i></p>
            </div>
        </div>
    </div>`;
}

// Vẽ một danh sách card vào một chỗ trống
function renderList(containerId, list, showSales) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = list.map(exp => createCard(exp, showSales)).join("");
}

// Mục "Trải nghiệm nổi bật": 8 trải nghiệm có rating cao nhất
const featuredList = [...experiences]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

renderList("featured-list", featuredList, false);

// Mục "Dành cho cuối tuần": 4 trải nghiệm có weekend, còn nhiều chỗ nhất
const weekendList = experiences
    .filter(e => e.weekend && e.spotsLeft > 0)
    .sort((a, b) => b.spotsLeft - a.spotsLeft)
    .slice(0, 4);

renderList("weekend-list", weekendList, true);

// Bấm "Tìm hiểu thêm" thì sang trang chi tiết
document.addEventListener("click", function (e) {
    const btn = e.target.closest(".price button");
    if (btn) {
        window.location.href = "detail.html?id=" + btn.dataset.id;
    }
});