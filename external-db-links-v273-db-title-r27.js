/* MARKET BASE V273 Japanese units and automatic world rank R8 specialist links.
 * Replace only `url` when each specialist DB receives its public address.
 * Relative URLs keep the bundled offline preview working.
 */
window.MARKET_BASE_EXTERNAL_DB_LINKS = {
  cvs_vendor: {
    url: "cvs-vendor-v273-db-title-r27.html"
  },
  flight_kitchen: {
    url: "flight-kitchen-v273-db-title-r27.html"
  },
  rail_food_kitchen: {
    url: "rail-food-kitchen-v273-db-title-r27.html"
  },
  school_meal_center: {
    url: "school-meal-center-v273-db-title-r27.html"
  },
  imported_food_machinery: {
    url: "imported-food-machinery-v273-db-title-r27.html"
  },
  retail_sales: {
    url: "retail-sales-v273-db-title-r27.html"
  },
  gohan_food_manufacturers: {
    url: "gohan-food-manufacturers-v273-db-title-r27.html"
  },
  food_machinery_import: {
    url: "food-machinery-import-v273-r32u.html?scope=japan&view=ranking&year=2025"
  },

  /* Future external DBs: add their card to index.html, then set its URL here.
  */
};

(function applyExternalDatabaseLinks() {
  var links = window.MARKET_BASE_EXTERNAL_DB_LINKS || {};
  document.querySelectorAll("[data-external-db]").forEach(function (anchor) {
    var config = links[anchor.getAttribute("data-external-db")];
    if (!config || !config.url) return;
    anchor.href = config.url;
    if (/^https?:\/\//i.test(config.url)) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    } else {
      anchor.removeAttribute("target");
      anchor.removeAttribute("rel");
    }
  });
})();
