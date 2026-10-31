/* =========================================================
   script.js — all the interactive parts of the page.
   Each section below is independent, so you can read them
   one at a time.
   ========================================================= */

// Small helper: grab one element by its CSS selector
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Does the visitor prefer less motion? We'll skip fancy animations if so.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/* ---------- 1. Dark / light mode toggle ---------- */
const root = document.documentElement;
const themeBtn = $("#themeBtn");

// Works out whether the page is currently dark
function isDark() {
  const forced = root.getAttribute("data-theme");
  if (forced) return forced === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function syncThemeIcon() {
  themeBtn.classList.toggle("is-dark", isDark());
}
// Remember the choice (wrapped in try/catch because storage can be blocked)
try {
  const saved = localStorage.getItem("theme");
  if (saved) root.setAttribute("data-theme", saved);
} catch (e) { /* storage not available: ignore */ }
syncThemeIcon();

themeBtn.addEventListener("click", () => {
  const next = isDark() ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try { localStorage.setItem("theme", next); } catch (e) {}
  syncThemeIcon();
});


/* ---------- 2. Scroll progress bar + active nav link ---------- */
const progressBar = $("#progressBar");
const navLinks = $$(".nav-links a");

function onScroll() {
  // How far down the page are we, from 0 to 1?
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? window.scrollY / max : 0;
  progressBar.style.width = (pct * 100) + "%";
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Highlight the nav link for the section currently on screen
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => {
      const on = a.getAttribute("href") === "#" + entry.target.id;
      a.classList.toggle("active", on);
      // Keep the active link visible in the scrollable nav on phones.
      // We scroll ONLY the nav bar sideways (never the page), so the
      // page never jumps while the visitor is scrolling.
      if (on) {
        const nav = a.parentElement;
        const left = a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2;
        nav.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
      }
    });
  });
}, { rootMargin: "-45% 0px -50% 0px" });
$$("main section[id]").forEach((s) => sectionObserver.observe(s));


/* ---------- 3. Scroll-reveal animations ---------- */
// Elements are always visible. When one scrolls into view for the
// first time, we add the "in" class, which plays a short entrance.
if (!reduceMotion) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  // Only animate things that start below the first screen
  $$(".reveal").forEach((el) => {
    if (el.getBoundingClientRect().top > window.innerHeight) revealObserver.observe(el);
  });
}


/* ---------- 4. Hero: typing code editor ---------- */
// Each line is a list of [cssClass, text] pieces so we can color them.
const codeLines = [
  [["tk-c", "<!-- index.html -->"]],
  [["tk-t", "<h1>"], ["", "Hello, Gordon College!"], ["tk-t", "</h1>"]],
  [["", ""]],
  [["tk-c", "/* style.css */"]],
  [["tk-t", "h1"], ["", " { "], ["tk-p", "color"], ["", ": "], ["tk-s", "tomato"], ["", "; }"]],
  [["", ""]],
  [["tk-c", "// script.js"]],
  [["tk-t", "h1"], ["", "."], ["tk-p", "textContent"], ["", " = "], ["tk-s", "\"Let's build!\""], ["", ";"]],
];
const typeTarget = $("#typeTarget");
const heroPreview = $("#heroPreview");

function renderAllCode() {
  typeTarget.innerHTML = "";
  codeLines.forEach((line) => {
    line.forEach(([cls, text]) => {
      const span = document.createElement("span");
      span.className = cls;
      span.textContent = text;
      typeTarget.appendChild(span);
    });
    typeTarget.appendChild(document.createTextNode("\n"));
  });
}

async function typeCode() {
  const caret = document.createElement("span");
  caret.className = "caret";
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  while (true) {
    typeTarget.innerHTML = "";
    typeTarget.appendChild(caret);
    heroPreview.textContent = "Hello, Gordon College!";

    for (let i = 0; i < codeLines.length; i++) {
      for (const [cls, text] of codeLines[i]) {
        const span = document.createElement("span");
        span.className = cls;
        typeTarget.insertBefore(span, caret);
        for (const ch of text) {
          span.textContent += ch;
          await wait(28);
        }
      }
      typeTarget.insertBefore(document.createTextNode("\n"), caret);
      // When the JavaScript line finishes, "run" it in the preview
      if (i === codeLines.length - 1) {
        heroPreview.textContent = "Let's build!";
        heroPreview.classList.add("bump");
        setTimeout(() => heroPreview.classList.remove("bump"), 300);
      }
      await wait(160);
    }
    await wait(4500); // pause, then type again
  }
}
if (reduceMotion) { renderAllCode(); heroPreview.textContent = "Let's build!"; }
else typeCode();


