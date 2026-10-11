const headerHTML = `
<header class="site-header">
    <div class="site-header-left">
        <div class="logo-web">
            <img src="assets/logo.png" alt="logo">
        </div>
        <p class="logo-title">ChamViet</p>
    </div>
    <div class="site-header-right">
        <div class="nav">
            <a class="nav-item" href="index.html" data-page="index">
                <p class="nav-item-content">Trang chủ</p>
            </a>
            <a class="nav-item" href="search.html" data-page="search">
                <p class="nav-item-content">Trải nghiệm</p>
            </a>
            <a class="nav-item" href="comingsoon.html" data-page="comingsoon">
                <p class="nav-item-content">Về ChamViet</p>
            </a>
            <a class="nav-item" href="comingsoon.html" data-page="comingsoon">
                <p class="nav-item-content">Blog</p>
            </a>
            <a class="nav-item" href="comingsoon.html" data-page="comingsoon">
                <p class="nav-item-content">Trở thành đối tác</p>
            </a>
            <div class="loop-glass">
                <i class="fa-solid fa-magnifying-glass"></i>
            </div>
        </div>
        <div class="me">
            <img src="assets/avatar.webp" alt="avatar">
            <i class="fa-solid fa-bell"></i>
        </div>
    </div>
</header>
`;

const footerHTML = `
<footer class="site-footer">
    <div class="footer-item">
        <p class="title">Về ChamViet</p>
        <p>Giới thiệu</p>
        <p>Liên hệ</p>
    </div>
    <div class="footer-item">
        <p class="title">Trải nghiệm</p>
        <p>Tất cả</p>
        <p>Gốm</p>
        <p>Farmstay</p>
    </div>
    <div class="footer-item">
        <p class="title">Chính sách</p>
        <p>Hoàn tiền</p>
        <p>Bảo mật</p>
    </div>
    <div class="footer-item">
        <p class="title">Mạng xã hội</p>
        <div class="icons">
            <i class="fa-brands fa-facebook"></i>
            <i class="fa-brands fa-instagram"></i>
            <i class="fa-brands fa-youtube"></i>
        </div>
    </div>
</footer>
`;

headerEl = document.getElementById("site-header");
footerEl = document.getElementById("site-footer");

if (headerEl) headerEl.innerHTML = headerHTML;
if (footerEl) footerEl.innerHTML = footerHTML;

const currentPage = document.body.dataset.page;
document.querySelectorAll(".nav-item").forEach(function (item) {
    if (item.dataset.page === currentPage) {
        item.classList.add("active");
    }
});