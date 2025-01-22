const slimeCircle = document.querySelector(".slime-circle");
let isMoving = false; // Status untuk mengetahui apakah kursor bergerak atau tidak
let slimeTimeout; // Untuk mengatur waktu sebelum slime-circle menghilang
let prevX = 0,
  prevY = 0; // Untuk menyimpan posisi sebelumnya

// Fungsi untuk membuat tetesan angka dalam bentuk grid
function createDrop(x, y) {
  const drop = document.createElement("div");
  drop.classList.add("drop");

  // Menambahkan angka 1 atau 0 secara acak
  drop.textContent = Math.random() > 0.5 ? "1" : "0";

  document.body.appendChild(drop);

  // Menyebarkan tetesan angka dalam pola baris atau kolom
  const scrollTop = window.scrollY || document.documentElement.scrollTop;

  // Tentukan jarak untuk tetesan angka (menggunakan grid)
  const spacing = 20; // jarak antar tetesan angka

  // Tentukan posisi agar angka berada dalam grid, tidak terbalik
  const rows = Math.floor(y / spacing);
  const cols = Math.floor(x / spacing);

  drop.style.left = `${cols * spacing}px`;
  drop.style.top = `${rows * spacing + scrollTop}px`; // Menambahkan offset scroll

  // Tambahkan animasi untuk tetesan angka
  setTimeout(() => drop.classList.add("fade-out"), 500); // Efek menghilang setelah 500ms

  // Hapus tetesan setelah animasi selesai
  setTimeout(() => drop.remove(), 1000);
}

// Fungsi utama untuk mengikuti kursor atau sentuhan
function moveSlimeCircle(x, y) {
  // Update posisi slime-circle agar mengikuti kursor atau sentuhan
  const dx = x - prevX;
  const dy = y - prevY;

  // Perbarui posisi slime-circle dengan transisi halus
  slimeCircle.style.left = `${
    prevX + dx * 0.2 - slimeCircle.offsetWidth / 2
  }px`;
  slimeCircle.style.top = `${
    prevY + dy * 0.2 - slimeCircle.offsetHeight / 2
  }px`;

  // Efek lentur lebih lembek dengan kecepatan kursor
  const scaleX = 1 + Math.sin(x * 0.1) * 0.15;
  const scaleY = 1 + Math.cos(y * 0.1) * 0.15;
  slimeCircle.style.transform = `scale(${scaleX}, ${scaleY})`;

  // Efek tetesan angka mengikuti kursor atau sentuhan
  createDrop(x, y);

  // Menandakan kursor atau jari sedang bergerak
  isMoving = true;

  // Tampilkan slime-circle dengan animasi masuk
  slimeCircle.classList.add("visible"); // Menambahkan kelas visible untuk memulai animasi masuk

  // Update posisi sebelumnya untuk pergerakan halus berikutnya
  prevX = x;
  prevY = y;

  // Reset timeout untuk menyembunyikan slime-circle
  clearTimeout(slimeTimeout);
  slimeTimeout = setTimeout(() => {
    slimeCircle.classList.remove("visible"); // Menghapus kelas visible untuk memulai animasi keluar
  }, 1000); // Tunggu 1 detik setelah tidak ada gerakan
}

// Fungsi untuk menangani gerakan sentuhan
function handleTouchMove(e) {
  const touch = e.touches[0]; // Mengambil titik sentuhan pertama
  const x = touch.clientX;
  const y = touch.clientY;

  moveSlimeCircle(x, y);
}

// Fungsi untuk menangani sentuhan pertama (touchstart)
function handleTouchStart(e) {
  const touch = e.touches[0]; // Mengambil titik sentuhan pertama
  const x = touch.clientX;
  const y = touch.clientY;

  prevX = x;
  prevY = y;

  // Tampilkan slime-circle saat sentuhan pertama
  slimeCircle.classList.add("visible");
}

// Event listener untuk menangani gerakan kursor dan sentuhan
document.addEventListener("mousemove", function (e) {
  requestAnimationFrame(() => moveSlimeCircle(e.clientX, e.clientY)); // Pastikan pergerakan mulus
});

document.addEventListener("touchmove", function (e) {
  e.preventDefault(); // Menghindari scrolling saat sentuhan, jika diinginkan
  requestAnimationFrame(() => handleTouchMove(e)); // Tangani gerakan sentuhan
});

document.addEventListener("touchstart", function (e) {
  e.preventDefault(); // Menghindari scrolling saat sentuhan, jika diinginkan
  handleTouchStart(e); // Tangani sentuhan pertama
});