/* ---------- 5. Flip cards ---------- */
$$(".flip").forEach((card) => {
  card.addEventListener("click", () => {
    const flipped = card.getAttribute("aria-pressed") === "true";
    card.setAttribute("aria-pressed", String(!flipped));
  });
});


/* ---------- 6. Live HTML/CSS playground ---------- */
const DEFAULT_HTML = `<div class="card">
  <h2>My First Page</h2>
  <p>Edit me and watch the preview change.</p>
  <ul>
    <li>HTML = structure</li>
    <li>CSS = style</li>
  </ul>
  <button>Click me</button>
</div>`;
const DEFAULT_CSS = `.card {
  font-family: sans-serif;
  padding: 16px;
  border-radius: 12px;
  background: #fff4d6;
}
h2 { color: #e34c26; }
button {
  background: #1f63e0;
  color: white;
  border: 0;
  padding: 8px 14px;
  border-radius: 8px;
}`;

const pgHtml = $("#pgHtml");
const pgCss = $("#pgCss");
const pgPreview = $("#pgPreview");
// A "shadow root" keeps the playground's CSS from leaking into our page
const shadow = pgPreview.attachShadow({ mode: "open" });
let clicks = 0;

function updatePreview() {
  shadow.innerHTML = `<style>${pgCss.value}</style>${pgHtml.value}`;
  // JavaScript part: make every button in the preview count clicks
  shadow.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      clicks++;
      btn.textContent = `Clicked ${clicks} time${clicks === 1 ? "" : "s"}`;
    });
  });
}
function resetPlayground() {
  pgHtml.value = DEFAULT_HTML;
  pgCss.value = DEFAULT_CSS;
  clicks = 0;
  updatePreview();
}
pgHtml.addEventListener("input", updatePreview);
pgCss.addEventListener("input", updatePreview);
$("#pgReset").addEventListener("click", resetPlayground);
resetPlayground();


/* ---------- 7. Element anatomy ---------- */
const anatomyText = {
  open: "<strong>Opening tag</strong> tells the browser where the element starts and what kind it is. Here, <code>&lt;p&gt;</code> means \"paragraph\".",
  content: "<strong>Content</strong> is what the visitor actually sees on the page: the text, image or other elements inside.",
  close: "<strong>Closing tag</strong> has a slash <code>/</code> and marks where the element ends.",
};
const anatomyExplain = $("#anatomyExplain");
$$(".part").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".part").forEach((b) => b.classList.toggle("is-on", b === btn));
    anatomyExplain.innerHTML = anatomyText[btn.dataset.part];
  });
});
anatomyExplain.innerHTML = anatomyText.open;


/* ---------- 8. Tag explorer ---------- */
const tags = {
  p: {
    def: "<code>&lt;p&gt;</code> defines a paragraph.",
    code: `<p>HTML gives a page its structure.</p>\n<p>CSS makes it look good.</p>`,
  },
  ul: {
    def: "The <code>&lt;ul&gt;</code> tag is used for grouping related sets of items.",
    code: `<ul>\n  <li>HTML</li>\n  <li>CSS</li>\n  <li>JavaScript</li>\n</ul>`,
  },
  nav: {
    def: "The <code>&lt;nav&gt;</code> tag is used to declare the navigational section of a site.",
    code: `<nav>\n  <a href="#">Home</a>\n  <a href="#">About</a>\n  <a href="#">Contact</a>\n</nav>`,
  },
};
function showTag(name) {
  $$(".tag-btn").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tag === name)));
  $("#tagDef").innerHTML = tags[name].def;
  $("#tagCode").textContent = tags[name].code;   // show the code as text
  $("#tagRender").innerHTML = tags[name].code;   // let the browser render it
  // stop the demo links from jumping to the top
  $$("#tagRender a").forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));
}
$$(".tag-btn").forEach((b) => b.addEventListener("click", () => showTag(b.dataset.tag)));
showTag("p");


