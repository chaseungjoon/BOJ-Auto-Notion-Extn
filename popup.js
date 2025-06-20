const $ = (id) => document.getElementById(id);
const addLog = (txt) => {
  const li = document.createElement("li");
  li.textContent = txt;
  $("log").append(li);
};

const EYE =
  '<svg viewBox="0 0 24 24"><path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg>';
const EYE_OFF =
  '<svg viewBox="0 0 24 24"><path d="m2 4.27 3 3A11.76 11.76 0 0 0 1 12c1.73 3.89 6 7 11 7a10.9 10.9 0 0 0 5-1.18l3.73 3.73 1.27-1.27L3.27 3ZM12 17c-3.31 0-6.5-2.06-8.47-5 1-1.55 2.31-2.78 3.9-3.57L9 10a3 3 0 0 0 4 4l1.57 1.57A8.95 8.95 0 0 1 12 17Zm0-10a8.95 8.95 0 0 1 7.47 4.04 15.71 15.71 0 0 1-2.45 2.66l1.46 1.46A12.36 12.36 0 0 0 23 12c-1.73-3.89-6-7-11-7a10.9 10.9 0 0 0-4.22.83l1.49 1.49A9.1 9.1 0 0 1 12 7Zm0 2a3 3 0 0 1 3 3 2.9 2.9 0 0 1-.34 1.37l1.46 1.46A4.95 4.95 0 0 0 17 12a5 5 0 0 0-5-5 4.95 4.95 0 0 0-2.83.83l1.46 1.46A2.9 2.9 0 0 1 12 9Z"/></svg>';

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(null, (cfg) =>
    cfg.notionToken && cfg.notionParent
      ? show("mainScreen")
      : show("setupScreen"),
  );

  $("saveSet").onclick = () => {
    const cfg = {
      openaiKey: $("openaiKey").value.trim(),
      notionToken: $("notionToken").value.trim(),
      notionParent: $("notionParent").value.trim(),
      openaiOn: !!$("openaiKey").value.trim(),
    };
    if (!cfg.notionToken || !cfg.notionParent) {
      $("setupMsg").textContent = "❗ Notion 토큰·Parent ID는 필수입니다.";
      return;
    }
    chrome.storage.local.set(cfg, () => show("mainScreen"));
  };

  $("importBtn").onclick = () => {
    const url = $("urlInput").value.trim();
    if (!/^https?:\/\/boj\.kr\/[0-9a-f]{32}$/i.test(url)) {
      addLog("❌ boj.kr URL 아님");
      return;
    }
    $("log").innerHTML = "";
    addLog("요청 시작…");
    chrome.runtime.sendMessage({ action: "processURL", url });
  };

  $("logoutBtn").onclick = () => {
    chrome.storage.local.clear(() => show("setupScreen"));
  };

  document.querySelectorAll(".eye-btn").forEach((btn) => {
    btn.innerHTML = EYE; // 초기 아이콘
    btn.onclick = () => {
      const inp = $(btn.dataset.target);
      const masked = inp.type === "password";
      inp.type = masked ? "text" : "password";
      btn.innerHTML = masked ? EYE_OFF : EYE;
    };
  });

  chrome.runtime.onMessage.addListener((m) => {
    if (m.type === "log") addLog(m.text);
    if (m.type === "done") addLog("✅ 완료");
  });
});

function show(id) {
  ["setupScreen", "mainScreen"].forEach((s) =>
    $(s).classList.toggle("hidden", s !== id),
  );
}
