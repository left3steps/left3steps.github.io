(() => {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  const search = document.querySelector("[data-article-search]");
  const tabs = [...document.querySelectorAll("[data-category]")];
  const cards = [...document.querySelectorAll("[data-article-card]")];
  const count = document.querySelector("[data-result-count]");
  const empty = document.querySelector("[data-empty-results]");
  let category = "전체";

  const filter = () => {
    const query = (search?.value || "").trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const categoryMatch = category === "전체" || card.dataset.articleCategory === category;
      const textMatch = !query || card.textContent.toLowerCase().includes(query);
      card.hidden = !(categoryMatch && textMatch);
      if (!card.hidden) visible += 1;
    });
    if (count) count.textContent = `총 ${visible}편의 글`;
    empty?.classList.toggle("visible", visible === 0);
  };

  search?.addEventListener("input", filter);
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    category = tab.dataset.category || "전체";
    tabs.forEach((item) => item.classList.toggle("active", item === tab));
    filter();
  }));
})();