/* ---------- 9. Static vs dynamic switch ---------- */
const siteInfo = {
  static: {
    title: "Static website",
    desc: "A static website is made up of web pages created using HTML, CSS and JavaScript. The server sends the same ready-made files to every visitor.",
    examples: ["Portfolios", "Landing pages", "Event pages", "This website!"],
    diagram: `
      <div class="node n-browser">Browser<small>you</small></div>
      <div class="arrow"><span class="packet"></span></div>
      <div class="node n-server">Web server<small>stores the files</small></div>
      <div class="files"><span>index.html</span><span>style.css</span><span>script.js</span></div>`,
  },
  dynamic: {
    title: "Dynamic website",
    desc: "In a dynamic website, all of your data and content are organized in a database or backend content management system (CMS), which connects to your website pages.",
    examples: ["Online stores", "Social media feeds", "Student portals", "Blogs with a CMS"],
    diagram: `
      <div class="node n-browser">Browser<small>you</small></div>
      <div class="arrow"><span class="packet"></span></div>
      <div class="node n-server">Server<small>builds the page</small></div>
      <div class="arrow"><span class="packet"></span></div>
      <div class="node n-db">Database<small>or CMS</small></div>`,
  },
};
const siteSwitch = $("#siteSwitch");
function showSite(kind) {
  const info = siteInfo[kind];
  $("#siteTitle").textContent = info.title;
  $("#siteDesc").textContent = info.desc;
  $("#siteExamples").innerHTML = info.examples.map((x) => `<li>${x}</li>`).join("");
  $("#siteDiagram").innerHTML = info.diagram;
  siteSwitch.setAttribute("aria-checked", String(kind === "dynamic"));
  $("#lblStatic").classList.toggle("on", kind === "static");
  $("#lblDynamic").classList.toggle("on", kind === "dynamic");
}
siteSwitch.addEventListener("click", () => {
  showSite(siteSwitch.getAttribute("aria-checked") === "true" ? "static" : "dynamic");
});
// Clicking the words also flips the switch
$("#lblStatic").addEventListener("click", () => showSite("static"));
$("#lblDynamic").addEventListener("click", () => showSite("dynamic"));
showSite("static");


/* ---------- 10. Deployment timeline ---------- */
const stages = [
  { name: "Planning", title: "Planning your code",
    text: "This is the foundation of deployment. Teams identify what needs to be deployed, dependencies, potential risks, the timeline, and who is responsible for what. A clear plan prevents last-minute issues." },
  { name: "Development", title: "Development phase",
    text: "Developers write and finalize code based on the features or fixes to be released. This includes updating files, creating new components, and integrating third-party services if needed." },
  { name: "Testing", title: "Testing the application",
    text: "Testing makes sure the application works as expected. It involves three kinds of tests:",
    list: [
      ["Unit testing", "checks individual components."],
      ["Integration testing", "verifies how components interact."],
      ["User acceptance testing (UAT)", "confirms the software meets user expectations."],
    ] },
  { name: "Build", title: "Build the application",
    text: "The code is packaged or compiled into a format that is ready for deployment. For web apps, this might mean bundling JavaScript files or generating static pages." },
  { name: "Release", title: "Releasing the build",
    text: "The application is deployed to a live environment (production) or a staging environment for final review. This can be manual or automated, and may include database migrations or background services." },
  { name: "Monitoring", title: "Monitoring the application",
    text: "After deployment, continuous monitoring keeps the system stable and performing well. Monitoring tools track performance, identify errors, and alert the team to issues in real time." },
  { name: "Feedback", title: "Feedback & maintenance",
    text: "Once users interact with the deployed version, their feedback is collected for improvements. Teams also provide patches, bug fixes, and security updates as ongoing maintenance." },
];
const timeline = $("#timeline");
const stageCard = $("#stageCard");
let currentStage = 0;

// Build the clickable dots
timeline.innerHTML = stages.map((s, i) => `
  <li><button type="button" role="tab" class="t-step" data-i="${i}" aria-selected="false">
    <span class="t-dot">${i + 1}</span><span>${s.name}</span>
  </button></li>`).join("");

function showStage(i) {
  currentStage = i;
  const s = stages[i];
  $$(".t-step").forEach((btn, j) => {
    btn.setAttribute("aria-selected", String(j === i));
    btn.classList.toggle("done", j < i);
  });
  $("#stageNum").textContent = i + 1;
  $("#stageTitle").textContent = s.title;
  $("#stageText").textContent = s.text;
  $("#stageList").innerHTML = (s.list || [])
    .map(([name, desc]) => `<li><strong>${name}</strong>: ${desc}</li>`).join("");
  $("#stagePrev").disabled = i === 0;
  $("#stageNext").textContent = i === stages.length - 1 ? "Start over ↺" : "Next stage →";
  // replay the little pop animation
  stageCard.classList.remove("swap"); void stageCard.offsetWidth; stageCard.classList.add("swap");
}
timeline.addEventListener("click", (e) => {
  const btn = e.target.closest(".t-step");
  if (btn) showStage(Number(btn.dataset.i));
});
$("#stagePrev").addEventListener("click", () => showStage(Math.max(0, currentStage - 1)));
$("#stageNext").addEventListener("click", () => showStage((currentStage + 1) % stages.length));
showStage(0);


