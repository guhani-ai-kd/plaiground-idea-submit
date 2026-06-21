# Kwangdong PLAIground — 과제 아이디어 제출 (Google Sheet + GitHub Pages)

DAY1 ‘팀별 주제·컨셉 공유’ 시간에 각 팀이 **① 풀고 싶은 문제**와 **② 해결 방법(아이디어)** 을 정리해 제출하는 사이트입니다. (최종 결과물이 아니라 아이디어 단계)

서버 없이 동작합니다.

- **정적 사이트(폼·소개 페이지)** → GitHub Pages 가 호스팅 (Git)
- **제출 데이터** → Google Apps Script 가 받아 **Google 스프레드시트**에 적재
- 스프레드시트가 곧 취합본 → 정렬·필터·CSV 다운로드 전부 시트에서 그대로

```
[참가 팀] ── 제출 ──▶ index.html (GitHub Pages)
                         │  fetch POST
                         ▼
              Apps Script 웹앱(/exec)
                         │  행 추가/수정(팀명 upsert)
                         ▼
                 Google 스프레드시트  ◀── 운영진이 직접 보고 CSV 받음
                         ▲
                         │  fetch GET (목록)
              showcase.html ── 미참가 임직원·디스플레이용 소개 (30초 자동 갱신)
```

## 파일 구성

```
plaiground-gsheet/
├── index.html        제출 폼 (팀용)
├── showcase.html     과제 소개 (전 임직원·디스플레이용)
├── config.js         ⚠️ 웹앱 URL 한 줄만 입력
└── apps-script/
    └── Code.gs        스프레드시트에 붙여넣는 백엔드 코드
```

---

## 설치 (약 10분, 한 번만)

### 1) 스프레드시트 + Apps Script 배포

1. Google 드라이브에서 **새 스프레드시트** 생성 (이름: 예 `PLAIground 과제취합`)
2. 상단 메뉴 **확장 프로그램 → Apps Script**
3. 기본 코드를 지우고 `apps-script/Code.gs` 내용을 **전체 붙여넣기** → 저장(💾)
4. 우측 상단 **배포 → 새 배포**
5. 톱니바퀴(유형 선택) → **웹 앱**
6. 설정:
   - 설명: 아무거나 (예: `plaiground v1`)
   - **실행: 나(your account)**
   - **액세스 권한: 모든 사용자**  ← 사내 누구나 제출하려면 필수
7. **배포** → 권한 승인(본인 계정) → **웹 앱 URL** 복사
   (형태: `https://script.google.com/macros/s/AKfycb..../exec`)

> 코드를 수정하면 매번 **배포 → 배포 관리 → 편집(연필) → 버전: 새 버전 → 배포** 를 해야 반영됩니다.

### 2) 사이트에 URL 연결

`config.js` 를 열어 복사한 URL 을 붙여넣습니다.

```js
window.PLAI_CONFIG = {
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycb..../exec"
};
```

### 3) GitHub Pages 배포

```bash
cd plaiground-gsheet
git init && git add . && git commit -m "PLAIground 과제 제출 사이트"
git branch -M main
git remote add origin https://github.com/<계정>/plaiground-submit.git
git push -u origin main
```

GitHub 저장소 → **Settings → Pages** → Source: `main` 브랜치 `/ (root)` → 저장.
잠시 후 발급되는 주소가 사이트 URL 입니다.

- 제출 폼: `https://<계정>.github.io/plaiground-submit/`
- 과제 소개: `https://<계정>.github.io/plaiground-submit/showcase.html`

---

## 사용

- **팀**: 제출 폼 URL 접속 → 작성 → 제출. 같은 팀명으로 다시 내면 **수정**됩니다.
- **운영진**: 스프레드시트를 열면 실시간 취합본. 정렬/필터 자유롭게, `파일 → 다운로드 → CSV` 로 내보내기.
- **디스플레이/공지**: `showcase.html` 을 띄워두면 제출이 들어올 때마다 자동으로 채워집니다.

---

## 동작 원리 / 주의

- 폼은 `fetch` POST 시 **Content-Type 헤더를 일부러 지정하지 않습니다.** 이러면 단순요청(text/plain)으로 전송되어 Apps Script 에서 흔히 막히는 **CORS preflight 를 회피**합니다. (Apps Script 가 본문을 JSON 으로 파싱)
- 동시 제출은 Apps Script 의 `LockService` 로 충돌을 막습니다.
- 시트의 **팀명(2번째 열)** 이 식별자입니다. 운영 중 팀명 열을 임의로 바꾸면 수정 매칭이 어긋날 수 있습니다.
- 보안: "모든 사용자" 배포라 URL 을 아는 사람은 제출 가능합니다. 사내 행사용으로는 충분하지만, 더 강하게 막으려면 폼에 공용 제출 코드(비밀번호) 필드를 추가해 Apps Script 에서 검증하도록 확장하세요.

## 더 확장한다면 (Claude Code)

- 제출 시 Slack Webhook 알림
- 제출 마감 시간 후 잠금
- 발표 순서·평가 점수 시트/집계 추가
