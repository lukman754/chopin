// Tech Stack
fetch("data/tech-stack.json")
  .then((response) => response.json())
  .then((data) => {
    const container = document.getElementById("tech-stack-container");

    data.forEach((category) => {
      // Create a section for each category
      const categorySection = document.createElement("div");
      categorySection.classList.add("mb-4");

      // Add category name as a heading
      const categoryTitle = document.createElement("h6");
      categoryTitle.classList.add("mb-3");
      categoryTitle.innerHTML = category.category;
      categorySection.appendChild(categoryTitle);

      // Create a row for the items
      const row = document.createElement("div");
      row.classList.add("row", "g-2");

      // Add items in the category
      category.items.forEach((item) => {
        const col = document.createElement("div");
        col.classList.add("col-4", "col-md-2");

        const techItem = document.createElement("div");
        techItem.classList.add("d-flex", "flex-column", "align-items-center");

        techItem.innerHTML = `
          <img src="${item.icon}" alt="${item.name}" class="img-fluid mb-1" style="max-width: 40px;" />
          <p class="text-center" style="font-size: 0.8rem;">${item.name}</p>
        `;

        col.appendChild(techItem);
        row.appendChild(col);
      });

      // Append the row to the category section
      categorySection.appendChild(row);

      // Append the category section to the main container
      container.appendChild(categorySection);
    });
  })
  .catch((error) => console.error("Error loading tech stack:", error));

// Achievemnt
// Initialize Swiper
const swiper = new Swiper(".achievementsSwiper", {
  slidesPerView: 1,
  spaceBetween: 30,
  loop: true,
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
});

// Fetch and populate achievements
fetch("data/achievements.json")
  .then((response) => response.json())
  .then((data) => {
    const container = document.getElementById("achievements-container");

    data.forEach((achievement) => {
      const col = document.createElement("div");
      col.classList.add("col-md-6"); // Tambahkan margin bawah untuk jarak antar card

      col.innerHTML = `
        <div class="neo-card position-relative overflow-hidden" style="background: linear-gradient(145deg,rgba(48, 44, 40, 0.69) 0%,rgba(133, 102, 0, 0.49) 100%);">
          <div class="row g-0 align-items-center">
            <div class="col-md-6">
              <div class="position-relative">
                <img src="${achievement.image}" alt="${
        achievement.title
      }" class="img-fluid rounded" />
              </div>
            </div>
            <div class="col-md-6">
              <div class="p-3">
                <h3 class="russo h5 mb-3">
                  <img
                    src="${achievement.icon ? achievement.icon : ""}" 
                    width="30" 
                    alt=""
                    style="${achievement.icon ? "" : "display: none;"}"
                  />
                  ${achievement.title}
                </h3>
                <p class="roboto-light mb-3" style="color: #cccccc">
                  ${achievement.description}
                  <a class="text-decoration-none select-link" href="${
                    achievement.link
                  }">
                    ${achievement.organization}
                  </a> ${achievement.year}
                </p>
                <div class="d-flex flex-wrap justify-content-between align-items-center">
                  <span class="roboto-bold text-wrap" style="color: var(--mint)">${
                    achievement.date
                  }</span>
                  <a class="neo-button" href="${
                    achievement.image
                  }" data-fancybox="achievement" data-caption="${
        achievement.title
      }">
                    <i class="fa-solid fa-magnifying-glass"></i> View
                    <div class="portfolio-overlay">
                      <h3 class="portfolio-title">${achievement.title}</h3>
                      <p class="portfolio-category">1st Place</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      container.appendChild(col);
    });
  })
  .catch((error) => console.error("Error loading achievements data:", error));

// Function to load and display certificates
function loadSeminarCertificates() {
  fetch("data/seminar.json")
    .then((response) => response.json())
    .then((data) => {
      const container = document.getElementById(
        "seminar-certificates-container"
      );

      // Clear any existing content
      container.innerHTML = "";

      // Add each certificate to the table
      data.certificates.forEach((cert) => {
        const certRow = document.createElement("tr");
        certRow.classList.add("cert-item");

        certRow.innerHTML = `
         <td class="py-3">
         <p class="roboto-light mb-1">
                <span class="badge bg-${
                  cert.role === "Panitia" ? "success" : "info"
                }">${cert.role}</span>
                </p>
            <h5 class="roboto-bold mb-2">${cert.title}</h5>
            <div class="d-flex flex-wrap gap-3">
                <p class="roboto-light mb-0 text-muted">
                <i class="fa fa-calendar-alt me-1"></i>${cert.date}
                </p>
                <p class="roboto-light mb-0 text-muted">
                <i class="fa fa-building me-2"></i>${cert.issuedBy}
                </p>
                
            </div>
            </td>
            <td class="text-end align-middle">
            <a href="${cert.imageUrl}" 
                data-fancybox="seminar-gallery"
                class="view-cert neo-button text-black d-flex align-items-center">
                <i class="fa fa-search me-2"></i> View
            </a>
            </td>

        `;

        container.appendChild(certRow);
      });
    })
    .catch((error) => {
      console.error("Error loading certificates:", error);
      const container = document.getElementById(
        "seminar-certificates-container"
      );
      container.innerHTML = `
        <tr>
          <td colspan="2" class="text-center py-4">
            <p class="text-muted mb-0">Failed to load certificates. Please try again later.</p>
          </td>
        </tr>
      `;
    });
}

// Load certificates when the document is ready
document.addEventListener("DOMContentLoaded", loadSeminarCertificates);

// design
// Load the portfolio data from the JSON file