/* ---------- 11. Prompt builder ---------- */
const promptParts = {
  role: "Act as a senior frontend developer.",
  context: "I am building a responsive navigation bar in HTML/CSS.",
  task: "Create a clean layout with a logo on the left and links on the right.",
  constraints: "Use Flexbox and do not use external libraries.",
};
const order = ["role", "context", "task", "constraints"];
const meterSteps = [
  { label: "Empty. Click a component to start.", color: "var(--bad)" },
  { label: "Weak. The AI still has to guess a lot.", color: "var(--bad)" },
  { label: "Getting there. Add more detail.", color: "var(--html)" },
  { label: "Good. Clear instruction with context.", color: "var(--js)" },
  { label: "Excellent. The AI just executes.", color: "var(--good)" },
];
const chosen = new Set();

function renderPrompt() {
  const box = $("#assembled");
  const picked = order.filter((k) => chosen.has(k));
  box.innerHTML = picked.length
    ? picked.map((k) => `<span data-k="${k}">${promptParts[k]}</span>`).join(" ")
    : `<span class="ph">Your prompt will appear here…</span>`;
  const step = meterSteps[picked.length];
  $("#meterFill").style.width = (picked.length / 4) * 100 + "%";
  $("#meterFill").style.background = step.color;
  $("#meterLabel").textContent = step.label;
}
$$(".comp").forEach((card) => {
  card.addEventListener("click", () => {
    const key = card.dataset.key;
    chosen.has(key) ? chosen.delete(key) : chosen.add(key);
    card.setAttribute("aria-pressed", String(chosen.has(key)));
    renderPrompt();
  });
});
renderPrompt();

// Copy button (falls back to selecting the text if copying is blocked)
$("#copyPrompt").addEventListener("click", async (e) => {
  const text = $("#assembled").innerText;
  const btn = e.currentTarget;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = "Copied!";
  } catch (err) {
    const range = document.createRange();
    range.selectNodeContents($("#assembled"));
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    btn.textContent = "Selected";
  }
  setTimeout(() => (btn.textContent = "Copy"), 1500);
});