// Posisi slime-circle tetap berada di posisi layar meskipun halaman di-scroll
window.addEventListener("scroll", function () {
  const x = event.clientX;
  const y = event.clientY;

  slimeCircle.style.left = `${x - slimeCircle.offsetWidth / 2}px`;
  slimeCircle.style.top = `${y - slimeCircle.offsetHeight / 2}px`;
});

// ISOTOPE
// ISOTOPE
// ISOTOPE
// ISOTOPE
// ISOTOPE
// ISOTOPE
// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", function () {
  let iso;
  const portfolioGrid = document.querySelector(".portfolio-grid");

  // Initialize loading state
  portfolioGrid.style.opacity = "0";
  portfolioGrid.style.transition = "opacity 0.3s ease-in-out";

  // Load the portfolio data from the JSON file
  fetch("data/work.json")
    .then((response) => response.json())
    .then((data) => {
      // Create all portfolio items first
      data.forEach((item) => {
        const portfolioItem = document.createElement("div");

        // Set classes based on category
        switch (item.category.toLowerCase()) {
          case "project":
            portfolioItem.classList.add(
              "col-12",
              "col-lg-6",
              "portfolio-item",
              "project"
            );
            break;
          case "illustration":
            portfolioItem.classList.add(
              "col-md-6",
              "col-lg-3",
              "portfolio-item",
              "illustration"
            );
            break;
          case "animation":
            portfolioItem.classList.add(
              "col-12",
              "portfolio-item",
              "animation"
            );
            break;
          default:
            portfolioItem.classList.add(
              "col-12",
              "col-md-6",
              "col-lg-4",
              "portfolio-item",
              item.category.toLowerCase()
            );
        }

        // Generate appropriate HTML based on category
        let innerHTMLContent = "";
        switch (item.category.toLowerCase()) {
          case "illustration":
            innerHTMLContent = `
              <div class="portfolio-card h-100 illustration">
                <a href="${item.image}" data-fancybox="illustration" data-caption="${item.caption}">
                  <img src="${item.image}" style="aspect-ratio: 3 / 4; width: 100%; object-fit: cover;" alt="${item.title}" />
                  <div class="portfolio-overlay">
                    <h3 class="portfolio-title">${item.title}</h3>
                    <p class="portfolio-category">${item.category}</p>
                  </div>
                </a>
              </div>
            `;
            break;
          case "project":
            innerHTMLContent = `
              <div class="neo-card h-100">
                <div class="img-hover-zoom mb-4">
                  <img src="${item.image}" alt="${
              item.title
            }" class="project-image rounded thumbnail" />
                </div>
                <div class="d-flex justify-content-between align-items-start mb-4">
                  <h3 class="russo fs-3 mb-0">${item.title}</h3>
                  <div class="neo-icons">
                    <a href="${
                      item.github_link
                    }" class="neo-icon bg-yellow" title="GitHub Repository">
                      <i class="fab fa-github"></i>
                    </a>
                    <a href="${item.website || ""}" style="${
              item.website ? "" : "display: none;"
            }" class="neo-icon bg-mint" title="Visit Website">
                      <i class="fas fa-globe"></i>
                    </a>
                  </div>
                </div>
                <div class="mb-4">
                  <h5 class="roboto-bold mb-2">Project Overview</h5>
                  <p class="roboto-light">${item.overview}</p>
                  <ul class="roboto-light">
                    ${item.features
                      .map((feature) => `<li>${feature}</li>`)
                      .join("")}
                  </ul>
                </div>
                <div class="mb-4">
                  <h5 class="roboto-bold mb-2">Technologies Used</h5>
                  <div class="d-flex flex-wrap gap-2">
                    ${item.technologies
                      .map(
                        (tech) => `
                      <span class="tools-badge">
                        <i class="${tech.icon} me-2"></i>${tech.name}
                      </span>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              </div>
            `;
            break;
          case "uiux":
            innerHTMLContent = `
              <div class="portfolio-card ${item.category}">
                <a href="${item.figma}">
                  <img src="${item.image}" alt="${item.title}" />
                </a>
              </div>
            `;
            break;
          case "animation":
            innerHTMLContent = `
              <div class="portfolio-card ${item.category}">
                <video style="width: 100%; height: 100%;" controls>
                  <source src="${item.video}" type="video/mp4">
                  Your browser does not support the video tag.
                </video>
              </div>
            `;
            break;
          case "manipulation":
            innerHTMLContent = `
              <div class="portfolio-card ${item.category}">
                <a href="${item.image}" data-fancybox="${item.category}">
                  <img 
                    src="${item.image}" 
                    style="aspect-ratio: 3 / 4; width: 100%; object-fit: cover;" 
                    alt="${item.title}" 
                  />
                </a>
              </div>
            `;
            break;
          default:
            innerHTMLContent = `
              <div class="portfolio-card ${item.category}">
                <a href="${item.image}" data-fancybox="${item.category}">
                  <img src="${item.image}" alt="${item.title}" />
                </a>
              </div>
            `;
        }

        portfolioItem.innerHTML = innerHTMLContent;
        portfolioGrid.appendChild(portfolioItem);
      });

      // Initialize Isotope after all items are added
      iso = new Isotope(portfolioGrid, {
        itemSelector: ".portfolio-item",
        layoutMode: "fitRows",
      });

      // Set up filter buttons
      const filterButtons = document.querySelectorAll(".filter-button");
      filterButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const filterValue = this.getAttribute("data-filter");
          iso.arrange({ filter: filterValue });

          filterButtons.forEach((btn) => btn.classList.remove("active"));
          this.classList.add("active");
        });
      });

      // Show the grid once everything is ready
      portfolioGrid.style.opacity = "1";

      // Function to handle random filter click with transition
      const handleRandomFilterTransition = () => {
        // Get all filter buttons except illustration
        const availableButtons = Array.from(filterButtons).filter(
          (btn) => btn.getAttribute("data-filter") !== ".illustration"
        );

        // Select random button
        const randomIndex = Math.floor(Math.random() * availableButtons.length);
        const randomButton = availableButtons[randomIndex];

        // Find illustration button
        const illustrationButton = Array.from(filterButtons).find(
          (btn) => btn.getAttribute("data-filter") === ".illustration"
        );

        // Click random button first
        if (randomButton) {
          randomButton.click();

          // Wait for 800ms then switch to illustration
          setTimeout(() => {
            if (illustrationButton) {
              illustrationButton.click();
            }
          }, 500);
        }
      };

      // Execute the random filter transition
      setTimeout(() => {
        handleRandomFilterTransition();
      }, 100);
    })
    .catch((error) => {
      console.error("Error loading portfolio data:", error);
      portfolioGrid.style.opacity = "1";
    });
});

// fancybox
// Initialize Fancybox with multiple galleries
$("[data-fancybox]").fancybox({
  buttons: ["zoom", "rotate", "slideShow", "fullScreen", "thumbs", "close"],
  animationEffect: "fade",
  transitionEffect: "slide",
  loop: true,
  protect: true,
  toolbar: true,
  touch: true,
  mobile: {
    clickContent: "close",
    clickSlide: "close",
  },
  btnTpl: {
    rotate:
      '<button data-fancybox-rotate class="fancybox-button fancybox-button--rotate" title="Rotate">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 2v2h3v2H7l-2 2v3h2V7l2-2v2h3V5h2v11h-4v-5H8v5H6l-2 2v3h2v-3l2-2h2v2h8v-2h2l2 2v3h2v-3l-2-2h-2v-2h1v-7h-1V5h-5V2z"/></svg>' +
      "</button>",
  },
  afterLoad: function (instance, current) {
    if (instance.group.length > 1) {
      current.$content.on("click", function (e) {
        if ($(e.target).is(".fancybox-button--rotate")) {
          current.$content.find("img").rotate(90);
        }
      });
    }
  },
});

// Logo
const logoContainer = document.querySelector(".logo-container");

// Tambahkan event klik untuk menampilkan teks
logoContainer.addEventListener("click", () => {
  logoContainer.classList.toggle("clicked");
});

// Navbar
// Function to update active class based on scroll position
// Function to update active class based on scroll position
function setActiveNavLink() {
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll(".nav-link");

  let currentSection = "";

  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 50; // Adjust the offset for better detection
    const sectionBottom = sectionTop + section.offsetHeight;

    if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
      currentSection = section.getAttribute("id");
    }
  });

  // Handle the case where we are at the top of the page
  if (window.scrollY === 0) {
    currentSection = sections[0].getAttribute("id");
  }

  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href").includes(currentSection)) {
      link.classList.add("active");
    }
  });
}

// Event listener for scroll events
window.addEventListener("scroll", setActiveNavLink);

// Set initial active class when the page loads
setActiveNavLink();

// portfolio pending
