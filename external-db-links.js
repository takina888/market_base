/* MARKET BASE V273 external specialist database links.
 * Replace only `url` when each specialist DB receives its public address.
 * Relative URLs keep the bundled offline preview working.
 */
window.MARKET_BASE_EXTERNAL_DB_LINKS = {
  cvs_vendor: {
    url: "cvs-vendor-v273-r5.html"
  },
  flight_kitchen: {
    url: "flight-kitchen-v273-r2.html"
  },
  rail_food_kitchen: {
    url: "rail-food-kitchen-v273-r3.html"
  },
  school_meal_center: {
    url: "school-meal-center-v273-r3.html"
  },
  imported_food_machinery: {
    url: "imported-food-machinery-v273-r3.html"
  },
  retail_sales: {
    url: "retail-sales-v273-r3.html"
  },
  gohan_food_manufacturers: {
    url: "gohan-food-manufacturers-v273-r3.html"
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
