export const TAX_CATEGORY = "생활세금";
export const TAX_TOPICS = ["연말정산", "소비·증빙", "주거세금", "신고기초"];
const SOURCE_HOSTS = ["nts.go.kr", "hometax.go.kr", "moef.go.kr", "moi.go.kr", "wetax.go.kr", "law.go.kr"];
const escape = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

export function koreaToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function taxReviewFor(post) {
  return post?.sections?.find((section) => section.review)?.review || null;
}

export function officialSourceUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && SOURCE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch { return false; }
}

export function validateTaxReview(review, today = koreaToday()) {
  if (!review || typeof review !== "object" || Array.isArray(review)) return ["세금 글에는 적용 범위와 공식 출처 review가 필요합니다."];
  const errors = [];
  if (!TAX_TOPICS.includes(review.topic)) errors.push("세금 주제는 연말정산, 소비·증빙, 주거세금, 신고기초 중 하나여야 합니다.");
  const checked = typeof review.checked_at === "string" ? review.checked_at : "";
  const date = new Date(`${checked}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checked) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== checked || checked > today) errors.push("자료 확인일은 실제 YYYY-MM-DD 날짜이며 미래일 수 없습니다.");
  if (typeof review.tax_year !== "string" || review.tax_year.trim().length < 4 || review.tax_year.length > 160) errors.push("귀속·적용 연도 또는 특정 연도 수치를 다루지 않는 범위를 적어주세요.");
  if (typeof review.scope !== "string" || review.scope.trim().length < 20 || review.scope.length > 500) errors.push("대상 독자와 제외 범위를 구체적으로 적어주세요.");
  if (!Array.isArray(review.sources) || review.sources.length < 1 || review.sources.length > 6 || review.sources.some((source) => !source || typeof source.title !== "string" || source.title.trim().length < 4 || !officialSourceUrl(source.url))) errors.push("제목과 허용된 정부기관 HTTPS URL이 있는 공식 출처 1~6개가 필요합니다.");
  if (!Array.isArray(review.cautions) || review.cautions.length < 2 || review.cautions.length > 6 || review.cautions.some((item) => typeof item !== "string" || item.trim().length < 8)) errors.push("예외와 확인할 사항을 2~6개 적어주세요.");
  return errors;
}

export function taxReviewMarkup(post) {
  if (post.category !== TAX_CATEGORY) return "";
  const review = taxReviewFor(post);
  if (validateTaxReview(review).length) return '<section class="tax-verification"><h2>자료 확인이 필요합니다</h2><p>이 글의 적용 범위나 출처 정보가 완전하지 않습니다. 개인의 신고 판단에 사용하지 말고 공식 기관에 확인해주세요.</p></section>';
  return `<section class="tax-verification" aria-label="적용 범위와 공식 근거"><span class="kicker">Source first</span><h2>적용 범위와 공식 근거</h2><dl><div><dt>주제</dt><dd>${escape(review.topic)}</dd></div><div><dt>귀속·적용 범위</dt><dd>${escape(review.tax_year)}</dd></div><div><dt>자료 확인일</dt><dd><time datetime="${escape(review.checked_at)}">${escape(review.checked_at)}</time></dd></div></dl><p>${escape(review.scope)}</p><h3>직접 확인한 공식 자료</h3><ul>${review.sources.map((source) => `<li><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)} ↗</a></li>`).join("")}</ul><h3>적용 전 확인할 사항</h3><ul>${review.cautions.map((item) => `<li>${escape(item)}</li>`).join("")}</ul><p class="tax-disclaimer">일반적인 세금 정보이며 개인별 세무·법률 자문이 아닙니다. 세무 전문가의 개별 검수를 받았다는 의미가 아닙니다. 신고·계약·거래 전 해당 연도의 공식 안내와 본인 요건을 확인하고, 불확실한 부분은 세무 전문가나 관할 기관에 문의하세요.</p></section>`;
}
