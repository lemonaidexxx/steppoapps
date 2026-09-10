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
    return (
      '<div class="privacy-copy"><h2>APO Data Privacy and Consent</h2><p>Alpha Phi Omega Philippines, Inc., through the Committee on Training and Skills Development and the Committee on Members’ Welfare and Development, administers STEP and related APO training, welfare, referral and support services.</p><h3>Information and purposes</h3><p>By submitting this form, you freely and voluntarily consent to APO’s collection, verification, use, storage, updating, sharing and other lawful processing of the information you or your authorized representative provide. This includes your identity, membership, contact, deployment, Philippine address, selected training and training goals, and your OFW relative’s information when you apply as a family member.</p><p>These details support eligibility and membership verification, application administration, training coordination, welfare assistance, referrals, employment and reintegration support, participant communication, monitoring, recordkeeping, reporting and evaluation of APO programs and related services.</p><h3>Contact and authorized sharing</h3><p>Authorized representatives may contact you by call, text message, email or other official channels using the details you supply for verification, application updates, training, assistance, referrals and related APO service communications.</p><p>Where necessary for these declared purposes, APO may provide relevant and proportionate information to authorized APO offices and committees, training institutions, government agencies, service providers, program and welfare partners, and other authorized stakeholders involved in delivering or coordinating those services. This may include TESDA, OWWA, DMW, DOLE and local government units when relevant to a referral or service; listing them does not claim a partnership or automatic access to your data.</p><p>Recipients must use information for authorized, lawful purposes and observe appropriate confidentiality, security and applicable data-sharing requirements. This consent does not authorize unrestricted public disclosure or unrelated use. If you provide another person’s details, you confirm that you are authorized to provide them for the purposes described here.</p><h3>Retention and safeguards</h3><p>Information is retained through <strong>December 31, 2026</strong>. Records are flagged for staff retention review after that date. They are not automatically deleted, and the review flag does not extend the stated retention period or consent. APO will review any further retention required by applicable obligations and communicate the applicable basis.</p><h3>Your rights and privacy requests</h3><p>You may request access or correction, object to processing, or withdraw consent, subject to applicable laws and procedures. Withdrawal may affect services that need the information but does not invalidate lawful processing already undertaken. Contact <a href="mailto:apocmwd2026.2027@gmail.com">apocmwd2026.2027@gmail.com</a> for privacy requests.</p><p>Processing is subject to Republic Act No. 10173 (Data Privacy Act of 2012), its Implementing Rules and Regulations, applicable National Privacy Commission issuances and other relevant laws. Membership does not waive privacy rights.</p><p class="helper">Consent version: ' +
      e(ctx.state.settings.consentVersion) +
      "</p></div>"
    );
  }
  function consentFields(data, prefix) {
    return (
      '<p>APO will use your information for training, welfare, referrals, related support, administration and authorized sharing described in the <a href="#privacy" data-open-privacy>Data Privacy and Consent</a> notice.</p><label class="consent-label"><input id="' +
      prefix +
      'consent" name="consent" type="checkbox" ' +
      (data.consent ? "checked" : "") +
      ' required><span>I have read and agree to the APO Data Privacy and Consent notice. I confirm my information is accurate and I am authorized to provide any OFW relative’s details. <strong>Required</strong></span></label><span class="error" id="' +
      prefix +
      'error-consent"></span>'
    );
  }
  var privacyOrigin = null,
    privacyFocus = null;
  function openPrivacy(link) {
    privacyFocus = link;
    privacyOrigin = document.querySelector("dialog[open]");
    if (privacyOrigin) privacyOrigin.close();
    document.getElementById("privacy-content").innerHTML = privacy();
    document.getElementById("privacy-dialog").showModal();
    document.getElementById("privacy-title").focus();
  }
  function closePrivacy() {
    document.getElementById("privacy-dialog").close();
    if (privacyOrigin && document.contains(privacyOrigin))
      privacyOrigin.showModal();
    if (privacyFocus && document.contains(privacyFocus)) privacyFocus.focus();
    privacyOrigin = null;
  }
  function activeSections() {
    return sections.filter(function (section) {
      return (
        section.id !== "checkpoint" &&
        (section.id !== "ofw-details" || ctx.state.draft.category === "family")
      );
    });
  }
  function courseHeader() {
    var o = ctx.offering();
    return (
      '<section class="panel course-heading" aria-label="Your selected course"><div class="eyebrow">YOUR SELECTED COURSE</div><h2>' +
      e(o.courseName) +
      "</h2>" +
      ctx.facts(o) +
      '<p class="callout">Each class requires 25 learners before training can begin. Please keep your phone lines open and check your email regularly for updates.</p><a href="#courses">Change course</a></section>'
    );
  }
  var repeatNotice =
    "You may submit as many applications as you wish for available courses. Submit one application per course offering.";
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
          StepOptions.choices(f.id, data)
            .map(function (v) {
              return (
                '<option value="' +
                e(v.key) +
                '" ' +
                (v.key === value ? "selected" : "") +
                ">" +
                e(v.label) +
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
      e(StepCore.labelFor(f, data)) +
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
          return StepCore.sectionFor(f, data) === section;
        })
        .map(function (f) {
          return field(f, data, prefix);
        })
        .join("") +
      "</div>"
    );
  }
  function html() {
    if (!ctx.offering())
      return '<div class="wrap"><h1>Choose your course first.</h1><a class="btn" href="#courses">Explore courses</a></div>';
    var passed =
      ctx.state.checkpointPassed &&
      Object.keys(StepCore.validate(ctx.state.draft, "checkpoint").errors)
        .length === 0;
    ctx.state.checkpointPassed = !!passed;
    var heading =
      '<div class="wrap registration-wrap"><div class="page-heading"><div class="eyebrow">YOUR STEP APPLICATION</div><h1>' +
      (passed ? "Tell us about yourself." : "Before you begin.") +
      "</h1>" +
      committees() +
      "<p>" +
      repeatNotice +
      "</p></div>" +
      courseHeader();
    if (!passed)
      return (
        heading +
        '<form id="application" class="panel checkpoint" novalidate><h2>APO member details</h2><p>Enter your own APO chapter, batch year and numeric ID. Staff will verify membership manually.</p><div id="form-errors" role="alert"></div>' +
        content("checkpoint", ctx.state.draft, "") +
        '<div class="form-actions"><button class="btn gold" id="continue-checkpoint" type="submit">Continue to application →</button></div></form></div>'
      );
    return (
      heading +
      '<div class="membership-summary"><p><strong>' +
      e(ctx.state.draft.chapter) +
      "</strong> · Batch " +
      e(ctx.state.draft.batchYear) +
      " · " +
      e(StepOptions.label("category", ctx.state.draft.category)) +
      '</p><button class="text-button" id="edit-membership" type="button">Edit membership details</button></div><div class="form-layout"><aside class="registration-rail"><nav class="section-nav" aria-label="On this page"><strong>On this page</strong><div class="section-links">' +
      sections
        .filter(function (s) {
          return s.id !== "checkpoint";
        })
        .map(function (s, i) {
          return (
            '<a href="#register/' +
            s.id +
            '" data-section-link="' +
            s.id +
            '" ' +
            (s.id === "ofw-details" && ctx.state.draft.category !== "family"
              ? "hidden "
              : "") +
            (i === 0 ? 'aria-current="location"' : "") +
            ">" +
            s.label +
            "</a>"
          );
        })
        .join("") +
      '</div></nav></aside><form id="application" novalidate><div id="form-errors" role="alert"></div>' +
      sections
        .filter(function (s) {
          return s.id !== "checkpoint";
        })
        .map(function (s) {
          return (
            '<section class="panel registration-section" id="register/' +
            s.id +
            '" data-section="' +
            s.id +
            '" ' +
            (s.id === "ofw-details" && ctx.state.draft.category !== "family"
              ? "hidden "
              : "") +
            ' aria-labelledby="heading-' +
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
      '<div class="hp" aria-hidden="true"><label>Website<input id="website" name="website" tabindex="-1" autocomplete="off"></label></div><div class="form-actions"><span class="helper">Review all details before submitting.</span><button class="btn gold" type="submit" id="review-application">Review application →</button></div></form></div></div><dialog id="review-dialog" class="review-dialog" aria-labelledby="review-title"><div class="dialog-top"><h2 id="review-title" tabindex="-1">Review your application</h2><button class="icon-close" type="button" data-close-review aria-label="Close review">×</button></div><div id="review-content"></div><div id="submission-errors" role="alert"></div><div id="retry-actions"></div><div class="dialog-actions"><button class="btn secondary" type="button" data-close-review>Back to application</button><button class="btn gold" id="send-application" type="button">Submit application</button></div></dialog><dialog id="edit-dialog" class="edit-dialog" aria-labelledby="edit-title"><form id="edit-form" novalidate><div class="dialog-top"><h2 id="edit-title" tabindex="-1"></h2><button class="icon-close" type="button" id="cancel-edit-top" aria-label="Cancel editing">×</button></div><div id="edit-errors" role="alert"></div><div id="edit-content"></div><div class="dialog-actions"><button class="btn secondary" id="cancel-edit" type="button">Cancel</button><button class="btn gold" type="submit">Save changes</button></div></form></dialog><dialog id="privacy-dialog" class="review-dialog" aria-labelledby="privacy-title"><div class="dialog-top"><h2 id="privacy-title" tabindex="-1">Data Privacy and Consent</h2><button type="button" class="icon-close" id="close-privacy" aria-label="Close privacy notice">×</button></div><div id="privacy-content"></div></dialog>'
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
    root.querySelectorAll(".registration-section").forEach(function (section) {
      var spec = sections.find(function (s) {
        return s.id === section.dataset.section;
      });
      section.innerHTML =
        '<h2 id="heading-' +
        spec.id +
        '">' +
        spec.label +
        "</h2>" +
        content(spec.id, ctx.state.draft, "");
      section.hidden =
        spec.id === "ofw-details" && ctx.state.draft.category !== "family";
    });
    document.querySelectorAll("[data-section-link]").forEach(function (link) {
      link.hidden =
        link.dataset.sectionLink === "ofw-details" &&
        ctx.state.draft.category !== "family";
    });
    var summary = document.querySelector(".membership-summary p");
    if (summary)
      summary.textContent =
        ctx.state.draft.chapter +
        " · Batch " +
        ctx.state.draft.batchYear +
        " · " +
        StepOptions.label("category", ctx.state.draft.category);
    activeSection();
  }
  function cascade(root, data, id) {
    var ids =
      id === "region"
        ? ["province", "city"]
        : id === "province"
          ? ["city"]
          : [];
    ids.forEach(function (key) {
      data[key] = "";
      var f = StepCore.fields.find(function (f) {
          return f.id === key;
        }),
        wrapper = root.querySelector('[data-field="' + key + '"]');
      if (wrapper)
        wrapper.outerHTML = field(
          f,
          data,
          root.id === "edit-form" ? "edit-" : "",
        );
    });
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
        .filter(function (s) {
          return s.id !== "ofw-details" || d.category === "family";
        })
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
              ? "<p>APO Data Privacy and Consent: Accepted</p>"
              : '<dl class="review">' +
                StepCore.fields
                  .filter(function (f) {
                    return (
                      StepCore.sectionFor(f, d) === s.id &&
                      StepCore.visible(f, d)
                    );
                  })
                  .map(function (f) {
                    return (
                      "<div><dt>" +
                      e(StepCore.labelFor(f, d)) +
                      "</dt><dd>" +
                      e(
                        (f.type === "select"
                          ? StepOptions.label(f.id, d[f.id])
                          : d[f.id]) || "Not provided",
                      ) +
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
    (focus || document.getElementById("review-title")).focus();
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
        configurationVersion: StepOptions.version(),
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
      if (response.configuration) StepOptions.configure(response.configuration);
      if (response.errors) {
        dialog.close();
        if (
          StepCore.fields.some(function (f) {
            return f.section === "checkpoint" && response.errors[f.id];
          })
        ) {
          ctx.state.checkpointPassed = false;
          ctx.redraw();
        } else syncForm();
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
      document.querySelectorAll(".registration-section:not([hidden])"),
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
    if (target && !target.hidden)
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
    if (!ctx.state.checkpointPassed) {
      form.oninput = capture;
      form.onsubmit = function (event) {
        event.preventDefault();
        capture();
        var check = StepCore.validate(ctx.state.draft, "checkpoint");
        if (
          errors(form, check.errors, document.getElementById("form-errors"), "")
        )
          return;
        ctx.state.checkpointPassed = true;
        ctx.redraw();
        navigate("register/personal-information");
      };
      return;
    }
    document.getElementById("edit-membership").onclick = function () {
      capture();
      ctx.state.checkpointPassed = false;
      ctx.redraw();
    };
    document.getElementById("close-privacy").onclick = closePrivacy;
    document
      .getElementById("privacy-dialog")
      .addEventListener("cancel", function (event) {
        event.preventDefault();
        closePrivacy();
      });
    document.getElementById("main").onclick = function (event) {
      var link = event.target.closest("[data-open-privacy]");
      if (link) {
        event.preventDefault();
        openPrivacy(link);
      }
    };
    ["review-dialog", "edit-dialog", "privacy-dialog"].forEach(function (id) {
      document.getElementById(id).addEventListener("keydown", keepModalFocus);
    });
    form.addEventListener("input", function () {
      capture();
    });
    form.addEventListener("change", function (event) {
      capture();
      cascade(form, ctx.state.draft, event.target.name);
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
    edit.onchange = function (event) {
      drawerDraft = read(edit, drawerDraft);
      cascade(edit, drawerDraft, event.target.name);
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
    document.getElementById("main").onclick = null;
    if (observer) observer.disconnect();
    if (resizeObserver) resizeObserver.disconnect();
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener("scroll", scrollHandler);
    window.removeEventListener("resize", resizeHandler);
    ["review-dialog", "edit-dialog", "privacy-dialog"].forEach(function (id) {
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
