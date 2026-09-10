(function () {
  "use strict";
  var main = document.getElementById("main"),
    state = {
      offerings: [],
      settings: {},
      draft: {},
      token: null,
      receipt: null,
      busy: false,
      filter: { q: "", modality: "", city: "", page: 1 },
    };
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }
  function rpc(name, arg) {
    return new Promise(function (resolve, reject) {
      if (window.STEP_PREVIEW) {
        window.STEP_PREVIEW(name, arg).then(resolve, reject);
        return;
      }
      if (window.STEP_REMOTE) {
        window.STEP_REMOTE(name, arg).then(resolve, reject);
        return;
      }
      if (!window.google || !google.script) {
        reject(new Error("Service unavailable"));
        return;
      }
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        [name](arg);
    });
  }
  function go(route) {
    if (location.hash === "#" + route) render();
    else location.hash = route;
  }
  function offering() {
    return state.offerings.find(function (o) {
      return o.id === state.draft.offeringId;
    });
  }
  function button(label, route, style) {
    return (
      '<a class="btn ' +
      (style || "") +
      '" href="#' +
      route +
      '">' +
      label +
      "</a>"
    );
  }
  function card(o) {
    return (
      '<article class="card"><span class="tag">' +
      esc(o.modality) +
      "</span><h3>" +
      esc(o.courseName) +
      '</h3><p class="institution">' +
      esc(o.institution) +
      '</p><div class="card-meta"><span>' +
      esc(o.hours) +
      " hours</span><span>" +
      esc(o.city) +
      '</span></div><a class="card-link" href="#course/' +
      encodeURIComponent(o.id) +
      '">View course <span aria-hidden="true">↗</span></a></article>'
    );
  }
  function heading(k, title, description) {
    return (
      '<div class="page-heading"><div class="eyebrow">' +
      k +
      "</div><h1>" +
      title +
      "</h1>" +
      (description ? '<p class="muted">' + description + "</p>" : "") +
      "</div>"
    );
  }
  function howCards() {
    return '<div class="steps"><article class="step-card"><span class="step-number">01 / DISCOVER</span><h3>Find your next skill.</h3><p>Explore courses, compare training institutions, and find a modality and location that work for you.</p></article><article class="step-card"><span class="step-number">02 / APPLY</span><h3>Take the next step.</h3><p>Choose one offering, check eligibility, and complete your application. No sign-in needed.</p></article><article class="step-card"><span class="step-number">03 / REVIEW</span><h3>Start with a clear plan.</h3><p>Save your registration reference. APO staff will review your membership and application details.</p></article></div>';
  }
  function home() {
    return (
      '<section class="hero"><div><div class="eyebrow">Developmental Year ' +
      esc(state.settings.developmentalYear || "2026 - 2027") +
      ' · APO PHILIPPINES</div><h1>Skills for your<br>next <em>chapter.</em></h1><p class="intro">New skills. More possibilities. Discover training opportunities for APO members who are OFWs or Former OFWs, or family members of an OFW or Former OFW.</p><div class="actions">' +
      button(
        'Explore courses <span aria-hidden="true">↗</span>',
        "courses",
        "gold",
      ) +
      button("How the program works", "how", "secondary") +
      '</div><p class="helper" style="margin-top:20px">Explore first. Choose your course. Apply when you’re ready.</p></div><div class="hero-art" aria-label="STEP: Skills, Training, Empowerment, Progress"><div class="art-top"><span>LEARNING OPENS DOORS</span><span>2026 / 27</span></div><div class="art-word">STEP<span>.</span></div><div class="stairs" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="art-bottom">SKILLS. TRAINING.<br>EMPOWERMENT. PROGRESS.</div></div></section><div class="hero-foot"><small>A JOINT PROGRAM OF</small><p>Committee on Training and Skills Development <strong>(CTSD)</strong></p><p>Committee on Members’ Welfare and Development <strong>(CMWD)</strong></p></div><div class="wrap"><section class="section"><div class="section-head"><div><div class="eyebrow">YOUR NEXT STEP STARTS HERE</div><h2>Explore the possibilities.</h2></div><a href="#courses">View all offerings ↗</a></div><div class="grid">' +
      state.offerings.slice(0, 3).map(card).join("") +
      '</div></section><section class="section"><div class="eyebrow">A CLEAR PATH FORWARD</div><h2>From discovery to application.</h2>' +
      howCards() +
      "</section></div>"
    );
  }
  function options(values, selected) {
    return values
      .map(function (v) {
        return (
          "<option " +
          (v === selected ? "selected " : "") +
          'value="' +
          esc(v) +
          '">' +
          esc(v) +
          "</option>"
        );
      })
      .join("");
  }
  function courses() {
    var modes = Array.from(
        new Set(
          state.offerings.map(function (o) {
            return o.modality;
          }),
        ),
      ).sort(),
      cities = Array.from(
        new Set(
          state.offerings.map(function (o) {
            return o.city;
          }),
        ),
      ).sort();
    return (
      '<div class="wrap">' +
      heading("THE COURSE CATALOG", "Find a course. Build your future.", "") +
      '<div class="filters"><label>Search courses or institutions<input id="search" type="search" placeholder="What would you like to learn?" value="' +
      esc(state.filter.q) +
      '"></label><label>Modality<select id="modality"><option value="">All modalities</option>' +
      options(modes, state.filter.modality) +
      '</select></label><label>Location<select id="city"><option value="">All cities</option>' +
      options(cities, state.filter.city) +
      '</select></label><button class="filter-reset" id="reset">Clear filters</button></div><div id="results"></div></div>'
    );
  }
  function results() {
    var rows = StepCore.filterOfferings(
        state.offerings,
        state.filter.q,
        state.filter.modality,
        state.filter.city,
      ),
      pages = Math.max(1, Math.ceil(rows.length / 12));
    state.filter.page = Math.min(pages, state.filter.page);
    var start = (state.filter.page - 1) * 12;
    document.getElementById("results").innerHTML =
      '<div class="grid">' +
      rows
        .slice(start, start + 12)
        .map(card)
        .join("") +
      "</div>" +
      (rows.length
        ? ""
        : '<div class="empty"><h2>No matching courses</h2><p>Try another keyword or clear your filters.</p></div>') +
      (pages > 1
        ? '<div class="pagination"><button class="btn secondary" id="prev" ' +
          (state.filter.page === 1 ? "disabled" : "") +
          ">Previous</button><span>Page " +
          state.filter.page +
          " of " +
          pages +
          '</span><button class="btn secondary" id="next" ' +
          (state.filter.page === pages ? "disabled" : "") +
          ">Next</button></div>"
        : "") +
      '<div class="results-info" role="status"><span>' +
      rows.length +
      (rows.length === 1 ? " course offering" : " course offerings") +
      "</span></div>";
    ["prev", "next"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el)
        el.onclick = function () {
          state.filter.page += id === "next" ? 1 : -1;
          results();
          document.getElementById("results").scrollIntoView();
        };
    });
  }
  function facts(o) {
    return (
      '<dl class="detail-facts"><div><dt>Training institution</dt><dd>' +
      esc(o.institution) +
      "</dd></div><div><dt>Location</dt><dd>" +
      esc(o.city) +
      "</dd></div><div><dt>Learning modality</dt><dd>" +
      esc(o.modality) +
      "</dd></div><div><dt>Training hours</dt><dd>" +
      esc(o.hours) +
      " hours</dd></div></dl>"
    );
  }
  function detail(id) {
    var o = state.offerings.find(function (r) {
      return r.id === id;
    });
    if (!o)
      return (
        '<div class="wrap">' +
        heading(
          "COURSES",
          "Offering not found",
          "Please select an offering from the current catalog.",
        ) +
        button("Return to courses", "courses") +
        "</div>"
      );
    return (
      '<div class="wrap"><a class="back" href="#courses">← Back to courses</a><div class="detail-grid"><section class="panel"><span class="tag">' +
      esc(o.modality) +
      "</span><h1>" +
      esc(o.courseName) +
      "</h1>" +
      facts(o) +
      '<div class="callout">Each class requires 25 learners before training can begin. Please keep your phone lines open and check your email regularly for updates.</div></section><aside class="panel"><div class="eyebrow">MAKE YOUR NEXT MOVE</div><h2>Interested in this course?</h2><p class="muted">Review who can apply, then complete one application for this offering.</p><button class="btn gold" id="select-course" data-id="' +
      esc(o.id) +
      '">Select this course ↗</button><p class="helper" style="margin-top:16px">Application is subject to staff review. Submission does not guarantee enrollment.</p></aside></div></div>'
    );
  }
  function whatsappHelp() {
    var number = String(state.settings.whatsAppNumber || "");
    if (!state.settings.whatsAppEnabled || !/^[1-9][0-9]{6,14}$/.test(number))
      return "";
    return (
      '<section class="eligibility-contact" aria-labelledby="whatsapp-heading"><h2 id="whatsapp-heading">Questions about eligibility?</h2><p>Contact APO STEP on WhatsApp for assistance.</p><a id="whatsapp-contact" class="btn whatsapp-button" href="https://wa.me/' +
      number +
      '" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp (opens a new tab)">Chat on WhatsApp ↗</a></section>'
    );
  }
  function eligibility() {
    return (
      '<div class="wrap">' +
      heading(
        "WHO CAN APPLY",
        "A shared opportunity to grow.",
        "STEP welcomes eligible APO members and their families.",
      ) +
      '<div class="detail-grid"><section class="panel"><h2>Eligible participants</h2><ul class="checklist"><li>APO members who are OFWs or Former OFWs.</li><li>APO members who are parents, children, siblings, or spouses of an OFW or Former OFW.</li></ul><h2>Before you apply</h2><p>Have your own APO Chapter, Batch Year and ID ready. Every applicant must be an APO member; staff will verify membership manually. Family applicants provide their OFW relative’s information. The OFW relative does not need to be an APO member.</p><p>You may submit as many applications as you wish for available courses. Submit one application per course offering.</p></section><aside class="panel"><h2>' +
      (offering() ? esc(offering().courseName) : "Start with a course") +
      '</h2><p class="muted">' +
      (offering()
        ? esc(offering().institution) + " · " + esc(offering().city)
        : "Explore the catalog and select the institution, location, and modality that suit you.") +
      "</p>" +
      button(
        offering() ? "Proceed to registration" : "Explore courses",
        offering() ? "register" : "courses",
        "gold",
      ) +
      whatsappHelp() +
      "</aside></div></div>"
    );
  }
  function confirmation() {
    if (!state.receipt)
      return (
        '<div class="wrap">' +
        heading(
          "APPLICATIONS",
          "No receipt in this session.",
          "Receipts appear here after a confirmed submission.",
        ) +
        button("Explore courses", "courses") +
        "</div>"
      );
    return (
      '<div class="wrap"><section class="panel confirmation"><div class="symbol" aria-hidden="true">✓</div><div class="eyebrow">APPLICATION RECEIVED</div><h1>You’ve taken the next step.</h1><p>Your application has been recorded for APO staff review. This is not a confirmation of enrollment. An email confirmation is queued for delivery; keep your reference below even if email is delayed.</p><p>You may submit as many applications as you wish for available courses. Submit one application per course offering.</p><p class="helper">Save your registration reference</p><p class="receipt">' +
      esc(state.receipt.registrationId) +
      "</p>" +
      button("Explore more courses", "courses", "secondary") +
      "</section></div>"
    );
  }
  function render(force) {
    if (state.busy) return;
    var route = location.hash.slice(1) || "home";
    var registrationRoute =
      route === "register" || route.startsWith("register/");
    if (
      force !== true &&
      registrationRoute &&
      document.getElementById("application")
    ) {
      StepRegistration.navigate(route);
      return;
    }
    StepRegistration.destroy(route !== "confirmation");
    if (route === "home") main.innerHTML = home();
    else if (route === "courses") main.innerHTML = courses();
    else if (route.startsWith("course/"))
      main.innerHTML = detail(decodeURIComponent(route.slice(7)));
    else if (route === "how")
      main.innerHTML =
        '<div class="wrap">' +
        heading(
          "HOW STEP WORKS",
          "Discover. Understand. Apply.",
          "Understand your training options before you register.",
        ) +
        howCards() +
        button("Explore courses", "courses", "gold") +
        "</div>";
    else if (route === "eligibility") main.innerHTML = eligibility();
    else if (registrationRoute) main.innerHTML = StepRegistration.html();
    else if (route === "privacy")
      main.innerHTML =
        '<div class="wrap">' + StepRegistration.privacy() + "</div>";
    else if (route === "confirmation") main.innerHTML = confirmation();
    else
      main.innerHTML =
        '<div class="wrap">' +
        heading(
          "PAGE NOT FOUND",
          "Let’s get you back on track.",
          "Choose a page from the navigation.",
        ) +
        button("Home", "home") +
        "</div>";
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    if (route === "courses") {
      results();
      ["search", "modality", "city"].forEach(function (id) {
        document
          .getElementById(id)
          .addEventListener(id === "search" ? "input" : "change", function (e) {
            state.filter[id === "search" ? "q" : id] = e.target.value;
            state.filter.page = 1;
            results();
          });
      });
      document.getElementById("reset").onclick = function () {
        state.filter = { q: "", modality: "", city: "", page: 1 };
        render();
      };
    }
    var select = document.getElementById("select-course");
    if (select)
      select.onclick = function () {
        if (state.draft.offeringId !== select.dataset.id) state.token = null;
        state.draft.offeringId = select.dataset.id;
        state.receipt = null;
        go("eligibility");
      };
    if (registrationRoute) StepRegistration.mount(route);
  }
  StepRegistration.configure({
    redraw: function () {
      render(true);
    },
    state: state,
    esc: esc,
    rpc: rpc,
    go: go,
    offering: offering,
    facts: facts,
  });
  document.querySelector(".skip").onclick = function (e) {
    e.preventDefault();
    main.focus();
  };
  document.addEventListener(
    "click",
    function (e) {
      if (state.busy && e.target.closest("a, #form-back")) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
  window.addEventListener("hashchange", render);
  window.addEventListener("beforeunload", function (e) {
    if (Object.keys(state.draft).length > 1 && !state.receipt) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  rpc("getPublicData")
    .then(function (result) {
      if (!result.ok) throw new Error(result.message);
      state.offerings = result.offerings;
      state.settings = result.settings;
      document.getElementById("developmental-year").textContent =
        "Developmental Year " +
        (state.settings.developmentalYear || "2026 - 2027");
      StepOptions.configure(result.configuration);
      var notice = document.getElementById("notice");
      if (!state.settings.registrationEnabled || window.STEP_PREVIEW) {
        notice.hidden = false;
        notice.textContent = window.STEP_PREVIEW
          ? "LOCAL DEMO · Use synthetic information only. No data is sent to Google Sheets."
          : "Applications are not open yet. Explore courses while registration is being prepared.";
      }
      render();
    })
    .catch(function () {
      main.innerHTML =
        '<div class="wrap">' +
        heading(
          "PLEASE TRY AGAIN",
          "The catalog is temporarily unavailable.",
          "Refresh this page to retry. No application information has been submitted.",
        ) +
        '<button class="btn" onclick="location.reload()">Retry</button></div>';
    });
})();
