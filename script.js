/* =========================================================
   script.js: all the interactive parts of the page.
   Each block below handles one feature.
   Rule we follow: this file NEVER scrolls the page by itself.
   Only the user (or a nav link they click) moves the page.
   ========================================================= */

// Tell the CSS that JavaScript is running (turns on reveal animations)
document.documentElement.classList.add("js");

/* ---------- 1. DARK / LIGHT MODE ---------- */
const root = document.documentElement;
const themeBtn = document.querySelector(".theme-toggle");
const themeIcon = document.querySelector(".theme-icon");

// Apply a theme ("light" or "dark") and update the button
function setTheme(theme) {
  root.setAttribute("data-theme", theme);
  const isDark = theme === "dark";
  themeIcon.textContent = isDark ? "☀" : "☾";
  themeBtn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
}

// Pick the starting theme: saved choice first, then the device setting
let savedTheme = null;
try { savedTheme = localStorage.getItem("theme"); } catch (e) { /* storage blocked: ignore */ }
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
setTheme(savedTheme || (prefersDark ? "dark" : "light"));

themeBtn.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  setTheme(next);
  try { localStorage.setItem("theme", next); } catch (e) { /* ignore */ }
});

/* ---------- 2. MOBILE MENU ---------- */
const menuBtn = document.querySelector(".menu-toggle");
const navLinks = document.getElementById("nav-links");

menuBtn.addEventListener("click", () => {
  const open = navLinks.classList.toggle("is-open");
  menuBtn.setAttribute("aria-expanded", String(open));
});

// Close the menu after a link is picked (the link itself does the scrolling)
navLinks.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    navLinks.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
  }
});

/* ---------- 3. HIGHLIGHT THE CURRENT NAV LINK ----------
   An IntersectionObserver tells us which section is on screen.
   We ONLY change CSS classes here, never the scroll position. */
const sections = document.querySelectorAll("main section[id]");
const linkFor = {};
navLinks.querySelectorAll("a").forEach((a) => {
  linkFor[a.getAttribute("href").slice(1)] = a;
});

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      Object.values(linkFor).forEach((a) => a.classList.remove("is-current"));
      const link = linkFor[entry.target.id];
      if (link) link.classList.add("is-current");
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" }); // a thin band across the middle of the screen

sections.forEach((s) => navObserver.observe(s));

/* ---------- 4. SCROLL-REVEAL ANIMATIONS ----------
   When an element with .reveal enters the screen, add .is-visible.
   Again: classes only, no scrolling. */
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target); // animate once, then stop watching
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((el, i) => {
  // Small stagger so groups of cards appear one after another
  el.style.transitionDelay = (i % 4) * 70 + "ms";
  revealObserver.observe(el);
});

/* ---------- 5. FLIP CARDS ---------- */
document.querySelectorAll(".flip-card").forEach((card) => {
  card.addEventListener("click", () => {
    const flipped = card.classList.toggle("is-flipped");
    card.setAttribute("aria-pressed", String(flipped));
  });
});

/* ---------- 6. LIVE HTML PLAYGROUND ---------- */
const pgInput = document.getElementById("pg-input");
const pgPreview = document.getElementById("pg-preview");

const starterHTML = `<h1>Hello, Gordon College!</h1>
<p>Edit me and watch the preview change.</p>
<ul>
  <li>HTML = structure</li>
  <li>CSS = style</li>
  <li>JS = behavior</li>
</ul>`;

// Put the user's HTML inside a tiny page and show it in the iframe
function updatePreview() {
  pgPreview.srcdoc = `<!DOCTYPE html><html><head><style>
    body { font-family: system-ui, sans-serif; padding: 16px; color: #1d1b22; line-height: 1.5; }
    h1 { margin-top: 0; }
  </style></head><body>${pgInput.value}</body></html>`;
}

pgInput.value = starterHTML;
updatePreview();
pgInput.addEventListener("input", updatePreview); // runs on every keystroke

// Snippet buttons add code to the end of the editor
document.querySelectorAll("[data-snippet]").forEach((btn) => {
  btn.addEventListener("click", () => {
    pgInput.value = pgInput.value.trimEnd() + "\n" + btn.dataset.snippet;
    updatePreview();
  });
});

document.getElementById("pg-reset").addEventListener("click", () => {
  pgInput.value = starterHTML;
  updatePreview();
});

