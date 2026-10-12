const headerHTML = `
<header class="site-header">
    <div class="menu" id="menu">
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
    </div>
    <div class="site-header-left">
        <div class="logo-web">
            <img src="assets/logo.png" alt="logo">
        </div>
        <p class="logo-title">ChamViet</p>
    </div>
    <div class="site-header-right">
        <div class="nav">
            <button id="menu-icon">
                <i class="fa-solid fa-bars"></i>
            </button>
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
            <a href="dashboard.html">
                <img src="assets/avatar.webp" alt="avatar">
                <i class="fa-solid fa-bell"></i>
            </a>
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

const chatBoxAI = `
<div class="box-ai">
    <div class="ai">
        <i class="fa-solid fa-paper-plane"></i>
        <div class="nocti">
            <p>Bạn có gặp khó khăn gì không?</p>
            <p>Tôi sẵn sàng giúp bạn!</p>
        </div>
    </div>
</div>
`;

headerEl = document.getElementById("site-header");
footerEl = document.getElementById("site-footer");
chatEL = document.getElementById("box-ai");

chatEL.innerHTML = chatBoxAI;

if (headerEl) headerEl.innerHTML = headerHTML;
if (footerEl) footerEl.innerHTML = footerHTML;

const menuIcon = document.getElementById("menu-icon");
const menu = document.getElementById("menu");

menuIcon.addEventListener("click", (e) => {
    e.stopPropagation();

    if (menu.classList.contains("active")) {
        closeMenu();
        document.body.classList.remove("no-scroll");
    } else {
        menu.classList.add("active");

        document.body.classList.add("no-scroll");

        gsap.fromTo(menu,
            {
                width: 0,
                opacity: 0
            },
            {
                width: "100%",
                opacity: 1,
                duration: 0.3,
                ease: "power2.out"
            }
        );
    }
});

function closeMenu() {
    gsap.to(menu, {
        width: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
            menu.classList.remove("active");
            gsap.set(menu, { clearProps: "width,opacity" });
        }
    });
}

document.addEventListener("click", (e) => {
    if (
        menu.classList.contains("active") &&
        !menu.contains(e.target) &&
        !menuIcon.contains(e.target)
    ) {
        closeMenu();
        document.body.classList.remove("no-scroll");
    }
});

const currentPage = document.body.dataset.page;
document.querySelectorAll(".nav-item").forEach(function (item) {
    if (item.dataset.page === currentPage) {
        item.classList.add("active");
    }
});