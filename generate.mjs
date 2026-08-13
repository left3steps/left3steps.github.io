import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { seedPosts } from "./data/posts.mjs";

const ORIGIN = "https://left3steps.github.io";
const ADSENSE_CLIENT = "ca-pub-1146138210876381";
const OUT = new URL("./docs/", import.meta.url);

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
}).format(new Date(`${value}T00:00:00+09:00`));

async function output(path, contents) {
  const target = new URL(path, OUT);
  await mkdir(new URL("./", target), { recursive: true });
  await writeFile(target, contents, "utf8");
}

function document({ title, description, path = "/", content, schema = null, noindex = false }) {
  const fullTitle = title === "하루결" ? title : `${title} | 하루결`;
  const canonical = `${ORIGIN}${path}`;
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="google-adsense-account" content="${ADSENSE_CLIENT}">
  ${noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index,follow,max-image-preview:large">'}
  <link rel="canonical" href="${canonical}">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="하루결">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ORIGIN}/assets/og.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="/assets/styles.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2248%22 fill=%22%2336564b%22/><text x=%2250%22 y=%2265%22 font-size=%2252%22 text-anchor=%22middle%22 fill=%22white%22>ㅎ</text></svg>">
  ${noindex ? "<!-- AdSense is disabled on utility pages. -->" : `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>`}
  ${schema ? `<script type="application/ld+json">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script>` : ""}
</head>
<body>
  <a class="skip-link" href="#main">본문 바로가기</a>
  ${header()}
  <main id="main">${content}</main>
  ${footer()}
  <script src="/assets/site.js" defer></script>
</body>
</html>`;
}

function header() {
  return `<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="/" aria-label="하루결 홈"><span class="brand-mark" aria-hidden="true">ㅎ</span><span>하루결</span></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav" data-nav-toggle>메뉴</button>
    <nav class="main-nav" id="main-nav" aria-label="주요 메뉴" data-nav>
      <a href="/articles/">모든 글</a><a href="/about/">소개</a><a href="/editorial-policy/">편집 원칙</a>
    </nav>
  </div>
</header>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="footer-grid">
    <div><div class="footer-brand">하루결</div><p>집을 완벽하게 바꾸기보다, 오늘의 생활을 조금 가볍게 만드는 방법을 기록합니다.</p></div>
    <div class="footer-links"><span>사이트</span><a href="/articles/">모든 글</a><a href="/about/">소개</a></div>
    <div class="footer-links"><span>운영 정책</span><a href="/editorial-policy/">편집 원칙</a><a href="/privacy/">개인정보처리방침</a><a href="/terms/">이용약관</a></div>
  </div>
  <div class="footer-bottom"><span>© 2026 하루결. All rights reserved.</span><span class="site-updated">마지막 정책 검토: 2026년 8월 13일</span></div>
</footer>`;
}

function card(post, filterable = false) {
  const attrs = filterable ? ` data-article-card data-article-category="${escapeHtml(post.category)}"` : "";
  return `<article class="article-card accent-${post.accent}"${attrs}>
  <a href="/articles/${post.slug}/" aria-label="${escapeHtml(post.title)} 읽기">
    <div class="card-art" aria-hidden="true"><span class="art-line art-line-one"></span><span class="art-line art-line-two"></span><span class="art-dot"></span></div>
    <div class="card-body"><div class="eyebrow-row"><span>${escapeHtml(post.category)}</span><span>${post.readingMinutes}분 읽기</span></div><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.excerpt)}</p><span class="read-link">글 읽기 <span aria-hidden="true">→</span></span></div>
  </a>
