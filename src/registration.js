/* Continuous registration, native modal review/editing and section navigation. */
var StepRegistration = (function () {
  "use strict";
  var ctx,
    observer,
    resizeObserver,
    frame,
    scrollHandler,
    resizeHandler,
    drawerSection,
    drawerDraft;
  var sections = StepCore.sections;
  function configure(context) {
    ctx = context;
  }
  function e(value) {
    return ctx.esc(value);
  }
  function committees() {
    return '<p class="committee-credit">A joint program of the <strong>Committee on Training and Skills Development</strong> and the <strong>Committee on Members’ Welfare and Development</strong>.</p>';
  }
  function privacy() {
    var s = ctx.state.settings;
    return (
      '<div class="privacy-copy"><h2>APO STEP privacy and consent</h2><p>Alpha Phi Omega Philippines, Inc., through the Committee on Training and Skills Development and the Committee on Members’ Welfare and Development, processes application information to administer STEP.</p><p>Your information is used for eligibility and membership verification, OFW and family-status assessment, training coordination, participant communication, welfare support connected with the program, monitoring, evaluation, recordkeeping, and reporting. Authorized APO program staff may share relevant information with the selected training institution and authorized training or welfare partners when necessary for these stated purposes. Sharing must be relevant, proportionate, and subject to appropriate safeguards.</p><p>If you provide another person’s details, confirm that you are authorized to provide them for these purposes. Enter names exactly as shown on the relevant person’s passport.</p><p><strong>Retention:</strong> ' +
      e(s.retentionPeriod || "Through December 31, 2026") +
      '. Records are flagged for staff retention review after this cutoff; they are not automatically deleted or retained indefinitely.</p><p><strong>Privacy requests:</strong> Contact <a href="mailto:apocmwd2026.2027@gmail.com">apocmwd2026.2027@gmail.com</a> for access, correction, deletion, or withdrawal requests. Requests are reviewed in light of applicable obligations. Consent does not waive your privacy rights.</p><h3>Optional updates about other APO programs</h3><p>You may separately choose to receive information about future APO training and welfare opportunities. If you opt in, your name, contact details, and stated training interests may be used by authorized APO training and welfare committees and shared with authorized partners only as needed to coordinate those opportunities. This choice is optional, can be withdrawn, and does not affect your STEP application. The same stated retention cutoff applies; it does not authorize use beyond that period.</p><p class="helper">STEP notice: ' +
      e(s.consentVersion) +
      " · Other-program notice: " +
      e(s.otherProgramsConsentVersion) +
      "</p></div>"
    );
  }
  function consentFields(data, prefix) {
    return (
      privacy() +
      '<label class="consent-label"><input id="' +
      prefix +
      'consent" name="consent" type="checkbox" ' +
      (data.consent ? "checked" : "") +
      ' required><span>I have read the STEP notice and consent to the stated purposes. I confirm my details are accurate and I am authorized to provide any family member’s information. <strong>Required</strong></span></label><span class="error" id="' +
      prefix +
      'error-consent"></span><label class="consent-label optional-consent"><input id="' +
      prefix +
      'otherProgramsConsent" name="otherProgramsConsent" type="checkbox" ' +
      (data.otherProgramsConsent ? "checked" : "") +
      "><span>I also consent to receive information about other APO training and welfare opportunities and the limited sharing described above. <strong>Optional</strong></span></label>"
    );
  }
  function field(f, data, prefix) {
    var id = prefix + f.id,
      value = data[f.id] || "",
      isVisible = StepCore.visible(f, data),
      hint =
        f.hint ||
        (f.id === "membershipNumber"
          ? "Enter only the number parts of your APO ID. Keep leading zeros."
          : f.id === "batchYear"
            ? "Enter the four-digit year of your batch."
            : "");
    var attrs =
      ' id="' +
      id +
      '" name="' +
      f.id +
      '" ' +
      (f.required && isVisible ? "required " : "") +
      (!isVisible ? "disabled " : "") +
      (hint ? 'aria-describedby="' + id + '-hint" ' : "");
    var input =
      f.type === "select"
        ? "<select" +
          attrs +
          '><option value="">Select an option</option>' +
          f.options
            .map(function (v) {
              return (
                '<option value="' +
                e(v) +
                '" ' +
                (v === value ? "selected" : "") +
                ">" +
                e(v) +
                "</option>"
              );
            })
            .join("") +
          "</select>"
        : "<input" +
          attrs +
          ' type="' +
          f.type +
          '" value="' +
          e(value) +
          '" maxlength="' +
          (f.id === "batchYear" ? 4 : 300) +
          '" ' +
          (["membershipNumber", "batchYear"].indexOf(f.id) >= 0
            ? 'inputmode="numeric" pattern="' +
              (f.id === "batchYear" ? "[0-9]{4}" : "[0-9]+") +
              '" '
            : "") +
          (f.id === "country" ? 'list="' + prefix + 'country-hints" ' : "") +
          ">";
    return (
      '<div class="field" data-field="' +
      f.id +
      '" ' +
      (!isVisible ? "hidden" : "") +
      '><label for="' +
      id +
      '">' +
      e(f.label) +
      (f.required
        ? ' <span aria-hidden="true">*</span>'
        : ' <span class="muted">(optional)</span>') +
      "</label>" +
      input +
      (hint
        ? '<p class="helper" id="' + id + '-hint">' + e(hint) + "</p>"
        : "") +
      '<span class="error" id="' +
      prefix +
      "error-" +
      f.id +
      '"></span></div>'
    );
  }
  function content(section, data, prefix) {
    if (section === "consent") return consentFields(data, prefix);
    return (
      '<div class="form-grid">' +
      StepCore.fields
        .filter(function (f) {
          return f.section === section;
        })
        .map(function (f) {
          return field(f, data, prefix);
        })
        .join("") +
      "</div>" +
      (section === "ofw-details"
        ? '<datalist id="' +
          prefix +
          'country-hints"><option value="Seabased OFW"></datalist>'
        : "")
    );
  }
  function html() {
    var o = ctx.offering();
    if (!o)
      return '<div class="wrap"><h1>Choose your course first.</h1><p>Select an offering before applying.</p><a class="btn" href="#courses">Explore courses</a></div>';
    return (
      '<div class="wrap registration-wrap"><div class="page-heading"><div class="eyebrow">YOUR STEP APPLICATION</div><h1>A new chapter starts with you.</h1>' +
      committees() +
      '<p>Start with the qualifying APO member’s details, including when applying as a family member. Fields marked * are required.</p></div><div class="form-layout"><aside class="registration-rail"><nav class="section-nav" aria-label="On this page"><strong>On this page</strong><div class="section-links">' +
      sections
        .map(function (s, i) {
          return (
            '<a href="#register/' +
            s.id +
            '" data-section-link="' +
            s.id +
            '" ' +
            (i === 0 ? 'aria-current="location"' : "") +
            ">" +
            s.label +
            "</a>"
          );
        })
        .join("") +
      '</div></nav><div class="selected-summary"><strong>' +
      e(o.courseName) +
      "</strong>" +
      e(o.institution) +
      "<br>" +
      e(o.city) +
      " · " +
      e(o.hours) +
      ' hours<br><a href="#courses">Change course</a></div></aside><form id="application" novalidate><div id="form-errors" role="alert"></div>' +
      sections
        .map(function (s) {
          return (
            '<section class="panel registration-section" id="register/' +
            s.id +
            '" data-section="' +
            s.id +
            '" aria-labelledby="heading-' +
            s.id +
            '"><h2 id="heading-' +
            s.id +
            '">' +
            s.label +
            "</h2>" +
            content(s.id, ctx.state.draft, "") +
            "</section>"
          );
        })
        .join("") +
      '<div class="hp" aria-hidden="true"><label>Website<input id="website" name="website" tabindex="-1" autocomplete="off"></label></div><div class="form-actions"><span class="helper">Review all details before submitting.</span><button class="btn gold" type="submit" id="review-application">Review application →</button></div></form></div></div><dialog id="review-dialog" class="review-dialog" aria-labelledby="review-title"><div class="dialog-top"><h2 id="review-title" tabindex="-1">Review your application</h2><button class="icon-close" type="button" data-close-review aria-label="Close review">×</button></div><div id="review-content"></div><div id="submission-errors" role="alert"></div><div id="retry-actions"></div><div class="dialog-actions"><button class="btn secondary" type="button" data-close-review>Back to application</button><button class="btn gold" id="send-application" type="button">Submit application</button></div></dialog><dialog id="edit-dialog" class="edit-dialog" aria-labelledby="edit-title"><form id="edit-form" novalidate><div class="dialog-top"><h2 id="edit-title" tabindex="-1"></h2><button class="icon-close" type="button" id="cancel-edit-top" aria-label="Cancel editing">×</button></div><div id="edit-errors" role="alert"></div><div id="edit-content"></div><div class="dialog-actions"><button class="btn secondary" id="cancel-edit" type="button">Cancel</button><button class="btn gold" type="submit">Save changes</button></div></form></dialog>'
    );
  }
  function read(root, data) {
    var next = Object.assign({}, data);
    root.querySelectorAll("input[name],select[name]").forEach(function (el) {
      if (el.name === "website") return;
      next[el.name] = el.type === "checkbox" ? el.checked : el.value;
    });
    return next;
  }
  function capture() {
    var root = document.getElementById("application");
    if (root) ctx.state.draft = read(root, ctx.state.draft);
  }
  function conditional(root, data) {
    root.querySelectorAll("[data-field]").forEach(function (w) {
      var f = StepCore.fields.find(function (x) {
          return x.id === w.dataset.field;
        }),
        v = StepCore.visible(f, data);
      w.hidden = !v;
      var input = w.querySelector("input,select");
      input.disabled = !v;
      input.required = v && f.required;
    });
  }
  function syncForm() {
    var root = document.getElementById("application");
    StepCore.fields.forEach(function (f) {
      var el = root.querySelector('[name="' + f.id + '"]');
      if (el) el.value = ctx.state.draft[f.id] || "";
    });
    ["consent", "otherProgramsConsent"].forEach(function (k) {
      root.querySelector('[name="' + k + '"]').checked =
        ctx.state.draft[k] === true;
    });
    conditional(root, ctx.state.draft);
  }
  function errors(root, items, summary, prefix) {
    root.querySelectorAll("[aria-invalid]").forEach(function (el) {
      el.removeAttribute("aria-invalid");
      var hint = document.getElementById(el.id + "-hint");
      if (hint) el.setAttribute("aria-describedby", hint.id);
      else el.removeAttribute("aria-describedby");
    });
    root.querySelectorAll(".error").forEach(function (el) {
      el.textContent = "";
    });
    var keys = Object.keys(items);
    summary.innerHTML = keys.length
      ? '<div class="error-summary">Please check the highlighted fields.</div>'
      : "";
    keys.forEach(function (k) {
      var input = root.querySelector('[name="' + k + '"]'),
        hint = document.getElementById(prefix + "error-" + k);
      if (input) {
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", prefix + "error-" + k);
      }
      if (hint) hint.textContent = items[k];
    });
    var first = root.querySelector('[aria-invalid="true"]');
    if (first) {
      first.focus({ preventScroll: true });
      first.scrollIntoView({ block: "center", behavior: "auto" });
    }
    return keys.length;
  }
  function reviewMarkup() {
    var d = StepCore.clean(ctx.state.draft),
      o = ctx.offering();
    return (
      "<p>Confirm your details before submitting. Your application will be reviewed by APO staff.</p><h3>" +
      e(o.courseName) +
      "</h3>" +
      ctx.facts(o) +
      sections
        .map(function (s) {
          return (
            '<section class="review-section"><div class="section-head"><h3>' +
            s.label +
            '</h3><button type="button" class="text-button" data-edit="' +
            s.id +
            '">Edit <span class="sr-only">' +
            s.label +
            "</span></button></div>" +
            (s.id === "consent"
              ? "<p>STEP consent: Accepted<br>Other APO programs: " +
                (d.otherProgramsConsent ? "Opted in" : "Not opted in") +
                "</p>"
              : '<dl class="review">' +
                StepCore.fields
                  .filter(function (f) {
                    return f.section === s.id && StepCore.visible(f, d);
                  })
                  .map(function (f) {
                    return (
                      "<div><dt>" +
                      e(f.label) +
                      "</dt><dd>" +
                      e(d[f.id] || "Not provided") +
                      "</dd></div>"
                    );
                  })
                  .join("") +
                "</dl>") +
            "</section>"
          );
        })
        .join("")
    );
  }
  function openReview(focusSection) {
    var dialog = document.getElementById("review-dialog");
    document.getElementById("review-content").innerHTML = reviewMarkup();
    document.getElementById("submission-errors").textContent = "";
    document.getElementById("retry-actions").textContent = "";
    dialog.showModal();
    var focus = focusSection
      ? dialog.querySelector('[data-edit="' + focusSection + '"]')
      : document.getElementById("review-title");
    focus.focus();
    dialog.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.onclick = function () {
        openEditor(btn.dataset.edit);
      };
    });
  }
  function closeReview() {
    if (ctx.state.busy) return;
    document.getElementById("review-dialog").close();
    document.getElementById("review-application").focus();
  }
  function openEditor(section) {
    drawerSection = section;
    drawerDraft = Object.assign({}, ctx.state.draft);
    document.getElementById("review-dialog").close();
    var title = sections.find(function (s) {
      return s.id === section;
    }).label;
    document.getElementById("edit-title").textContent = "Edit " + title;
    document.getElementById("edit-errors").textContent = "";
    document.getElementById("edit-content").innerHTML = content(
      section,
      drawerDraft,
      "edit-",
    );
    var dialog = document.getElementById("edit-dialog");
    dialog.showModal();
    document.getElementById("edit-title").focus();
  }
  function finishEditor(save) {
    var form = document.getElementById("edit-form");
    if (save) {
      drawerDraft = read(form, drawerDraft);
      var validation = StepCore.validate(drawerDraft, drawerSection),
        issues = validation.errors;
      if (drawerSection === "consent" && !drawerDraft.consent)
        issues.consent = "Please accept the required STEP consent.";
      if (errors(form, issues, document.getElementById("edit-errors"), "edit-"))
        return;
      ctx.state.draft = drawerDraft;
      syncForm();
    }
    document.getElementById("edit-dialog").close();
    openReview(drawerSection);
  }
  async function send() {
    if (ctx.state.busy) return;
    var validation = StepCore.validate(ctx.state.draft);
    if (Object.keys(validation.errors).length) {
      document.getElementById("review-dialog").close();
      errors(
        document.getElementById("application"),
        validation.errors,
        document.getElementById("form-errors"),
        "",
      );
      return;
    }
    ctx.state.busy = true;
    var dialog = document.getElementById("review-dialog"),
      button = document.getElementById("send-application");
    dialog.querySelectorAll("button").forEach(function (b) {
      b.disabled = true;
    });
    button.textContent = "Submitting…";
    var summary = document.getElementById("submission-errors");
    try {
      if (!ctx.state.token) {
        var issued = await ctx.rpc("issueSubmissionToken");
        if (!issued.ok) {
          summary.textContent = issued.message;
          return;
        }
        ctx.state.token = issued.token;
      }
      var data = Object.assign({}, ctx.state.draft, {
        consentVersion: ctx.state.settings.consentVersion,
        otherProgramsConsentVersion:
          ctx.state.settings.otherProgramsConsentVersion,
      });
      var response = await ctx.rpc("submitApplication", {
        token: ctx.state.token,
        data: data,
        website: document.getElementById("website").value,
      });
      if (response.ok) {
        ctx.state.receipt = response;
        ctx.state.draft = {};
        ctx.state.token = null;
        dialog.close();
        ctx.state.busy = false;
        ctx.go("confirmation");
        return;
      }
      summary.textContent = response.message;
      if (
        response.code === "TOKEN_EXPIRED" ||
        response.code === "TOKEN_INVALID"
      ) {
        document.getElementById("retry-actions").innerHTML =
          '<button class="btn secondary" id="refresh-session" type="button">Refresh submission session</button>';
        document.getElementById("refresh-session").onclick = function () {
          ctx.state.token = null;
          document.getElementById("retry-actions").textContent = "";
          summary.textContent = "Session refreshed. Submit again when ready.";
        };
      }
      if (response.errors) {
        dialog.close();
        errors(
          document.getElementById("application"),
          response.errors,
          document.getElementById("form-errors"),
          "",
        );
      }
    } catch (err) {
      summary.textContent =
        "We could not confirm your submission. Keep this page open and retry; your answers are preserved.";
    } finally {
      ctx.state.busy = false;
      if (document.contains(button)) {
        dialog.querySelectorAll("button").forEach(function (b) {
          b.disabled = false;
        });
        button.textContent = "Submit application";
      }
    }
  }
  function activeSection() {
    var targets = Array.from(
      document.querySelectorAll(".registration-section"),
    );
    if (!targets.length) return;
    var offset =
        parseFloat(
          document.documentElement.style.getPropertyValue("--section-offset"),
        ) || 110,
      chosen = targets[0];
    targets.forEach(function (s) {
      if (s.getBoundingClientRect().top <= offset + 70) chosen = s;
    });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4)
      chosen = targets[targets.length - 1];
    document.querySelectorAll("[data-section-link]").forEach(function (a) {
      if (a.dataset.sectionLink === chosen.dataset.section) {
        var changed = a.getAttribute("aria-current") !== "location";
        a.setAttribute("aria-current", "location");
        if (changed && innerWidth <= 700) {
          var rail = a.parentElement,
            linkBox = a.getBoundingClientRect(),
            railBox = rail.getBoundingClientRect();
          if (linkBox.left < railBox.left)
            rail.scrollLeft += linkBox.left - railBox.left;
          else if (linkBox.right > railBox.right)
            rail.scrollLeft += linkBox.right - railBox.right;
        }
      } else a.removeAttribute("aria-current");
    });
  }
  function observe() {
    if (observer) observer.disconnect();
    var header = document.querySelector(".site-header"),
      nav = document.querySelector(".section-nav"),
      offset =
        Math.ceil(header.getBoundingClientRect().height) +
        (innerWidth <= 700
          ? Math.ceil(nav.getBoundingClientRect().height)
          : 0) +
        16;
    document.documentElement.style.setProperty(
      "--header-height",
      Math.ceil(header.getBoundingClientRect().height) + "px",
    );
    document.documentElement.style.setProperty(
      "--section-offset",
      offset + "px",
    );
    observer = new IntersectionObserver(activeSection, {
      rootMargin: "-" + offset + "px 0px -45% 0px",
      threshold: [0, 0.1, 0.5, 1],
    });
    document.querySelectorAll(".registration-section").forEach(function (s) {
      observer.observe(s);
    });
    activeSection();
  }
  function navigate(fragment) {
    var id = fragment.replace(/^register\/?/, "");
    if (!id) return;
    var target = document.getElementById("register/" + id);
    if (target)
      target.scrollIntoView({
        block: "start",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  }
  function keepModalFocus(event) {
    if (event.key !== "Tab") return;
    var dialog = event.currentTarget;
    var controls = Array.from(
      dialog.querySelectorAll(
        'a[href],button,input,select,textarea,[tabindex="0"]',
      ),
    ).filter(function (el) {
      return !el.disabled && el.tabIndex >= 0 && el.getClientRects().length > 0;
    });
    if (!controls.length) {
      event.preventDefault();
      return;
    }
    var index = controls.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      controls[controls.length - 1].focus();
    } else if (!event.shiftKey && index === controls.length - 1) {
      event.preventDefault();
      controls[0].focus();
    }
  }
  function mount(fragment) {
    var form = document.getElementById("application");
    if (!form) return;
    ["review-dialog", "edit-dialog"].forEach(function (id) {
      document.getElementById(id).addEventListener("keydown", keepModalFocus);
    });
    form.addEventListener("input", function () {
      capture();
    });
    form.addEventListener("change", function () {
      capture();
      conditional(form, ctx.state.draft);
      activeSection();
    });
    form.onsubmit = function (event) {
      event.preventDefault();
      capture();
      var validation = StepCore.validate(ctx.state.draft);
      if (
        errors(
          form,
          validation.errors,
          document.getElementById("form-errors"),
          "",
        )
      )
        return;
      openReview();
    };
    document.querySelectorAll("[data-close-review]").forEach(function (b) {
      b.onclick = closeReview;
    });
    document
      .getElementById("review-dialog")
      .addEventListener("cancel", function (event) {
        event.preventDefault();
        closeReview();
      });
    document.getElementById("send-application").onclick = send;
    document
      .getElementById("edit-dialog")
      .addEventListener("cancel", function (event) {
        event.preventDefault();
        finishEditor(false);
      });
    document.getElementById("cancel-edit").onclick = document.getElementById(
      "cancel-edit-top",
    ).onclick = function () {
      finishEditor(false);
    };
    var edit = document.getElementById("edit-form");
    edit.oninput = function () {
      drawerDraft = read(edit, drawerDraft);
    };
    edit.onchange = function () {
      drawerDraft = read(edit, drawerDraft);
      conditional(edit, drawerDraft);
    };
    edit.onsubmit = function (event) {
      event.preventDefault();
      finishEditor(true);
    };
    scrollHandler = function () {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(activeSection);
    };
    resizeHandler = observe;
    window.addEventListener("scroll", scrollHandler, { passive: true });
    window.addEventListener("resize", resizeHandler);
    resizeObserver = new ResizeObserver(observe);
    resizeObserver.observe(document.querySelector(".site-header"));
    observe();
    navigate(fragment || "");
  }
  function destroy(preserve) {
    if (preserve !== false) capture();
    if (observer) observer.disconnect();
    if (resizeObserver) resizeObserver.disconnect();
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener("scroll", scrollHandler);
    window.removeEventListener("resize", resizeHandler);
    ["review-dialog", "edit-dialog"].forEach(function (id) {
      var d = document.getElementById(id);
      if (d && d.open) d.close();
    });
  }
  return {
    configure: configure,
    html: html,
    mount: mount,
    navigate: navigate,
    destroy: destroy,
    capture: capture,
    privacy: privacy,
  };
})();
