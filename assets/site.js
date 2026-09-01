const SUPABASE_URL = "https://dikjsgxlijnsvpyclbyb.supabase.co";
const SUPABASE_KEY = "sb_publishable_T0w2q8uzzxEVX8KOE7HA1A_hruO35mS";
const POSTS_TABLE = "harugyeol_posts";
const SESSION_KEY = "harugyeol_admin_session";

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const formatDate = (value) => new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
}).format(new Date(value));

function postHref(post) {
  return `/articles/${encodeURIComponent(post.slug)}/`;
}

function cardMarkup(post, filterable = true) {
  return `<article class="article-card accent-${escapeHtml(post.accent || "sage")}"${filterable ? ` data-article-card data-article-category="${escapeHtml(post.category)}"` : ""}>
    <a href="${postHref(post)}" aria-label="${escapeHtml(post.title)} 읽기">
      <div class="card-art" aria-hidden="true"><span class="art-line art-line-one"></span><span class="art-line art-line-two"></span><span class="art-dot"></span></div>
      <div class="card-body"><div class="eyebrow-row"><span>${escapeHtml(post.category)}</span><span>${Number(post.reading_minutes || 5)}분 읽기</span></div><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.excerpt)}</p><span class="read-link">글 읽기 <span aria-hidden="true">→</span></span></div>
    </a>
  </article>`;
}

function sectionsMarkup(post) {
  const sections = Array.isArray(post.sections) ? post.sections : [];
  return `<p class="article-lead">${escapeHtml(post.intro)}</p>${sections.map((section, index) => `<section><span class="section-index">${String(index + 1).padStart(2, "0")}</span><h2>${escapeHtml(section.heading)}</h2>${(section.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}${section.checklist?.length ? `<div class="checklist-box"><strong>바로 해보기</strong><ul>${section.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}</section>`).join("")}<div class="article-note"><strong>편집 메모</strong><p>집의 크기와 가족 구성에 따라 맞는 방법은 달라질 수 있습니다. 한 번에 모두 바꾸기보다 가장 불편한 한 지점부터 시험해보세요.</p></div>`;
}

async function publicPosts(query = "") {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${POSTS_TABLE}?select=*&status=eq.published&order=published_at.desc${query}`, {
    headers: { apikey: SUPABASE_KEY },
  });
  if (!response.ok) throw new Error("게시글을 불러오지 못했습니다.");
  return response.json();
}

