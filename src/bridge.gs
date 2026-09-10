/* Private rendering helper; administrative methods are never bridged. */
function bridgeOutput_(parameters) {
  var origin = PropertiesService.getScriptProperties().getProperty("PUBLIC_SITE_ORIGIN") || "https://lemonaidexxx.github.io";
  if (!/^https:\/\/[a-z0-9.-]+(?::[0-9]+)?$/.test(origin) || parameters.origin !== origin || !/^[a-f0-9-]{36}$/.test(parameters.channel || "")) {
    return HtmlService.createHtmlOutput("Invalid website connection.");
  }
  var template = HtmlService.createTemplateFromFile("Bridge");
  template.connectionConfig = JSON.stringify({origin:origin,channel:parameters.channel});
  return template.evaluate().setTitle("APO STEP connection").setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
