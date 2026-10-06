import { TAX_CATEGORY, taxReviewFor } from "./tax-review.mjs";

// Editorial entry points, not claims about measured keyword demand or popularity.
export const TAX_READER_QUESTIONS = [
  { topic: "주거세금", question: "월세 공제 서류는 무엇을 준비하나요?", slug: "rent-tax-credit-documents-contract-address-payment", description: "계약서·등본·지급 기록을 대조하는 순서를 확인합니다." },
  { topic: "연말정산", question: "소득공제와 세액공제는 무엇이 다를까요?", slug: "income-deduction-vs-tax-credit-year-end-settlement", description: "줄어드는 숫자와 환급액이 다른 이유를 구분합니다." },
  { topic: "소비·증빙", question: "결제 기록이 있으면 공제도 받을 수 있나요?", slug: "cash-receipts-card-slips-check-records-before-deduction", description: "영수증 확인과 공제 요건 판단을 나눠 살펴봅니다." },
];

export function readerQuestionsFor(posts) {
  return TAX_READER_QUESTIONS.flatMap((entry) => {
    const post = posts.find((item) => item.category === TAX_CATEGORY && item.slug === entry.slug);
    return post ? [{ ...entry, post }] : [];
  });
}

const STOPWORDS = new Set(["하는", "위한", "있습니다", "없습니다", "방법", "정리", "청소", "주방", "루틴", "살림", "도구", "생활", "가을", "여름", "겨울", "봄", "분", "가지"]);
const tokensFor = (post) => new Set(`${post.title} ${post.excerpt}`.toLowerCase().replace(/[^0-9a-z가-힣\s]/g, " ").split(/\s+/).filter((token) => token.length >= 2 && !STOPWORDS.has(token)));

export function selectRelatedPosts(post, posts) {
  const isTax = post.category === TAX_CATEGORY;
  const tokens = tokensFor(post);
  const topic = taxReviewFor(post)?.topic;
  const ranked = posts.filter((item) => item.slug !== post.slug && (item.category === TAX_CATEGORY) === isTax).map((item) => {
    const shared = [...tokensFor(item)].filter((token) => tokens.has(token)).length;
    const sameGroup = isTax ? Boolean(topic && taxReviewFor(item)?.topic === topic) : item.category === post.category;
    const similarLength = Math.abs(Number(item.readingMinutes || item.reading_minutes || 5) - Number(post.readingMinutes || post.reading_minutes || 5)) <= 1;
    return { item, sameGroup, score: (sameGroup ? 8 : 0) + shared * 3 + (similarLength ? 1 : 0) };
  }).sort((a, b) => b.score - a.score || new Date(b.item.publishedAt || b.item.published_at) - new Date(a.item.publishedAt || a.item.published_at));
  const sameGroup = ranked.filter((entry) => entry.sameGroup).slice(0, 2);
  if (!isTax) {
    const nextGroup = ranked.find((entry) => !entry.sameGroup);
    return [...sameGroup, ...(nextGroup ? [nextGroup] : [])].map(({ item }) => item);
  }
  const selected = [...sameGroup];
  const topics = new Set(selected.map(({ item }) => taxReviewFor(item)?.topic));
  if (topic) topics.add(topic);
  for (const entry of ranked) {
    const nextTopic = taxReviewFor(entry.item)?.topic;
    if (selected.length < 3 && nextTopic && !topics.has(nextTopic)) {
      selected.push(entry);
      topics.add(nextTopic);
    }
  }
  for (const entry of ranked) {
    if (selected.length < 3 && !selected.some(({ item }) => item.slug === entry.item.slug)) selected.push(entry);
  }
  return selected.map(({ item }) => item);
}
