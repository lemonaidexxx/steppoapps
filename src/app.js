(function () {
  "use strict";
  var main = document.getElementById("main"),
    state = {
      offerings: [],
      settings: {},
      draft: {},
      step: 0,
      token: null,
      receipt: null,
      busy: false,
      filter: { q: "", modality: "", city: "", page: 1 },
    };
  var steps = [
    "Your details",
    "APO & OFW",
    "Philippine address",
    "Training goals",
    "Privacy & consent",
    "Review",
  ];
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
      '</h1><p class="muted">' +
      description +
      "</p></div>"
    );
  }
  function howCards() {
    return '<div class="steps"><article class="step-card"><span class="step-number">01 / DISCOVER</span><h3>Find your next skill.</h3><p>Explore courses, compare training institutions, and find a modality and location that work for you.</p></article><article class="step-card"><span class="step-number">02 / APPLY</span><h3>Take the next step.</h3><p>Choose one offering, check eligibility, and complete your application. No sign-in needed.</p></article><article class="step-card"><span class="step-number">03 / REVIEW</span><h3>Start with a clear plan.</h3><p>Save your registration reference. APO staff will review your membership and application details.</p></article></div>';
  }
  function home() {
    return (
      '<section class="hero"><div><div class="eyebrow">DISTRICT YEAR 2026–2027 · APO PHILIPPINES</div><h1>Skills for your<br>next <em>chapter.</em></h1><p class="intro">New skills. More possibilities. Discover training opportunities for APO members who are current or former OFWs, and their eligible family members.</p><div class="actions">' +
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
      heading(
        "THE COURSE CATALOG",
        "Find a course. Build your future.",
        "Compare training options by institution, learning modality, hours, and city.",
      ) +
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
      '<div class="results-info" role="status"><span>' +
      rows.length +
      ' course offerings</span><span>City-level locations</span></div><div class="grid">' +
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
        : "");
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
      '<div class="callout">Schedules, street addresses, and course-specific requirements are not listed in the supplied catalog.</div></section><aside class="panel"><div class="eyebrow">MAKE YOUR NEXT MOVE</div><h2>Interested in this course?</h2><p class="muted">Review who can apply, then complete one application for this offering.</p><button class="btn gold" id="select-course" data-id="' +
      esc(o.id) +
      '">Select this course ↗</button><p class="helper" style="margin-top:16px">Application is subject to staff review. Submission does not guarantee enrollment.</p></aside></div></div>'
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
      '<div class="detail-grid"><section class="panel"><h2>Eligible participants</h2><ul class="checklist"><li>APO members who are current OFWs.</li><li>APO members who are former OFWs.</li><li>Their parents, children, siblings, or spouses.</li></ul><h2>Before you apply</h2><p>Have the qualifying APO member’s membership number ready. Staff will check membership manually. Family applicants also provide their relationship and the member’s identifying information.</p><p>Choose one course offering per application. You can submit a separate application later.</p></section><aside class="panel"><h2>' +
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
      "</aside></div></div>"
    );
  }
  function privacy() {
    return (
      '<div class="privacy-copy"><h2>APO STEP privacy and consent</h2><p>Alpha Phi Omega Philippines, Inc., through the Committee on Training and Skills Development and the Committee on Members’ Welfare and Development, will use your application information to administer STEP.</p><p>The information you provide will be used to assess eligibility, verify APO membership and OFW or family status, coordinate training applications, contact you about your application, and monitor and report on program participation. Authorized APO program staff will review the records. Where necessary for your selected training application, relevant information may be shared with the selected training institution for coordination.</p><p>Provide only information needed for this application. If you provide a family member’s information, confirm that you are authorized to provide it for these purposes.</p><p><strong>Retention:</strong> ' +
      esc(state.settings.retentionPeriod) +
      ".</p><p><strong>Privacy requests:</strong> Contact " +
      esc(state.settings.privacyContact) +
      ' to request access, correction, deletion, or withdrawal of consent. Requests will be reviewed in light of applicable obligations and the status of your application.</p><p>Consent covers these stated STEP purposes. It does not waive your privacy rights or authorize unrelated uses.</p><p class="helper">Notice version: ' +
      esc(state.settings.consentVersion) +
      "</p></div>"
    );
  }
  function fieldHtml(f) {
    var value = state.draft[f.id] || "",
      input =
        f.type === "select"
          ? '<select id="' +
            f.id +
            '" name="' +
            f.id +
            '" ' +
            (f.required ? "required" : "") +
            '><option value="">Select an option</option>' +
            options(f.options, value) +
            "</select>"
          : '<input id="' +
            f.id +
            '" name="' +
            f.id +
            '" type="' +
            f.type +
            '" value="' +
            esc(value) +
            '" maxlength="300" ' +
            (f.required ? "required " : "") +
            (f.id === "country" ? 'list="country-hints" ' : "") +
            ">";
    return (
      '<div class="field"><label for="' +
      f.id +
      '">' +
      esc(f.label) +
      (f.required
        ? ' <span aria-hidden="true">*</span>'
        : ' <span class="muted">(optional)</span>') +
      "</label>" +
      input +
      '<span class="error" id="error-' +
      f.id +
      '"></span></div>'
    );
  }
  function capture() {
    if (!document.getElementById("application")) return;
    StepCore.fields.forEach(function (f) {
      var el = document.getElementById(f.id);
      if (el) state.draft[f.id] = el.value;
    });
    var consent = document.getElementById("consent");
    if (consent) state.draft.consent = consent.checked;
  }
  function registration() {
    var o = offering();
    if (!o)
      return (
        '<div class="wrap">' +
        heading(
          "REGISTRATION",
          "Choose your course first.",
          "Browse the catalog and select one offering before applying.",
        ) +
        button("Explore courses", "courses") +
        "</div>"
      );
    var content = "";
    if (state.step < 4) {
      content =
        "<h2>" +
        steps[state.step] +
        '</h2><p class="helper">Fields marked * are required. ' +
        (state.step === 0
          ? "Use your complete name as it appears on your passport. International contact numbers are accepted."
          : state.step === 1
            ? "For former OFWs, use the most recent deployment and occupation."
            : state.step === 2
              ? "For NCR, enter Metro Manila in the province field."
              : "") +
        '</p><div class="form-grid">' +
        StepCore.fields
          .filter(function (f) {
            return f.step === state.step && StepCore.visible(f, state.draft);
          })
          .map(fieldHtml)
          .join("") +
        '</div><datalist id="country-hints"><option value="Seabased OFW"></datalist>';
    } else if (state.step === 4) {
      content =
        privacy() +
        '<label class="consent-label"><input type="checkbox" id="consent" ' +
        (state.draft.consent ? "checked" : "") +
        '> <span>I have read the notice and consent to the stated STEP purposes. I confirm that the details are accurate and that I am authorized to provide any family member’s information.</span></label><span id="error-consent" class="error"></span>';
    } else {
      content =
        '<h2>Review your application</h2><p class="muted">Check your details before submitting. Use Back to make corrections.</p>' +
        facts(o) +
        '<dl class="review">' +
        StepCore.fields
          .filter(function (f) {
            return StepCore.visible(f, state.draft);
          })
          .map(function (f) {
            return (
              "<div><dt>" +
              esc(f.label) +
              "</dt><dd>" +
              esc(state.draft[f.id] || "Not provided") +
              "</dd></div>"
            );
          })
          .join("") +
        '</dl><p class="helper">Privacy consent accepted · ' +
        esc(state.settings.consentVersion) +
        "</p>";
    }
    return (
      '<div class="wrap">' +
      heading(
        "YOUR STEP APPLICATION",
        "A new chapter starts with you.",
        "Selected course: " + esc(o.courseName),
      ) +
      '<div class="form-layout"><aside><ol class="progress" aria-label="Application progress">' +
      steps
        .map(function (s, i) {
          return (
            '<li class="' +
            (i === state.step ? "active" : "") +
            '" ' +
            (i === state.step ? 'aria-current="step"' : "") +
            "><small>" +
            ("0" + (i + 1)) +
            "</small> " +
            s +
            "</li>"
          );
        })
        .join("") +
      '</ol><div class="selected-summary"><strong>' +
      esc(o.courseName) +
      "</strong>" +
      esc(o.institution) +
      "<br>" +
      esc(o.city) +
      " · " +
      esc(o.hours) +
      ' hours<br><a href="#courses">Change course</a></div></aside><form class="panel" id="application" novalidate><div id="form-errors" role="alert"></div>' +
      content +
      '<div class="hp" aria-hidden="true"><label for="website">Website<input id="website" name="website" tabindex="-1" autocomplete="off"></label></div><div class="form-actions"><button class="btn secondary" type="button" id="form-back">' +
      (state.step ? "Back" : "Eligibility") +
      '</button><button class="btn gold" id="form-next" type="submit">' +
      (state.step === 5 ? "Submit application" : "Continue →") +
      '</button></div><div id="retry-actions"></div></form></div></div>'
    );
  }
  function showErrors(errors, message) {
    document.getElementById("form-errors").innerHTML =
      '<div class="error-summary">' +
      esc(message || "Please check the fields below.") +
      "</div>";
    Object.keys(errors || {}).forEach(function (id) {
      var el = document.getElementById(id),
        hint = document.getElementById("error-" + id);
      if (el) {
        el.setAttribute("aria-invalid", "true");
        el.setAttribute("aria-describedby", "error-" + id);
      }
      if (hint) hint.textContent = errors[id];
    });
    var first = document.getElementById(Object.keys(errors || {})[0]);
    if (first) first.focus();
    else document.getElementById("form-errors").scrollIntoView();
  }
  async function submit() {
    if (state.busy) return;
    state.busy = true;
    var btn = document.getElementById("form-next");
    btn.disabled = true;
    btn.textContent = "Submitting…";
    try {
      if (!state.token) {
        var issued = await rpc("issueSubmissionToken");
        if (!issued.ok) {
          showErrors({}, issued.message);
          return;
        }
        state.token = issued.token;
      }
      state.draft.consentVersion = state.settings.consentVersion;
      var response = await rpc("submitApplication", {
        token: state.token,
        data: state.draft,
        website: document.getElementById("website").value,
      });
      if (response.ok) {
        state.receipt = response;
        state.draft = {};
        state.token = null;
        go("confirmation");
      } else {
        showErrors(response.errors || {}, response.message);
        if (
          response.code === "TOKEN_EXPIRED" ||
          response.code === "TOKEN_INVALID"
        ) {
          document.getElementById("retry-actions").innerHTML =
            '<button type="button" class="btn secondary" id="refresh-token">Refresh submission session</button>';
          document.getElementById("refresh-token").onclick = function () {
            state.token = null;
            document.getElementById("retry-actions").innerHTML = "";
            showErrors(
              {},
              "Session refreshed. Review your details and submit again.",
            );
          };
        }
      }
    } catch (e) {
      showErrors(
        {},
        "We could not confirm your submission. Keep this page open and retry. Your details are preserved.",
      );
    } finally {
      state.busy = false;
      if (document.contains(btn)) {
        btn.disabled = false;
        btn.textContent = "Submit application";
      }
    }
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
      '<div class="wrap"><section class="panel confirmation"><div class="symbol" aria-hidden="true">✓</div><div class="eyebrow">APPLICATION RECEIVED</div><h1>You’ve taken the next step.</h1><p>Your application has been recorded for APO staff review. This is not a confirmation of enrollment.</p><p class="helper">Save your registration reference</p><p class="receipt">' +
      esc(state.receipt.registrationId) +
      "</p>" +
      button("Explore more courses", "courses", "secondary") +
      "</section></div>"
    );
  }
  function render() {
    if (state.busy) return;
    var route = location.hash.slice(1) || "home";
    if (route !== "register") capture();
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
    else if (route === "register") main.innerHTML = registration();
    else if (route === "privacy")
      main.innerHTML = '<div class="wrap">' + privacy() + "</div>";
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
        state.step = 0;
        go("eligibility");
      };
    var form = document.getElementById("application");
    if (form) {
      ["category", "goal"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el)
          el.onchange = function () {
            capture();
            render();
            document.getElementById(id).focus();
          };
      });
      document.getElementById("form-back").onclick = function () {
        capture();
        if (state.step) {
          state.step--;
          render();
        } else go("eligibility");
      };
      form.onsubmit = function (e) {
        e.preventDefault();
        capture();
        if (state.step === 5) {
          submit();
          return;
        }
        var check =
          state.step < 4
            ? StepCore.validate(state.draft, state.step)
            : {
                errors: state.draft.consent
                  ? {}
                  : { consent: "Please read and accept the notice." },
              };
        if (Object.keys(check.errors).length) {
          showErrors(check.errors);
          return;
        }
        state.step++;
        render();
      };
    }
  }
  document.querySelector(".skip").onclick = function (e) {
    e.preventDefault();
    main.focus();
  };
  document.addEventListener("click", function(e) {
    if (state.busy && e.target.closest("a, #form-back")) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
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
