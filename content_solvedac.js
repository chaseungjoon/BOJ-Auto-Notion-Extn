/* content_solvedac.js ── runs in https://solved.ac/problem/<id> */

(() => {
  /** Solved.ac DOM → { title, level, tags } */
  function scrapeSolved() {
    /* 제목 : <h2 class="problem-title">A+B</h2> (2025 기준) */
    const titleEl =
      document.querySelector("h2.problem-title") ||
      document.querySelector("title");
    const title = titleEl ? titleEl.textContent.trim() : "Unknown";

    /* 티어 : <img class="solvedac-tier" src="/tier/17.svg"> */
    const tierImg = document.querySelector("img.solvedac-tier") ||
                    document.querySelector('img[src*="/tier/"]');
    const level = tierImg
      ? Number((tierImg.getAttribute("src") || "").match(/tier\/(\d+)\.svg$/)?.[1] || 0)
      : 0;

    /* 태그 : <a class="badge"> (여러 개) */
    const tags = [
      ...document.querySelectorAll("a.badge, span.badge")
    ].map(a => a.textContent.trim());

    return { title, level, tags };
  }

  chrome.runtime.onMessage.addListener((msg, _, res) => {
    if (msg.action === "scrapeSolved") res(scrapeSolved());
  });
})();