</article>`;
}

function home() {
  const featured = seedPosts.filter((post) => post.featured).slice(0, 3);
  const latest = seedPosts.filter((post) => !featured.some((item) => item.id === post.id)).slice(0, 6);
  return document({
    title: "하루결",
    description: "작은 집에서도 오래 유지되는 정리, 청소, 주방 동선과 생활 루틴을 소개합니다.",
    path: "/",
    schema: { "@context": "https://schema.org", "@type": "WebSite", name: "하루결", url: ORIGIN, inLanguage: "ko-KR" },
    content: `<section class="hero-shell">
      <div class="hero-copy"><span class="kicker">A quieter way to live</span><h1>완벽한 집보다<br>편안한 하루</h1><p>정리는 물건을 숨기는 기술이 아니라 생활의 마찰을 줄이는 일이라고 믿습니다. 오늘 바로 해볼 수 있는 작은 방법부터 시작해보세요.</p><div class="hero-actions"><a class="primary-button" href="/articles/">생활 안내서 보기</a><a class="text-button" href="/about/">하루결 소개 <span aria-hidden="true">↗</span></a></div></div>
      <div class="hero-art" aria-hidden="true"><div class="sun-shape"></div><div class="shelf-shape"><span></span><span></span><span></span></div><div class="plant-shape"><i></i><i></i><i></i></div><div class="hero-note">오늘의 작은 변화가<br>내일의 여백이 됩니다.</div></div>
    </section>
    <section class="section-shell"><div class="section-heading"><div><span class="section-number">01</span><h2>먼저 읽어볼 이야기</h2></div><p>가장 자주 마주치는 생활의 불편부터 골랐습니다.</p></div><div class="article-grid">${featured.map((post) => card(post)).join("")}</div></section>
    <section class="manifesto-band"><div class="manifesto-inner"><span>하루결의 기준</span><blockquote>“좋은 살림은 더 많이 가지는 일이 아니라,<br>덜 망설이고 편하게 움직이는 일.”</blockquote><a href="/editorial-policy/">콘텐츠를 만드는 원칙 보기 →</a></div></section>
    <section class="section-shell"><div class="section-heading"><div><span class="section-number">02</span><h2>최근 생활 안내서</h2></div><a class="text-button" href="/articles/">모든 글 보기 <span aria-hidden="true">→</span></a></div><div class="article-grid latest-grid">${latest.map((post) => card(post)).join("")}</div></section>
    <section class="newsletter-shell"><div><span class="kicker">Weekly note</span><h2>주말에 한 가지씩,<br>집의 흐름을 바꿔보세요.</h2></div><div class="newsletter-copy"><p>새 글은 매주 한 편씩 발행합니다. 과장된 비법보다 실제로 반복할 수 있는 방법을 담겠습니다.</p><a class="primary-button light" href="/articles/">지금 10편 모두 읽기</a></div></section>`,
  });
}

function articles() {
  const categories = ["전체", ...new Set(seedPosts.map((post) => post.category))];
  return document({
    title: "모든 생활 안내서",
    description: "정리, 청소, 주방과 생활 루틴에 관한 하루결의 모든 글을 찾아보세요.",
    path: "/articles/",
    content: `<div class="page-shell articles-page"><div class="page-intro"><span class="kicker">Living library</span><h1>생활 안내서</h1><p>집을 돌보는 일이 버겁지 않도록, 바로 적용할 수 있는 순서와 기준으로 정리했습니다.</p></div>
      <div class="filter-panel"><div class="search-box"><label class="sr-only" for="article-search">글 검색</label><input id="article-search" type="search" placeholder="제목이나 내용으로 검색" data-article-search></div><div class="category-tabs">${categories.map((name, index) => `<button class="${index === 0 ? "active" : ""}" type="button" data-category="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join("")}</div></div>
      <p class="result-count" data-result-count>총 ${seedPosts.length}편의 글</p><div class="article-grid all-articles-grid" data-remote-articles>${seedPosts.map((post) => card(post, true)).join("")}</div><div class="empty-results" data-empty-results>검색 조건에 맞는 글이 없습니다.</div></div>`,
  });
}

