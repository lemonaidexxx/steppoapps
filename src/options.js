/* Public dropdown configuration. Keys, not editable labels, control form behavior. */
var StepOptions = (function () {
  "use strict";
  var current = { form: [], addresses: [], version: "" };
  var lists = [
    "category",
    "sex",
    "civilStatus",
    "relationship",
    "country",
    "goal",
  ];
  function normalize(config) {
    var seen = Object.create(null),
      all = (config.form || []).concat(config.addresses || []);
    all.forEach(function (o) {
      if (
        !o.key ||
        !/^[a-zA-Z0-9_-]+$/.test(o.key) ||
        !o.label ||
        o.label.length > 300 ||
        seen[o.key]
      )
        throw Error("Invalid or duplicate option key");
      seen[o.key] = o;
      if (!Number.isFinite(Number(o.order)))
        throw Error("Invalid option order");
    });
    (config.form || []).forEach(function (o) {
      if (lists.indexOf(o.list) < 0) throw Error("Unknown form option list");
      if (o.list === "category" && ["member", "family"].indexOf(o.key) < 0)
        throw Error("Unsupported applicant classification");
      if (o.list === "sex" && ["male", "female"].indexOf(o.key) < 0)
        throw Error("Unsupported sex option");
      if (
        o.list === "relationship" &&
        ["parent", "child", "sibling", "spouse"].indexOf(o.key) < 0
      )
        throw Error("Unsupported relationship");
    });
    (config.addresses || []).forEach(function (o) {
      if (["region", "province", "city"].indexOf(o.level) < 0)
        throw Error("Invalid geographic level");
      if (o.level === "region") {
        if (o.parent) throw Error("Region has a parent");
      } else if (
        !seen[o.parent] ||
        seen[o.parent].level !==
          (o.level === "province" ? "region" : "province")
      )
        throw Error("Invalid address parent");
    });
    lists.forEach(function (list) {
      if (
        !(config.form || []).some(function (o) {
          return o.list === list && o.enabled;
        })
      )
        throw Error("Empty required option list");
    });
    if (
      !(config.addresses || []).some(function (o) {
        return o.level === "region" && o.enabled;
      })
    )
      throw Error("Missing address configuration");
    return config;
  }
  function configure(config) {
    current = normalize(config);
  }
  function choices(id, data) {
    var address = ["region", "province", "city"].indexOf(id) >= 0;
    var parent =
      id === "province" ? data.region : id === "city" ? data.province : "";
    if (address && id !== "region" && !parent) return [];
    return (address ? current.addresses : current.form)
      .filter(function (o) {
        return (
          o.enabled &&
          (address ? o.level === id && o.parent === parent : o.list === id)
        );
      })
      .sort(function (a, b) {
        return (
          Number(a.order) - Number(b.order) || a.label.localeCompare(b.label)
        );
      });
  }
  function label(id, key) {
    var o = current.form.concat(current.addresses).find(function (o) {
      return o.key === key && (o.list === id || o.level === id);
    });
    return o ? o.label : key;
  }
  function valid(id, key, data) {
    return choices(id, data).some(function (o) {
      return o.key === key;
    });
  }
  return {
    configure: configure,
    normalize: normalize,
    choices: choices,
    label: label,
    valid: valid,
    version: function () {
      return current.version;
    },
    lists: lists,
  };
})();
if (typeof module !== "undefined") module.exports = StepOptions;
