---
description: 다른 레포의 완성된 빌드 결과물을 html-proto로 다시 복사해서 최신화
argument-hint: "[todak-routine|gut-diary|novel-assistant] (생략 시 전체 동기화)"
---

이 레포(`kkanbi/html-proto`)는 유일한 public 저장소이고, 다른 프로젝트 레포는 전부 private입니다.
여기 담긴 하위 폴더들은 각 원본 레포의 "완성 시점 정적 스냅샷"입니다 — 실시간 동기화가 아니라,
사람이 필요할 때 이 커맨드로 다시 복사해서 최신화하는 방식입니다.

인자로 특정 프로젝트 이름이 오면 그 프로젝트만, 없으면 아래 전체를 순서대로 동기화하세요.

## 공통 규칙

- 원본 레포가 이번 세션에 아직 추가되지 않았다면 `add_repo`로 추가하고 지시된 대로 clone.
- 항상 `/workspace/<repo>`에 얕은 클론(depth 1)한 뒤 작업.
- 복사 후 새로 생긴/사라진 파일이 있으면 `index.html`의 카드 그리드와 `README.md`의 목록도 같이 갱신.
- 복사 대상 폴더에 하드코딩된 API 키/시크릿이 없는지 `grep -riE "sk-ant|AIza[0-9A-Za-z_-]{10,}|api[_-]?key\s*[:=]\s*['\"][A-Za-z0-9]{16,}"` 로 한 번 확인 (Novel Assistant처럼 사용자가 브라우저에서 직접 입력하는 구조는 안전하지만, 새로 추가되는 프로젝트는 반드시 확인).
- 작업은 이 레포의 지정된 브랜치에서만 커밋. `main`에 직접 커밋하지 말 것.
- 커밋 메시지 예: `sync: refresh <project> build snapshot`.
- 푸시 후, GitHub Pages는 `main` 브랜치 기준으로 배포되므로 PR 병합이 필요하다는 걸 사용자에게 안내.

## todak-routine (kkanbi/todak-routine, private, Vite+React PWA)

- 이 레포는 빌드 결과물을 `docs/` 폴더에 이미 커밋해서 관리합니다 (`vite.config.ts`의 `base: "./"`로 상대경로 빌드됨) — 별도 빌드 불필요, clone만 하면 됩니다.
- `docs/` 전체 내용을 `html-proto/todak-routine/`으로 복사 (덮어쓰기), `docs/.nojekyll`은 제외.

## gut-diary (kkanbi/gut-diary, private, Vite+React, base가 "/gut-diary/"로 절대경로)

- clone 후 `npm install`.
- **주의**: `vite.config.js`의 base가 절대경로(`/gut-diary/`)라서 그대로 빌드하면 html-proto 하위 경로에서 에셋이 깨집니다. 반드시 `npx vite build --base=./` 로 상대경로 빌드.
- `dist/` 전체 내용을 `html-proto/gut-diary/`로 복사 (덮어쓰기).

## novel-assistant (kkanbi/Novel_Assistant, private, 순수 정적 HTML/JS/CSS, 빌드 불필요)

- clone만 하면 됨. `index.html`, `styles.css`, `src/`만 복사 (덮어쓰기). `docs/`, `proxy_server.py`, `*.bat`, `cloudflare-worker-proxy.js`는 로컬 개발용이라 제외.

## 새 프로젝트를 추가하고 싶을 때

1. 해당 레포가 빌드 시스템이 있는지 확인 (`package.json` 유무).
   - 없으면(순수 HTML/JS/CSS): 그대로 복사.
   - 있으면(Vite 등): base를 상대경로로 맞춰서 빌드 후 산출물만 복사. base가 원래 절대경로였다면 반드시 오버라이드.
2. `html-proto/<project-slug>/` 폴더를 만들고 위 규칙대로 복사.
3. `index.html`의 `<section class="grid">`에 카드 하나 추가 (기존 카드 패턴 따라서), `README.md` 목록에도 한 줄 추가 (원본 레포 링크 + private 표시).
4. 이 파일(`html_proto.md`)의 프로젝트 섹션에도 새 항목을 추가해서 다음번에 재사용할 수 있게 기록.
