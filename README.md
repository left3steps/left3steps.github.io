# 하루결 GitHub Pages

`https://left3steps.github.io`에 게시되는 하루결의 정적 공개 사이트입니다.

## 생활세금 전환 (2026-10-05)

홈과 새 글 발행은 생활세금 중심입니다. 연말정산, 소비·증빙, 주거세금, 신고기초의 네 주제를 다루며, 기존 생활 글과 주소는 `/living/` 아카이브로 유지합니다. 주제별 입구는 `/tax/`, 전체 글은 `/articles/`입니다.

생활세금 글의 첫 본문 섹션에 `review` 객체를 저장합니다. 필수 항목은 `topic`, `tax_year`, `checked_at`, `scope`, `sources`(공식 자료 제목·HTTPS URL), `cautions`(주요 예외 2~6개)입니다. 관리자에는 별도의 검토 정보 JSON 입력란이 있습니다. 브라우저 편집기와 서명 발행 함수가 같은 검증 모듈을 사용하며, 생성된 정적 본문과 실시간 본문 모두 적용 범위·공식 출처·확인일을 표시합니다.

`assets/tax-review.mjs`를 변경하면 `supabase/functions/harugyeol-publish/tax-review.mjs`도 동일하게 갱신하고 함수를 배포합니다. `test.mjs`가 세 복사본의 일치, 잘못된 날짜·비공식 출처 차단, 기존 기사 및 사이트맵 보존을 검사합니다. 도메인 허용 검증은 자료의 실제 내용 확인이나 세무 전문가 검수를 대신하지 않습니다.

`data/tax-topics.mjs`의 첫 10개 주제는 편집 후보일 뿐입니다. 발행할 때마다 공식 자료를 실제로 열어 적용 연도·대상·예외를 확인합니다. 개정안과 시행 중인 제도를 구분하고, 근거가 불확실하면 발행하지 않습니다. 개인별 환급 보장, 신고 대행, 투자 추천은 제공하지 않습니다.

## 생성과 검증

```bash
npm run build
npm test
```

완성된 공개 파일은 `docs/`에 생성됩니다. GitHub Pages는 `main` 브랜치의 `/docs` 폴더를 게시 소스로 사용합니다.

## 편집 스튜디오

- 관리자 주소: `https://left3steps.github.io/admin/`
- 게시글 저장소: Supabase의 `public.harugyeol_posts`
- 공개 글은 빌드할 때 Supabase의 발행 상태를 읽어 각각 `/articles/{slug}/` 정적 페이지로 생성합니다.
- 제목, 본문, canonical, Article 구조화 데이터와 사이트맵이 같은 빌드에서 동기화됩니다.
- GitHub Actions가 매시간 새 공개 글을 정적 페이지로 반영합니다.
- 브라우저에는 공개용 publishable key만 포함하며, 쓰기는 RLS와 `app_metadata.harugyeol_role = admin`으로 제한합니다.

Google AdSense 게시자 `pub-1146138210876381`의 사이트 확인 메타 태그, 로더 스크립트, `ads.txt`를 포함합니다.

## 무인 발행 경로

- `harugyeol-publish` Edge Function이 자동화 전용 요청만 검증해 게시글을 발행합니다.
- 발행 개인키는 로컬 자격증명 폴더에만 저장하고, Supabase에는 공개키만 보관합니다.
- 함수가 제목·slug·카테고리·본문 4개 섹션·체크리스트·읽기 시간을 검증하고 `published` 상태를 강제합니다.
- 로컬 호출은 `node scripts/publish-post.mjs --file .automation/pending-post.json`을 사용합니다.