/* ---------- 7. HTML TAG EXPLORER ---------- */
// Data for each tag: name, definition (from the slides), and example code
const tags = {
  p: {
    name: "<p> · Paragraph",
    def: "<p> defines a paragraph. Browsers add a little space above and below it.",
    code: `<p>HTML gives a page structure.</p>
<p>Each paragraph sits on its own.</p>`,
  },
  ul: {
    name: "<ul> · Unordered list",
    def: "<ul> groups related items. Each item goes inside an <li> tag and gets a bullet.",
    code: `<ul>
  <li>HTML</li>
  <li>CSS</li>
  <li>JavaScript</li>
</ul>`,
  },
  nav: {
    name: "<nav> · Navigation",
    def: "<nav> declares the navigation section of a site: the menu of links.",
    code: `<nav class="demo-nav">
  <a href="#">Home</a>
  <a href="#">About</a>
  <a href="#">Contact</a>
</nav>`,
  },
};

const tagName = document.getElementById("tag-name");
const tagDef = document.getElementById("tag-def");
const tagCode = document.getElementById("tag-code");
const tagRender = document.getElementById("tag-render");
const tagPanel = document.querySelector(".tag-panel");
const tagButtons = document.querySelectorAll(".tag-btn");

function showTag(key) {
  const t = tags[key];
  tagName.textContent = t.name;
  tagDef.textContent = t.def;
  tagCode.textContent = t.code;   // textContent shows the code as text
  tagRender.innerHTML = t.code;   // innerHTML actually renders it

  tagButtons.forEach((b) => {
    const active = b.dataset.tag === key;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });

  // Restart the little pop animation
  tagPanel.style.animation = "none";
  void tagPanel.offsetWidth;
  tagPanel.style.animation = "";
}

tagButtons.forEach((b) => b.addEventListener("click", () => showTag(b.dataset.tag)));

// The demo links use href="#", which would jump to the top. Block that.
tagRender.addEventListener("click", (event) => {
  if (event.target.closest("a")) event.preventDefault();
});

showTag("p");

/* ---------- 8. STATIC VS DYNAMIC SWITCH ---------- */
const siteSwitch = document.querySelector(".switch");
const panelStatic = document.getElementById("panel-static");
const panelDynamic = document.getElementById("panel-dynamic");
const lblStatic = document.getElementById("lbl-static");
const lblDynamic = document.getElementById("lbl-dynamic");

siteSwitch.addEventListener("click", () => {
  const dynamic = siteSwitch.getAttribute("aria-checked") !== "true";
  siteSwitch.setAttribute("aria-checked", String(dynamic));
  siteSwitch.setAttribute("aria-label", dynamic ? "Show static websites" : "Show dynamic websites");

  panelStatic.hidden = dynamic;
  panelDynamic.hidden = !dynamic;
  lblStatic.classList.toggle("is-on", !dynamic);
  lblDynamic.classList.toggle("is-on", dynamic);

  // Make the newly shown panel visible and give it a pop animation
  const shown = dynamic ? panelDynamic : panelStatic;
  shown.classList.add("is-visible");
  shown.classList.remove("swap-in");
  void shown.offsetWidth;
  shown.classList.add("swap-in");
});

/* ---------- 9. DEPLOYMENT TIMELINE ---------- */
const stages = [
  {
    name: "Planning",
    text: "The foundation. Teams list what to deploy, the dependencies, risks, timeline, and who does what.",
    extra: "A clear plan prevents last-minute surprises.",
  },
  {
    name: "Development",
    text: "Developers write and finalize the code for new features or fixes.",
    extra: "That means updating files, building components, and plugging in third-party services.",
  },
  {
    name: "Testing",
    text: "Testing makes sure the app works as expected. There are three main kinds:",
    tests: [
      ["Unit testing", "Checks individual components on their own."],
      ["Integration testing", "Verifies how components work together."],
      ["User Acceptance Testing (UAT)", "Confirms the software meets user expectations."],
    ],
  },
  {
    name: "Build",
    text: "The code is packaged or compiled into a deploy-ready format.",
    extra: "For web apps, that can mean bundling JavaScript or generating static pages.",
  },
  {
    name: "Release",
    text: "The app goes to production (live) or to staging for a final review.",
    extra: "It can be manual or automated, and may include database migrations.",
  },
  {
    name: "Monitoring",
    text: "After launch, tools track performance and errors to keep things stable.",
    extra: "They alert the team to problems in real time.",
  },
  {
    name: "Feedback & Maintenance",
    text: "Real users share feedback, and the team uses it to improve the app.",
    extra: "Ongoing work includes patches, bug fixes, and security updates.",
  },
];

const timeline = document.getElementById("timeline");
const stageDetail = document.getElementById("stage-detail");
let openStage = 0; // which stage is open (-1 means none)

// Build one button per stage
stages.forEach((stage, i) => {
  const li = document.createElement("li");
  li.innerHTML = `
    <button class="stage-btn" type="button" aria-expanded="false" aria-controls="stage-detail">
      <span class="stage-dot">${i + 1}</span>
      <span class="stage-name">${stage.name}</span>
    </button>`;
  li.querySelector("button").addEventListener("click", () => {
    // Clicking the open stage again closes it
    openStage = openStage === i ? -1 : i;
    renderStage();
  });
  timeline.appendChild(li);
});

