(() => {
  /** Solved.ac DOM → { title, level, tags } */
  function scrapeSolved() {
    const titleEl =
      document.querySelector("h2.problem-title") ||
      document.querySelector("title");
    const title = titleEl ? titleEl.textContent.trim() : "Unknown";

    const tierImg = document.querySelector("img.solvedac-tier") ||
                    document.querySelector('img[src*="/tier/"]');
    const level = tierImg
      ? Number((tierImg.getAttribute("src") || "").match(/tier\/(\d+)\.svg$/)?.[1] || 0)
      : 0;

    const tags = [
      ...document.querySelectorAll("a.badge, span.badge")
    ].map(a => a.textContent.trim());

    return { title, level, tags };
  }

  chrome.runtime.onMessage.addListener((msg, _, res) => {
    if (msg.action === "scrapeSolved") res(scrapeSolved());
  });
})();