function article(post) {
  const related = seedPosts.filter((item) => item.id !== post.id && item.category === post.category).slice(0, 2);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: { "@type": "Organization", name: "하루결 편집부" },
    publisher: { "@type": "Organization", name: "하루결" },
    mainEntityOfPage: `${ORIGIN}/articles/${post.slug}/`,
    inLanguage: "ko-KR",
  };
  const sections = post.sections.map((section, index) => `<section><span class="section-index">${String(index + 1).padStart(2, "0")}</span><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}${section.checklist ? `<div class="checklist-box"><strong>바로 해보기</strong><ul>${section.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}</section>`).join("");
  return document({
    title: post.title,
    description: post.excerpt,
    path: `/articles/${post.slug}/`,
    schema,
    content: `<article data-live-article data-post-slug="${escapeHtml(post.slug)}"><nav class="breadcrumbs" aria-label="현재 위치"><a href="/">홈</a><span>/</span><a href="/articles/">생활 안내서</a><span>/</span><span data-live-category>${escapeHtml(post.category)}</span></nav>
      <header class="article-hero accent-${post.accent}" data-live-hero><div class="article-title-wrap"><div class="eyebrow-row"><span data-live-category>${escapeHtml(post.category)}</span><span data-live-reading>${post.readingMinutes}분 읽기</span></div><h1 data-live-title>${escapeHtml(post.title)}</h1><p data-live-excerpt>${escapeHtml(post.excerpt)}</p><div class="article-byline"><span>하루결 편집부</span><time datetime="${post.publishedAt}" data-live-date>${formatDate(post.publishedAt)}</time></div></div><div class="article-hero-art" aria-hidden="true"><span></span><i></i><b></b></div></header>
      <div class="article-layout"><aside class="article-aside"><span>이 글의 핵심</span><p data-live-intro>${escapeHtml(post.intro)}</p></aside><div class="article-content" data-live-content><p class="article-lead">${escapeHtml(post.intro)}</p>${sections}<div class="article-note"><strong>편집 메모</strong><p>집의 크기와 가족 구성에 따라 맞는 방법은 달라질 수 있습니다. 한 번에 모두 바꾸기보다 가장 불편한 한 지점부터 시험해보세요.</p></div></div></div></article>
      ${related.length ? `<section class="section-shell related-section"><div class="section-heading"><div><span class="section-number">Next</span><h2>이어 읽기</h2></div></div><div class="article-grid related-grid">${related.map((item) => card(item)).join("")}</div></section>` : ""}`,
  });
}

function dynamicArticle() {
  return document({
    title: "생활 안내서",
    description: "하루결 편집 스튜디오에서 발행한 최신 생활 안내서입니다.",
    path: "/article/",
    noindex: true,
    content: `<div class="dynamic-article-shell" data-dynamic-article><div class="loading-card"><span class="kicker">Living guide</span><h1>글을 불러오는 중입니다</h1><p>잠시만 기다려주세요.</p></div></div>`,
  });
}

function adminPage() {
  return document({
    title: "편집 스튜디오",
    description: "하루결 관리자 전용 게시글 편집 화면입니다.",
    path: "/admin/",
    noindex: true,
    content: `<div class="admin-page" data-admin-app>
      <header class="admin-page-header"><span class="brand-mark">ㅎ</span><div><span>하루결</span><h1>편집 스튜디오</h1></div></header>
      <section class="admin-login-card" data-admin-login>
        <span class="kicker">Secure access</span><h2>편집자 로그인</h2><p>등록된 Supabase 관리자 계정으로 로그인하세요.</p>
        <form class="admin-form compact-form" data-login-form><label>이메일<input name="email" type="email" required autocomplete="username"></label><label>비밀번호<input name="password" type="password" required autocomplete="current-password"></label><p class="form-message full-field" data-login-message hidden></p><button class="primary-button" type="submit">로그인</button></form>
        <button class="admin-secondary-action" type="button" data-recovery>처음 접속 또는 비밀번호 설정</button>
      </section>
      <section class="admin-login-card" data-password-setup hidden>
        <span class="kicker">Set password</span><h2>관리자 비밀번호 설정</h2><p>앞으로 편집 스튜디오에 로그인할 비밀번호를 직접 설정하세요.</p>
        <form class="admin-form compact-form" data-password-form><label>새 비밀번호<input name="password" type="password" required minlength="10" autocomplete="new-password"></label><label>새 비밀번호 확인<input name="confirm_password" type="password" required minlength="10" autocomplete="new-password"></label><p class="form-message full-field" data-password-message hidden></p><button class="primary-button" type="submit">비밀번호 저장</button></form>
      </section>
      <section class="admin-workspace" data-admin-workspace hidden>
        <div class="admin-toolbar"><div><span>로그인됨</span><strong data-admin-email></strong></div><div class="admin-stats"><span>전체 <strong data-post-count>0</strong></span><span>공개 <strong data-published-count>0</strong></span></div><button type="button" data-logout>로그아웃</button></div>
        <div class="admin-columns"><section class="editor-panel"><div class="panel-heading"><div><span class="kicker">Editor</span><h2 data-editor-title>새 글 작성</h2></div><button type="button" data-new-post hidden>새 글</button></div>
          <form class="admin-form" data-post-form>
            <input type="hidden" name="id"><label class="full-field">제목<input name="title" required maxlength="120"></label><label>주소 슬러그<input name="slug" required pattern="[a-z0-9-]+" placeholder="english-post-address"><small>영문 소문자·숫자·하이픈만 사용합니다.</small></label><label>카테고리<select name="category"><option>정리</option><option>청소</option><option>주방</option><option>루틴</option><option>살림도구</option></select></label>
            <label class="full-field">요약<textarea name="excerpt" required rows="3" minlength="20" maxlength="320"></textarea></label><label class="full-field">도입문<textarea name="intro" required rows="4" minlength="20" maxlength="1000"></textarea></label><label class="full-field">본문 <small>소제목은 ##, 체크 항목은 - 로 시작합니다.</small><textarea name="body" required rows="18" placeholder="## 첫 번째 소제목&#10;본문을 입력하세요.&#10;&#10;- 체크 항목"></textarea></label>
            <label>예상 읽기 시간<input name="reading_minutes" type="number" min="1" max="60" value="5"></label><label>상태<select name="status"><option value="draft">초안</option><option value="published">공개 발행</option></select></label><label class="check-field"><input name="featured" type="checkbox"> 홈 추천 글로 표시</label><p class="form-message full-field" data-save-message hidden></p><div class="form-actions full-field"><button class="primary-button" type="submit">저장</button></div>
          </form></section>
          <aside class="post-manager"><div class="panel-heading"><div><span class="kicker">Library</span><h2>게시글 관리</h2></div></div><div class="admin-post-list" data-admin-post-list><p>게시글을 불러오는 중입니다.</p></div></aside>
        </div>
      </section>
    </div>`,
  });
}

const pages = {
  about: {
    eyebrow: "About harugyeol", title: "생활의 결을 가볍게", description: "하루결이 어떤 생활 정보를 만들고 어떻게 운영되는지 소개합니다.", intro: "하루결은 작은 집에서도 무리 없이 반복할 수 있는 정리와 살림 방법을 기록하는 독립 생활 정보 사이트입니다.",
    sections: [
      ["우리가 다루는 것", "정리, 청소, 주방 동선, 생활 루틴, 살림 도구를 중심으로 다룹니다. 유행하는 제품을 빠르게 소개하기보다 왜 불편한지 관찰하고, 별도의 구매 없이 먼저 시험할 수 있는 순서를 제안합니다."],
      ["글을 만드는 방식", "한 글에는 독자가 바로 적용할 수 있는 구체적인 단계, 필요한 시간, 주의할 점을 담습니다. 정보가 바뀌거나 더 나은 방법이 확인되면 수정 날짜와 이유를 표시합니다. 광고나 협찬이 포함될 경우 글 첫머리에 독자가 알아보기 쉬운 방식으로 공개합니다."],
      ["운영 정보", "사이트명은 하루결이며 하루결 편집부가 한국어로 정리·청소·주방·생활 루틴 정보를 발행합니다."],
    ],
  },
  "editorial-policy": {
    eyebrow: "Editorial policy", title: "하루결의 편집 원칙", description: "하루결 콘텐츠의 작성, 검토, 수정, 광고 공개 원칙을 안내합니다.", intro: "읽는 사람의 시간과 신뢰를 가장 중요한 기준으로 삼습니다. 아래 원칙은 모든 공개 글에 적용됩니다.",
    sections: [
      ["1. 구체성과 실용성", "제목만 바꾼 일반적인 조언보다 실제 생활에서 따라 할 수 있는 순서와 판단 기준을 제공합니다. 필요 이상의 분량을 늘리지 않고, 독자가 어떤 상황에서 적용할 수 있는지 분명히 씁니다."],
      ["2. 정확성과 검토", "안전, 제품 사용법, 보관 기간처럼 확인이 필요한 내용은 제조사와 공공기관 등 신뢰할 수 있는 출처를 우선 확인합니다. 확실하지 않은 내용을 단정하지 않으며 개인의 생활 조건에 따라 달라질 수 있는 부분은 그 한계를 밝힙니다."],
      ["3. 독창적인 관점", "다른 글을 짜깁기하거나 표현만 바꿔 재생산하지 않습니다. 하루결만의 분류 방식, 체크리스트, 적용 순서를 만들어 독자가 이 사이트를 다시 찾을 이유를 제공합니다."],
      ["4. 수정과 업데이트", "오류가 확인되면 가능한 한 빠르게 고치고 의미 있는 변경에는 수정 날짜를 표시합니다. 독자의 정정 요청은 근거를 검토한 뒤 반영 여부를 결정합니다."],
      ["5. 광고와 이해관계", "광고는 편집 판단에 영향을 주지 않습니다. 협찬, 제휴 링크, 제품 제공이 있는 글은 콘텐츠 시작 부분에 명확히 표시합니다. 대가를 받은 긍정적 평가를 독립적인 추천처럼 표현하지 않습니다."],
      ["6. 자동화 도구의 사용", "초안 구성이나 맞춤법 확인에 자동화 도구를 활용할 수 있지만 최종 발행 전 편집 기준과 사실관계를 사람이 검토합니다. 확인되지 않은 경험이나 출처를 만들어내지 않습니다."],
    ],
    date: "제정일: 2026년 8월 13일 · 다음 검토 예정일: 2026년 11월",
  },
  privacy: {
    eyebrow: "Privacy", title: "개인정보처리방침", description: "하루결의 개인정보 수집, 이용, 보관 및 쿠키 정책을 안내합니다.", intro: "하루결은 필요한 범위에서만 정보를 처리하며, 처리 목적과 방식을 알기 쉽게 공개합니다.",
    sections: [
      ["1. 수집하는 정보", "공개 글을 읽을 때 하루결이 직접 이름이나 연락처를 요구하지 않습니다. 호스팅 운영 과정에서 접속 시각, 브라우저 종류, IP 주소와 같은 기술 정보가 보안 및 오류 분석 목적으로 처리될 수 있습니다."],
      ["2. 이용 목적과 보관", "수집된 정보는 서비스 안정성 확보, 부정 이용 방지, 이용 흐름 개선에만 사용합니다. 목적을 달성했거나 법적 보관 의무가 끝나면 복구하기 어려운 방법으로 삭제합니다."],
      ["3. 데이터 처리 서비스", "웹사이트 제공을 위해 GitHub Pages를 사용하며, 서비스 제공자가 보안과 운영에 필요한 기술 정보를 처리할 수 있습니다."],
      ["4. 쿠키와 광고", "향후 Google AdSense를 포함한 제3자 광고 서비스가 사용될 수 있습니다. 이 경우 Google과 제3자가 광고 제공 및 측정을 위해 쿠키와 웹 비콘, IP 주소 등의 식별자를 사용할 수 있습니다. 광고가 활성화되기 전 필요한 동의 관리와 거부 방법을 이 페이지에 추가 안내합니다."],
      ["5. 이용자의 선택", "브라우저 설정에서 쿠키를 삭제하거나 차단할 수 있습니다. 다만 일부 기능이 정상적으로 작동하지 않을 수 있습니다."],
      ["6. 방침 변경", "법령이나 서비스 변경으로 내용이 달라지면 시행 전에 이 페이지에서 알립니다. 중요한 변경은 눈에 띄는 방식으로 별도 안내합니다."],
    ],
    date: "시행일: 2026년 8월 13일",
  },
  terms: {
    eyebrow: "Terms", title: "이용약관", description: "하루결 사이트와 콘텐츠 이용 조건을 안내합니다.", intro: "하루결을 이용하면 아래 조건에 동의한 것으로 봅니다. 내용을 확인한 뒤 이용해주세요.",
    sections: [
      ["콘텐츠의 성격", "하루결의 글은 일반적인 생활 정보이며 각 가정의 환경과 제품에 따라 결과가 달라질 수 있습니다. 안전과 관련된 작업은 제품 설명서와 전문 기관의 안내를 우선 확인해야 합니다."],
      ["저작권", "별도 표시가 없는 글, 편집 구성, 그래픽의 권리는 하루결에 있습니다. 개인적인 참고와 비상업적 인용은 출처와 링크를 함께 표시하는 범위에서 가능하지만 글 전체를 복제하거나 자동 수집해 재게시할 수 없습니다."],
      ["외부 링크와 광고", "외부 사이트의 내용과 운영은 해당 제공자가 책임집니다. 광고와 제휴가 있는 경우 관련 표시를 제공하며 광고주의 주장이나 외부 서비스의 이용 결과를 하루결이 보증하지 않습니다."],
      ["서비스 변경", "콘텐츠 품질과 보안을 위해 일부 기능을 변경하거나 중단할 수 있습니다. 중요한 변경이 있을 때에는 사이트에서 합리적인 기간 전에 안내합니다."],
    ],
    date: "시행일: 2026년 8월 13일",
  },
};

function infoPage(slug, page) {
  return document({
    title: page.title,
    description: page.description,
    path: `/${slug}/`,
    content: `<div class="page-shell info-page"><header class="info-header"><span class="kicker">${escapeHtml(page.eyebrow)}</span><h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.intro)}</p></header><div class="info-content">${page.sections.map(([heading, body]) => `<section><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(body)}</p></section>`).join("")}${page.date ? `<p class="policy-date">${escapeHtml(page.date)}</p>` : ""}</div></div>`,
  });
}

await output("index.html", home());
await output("articles/index.html", articles());
await output("article/index.html", dynamicArticle());
await output("admin/index.html", adminPage());
for (const post of seedPosts) await output(`articles/${post.slug}/index.html`, article(post));
for (const [slug, page] of Object.entries(pages)) await output(`${slug}/index.html`, infoPage(slug, page));
await output("404.html", document({ title: "페이지를 찾을 수 없습니다", description: "요청하신 페이지가 없습니다.", path: "/404.html", noindex: true, content: `<div class="not-found"><span>404</span><h1>페이지를 찾을 수 없습니다.</h1><p>주소가 바뀌었거나 삭제된 페이지입니다.</p><a class="primary-button" href="/">홈으로 돌아가기</a></div>` }));
await output("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
await output("ads.txt", `google.com, pub-1146138210876381, DIRECT, f08c47fec0942fa0\n`);
await output("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${["/", "/articles/", "/about/", "/editorial-policy/", "/privacy/", "/terms/", ...seedPosts.map((post) => `/articles/${post.slug}/`)].map((path) => `<url><loc>${ORIGIN}${path}</loc></url>`).join("")}</urlset>\n`);
await output(".nojekyll", "");
await mkdir(new URL("assets/", OUT), { recursive: true });
await Promise.all([
  copyFile(new URL("assets/styles.css", import.meta.url), new URL("assets/styles.css", OUT)),
  copyFile(new URL("assets/site.js", import.meta.url), new URL("assets/site.js", OUT)),
  copyFile(new URL("assets/og.png", import.meta.url), new URL("assets/og.png", OUT)),
]);

console.log(`Generated ${seedPosts.length + 9} pages in docs/`);
