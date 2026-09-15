/* Deepwater Horizon incident dossier — vanilla JS, no dependencies.
 * Loads ./data/findings.json, renders Timeline / Causes / Key Figures,
 * maps sourceIds to clickable citations, and degrades gracefully on error.
 */
(function () {
  "use strict";

  var DATA_URL = "./data/findings.json";

  // ---- small DOM helpers ----------------------------------------------------
  function $(sel) { return document.querySelector(sel); }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c == null) return;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  // ---- status / error UI ----------------------------------------------------
  var statusEl = $("#status");

  function showStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.classList.remove("is-hidden");
    statusEl.classList.toggle("is-error", !!isError);
    statusEl.innerHTML = "";
    statusEl.appendChild(document.createTextNode(msg));
  }

  function hideStatus() {
    if (statusEl) statusEl.classList.add("is-hidden");
  }

  function showFatal(title, detailNodes) {
    if (!statusEl) return;
    statusEl.classList.remove("is-hidden");
    statusEl.classList.add("is-error");
    statusEl.innerHTML = "";
    statusEl.appendChild(el("strong", { text: title }));
    (detailNodes || []).forEach(function (n) {
      statusEl.appendChild(el("div", null, n));
    });
  }

  // ---- organization heuristic ----------------------------------------------
  var ORG_TOKENS = [
    "Ltd.", "Ltd", "Company", "Corporation", "Corp.", "Petroleum",
    "International", "p.l.c.", "plc", "Court", "Commission", "LLC",
    "Inc.", "Board", "Agency", "Bureau", "Halliburton"
  ];

  function isOrganization(figure) {
    if (!figure || !figure.name) return false;
    var name = String(figure.name);
    var org = figure.org ? String(figure.org) : "";

    // name mirrors the org (name starts with org main body, or vice versa)
    if (org) {
      var sp = org.indexOf(" ");
      var pa = org.indexOf("(");
      var cut = org.length;
      if (sp !== -1) cut = Math.min(cut, sp);
      if (pa !== -1) cut = Math.min(cut, pa);
      var orgHead = org.slice(0, cut).trim();
      if (orgHead.length > 2 && name.indexOf(orgHead) === 0) return true;
    }
    // name contains an institutional identifier token
    for (var i = 0; i < ORG_TOKENS.length; i++) {
      if (name.indexOf(ORG_TOKENS[i]) !== -1) return true;
    }
    return false;
  }

  // ---- citation rendering ---------------------------------------------------
  function buildSourceIndex(sources) {
    // map id -> { number, source }
    var map = {};
    (sources || []).forEach(function (s, i) {
      if (s && s.id) map[s.id] = { number: i + 1, source: s };
    });
    return map;
  }

  function renderCitations(sourceIds, sourceIndex) {
    var wrap = el("div", { class: "cites" });
    wrap.appendChild(el("span", { class: "cites-label", text: "Sources" }));
    if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
      wrap.appendChild(el("span", { class: "cite is-missing", title: "No source listed" }, "—"));
      return wrap;
    }
    sourceIds.forEach(function (id) {
      var entry = sourceIndex[id];
      if (entry && entry.source && entry.source.url) {
        var a = el("a", {
          class: "cite",
          href: entry.source.url,
          target: "_blank",
          rel: "noopener",
          title: entry.source.title || entry.source.id
        }, String(entry.number));
        wrap.appendChild(a);
      } else if (entry) {
        wrap.appendChild(el("span", {
          class: "cite",
          title: (entry.source && entry.source.title) || id
        }, String(entry.number)));
      } else {
        // unknown id — degrade, don't crash
        wrap.appendChild(el("span", { class: "cite is-missing", title: "Unknown source id: " + id }, "?"));
      }
    });
    return wrap;
  }

  // ---- renderers ------------------------------------------------------------
  function safe(v, fallback) {
    return (v == null || v === "") ? (fallback || "") : String(v);
  }

  function renderSummary(data) {
    var titleEl = $("#page-title");
    var summaryEl = $("#page-summary");
    if (titleEl) titleEl.textContent = safe(data.title, "Deepwater Horizon");
    if (summaryEl) summaryEl.textContent = safe(data.summary, "Summary unavailable.");
    if (data.title) document.title = data.title + " — Causes, Timeline & Key Figures";
  }

  function renderTimeline(timeline, sourceIndex) {
    var list = $("#timeline-list");
    if (!list) return;
    list.innerHTML = "";

    var items = Array.isArray(timeline) ? timeline.slice() : [];
    // ascending by date (YYYY-MM-DD sorts lexicographically)
    items.sort(function (a, b) {
      return String(a && a.date).localeCompare(String(b && b.date));
    });

    if (items.length === 0) {
      list.appendChild(el("li", { text: "No timeline entries available." }));
      return;
    }

    items.forEach(function (ev) {
      var li = el("li", null, [
        el("span", { class: "t-date", text: safe(ev.date, "Date unknown") }),
        el("h3", { class: "t-title", text: safe(ev.title, "Untitled event") }),
        el("p", { class: "t-detail", text: safe(ev.detail, "") }),
        renderCitations(ev.sourceIds, sourceIndex)
      ]);
      list.appendChild(li);
    });
  }

  function renderCauses(causes, sourceIndex) {
    var container = $("#causes-list");
    if (!container) return;
    container.innerHTML = "";

    var items = Array.isArray(causes) ? causes : [];
    if (items.length === 0) {
      container.appendChild(el("p", { class: "view-lede", text: "No causes available." }));
      return;
    }

    items.forEach(function (c) {
      var card = el("div", { class: "card" }, [
        el("h3", { text: safe(c.title, "Untitled cause") }),
        el("p", { class: "detail", text: safe(c.detail, "") }),
        renderCitations(c.sourceIds, sourceIndex)
      ]);
      container.appendChild(card);
    });
  }

  function figureCard(f, sourceIndex) {
    var meta = el("p", { class: "card-meta" });
    meta.appendChild(document.createTextNode(safe(f.role, "Role unknown")));
    if (f.org) {
      meta.appendChild(el("span", { class: "org", text: " · " + f.org }));
    }
    return el("div", { class: "card" }, [
      el("h3", { text: safe(f.name, "Unnamed") }),
      meta,
      el("p", { class: "detail", text: safe(f.note, "") }),
      renderCitations(f.sourceIds, sourceIndex)
    ]);
  }

  function renderFigures(figures, sourceIndex) {
    var peopleEl = $("#figures-people");
    var orgsEl = $("#figures-orgs");
    if (!peopleEl || !orgsEl) return;
    peopleEl.innerHTML = "";
    orgsEl.innerHTML = "";

    var items = Array.isArray(figures) ? figures : [];
    var people = 0, orgs = 0;

    items.forEach(function (f) {
      if (isOrganization(f)) {
        orgsEl.appendChild(figureCard(f, sourceIndex));
        orgs++;
      } else {
        peopleEl.appendChild(figureCard(f, sourceIndex));
        people++;
      }
    });

    if (people === 0) peopleEl.appendChild(el("p", { class: "view-lede", text: "No individuals listed." }));
    if (orgs === 0) orgsEl.appendChild(el("p", { class: "view-lede", text: "No organizations listed." }));

    // reflect the actual rendered counts in the group headings (never hard-coded)
    var peopleTitle = document.querySelector("#view-figures .group-title");
    var orgsTitle = document.querySelectorAll("#view-figures .group-title")[1];
    if (peopleTitle) peopleTitle.textContent = "People (" + people + ")";
    if (orgsTitle) orgsTitle.textContent = "Organizations (" + orgs + ")";
  }

  function renderSources(sources) {
    var list = $("#sources-list");
    if (!list) return;
    list.innerHTML = "";

    var items = Array.isArray(sources) ? sources : [];
    if (items.length === 0) {
      list.appendChild(el("li", { text: "No sources available." }));
      return;
    }

    items.forEach(function (s) {
      var children = [];
      if (s.url) {
        children.push(el("a", {
          class: "src-title", href: s.url, target: "_blank", rel: "noopener"
        }, safe(s.title, s.url)));
      } else {
        children.push(el("span", { class: "src-title", text: safe(s.title, "Untitled source") }));
      }
      if (s.publisher) children.push(el("span", { class: "src-pub", text: s.publisher }));
      if (s.url) children.push(el("span", { class: "src-url", text: s.url }));
      var li = el("li", null, children);
      li.id = "source-" + safe(s.id, "");
      list.appendChild(li);
    });
  }

  // ---- tab navigation -------------------------------------------------------
  function setupTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
    var views = {
      timeline: $("#view-timeline"),
      causes: $("#view-causes"),
      figures: $("#view-figures")
    };

    function activate(name) {
      if (!views[name]) return;
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-view") === name;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      Object.keys(views).forEach(function (k) {
        if (views[k]) views[k].hidden = (k !== name);
      });
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", "#" + name);
      }
    }

    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        activate(t.getAttribute("data-view"));
      });
      // keyboard: left/right arrows move between tabs
      t.addEventListener("keydown", function (e) {
        var idx = tabs.indexOf(t);
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          var next = e.key === "ArrowRight" ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
          tabs[next].focus();
          activate(tabs[next].getAttribute("data-view"));
        }
      });
    });

    // honour deep link (#timeline / #causes / #figures)
    var hash = (window.location.hash || "").replace("#", "");
    activate(views[hash] ? hash : "timeline");
  }

  // ---- data loading + bootstrap --------------------------------------------
  function render(data) {
    var sourceIndex = buildSourceIndex(data.sources);
    renderSummary(data);
    renderTimeline(data.timeline, sourceIndex);
    renderCauses(data.causes, sourceIndex);
    renderFigures(data.figures, sourceIndex);
    renderSources(data.sources);
    setupTabs();
    hideStatus();
  }

  function isFileProtocol() {
    return window.location.protocol === "file:";
  }

  function handleLoadError(err) {
    // Reveal the views so the shell is visible, then explain the problem.
    ["#view-timeline", "#view-causes", "#view-figures"].forEach(function (s) {
      var v = $(s); if (v) v.hidden = false;
    });
    setupTabs();

    var detail = [];
    detail.push(el("p", { class: "detail", text: "Reason: " + (err && err.message ? err.message : String(err)) }));

    if (isFileProtocol()) {
      var hint = el("p", { class: "detail" });
      hint.appendChild(document.createTextNode("You appear to be opening this page via file:// . Browsers block fetch() of local files for security. Please serve the folder over HTTP instead, e.g. run "));
      hint.appendChild(el("code", { text: "python3 -m http.server" }));
      hint.appendChild(document.createTextNode(" inside the demo/ directory, then open "));
      hint.appendChild(el("code", { text: "http://localhost:8000/" }));
      hint.appendChild(document.createTextNode(" ."));
      detail.push(hint);
    } else {
      detail.push(el("p", { class: "detail", text: "Please confirm that ./data/findings.json exists and is valid JSON." }));
    }

    showFatal("Unable to load incident data.", detail);
  }

  function load() {
    showStatus("Loading data…", false);

    if (!window.fetch) {
      handleLoadError(new Error("This browser does not support fetch()."));
      return;
    }

    fetch(DATA_URL, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("HTTP " + res.status + " " + res.statusText + " while fetching " + DATA_URL);
        }
        return res.text();
      })
      .then(function (text) {
        var data;
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          throw new Error("The data file is not valid JSON (" + parseErr.message + ").");
        }
        if (!data || typeof data !== "object") {
          throw new Error("The data file did not contain a JSON object.");
        }
        render(data);
      })
      .catch(handleLoadError);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
