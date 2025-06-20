const nbsp = "\u00A0";
const log = (txt) => chrome.runtime.sendMessage({ type: "log", text: txt });
const done = () => chrome.runtime.sendMessage({ type: "done" });
const waitTab = (id) =>
  new Promise((r) => {
    chrome.tabs.onUpdated.addListener(function l(tid, info) {
      if (tid === id && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(l);
        r();
      }
    });
  });

const notionLang = {
  C: "c",
  C89: "c",
  C90: "c",
  C99: "c",
  C11: "c",
  C17: "c",
  "C99 (Clang)": "c",
  "C11 (Clang)": "c",
  "C90 (Clang)": "c",
  "C2x (Clang)": "c",

  "C++": "c++",
  "C++11": "c++",
  "C++14": "c++",
  "C++17": "c++",
  "C++20": "c++",
  "C++23": "c++",
  "C++26": "c++",
  "C++11 (Clang)": "c++",
  "C++14 (Clang)": "c++",
  "C++17 (Clang)": "c++",
  "C++20 (Clang)": "c++",

  Python: "python",
  "Python 3": "python",
  PyPy3: "python",
  Java: "java",
  "Java 11": "java",
  "Java 17": "java",
  "Java 8": "java",
  "Java 8 (OpenJDK)": "java",
  "Java 15": "java",
  "Kotlin (JVM)": "kotlin",
  Javascript: "javascript",
  "node.js": "javascript",
  TypeScript: "typescript",
  Go: "go",
  Swift: "swift",
  Rust: "rust",
  "Rust 2015": "rust",
  "Rust 2018": "rust",
  "Rust 2021": "rust",
  Bash: "bash",
  Fortran: "fortran",
  Ruby: "ruby",
  PHP: "php",
  Perl: "perl",
  Pascal: "pascal",
  Lua: "lua",
  Haskell: "haskell",
  R: "r",
  "Assembly (64bit)": "assembly",
  "Assembly (32bit)": "assembly",
  Text: "plain text",
};
const toNotionLang = (s) => notionLang[s.trim()] ?? "Plain Text";

chrome.runtime.onMessage.addListener((m) => {
  if (m.action === "processURL") void runFlow(m.url);
});

async function runFlow(url) {
  log("1️⃣ 소스 페이지 로딩…");
  const srcTab = await chrome.tabs.create({ url, active: false });
  await waitTab(srcTab.id);
  const src = await chrome.tabs.sendMessage(srcTab.id, {
    action: "scrapeSource",
  });
  await chrome.tabs.remove(srcTab.id);

  if (!src?.code) {
    log("❌ 코드 추출 실패");
    return done();
  }
  log("2️⃣ 코드/언어/메모리 추출 완료");
  if (!src.problem) {
    log("❌ 문제 번호 추출 실패");
    return done();
  }

  const info = await fetchSolvedInfo(src.problem);
  if (!info) {
    log("❌ Solved.ac 정보 최종 실패");
    return done();
  }

  const keys = await chrome.storage.local.get(null);
  await uploadToNotion(src, info, keys);
}

async function fetchSolvedInfo(pid) {
  const apiRaw = `https://solved.ac/api/v3/problem/show?problemId=${pid}`;
  let info = null;

  for (let t = 1; t <= 3 && !info; t++) {
    const url = `https://api.allorigins.win/raw?nocache=${Date.now()}&url=${encodeURIComponent(apiRaw)}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        log(`⚠️ API 시도${t}: HTTP ${res.status}`);
        continue;
      }
      const j = await res.json();
      info = {
        title: j.titleKo,
        level: j.level,
        tags: j.tags.map((v) => v.displayNames[0].name),
      };
      log(`3️⃣ Solved.ac 메타 획득 (시도 ${t})`);
    } catch {
      log(`⚠️ API 시도${t}: 네트워크 예외`);
    }
  }

  if (!info) {
    log("⚠️ 프록시 실패 → HTML 파싱 시도");
    const tab = await chrome.tabs.create({
      url: `https://solved.ac/problem/${pid}`,
      active: false,
    });
    await waitTab(tab.id);
    info = await chrome.tabs.sendMessage(tab.id, { action: "scrapeSolved" });
    await chrome.tabs.remove(tab.id);
    if (info?.title) log("3️⃣ HTML 파싱으로 메타 획득");
  }
  return info;
}

async function uploadToNotion(src, info, keys) {
  if (!keys.notionToken) {
    log("❌ Notion 토큰 없음");
    return done();
  }

  let comment = "";
  if (keys.openaiOn && keys.openaiKey) {
    log("4️⃣ GPT-4o-mini 주석 생성…");
    try {
      const j = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${keys.openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          messages: [
            {
              role: "user",
              content: `다음 코드의 작동 원리를 간결하게 한글로 설명해라 (말투는 '~이다')\n\n\`\`\`\n${src.code}\n\`\`\``,
            },
          ],
        }),
      }).then((r) => r.json());
      comment = j.choices?.[0]?.message?.content ?? "";
    } catch (e) {
      log(`⚠️ GPT 실패 (${e.message})`);
    }
  }

  const quote = [
    `Memory${nbsp}${src.extra[0]}`,
    `Time${nbsp}${src.extra[1]}`,
    `Code${nbsp}Len${nbsp}${src.extra[2]}`,
  ].join(nbsp.repeat(4));

  const blocks = [
    paragraph("문제 링크", `https://www.acmicpc.net/problem/${src.problem}`),
    callout("💡", info.tags.join("/")),
    quoteBlock(quote),
    codeBlock(src.code, toNotionLang(src.language)),
  ];
  if (comment) blocks.push(paragraph(comment));

  const body = {
    parent: parentObj(keys.notionParent),
    icon: {
      type: "external",
      external: {
        url: `https://d2gd6pc034wcta.cloudfront.net/tier/${info.level}.svg`,
      },
    },
    properties: { title: { title: [text(`${src.problem} - ${info.title}`)] } },
    children: blocks,
  };

  log("5️⃣ Notion 업로드…");
  try {
    const r = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${keys.notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(await r.text());
  } catch (e) {
    log(`❌ 업로드 실패: ${e.message.slice(0, 120)}`);
  }
  done();
}

const text = (c) => ({ type: "text", text: { content: c } });
const paragraph = (c, url) => ({
  object: "block",
  type: "paragraph",
  paragraph: {
    rich_text: [
      url ? { type: "text", text: { content: c, link: { url } } } : text(c),
    ],
  },
});
const callout = (emoji, c) => ({
  object: "block",
  type: "callout",
  callout: {
    icon: { type: "emoji", emoji },
    rich_text: [text(c)],
    color: "gray_background",
  },
});
const quoteBlock = (c) => ({
  object: "block",
  type: "quote",
  quote: { rich_text: [text(c)] },
});
const codeBlock = (code, lang) => ({
  object: "block",
  type: "code",
  code: { language: lang, rich_text: [text(code)] },
});
const parentObj = (id) =>
  id.replace(/-/g, "").length === 32 ? { page_id: id } : { database_id: id };
