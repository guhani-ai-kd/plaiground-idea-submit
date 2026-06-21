/**
 * Kwangdong PLAIground — 과제 제출 백엔드 (Google Apps Script)
 *
 * 역할: 정적 폼(GitHub Pages)에서 보낸 제출을 받아 이 스프레드시트에 적재하고,
 *       소개 페이지가 읽을 수 있도록 JSON으로 돌려줍니다.
 *
 * 설치: 스프레드시트 → 확장 프로그램 → Apps Script → 이 코드 붙여넣기 →
 *       배포 → 새 배포 → 유형 "웹 앱" → 실행: 나, 액세스: 모든 사용자 → 배포 → URL 복사
 *       (복사한 /exec URL 을 웹사이트의 config.js 에 넣으세요)
 */

const SHEET_NAME = "submissions";
// 시트 컬럼 순서 = 폼 필드 키 (과제 "아이디어" 제출: 문제 + 해결방법 중심)
const HEADERS = ["timestamp", "team", "org", "leader", "members", "title", "topic", "problem", "approach", "tools", "output"];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(["제출/수정시각", "팀명", "소속", "대표자", "팀원", "과제주제", "한줄소개", "해결하고싶은문제", "해결방법(접근)", "사용AI도구", "기대결과물"]);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ----- 제출/수정 (팀명 기준 upsert) -----
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const team = String(data.team || "").trim();
    if (!team) return json_({ ok: false, error: "팀명은 필수입니다." });
    if (!String(data.title || "").trim()) return json_({ ok: false, error: "과제 주제는 필수입니다." });

    const sh = getSheet_();
    const lock = LockService.getScriptLock();
    lock.waitLock(10000); // 동시 제출 충돌 방지
    try {
      const values = sh.getDataRange().getValues();
      let rowIndex = -1; // 1-based 시트 행
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][1]).trim().toLowerCase() === team.toLowerCase()) { rowIndex = i + 1; break; }
      }
      const row = HEADERS.map(h => h === "timestamp"
        ? Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm")
        : String(data[h] || "").slice(0, 600));
      if (rowIndex > 0) sh.getRange(rowIndex, 1, 1, HEADERS.length).setValues([row]);
      else sh.appendRow(row);
      const count = sh.getLastRow() - 1;
      return json_({ ok: true, updated: rowIndex > 0, count: count });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// ----- 목록 조회 (소개 페이지용) -----
function doGet(e) {
  const sh = getSheet_();
  const values = sh.getDataRange().getValues();
  const rows = values.slice(1).map(r => {
    const o = {};
    HEADERS.forEach((h, i) => { o[h] = r[i]; });
    return o;
  });
  return json_(rows);
}
