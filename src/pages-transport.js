/* GitHub Pages RPC through a hidden Apps Script HTML-service bridge. */
(function () {
  "use strict";
  var config = window.STEP_SITE_CONFIG,
    connection,
    remote,
    remoteOrigin,
    channel;
  var pending = new Map(),
    allowed = ["getPublicData", "issueSubmissionToken", "submitApplication"];
  function googleOrigin(origin) {
    return (
      /^https:\/\/[a-z0-9-]+-script\.googleusercontent\.com$/.test(origin) ||
      origin === "https://script.googleusercontent.com"
    );
  }
  function connect() {
    if (connection) return connection;
    connection = new Promise(function (resolve, reject) {
      if (
        location.origin !== config.siteOrigin ||
        !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(
          config.appsScriptUrl,
        )
      ) {
        reject(Error("The website connection is not configured yet."));
        return;
      }
      channel = crypto.randomUUID();
      var frame = document.createElement("iframe");
      frame.hidden = true;
      frame.title = "Secure application connection";
      frame.referrerPolicy = "no-referrer";
      var timeout = setTimeout(function () {
        window.removeEventListener("message", ready);
        frame.remove();
        connection = null;
        reject(
          Error("The application service could not connect. Please try again."),
        );
      }, 30000);
      function ready(event) {
        var m = event.data;
        if (
          !googleOrigin(event.origin) ||
          !m ||
          m.type !== "STEP_READY" ||
          m.channel !== channel ||
          m.protocol !== 1 ||
          !event.source
        )
          return;
        clearTimeout(timeout);
        window.removeEventListener("message", ready);
        remote = event.source;
        remoteOrigin = event.origin;
        resolve();
      }
      window.addEventListener("message", ready);
      frame.src =
        config.appsScriptUrl +
        "?mode=bridge&channel=" +
        encodeURIComponent(channel) +
        "&origin=" +
        encodeURIComponent(config.siteOrigin);
      document.body.appendChild(frame);
    });
    return connection;
  }
  window.addEventListener("message", function (event) {
    if (!remote || event.source !== remote || event.origin !== remoteOrigin)
      return;
    var m = event.data;
    if (
      !m ||
      m.type !== "STEP_RESULT" ||
      m.channel !== channel ||
      !pending.has(m.id)
    )
      return;
    var request = pending.get(m.id);
    pending.delete(m.id);
    clearTimeout(request.timer);
    if (m.error)
      request.reject(
        Error(
          "The application service could not complete this request. Please retry.",
        ),
      );
    else request.resolve(m.result);
  });
  window.STEP_REMOTE = async function (method, argument) {
    if (allowed.indexOf(method) < 0) throw Error("Unsupported request");
    await connect();
    return new Promise(function (resolve, reject) {
      var id = crypto.randomUUID();
      var timer = setTimeout(function () {
        pending.delete(id);
        reject(
          Error(
            "The response could not be confirmed. Keep this page open and retry.",
          ),
        );
      }, 60000);
      pending.set(id, { resolve: resolve, reject: reject, timer: timer });
      remote.postMessage(
        {
          type: "STEP_CALL",
          channel: channel,
          id: id,
          method: method,
          argument: argument,
        },
        remoteOrigin,
      );
    });
  };
})();
