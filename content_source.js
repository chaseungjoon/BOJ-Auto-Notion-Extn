(() => {
  const nb = "\u00A0";

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

  function getProblemNumber() {
    const h1Link = document.querySelector('h1.pull-left a[href*="/problem/"]');
    if (h1Link) {
      const num = h1Link.getAttribute("href").split("/").pop();
      if (/^\d+$/.test(num)) return num; // 정수만 OK
    }

    const anyLink = document.querySelector('a[href^="/problem/"]');
    if (anyLink) {
      const num = anyLink.getAttribute("href").split("/").pop();
      if (/^\d+$/.test(num)) return num;
    }

    return null;
  }

  function getLanguage() {
    const h2 = document.querySelector("div.headline h2");
    if (h2) return h2.textContent.trim();
    const badge = document.querySelector("span.label");
    return badge ? badge.textContent.trim() : "Unknown";
  }

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