function renderStage() {
  timeline.querySelectorAll(".stage-btn").forEach((b, i) => {
    b.setAttribute("aria-expanded", String(i === openStage));
  });

  if (openStage === -1) {
    stageDetail.classList.remove("is-open");
    return;
  }

  const s = stages[openStage];
  let html = `<div><div class="stage-card">
    <p class="stage-step">Stage ${openStage + 1} of ${stages.length}</p>
    <h3>${s.name}</h3>
    <p>${s.text}</p>`;
  if (s.extra) html += `<p>${s.extra}</p>`;
  if (s.tests) {
    html += `<ul class="test-list">` +
      s.tests.map(([title, desc]) => `<li><strong>${title}</strong><span>${desc}</span></li>`).join("") +
      `</ul>`;
  }
  html += `</div></div>`;

  stageDetail.innerHTML = html;
  stageDetail.classList.add("is-open");
}

renderStage();

/* ---------- 10. PROMPT TIERS (TABS) ---------- */
const tiers = [
  {
    desc: "A single sentence. No context, no constraints, no examples. The AI has to guess.",
    example: `"Write a blog intro about productivity."`,
    meter: 33,
    color: "var(--coral)",
  },
  {
    desc: "Adds context and a clear instruction. Better, but the AI still assumes how you want it.",
    example: `"Write a 150-word blog intro about productivity for software engineers who feel burned out. Use a casual tone."`,
    meter: 66,
    color: "var(--sun)",
  },
  {
    desc: "Role, context, task, constraints, format, and an example. The AI executes instead of interpreting.",
    example: `"You are a senior engineer who has written for the Stripe blog and Dev.to.

Write a 150-word intro for a blog post titled "I Deleted 80% of My Productivity Tools and Got More Done."

Audience: burned-out senior engineers.
Tone: dry, slightly self-deprecating, no hustle-culture clichés.
Open with a single concrete moment (not a generalization).
Avoid the phrases "in today's fast-paced world," "game-changer," and "let's dive in."
End with a one-line promise about what the post will cover."`,
    meter: 100,
    color: "var(--mint)",
  },
];

const tierTabs = document.querySelectorAll(".tier-tab");
const tierDesc = document.getElementById("tier-desc");
const tierExample = document.getElementById("tier-example");
const meterFill = document.getElementById("meter-fill");

function showTier(index) {
  const t = tiers[index];
  tierDesc.textContent = t.desc;
  tierExample.textContent = t.example;
  meterFill.style.width = t.meter + "%";
  meterFill.style.background = t.color;

  tierTabs.forEach((tab, i) => {
    tab.classList.toggle("is-active", i === index);
    tab.setAttribute("aria-selected", String(i === index));
  });

  // Replay the pop animation on the example box
  tierExample.style.animation = "none";
  void tierExample.offsetWidth;
  tierExample.style.animation = "";
}

tierTabs.forEach((tab) => tab.addEventListener("click", () => showTier(Number(tab.dataset.tier))));
showTier(0);

/* ---------- 11. GOOD OR BAD PROMPT? QUIZ ---------- */
// Every prompt comes from the slide deck
const questions = [
  {
    tag: "Build request",
    prompt: `"Make a simple calculator using HTML, CSS, and JavaScript that can add, subtract, multiply, and divide. Use big buttons and a dark theme, and add comments explaining the code for a beginner."`,
    answer: "good",
    why: "It names the tools, the exact features, the look, and who the code is for. Nothing is left to guess.",
  },
  {
    tag: "Build request",
    prompt: `"Make me the best and most amazing website ever with lots of cool features."`,
    answer: "bad",
    why: "\"Best\" and \"cool\" are opinions, not instructions. No topic, no audience, no features.",
    better: "Name the site's purpose, the pages, the tech, and the style you want.",
  },
  {
    tag: "Vague request",
    prompt: `"Write a summary of this report."`,
    answer: "bad",
    why: "No length, no format, no focus. The AI picks all of that for you.",
    better: "\"Summarise this report in three bullet points, focusing on key findings and action items.\"",
  },
  {
    tag: "Context-rich request",
    prompt: `"Develop a five-step digital marketing plan for a UK-based fintech startup launching an AI-powered budgeting app. Focus on social media and email marketing with a £5,000 budget."`,
    answer: "good",
    why: "The AI now understands the industry, audience, objectives, and constraints, so the answer fits.",
  },
  {
    tag: "Overly broad request",
    prompt: `"Tell me everything about Copilot in Microsoft 365."`,
    answer: "bad",
    why: "\"Everything\" is too big. You'll get a long, shallow answer.",
    better: "\"Explain how Microsoft Copilot improves productivity in Teams and Outlook. Provide three real-world examples.\"",
  },
  {
    tag: "Focused request",
    prompt: `"Summarise this report in three bullet points, focusing on key findings and action items."`,
    answer: "good",
    why: "The AI is given a clear structure and a specific focus.",
  },
  {
    tag: "Missing context",
    prompt: `"Create a marketing plan."`,
    answer: "bad",
    why: "For what product? Which audience? What budget? The AI has nothing to work with.",
    better: "\"Develop a five-step digital marketing plan for a UK-based fintech startup… with a £5,000 budget.\"",
  },
  {
    tag: "Narrowed request",
    prompt: `"Explain how Microsoft Copilot improves productivity in Teams and Outlook. Provide three real-world examples."`,
    answer: "good",
    why: "It narrows the scope and makes the request manageable.",
  },
];