/* ---------- 12. Three tiers of prompting ---------- */
const tiers = {
  normal: {
    sum: "A single sentence describing what you want. No context, no constraints, no examples. The AI has to guess.",
    prompt: "Write a blog intro about productivity.",
    chips: ["Topic"],
  },
  good: {
    sum: "You've added context and a clear instruction. The AI knows what you want, but it's still working with assumptions about how you want it.",
    prompt: "Write a 150-word blog intro about productivity for software engineers who feel burned out. Use a casual tone.",
    chips: ["Topic", "Length", "Audience", "Tone"],
  },
  best: {
    sum: "Context, role, task, constraints, format, and some example. The AI is doing execution, not interpretation.",
    prompt: `You are a senior engineer who has written for the Stripe blog and dev.to.
Write a 150-word intro for a blog post titled "I deleted 80% of my productivity tools and got more done."
Audience: burned-out senior engineers.
Tone: dry, slightly self-deprecating, no hustle-culture clichés.
Open with a single concrete moment (not a generalization).
Avoid the phrases "in today's fast-paced world," "game-changer," and "let's dive in."
End with a one-line promise about what the post will cover.`,
    chips: ["Role", "Title", "Length", "Audience", "Tone", "Opening rule", "Phrases to avoid", "Ending"],
  },
};
const tierPanel = $(".tier-panel");
function showTier(name) {
  $$(".tier-tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tier === name)));
  $("#tierSum").textContent = tiers[name].sum;
  $("#tierPrompt").textContent = tiers[name].prompt;
  $("#tierChips").innerHTML = tiers[name].chips
    .map((c, i) => `<li style="animation-delay:${i * 60}ms">${c}</li>`).join("");
  tierPanel.classList.remove("swap"); void tierPanel.offsetWidth; tierPanel.classList.add("swap");
}
$$(".tier-tab").forEach((t) => t.addEventListener("click", () => showTier(t.dataset.tier)));
showTier("normal");


/* ---------- 13. Good or Bad Prompt quiz ---------- */
const questions = [
  { prompt: "Make a simple calculator using HTML, CSS, and JavaScript that can add, subtract, multiply, and divide. Use big buttons and a dark theme, and add comments explaining the code for a beginner.",
    answer: "good", why: "It names the tools, the exact features, the look, and who the code is for. Nothing is left to guess." },
  { prompt: "Make me the best and most amazing website ever with lots of cool features.",
    answer: "bad", why: "\"Best\", \"amazing\" and \"cool features\" mean nothing specific. The AI has to guess what you want." },
  { prompt: "Write a summary of this report.",
    answer: "bad", why: "Vague request. There's no length, structure or focus, so you'll get a generic summary." },
  { prompt: "Summarise this report in three bullet points, focusing on key findings and action items.",
    answer: "good", why: "The AI is given a clear structure (three bullets) and a specific focus (findings and actions)." },
  { prompt: "Create a marketing plan.",
    answer: "bad", why: "Lack of context. The AI doesn't know the industry, audience, goals or budget." },
  { prompt: "Develop a five-step digital marketing plan for a UK-based fintech startup launching an AI-powered budgeting app. Focus on social media and email marketing with a £5,000 budget.",
    answer: "good", why: "The AI now understands the industry, audience, objectives and constraints, so the response is tailored." },
  { prompt: "Tell me everything about Copilot in Microsoft 365.",
    answer: "bad", why: "Overly broad. \"Everything\" is too big to answer well in one go." },
  { prompt: "Explain how Microsoft Copilot improves productivity in Teams and Outlook. Provide three real-world examples.",
    answer: "good", why: "It narrows the scope to two apps and asks for a specific number of examples, so it's manageable." },
];

let quizOrder = [];
let qIndex = 0;
let score = 0;
let results = [];

// Shuffle an array (Fisher–Yates) so each game feels fresh
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderDots() {
  $("#quizDots").innerHTML = quizOrder.map((_, i) => {
    let cls = results[i] === true ? "right" : results[i] === false ? "wrong" : (i === qIndex ? "now" : "");
    return `<i class="${cls}"></i>`;
  }).join("");
}

function showQuestion() {
  const q = quizOrder[qIndex];
  $("#quizCount").textContent = `Prompt ${qIndex + 1} of ${quizOrder.length}`;
  $("#quizPrompt").textContent = `"${q.prompt}"`;
  $("#feedback").hidden = true;
  $$(".ans").forEach((b) => { b.disabled = false; b.classList.remove("picked"); });
  renderDots();
}

function answer(choice) {
  const q = quizOrder[qIndex];
  const correct = choice === q.answer;
  if (correct) score++;
  results[qIndex] = correct;
  $("#quizScore").textContent = score;

  $$(".ans").forEach((b) => {
    b.disabled = true;
    b.classList.toggle("picked", b.dataset.ans === choice);
  });

  const fb = $("#feedback");
  fb.className = "feedback " + (correct ? "right" : "wrong");
  $("#fbVerdict").textContent = correct
    ? `Correct! It's a ${q.answer.toUpperCase()} prompt.`
    : `Not quite. It's a ${q.answer.toUpperCase()} prompt.`;
  $("#fbWhy").textContent = q.why;
  $("#quizNext").textContent = qIndex === quizOrder.length - 1 ? "See my score →" : "Next prompt →";
  fb.hidden = false;

  if (!correct && !reduceMotion) {
    const box = $("#quizBox");
    box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake");
  }
  renderDots();
}

function endQuiz() {
  $("#quizPlay").hidden = true;
  $("#quizEnd").hidden = false;
  $("#endScore").textContent = score;
  const total = quizOrder.length;
  let msg;
  if (score === total) msg = "Perfect score! You can spot a good prompt from a mile away.";
  else if (score >= total - 2) msg = "Great job! Just a couple slipped past you.";
  else if (score >= total / 2) msg = "Not bad! Scroll up to the prompting section and try again.";
  else msg = "Keep practicing. Remember: role, context, task, constraints.";
  $("#endMsg").textContent = msg;
  $("#quizCount").textContent = "Finished";
  qIndex = -1; renderDots();
  if (score === total) confetti();
}

function startQuiz() {
  quizOrder = shuffle(questions);
  qIndex = 0; score = 0; results = [];
  $("#quizScore").textContent = 0;
  $("#quizPlay").hidden = false;
  $("#quizEnd").hidden = true;
  showQuestion();
}

$$(".ans").forEach((b) => b.addEventListener("click", () => answer(b.dataset.ans)));
$("#quizNext").addEventListener("click", () => {
  if (qIndex < quizOrder.length - 1) { qIndex++; showQuestion(); }
  else endQuiz();
});
$("#quizAgain").addEventListener("click", startQuiz);
startQuiz();

// A little celebration for a perfect score
function confetti() {
  if (reduceMotion) return;
  const colors = ["var(--html)", "var(--css)", "var(--js)", "var(--good)"];
  for (let i = 0; i < 70; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = colors[i % colors.length];
    piece.style.animationDuration = 1.8 + Math.random() * 1.8 + "s";
    piece.style.animationDelay = Math.random() * 0.4 + "s";
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 4200);
  }
}
