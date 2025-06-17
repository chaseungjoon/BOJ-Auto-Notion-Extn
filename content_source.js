/* content_source.js ── https://www.acmicpc.net/source/<id> 전용 */

(() => {
  const nb = "\u00A0";

  /* 코드 추출 (textarea → pre → CodeMirror) */
  function getCode() {
    const ta = document.querySelector(
      "textarea.form-control.no-mathjax.codemirror-textarea",
    );
    if (ta?.value?.trim()) return ta.value;
    if (ta?.textContent?.trim()) return ta.textContent;

    const pre = document.querySelector("pre#submission-code");
    if (pre?.innerText?.trim()) return pre.innerText;

    const cm = document.querySelector(".CodeMirror-code");
    return cm?.innerText?.trim() ?? "";
  }

  /* 문제 번호 (main.py 방식: h1.pull-left 내부의 /problem/ 링크) */
  function getProblemNumber() {
    /* 1) 소스 페이지 <h1 class="pull-left"> 내부의 /problem/ 링크 */
    const h1Link = document.querySelector('h1.pull-left a[href*="/problem/"]');
    if (h1Link) {
      const num = h1Link.getAttribute("href").split("/").pop();
      if (/^\d+$/.test(num)) return num; // 정수만 OK
    }

    /* 2) 페이지 어디든 /problem/숫자 패턴 */
    const anyLink = document.querySelector('a[href^="/problem/"]');
    if (anyLink) {
      const num = anyLink.getAttribute("href").split("/").pop();
      if (/^\d+$/.test(num)) return num;
    }

    /* 3) 실패 시 빈 문자열 대신 null 반환 */
    return null;
  }

  /* 언어 추출 */
  function getLanguage() {
    const h2 = document.querySelector("div.headline h2");
    if (h2) return h2.textContent.trim();
    const badge = document.querySelector("span.label");
    return badge ? badge.textContent.trim() : "Unknown";
  }

  /* 메모리/시간/코드길이 (KB/ms/B) */
  function getExtra() {
    const td = [...document.querySelectorAll("td.text-center")].slice(1, 4);
    const def = ["?KB", "?ms", "?B"];
    return td.map((x, i) =>
      x ? x.textContent.trim() + ["KB", "ms", "B"][i] : def[i],
    );
  }

  chrome.runtime.onMessage.addListener((msg, _, res) => {
    if (msg.action === "scrapeSource") {
      res({
        problem: getProblemNumber(),
        language: getLanguage(),
        code: getCode(),
        extra: getExtra(),
      });
    }
  });
})();
