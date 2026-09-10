/* This page contains no form or records. Only its approved top-level site may call it. */
(function () {
  "use strict";
  var config = window.STEP_BRIDGE_CONFIG;
  var allowed = ["getPublicData", "issueSubmissionToken", "submitApplication"];
  window.addEventListener("message", function (event) {
    if (event.origin !== config.origin || event.source !== window.top) return;
    var m = event.data;
    if (
      !m ||
      m.type !== "STEP_CALL" ||
      m.channel !== config.channel ||
      typeof m.id !== "string" ||
      m.id.length > 80 ||
      allowed.indexOf(m.method) < 0
    )
      return;
    if (JSON.stringify(m).length > 20000) return;
    function reply(result, error) {
      event.source.postMessage(
        {
          type: "STEP_RESULT",
          channel: config.channel,
          id: m.id,
          result: result,
          error: !!error,
        },
        config.origin,
      );
    }
    google.script.run
      .withSuccessHandler(function (result) {
        reply(result, false);
      })
      .withFailureHandler(function () {
        reply(null, true);
      })
      [m.method](m.argument);
  });
  if (window.top !== window)
    window.top.postMessage(
      { type: "STEP_READY", protocol: 1, channel: config.channel },
      config.origin,
    );
})();