// Grab all the quiz elements once
const qCount = document.getElementById("quiz-count");
const qScore = document.getElementById("quiz-score");
const qDots = document.getElementById("quiz-dots");
const qTag = document.getElementById("quiz-tag");
const qPrompt = document.getElementById("quiz-prompt");
const qFeedback = document.getElementById("quiz-feedback");
const fbVerdict = document.getElementById("fb-verdict");
const fbWhy = document.getElementById("fb-why");
const fbBetter = document.getElementById("fb-better");
const qNext = document.getElementById("quiz-next");
const qPlay = document.getElementById("quiz-play");
const qEnd = document.getElementById("quiz-end");
const answerBtns = document.querySelectorAll("[data-answer]");

let current = 0;   // which question we're on
let score = 0;     // how many correct
let results = [];  // true/false for each answered question

// Draw the progress dots
function drawDots() {
  qDots.innerHTML = questions.map((_, i) => {
    let cls = "";
    if (results[i] === true) cls = "is-right";
    else if (results[i] === false) cls = "is-wrong";
    else if (i === current) cls = "is-now";
    return `<span class="${cls}"></span>`;
  }).join("");
}

// Show the current question
function showQuestion() {
  const q = questions[current];
  qCount.textContent = `${current + 1} / ${questions.length}`;
  qScore.textContent = score;
  qTag.textContent = q.tag;
  qPrompt.textContent = q.prompt;
  qFeedback.hidden = true;

  answerBtns.forEach((b) => {
    b.disabled = false;
    b.classList.remove("is-picked");
  });

  qPrompt.classList.remove("pop");
  void qPrompt.offsetWidth;
  qPrompt.classList.add("pop");
  drawDots();
}

// Handle a GOOD / BAD click
function answer(choice, btn) {
  const q = questions[current];
  const correct = choice === q.answer;
  if (correct) score++;
  results[current] = correct;

  // Lock the buttons so you can't answer twice
  answerBtns.forEach((b) => (b.disabled = true));
  btn.classList.add("is-picked");

  fbVerdict.textContent = correct
    ? `✅ Nice! It's a ${q.answer.toUpperCase()} prompt.`
    : `❌ Not quite. It's a ${q.answer.toUpperCase()} prompt.`;
  fbWhy.innerHTML = `<strong>${q.answer === "good" ? "Why it works:" : "Why it fails:"}</strong> `;
  fbWhy.append(q.why); // append as text (safe)

  if (q.better) {
    fbBetter.hidden = false;
    fbBetter.textContent = "Try instead → " + q.better;
  } else {
    fbBetter.hidden = true;
  }

  qFeedback.classList.toggle("is-right", correct);
  qFeedback.classList.toggle("is-wrong", !correct);
  qFeedback.hidden = false;
  qNext.textContent = current === questions.length - 1 ? "See my score →" : "Next prompt →";
  qScore.textContent = score;
  drawDots();
}

answerBtns.forEach((btn) => {
  btn.addEventListener("click", () => answer(btn.dataset.answer, btn));
});

qNext.addEventListener("click", () => {
  current++;
  if (current < questions.length) {
    showQuestion();
  } else {
    showEnd();
  }
});

// Final score screen with a message based on the score
function showEnd() {
  qPlay.hidden = true;
  qEnd.hidden = false;
  document.getElementById("end-score").textContent = score;

  let msg;
  if (score === questions.length) msg = "Perfect! You're a prompt wizard. 🧙";
  else if (score >= 6) msg = "Great instincts. Specific beats vague every time.";
  else if (score >= 4) msg = "Solid start. Look for role, context, task, and constraints.";
  else msg = "Every pro started here. Play again and watch for vague words.";
  document.getElementById("end-msg").textContent = msg;
}

document.getElementById("quiz-restart").addEventListener("click", () => {
  current = 0;
  score = 0;
  results = [];
  qEnd.hidden = true;
  qPlay.hidden = false;
  showQuestion();
});

showQuestion();