function setupNavigation() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function setupFilters() {
  const search = document.querySelector("[data-article-search]");
  const tabs = [...document.querySelectorAll("[data-category]")];
  const count = document.querySelector("[data-result-count]");
  const empty = document.querySelector("[data-empty-results]");
  if (!search && !tabs.length) return;
  let category = "전체";

  const filter = () => {
    const cards = [...document.querySelectorAll("[data-article-card]")];
    const query = (search?.value || "").trim().toLowerCase();
    let visible = 0;
    cards.forEach((item) => {
      const categoryMatch = category === "전체" || item.dataset.articleCategory === category;
      const textMatch = !query || item.textContent.toLowerCase().includes(query);
      item.hidden = !(categoryMatch && textMatch);
      if (!item.hidden) visible += 1;
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
  filter();
}

async function hydrateStaticArticle() {
  const root = document.querySelector("[data-live-article]");
  if (!root) return;
  try {
    const slug = root.dataset.postSlug;
    const posts = await publicPosts(`&slug=eq.${encodeURIComponent(slug)}&limit=1`);
    const post = posts[0];
    if (!post) return;
    root.querySelectorAll("[data-live-category]").forEach((item) => { item.textContent = post.category; });
    root.querySelector("[data-live-reading]").textContent = `${post.reading_minutes}분 읽기`;
    root.querySelector("[data-live-title]").textContent = post.title;
    root.querySelector("[data-live-excerpt]").textContent = post.excerpt;
    root.querySelector("[data-live-intro]").textContent = post.intro;
    const time = root.querySelector("[data-live-date]");
    time.dateTime = post.published_at;
    time.textContent = formatDate(post.published_at);
    const hero = root.querySelector("[data-live-hero]");
    hero.className = `article-hero accent-${post.accent || "sage"}`;
    root.querySelector("[data-live-content]").innerHTML = sectionsMarkup(post);
    document.title = `${post.title} | 하루결`;
  } catch {
    // 생성 시점의 정적 본문을 대체 콘텐츠로 유지합니다.
  }
}

function articleMarkup(post) {
  return `<article><nav class="breadcrumbs" aria-label="현재 위치"><a href="/">홈</a><span>/</span><a href="/articles/">생활 안내서</a><span>/</span><span>${escapeHtml(post.category)}</span></nav>
    <header class="article-hero accent-${escapeHtml(post.accent || "sage")}"><div class="article-title-wrap"><div class="eyebrow-row"><span>${escapeHtml(post.category)}</span><span>${Number(post.reading_minutes || 5)}분 읽기</span></div><h1>${escapeHtml(post.title)}</h1><p>${escapeHtml(post.excerpt)}</p><div class="article-byline"><span>하루결 편집부</span><time datetime="${escapeHtml(post.published_at)}">${formatDate(post.published_at)}</time></div></div><div class="article-hero-art" aria-hidden="true"><span></span><i></i><b></b></div></header>
    <div class="article-layout"><aside class="article-aside"><span>이 글의 핵심</span><p>${escapeHtml(post.intro)}</p></aside><div class="article-content">${sectionsMarkup(post)}</div></div></article>`;
}

async function loadDynamicArticle() {
  const shell = document.querySelector("[data-dynamic-article]");
  if (!shell) return;
  const slug = new URLSearchParams(location.search).get("slug");
  if (!slug) {
    shell.innerHTML = '<div class="not-found"><span>안내</span><h1>글 주소가 필요합니다.</h1><a class="primary-button" href="/articles/">모든 글 보기</a></div>';
    return;
  }
  try {
    const posts = await publicPosts(`&slug=eq.${encodeURIComponent(slug)}&limit=1`);
    if (!posts[0]) throw new Error("not-found");
    location.replace(postHref(posts[0]));
  } catch {
    shell.innerHTML = '<div class="not-found"><span>404</span><h1>공개된 글을 찾을 수 없습니다.</h1><a class="primary-button" href="/articles/">모든 글 보기</a></div>';
  }
}

function parseBody(body) {
  return body.split(/\n(?=## )/).map((block) => {
    const lines = block.trim().split("\n");
    const heading = (lines.shift() || "본문").replace(/^##\s*/, "").trim();
    const paragraphs = [];
    const checklist = [];
    let paragraph = [];
    const flush = () => {
      if (paragraph.length) paragraphs.push(paragraph.join(" ").trim());
      paragraph = [];
    };
    lines.forEach((line) => {
      if (line.startsWith("- ")) { flush(); checklist.push(line.slice(2).trim()); }
      else if (!line.trim()) flush();
      else paragraph.push(line.trim());
    });
    flush();
    return { heading, paragraphs, ...(checklist.length ? { checklist } : {}) };
  }).filter((section) => section.paragraphs.length || section.checklist?.length);
}

function editorBody(sections = []) {
  return sections.map((section) => [`## ${section.heading}`, ...(section.paragraphs || []), ...(section.checklist || []).map((item) => `- ${item}`)].join("\n\n")).join("\n\n");
}

function setupAdmin() {
  const app = document.querySelector("[data-admin-app]");
  if (!app) return;
  const loginPanel = app.querySelector("[data-admin-login]");
  const passwordPanel = app.querySelector("[data-password-setup]");
  const workspace = app.querySelector("[data-admin-workspace]");
  const loginForm = app.querySelector("[data-login-form]");
  const passwordForm = app.querySelector("[data-password-form]");
  const postForm = app.querySelector("[data-post-form]");
  const list = app.querySelector("[data-admin-post-list]");
  const loginMessage = app.querySelector("[data-login-message]");
  const passwordMessage = app.querySelector("[data-password-message]");
  const saveMessage = app.querySelector("[data-save-message]");
  let session = null;
  let posts = [];
  let current = null;
  const hash = new URLSearchParams(location.hash.slice(1));
  const recoveryToken = hash.get("access_token");
  const recoveryType = hash.get("type");

  const showMessage = (element, message, error = false) => {
    element.hidden = !message;
    element.textContent = message;
    element.classList.toggle("error", error);
  };

  const authHeaders = () => ({ apikey: SUPABASE_KEY, Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" });

  async function verifySession(candidate) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${candidate.access_token}` } });
    if (!response.ok) throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");
    const user = await response.json();
    if (user.app_metadata?.harugyeol_role !== "admin") throw new Error("하루결 관리자 권한이 아직 연결되지 않았습니다.");
    return user;
  }

  async function loadPosts() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${POSTS_TABLE}?select=*&order=updated_at.desc`, { headers: authHeaders() });
    if (!response.ok) throw new Error("게시글 목록을 불러오지 못했습니다.");
    posts = await response.json();
    app.querySelector("[data-post-count]").textContent = posts.length;
    app.querySelector("[data-published-count]").textContent = posts.filter((post) => post.status === "published").length;
    list.innerHTML = posts.map((post) => `<button type="button" data-edit-id="${escapeHtml(post.id)}"><span class="status-dot ${escapeHtml(post.status)}"></span><span><strong>${escapeHtml(post.title)}</strong><small>${post.status === "published" ? "공개" : "초안"} · ${escapeHtml(post.category)}</small></span><i>수정</i></button>`).join("") || "<p>아직 게시글이 없습니다.</p>";
    list.querySelectorAll("[data-edit-id]").forEach((button) => button.addEventListener("click", () => editPost(button.dataset.editId)));
  }

  async function enterWorkspace(candidate) {
    const user = await verifySession(candidate);
    session = candidate;
    localStorage.setItem(SESSION_KEY, JSON.stringify(candidate));
    app.querySelector("[data-admin-email]").textContent = user.email || "관리자";
    loginPanel.hidden = true;
    workspace.hidden = false;
    await loadPosts();
  }

  function resetForm() {
    current = null;
    postForm.reset();
    postForm.elements.reading_minutes.value = 5;
    postForm.elements.status.value = "draft";
    app.querySelector("[data-editor-title]").textContent = "새 글 작성";
    app.querySelector("[data-new-post]").hidden = true;
    showMessage(saveMessage, "");
  }

  function editPost(id) {
    current = posts.find((post) => post.id === id);
    if (!current) return;
    for (const name of ["id", "title", "slug", "excerpt", "category", "intro", "status", "reading_minutes"]) postForm.elements[name].value = current[name] ?? "";
    postForm.elements.featured.checked = Boolean(current.featured);
    postForm.elements.body.value = editorBody(current.sections);
    app.querySelector("[data-editor-title]").textContent = "글 수정";
    app.querySelector("[data-new-post]").hidden = false;
    scrollTo({ top: 0, behavior: "smooth" });
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage(loginMessage, "로그인 중입니다.");
    const data = new FormData(loginForm);
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error_description || result.msg || "로그인에 실패했습니다.");
      await enterWorkspace(result);
      showMessage(loginMessage, "");
    } catch (error) { showMessage(loginMessage, error.message, true); }
  });

  app.querySelector("[data-recovery]").addEventListener("click", async () => {
    const email = loginForm.elements.email.value.trim();
    if (!email) {
      showMessage(loginMessage, "먼저 관리자 이메일을 입력해주세요.", true);
      loginForm.elements.email.focus();
      return;
    }
    showMessage(loginMessage, "비밀번호 설정 메일을 보내는 중입니다.");
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent('https://left3steps.github.io/admin/')}`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.msg || result.message || "메일을 보내지 못했습니다.");
      }
      showMessage(loginMessage, "메일을 보냈습니다. 받은 편지함의 비밀번호 설정 링크를 열어주세요.");
    } catch (error) { showMessage(loginMessage, error.message, true); }
  });

  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = passwordForm.elements.password.value;
    const confirmPassword = passwordForm.elements.confirm_password.value;
    if (password !== confirmPassword) {
      showMessage(passwordMessage, "두 비밀번호가 일치하지 않습니다.", true);
      return;
    }
    showMessage(passwordMessage, "비밀번호를 저장하는 중입니다.");
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${recoveryToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.msg || result.message || "비밀번호를 저장하지 못했습니다.");
      history.replaceState(null, "", "/admin/");
      passwordPanel.hidden = true;
      loginPanel.hidden = false;
      loginForm.elements.email.value = result.email || "nature@left3steps.com";
      showMessage(loginMessage, "비밀번호가 설정됐습니다. 새 비밀번호로 로그인하세요.");
    } catch (error) { showMessage(passwordMessage, error.message, true); }
  });

  postForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(postForm);
    const status = String(data.get("status"));
    const payload = {
      title: String(data.get("title")).trim(),
      slug: String(data.get("slug")).trim(),
      excerpt: String(data.get("excerpt")).trim(),
      category: String(data.get("category")),
      intro: String(data.get("intro")).trim(),
      sections: parseBody(String(data.get("body"))),
      status,
      featured: data.get("featured") === "on",
      accent: current?.accent || "sage",
      reading_minutes: Number(data.get("reading_minutes")),
      published_at: status === "published" ? (current?.published_at || new Date().toISOString()) : null,
    };
    showMessage(saveMessage, "저장 중입니다.");
    try {
      const path = current ? `${POSTS_TABLE}?id=eq.${encodeURIComponent(current.id)}` : POSTS_TABLE;
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method: current ? "PATCH" : "POST",
        headers: { ...authHeaders(), Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "저장하지 못했습니다.");
      showMessage(saveMessage, status === "published" ? "공개 발행했습니다. 사이트 목록에 바로 반영됩니다." : "초안을 저장했습니다.");
      await loadPosts();
      if (result[0]) editPost(result[0].id);
    } catch (error) { showMessage(saveMessage, error.message, true); }
  });

  app.querySelector("[data-new-post]").addEventListener("click", resetForm);
  app.querySelector("[data-logout]").addEventListener("click", () => {
    localStorage.removeItem(SESSION_KEY);
    session = null;
    workspace.hidden = true;
    loginPanel.hidden = false;
    loginForm.reset();
  });

  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (saved?.access_token) enterWorkspace(saved).catch(() => localStorage.removeItem(SESSION_KEY));
  } catch { localStorage.removeItem(SESSION_KEY); }

  if (recoveryToken && (recoveryType === "recovery" || recoveryType === "invite")) {
    loginPanel.hidden = true;
    workspace.hidden = true;
    passwordPanel.hidden = false;
  }
}

setupNavigation();
setupFilters();
hydrateStaticArticle();
loadDynamicArticle();
setupAdmin();
