chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
  if(msg.action!=="getMeta") return;

  const probNum = document.querySelector("a.problem_title")?.textContent
                 || document.querySelector("#problem_title")?.textContent
                 || "Baekjoon";

  const lang    = document.querySelector("table tbody tr td:nth-child(6)")?.textContent
                 || "Unknown";

  sendResponse({problem: probNum.trim(), language: lang.trim()});
});