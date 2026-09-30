(function(){
  "use strict";

  var ORIGINAL = {
    guestCount: 120,
    totalBudget: 200000,
    plannerPct: null,
    categories: [
      { key:"venue",       name:"Venue + F&B package", low:72000, status:"Confirmed",
        note:"Provider: Soho House / Berenjak. Includes venue fee and F&B." },
      { key:"room",        name:"Soho room (1)", low:980, status:"Confirmed",
        note:"Provider: Soho House" },
      { key:"sofreh",      name:"Sofreh", low:7000, status:"Confirmed",
        note:"Provider: Maison De La Fork" },
      { key:"planning",    name:"Planning", low:7500, status:"Confirmed",
        note:"Provider: Maison De La Fork" },
      { key:"cake",        name:"Cake", low:700, status:"Confirmed",
        note:"Provider: Maison De La Fork" },
      { key:"dj",          name:"DJ", low:7500, status:"Confirmed",
        note:"Provider: Farjad" },
      { key:"photo",       name:"Photography", low:3054, status:"Confirmed",
        note:"Provider: Michelle Sobel" },
      { key:"security",    name:"Security", low:700, status:"Confirmed",
        note:"Provider: TBD" },
      { key:"floral",      name:"Florals", low:25000, status:"Estimate",
        note:"Provider: TBD" },
      { key:"attire",      name:"Attire (bride & groom)", low:15000, status:"Estimate",
        note:"Provider: TBD" },
      { key:"rentals",     name:"Rentals", low:10000, status:"Estimate",
        note:"Provider: TBD" },
      { key:"decor",       name:"Décor & installations", low:9000, status:"Estimate",
        note:"Provider: TBD" },
      { key:"video",       name:"Videography", low:10000, status:"Estimate",
        note:"Provider: TBD" },
      { key:"stationery",  name:"Stationery & paper goods", low:5000, status:"Estimate",
        note:"Provider: TBD" },
      { key:"gratuities",  name:"Gratuities", low:4000, status:"Estimate",
        note:"Provider: Vendor tips" },
      { key:"hairmakeup",  name:"Hair & makeup", low:2500, status:"Estimate",
        note:"Provider: TBD" },
      { key:"newyear",     name:"New Year's extras", low:2500, status:"Estimate",
        note:"Provider: TBD" },
      { key:"transport",   name:"Transportation", low:2000, status:"Estimate",
        note:"Provider: TBD" },
      { key:"cameras",     name:"Cameras (Polaroid + disposable)", low:1200, status:"Estimate",
        note:"Provider: TBD" },
      { key:"officiant",   name:"Officiant", low:1000, status:"Estimate",
        note:"Provider: TBD" },
      { key:"contingency", name:"Contingency", low:13366, status:"Estimate",
        note:"Provider: Buffer" }
    ]
  };

  var STORAGE_KEY = "mdlf_negeen_paymaun_budget_v3";

  // ============================================================================
  // REMOTE STORAGE — ACTION REQUIRED FOR THE SITE DEVELOPER
  // ============================================================================
  // This page currently saves only to the browser's localStorage, which means
  // edits stay on the device that made them and are not shared with anyone
  // else viewing the link. The client wants edits shared across everyone who
  // opens the link, so a small backend endpoint needs to be built and
  // REMOTE_API_URL below needs to be set to it before this goes live.
  //
  // Full setup instructions, the exact request/response contract, and a
  // sample backend are in README.md.
  //
  // Leave REMOTE_API_URL as "" only while developing locally — it must be set
  // before this page is considered done.
  var REMOTE_API_URL = "";

  function cloneOriginal(){
    var copy = JSON.parse(JSON.stringify(ORIGINAL));
    copy.categories.forEach(function(c){ c.high = c.low; });
    return copy;
  }

  function optionalAmount(value){
    if (value === null || value === undefined || value === "") return null;
    var number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function inputValue(value){ return value === null ? "" : value; }

  function mergeState(parsed){
    if (!parsed || !Array.isArray(parsed.categories)) return cloneOriginal();

    // Keep the current category list and fixed confirmed amounts, while retaining
    // editable values saved by an earlier version of the page.
    var fresh = cloneOriginal();
    fresh.guestCount = Number(parsed.guestCount) > 0 ? Number(parsed.guestCount) : fresh.guestCount;
    fresh.totalBudget = optionalAmount(parsed.totalBudget);
    fresh.plannerPct = optionalAmount(parsed.plannerPct);

    var savedByKey = {};
    parsed.categories.forEach(function(c){
      if (c && c.key) savedByKey[c.key] = c;
    });
    fresh.categories.forEach(function(c){
      var savedCat = savedByKey[c.key];
      if (!savedCat || String(c.status).toLowerCase() === "confirmed") return;
      c.low = optionalAmount(savedCat.low);
      c.high = c.low;
    });
    return fresh;
  }

  function loadState(){
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return saved ? mergeState(JSON.parse(saved)) : cloneOriginal();
    } catch (e) { return cloneOriginal(); }
  }

  function saveState(){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      saveRemoteState();
      announceStatus("Saved");
    } catch (e) {}
  }

  // Sends the current state to REMOTE_API_URL, if one has been configured.
  // No-op (does nothing) until the site's developer sets REMOTE_API_URL above.
  function saveRemoteState(){
    if (!REMOTE_API_URL) return;
    fetch(REMOTE_API_URL, {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(state)
    }).catch(function(){});
  }

  // Loads state from REMOTE_API_URL, if one has been configured, and applies
  // it on top of whatever was loaded from localStorage. No-op until the
  // site's developer sets REMOTE_API_URL above.
  function loadRemoteState(){
    if (!REMOTE_API_URL) return;

    fetch(REMOTE_API_URL)
      .then(function(r){ if (!r.ok) throw new Error("no remote data"); return r.json(); })
      .then(function(remote){
        if (!remote || !Array.isArray(remote.categories)) return;
        state = mergeState(remote);
        document.getElementById("guestCount").value = state.guestCount;
        document.getElementById("totalBudget").value = inputValue(state.totalBudget);
        document.getElementById("plannerPct").value = inputValue(state.plannerPct);
        buildRows();
        recalc(false, false);
      })
      .catch(function(){});
  }

  function clearSavedState(){
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  var state = loadState();
  state.categories.forEach(function(c){ c.high = c.low; });

  var fmtUSD0 = new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:0 });
  var fmtUSD2 = new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", minimumFractionDigits:2, maximumFractionDigits:2 });
  var fmtPct1 = function(x){ return (x*100).toFixed(1) + "%"; };

  var body = document.getElementById("categoryBody");
  var chartEl = document.getElementById("chart");

  /* ---------- fix #2: status -> badge color mapping ---------- */
  function statusBadgeClass(status){
    var normalized = String(status || "").toLowerCase();
    if (normalized === "confirmed") return "status-confirmed";
    if (normalized === "estimate" || normalized === "draft") return "status-draft";
    if (normalized === "updated") return "status-updated";
    if (normalized === "included") return "included";
    return "status-updated";
  }

  function buildRows(){
    body.innerHTML = "";
    state.categories.forEach(function(cat, i){
      var tr = document.createElement("tr");

      var isConfirmed = String(cat.status || "").toLowerCase() === "confirmed";
      var lowCell = isConfirmed
        ? '<td class="num locked" data-label="Estimated Cost"><span class="static-currency">' + (cat.low === null ? "—" : fmtUSD0.format(cat.low)) + '</span></td>'
        : '<td class="num" data-label="Estimated Cost"><div class="cell-currency"><span>$</span><input type="number" step="any" min="0" aria-label="Estimated cost for ' + cat.name + '" data-idx="' + i + '" data-field="low" value="' + inputValue(cat.low) + '"></div></td>';
      var highCell = '';

      var displayStatus = cat.status;
      tr.innerHTML =
        '<td class="cat-name" data-label="Category">' + cat.name + (cat.note ? '<span class="cat-note">' + cat.note + '</span>' : '') + '</td>' +
        lowCell + highCell +
        '<td class="num pct" data-pct="' + i + '" data-label="% of budget">—</td>' +
        '<td data-label="Status"><span class="badge ' + statusBadgeClass(displayStatus) + '">' + displayStatus + '</span></td>';
      body.appendChild(tr);
    });
    body.querySelectorAll("input").forEach(function(inp){
      inp.addEventListener("input", function(){
        var idx = +inp.getAttribute("data-idx");
        var field = inp.getAttribute("data-field");
        var v = parseFloat(inp.value);
        state.categories[idx][field] = optionalAmount(inp.value);
        state.categories[idx].high = state.categories[idx].low;
        var badge = inp.closest("tr").querySelector(".badge");
        if (state.categories[idx].status === "Draft") {
          var status = state.categories[idx].low === null ? "Draft" : "Updated";
          badge.textContent = status;
          badge.className = "badge " + statusBadgeClass(status);
        }
        recalc();
      });
    });
  }

  /* ---------- fix #3: debounced "value changed" highlight ---------- */
  var flashTargets = null;
  function getFlashTargets(){
    if (!flashTargets) {
      flashTargets = [
        document.querySelector(".readout-value"),
        document.getElementById("variancePill"),
        document.querySelector(".totals-row.emph .value")
      ].filter(Boolean);
    }
    return flashTargets;
  }
  var flashTimer = null;
  function scheduleFlash(){
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function(){
      getFlashTargets().forEach(function(el){
        el.classList.remove("flash");
        void el.offsetWidth; // force reflow so the animation restarts
        el.classList.add("flash");
      });
    }, 350);
  }

  /* ---------- fix #3: autosave status text ---------- */
  var saveStatusEl = document.getElementById("saveStatus");
  var saveStatusTimer = null;
  function announceStatus(text){
    if (!saveStatusEl) return;
    saveStatusEl.textContent = text;
    saveStatusEl.classList.remove("is-dim");
    saveStatusEl.classList.add("is-visible");
    clearTimeout(saveStatusTimer);
    saveStatusTimer = setTimeout(function(){
      saveStatusEl.classList.add("is-dim");
    }, 1800);
  }

  function recalc(shouldSave, shouldFlash){
    if (shouldSave === undefined) shouldSave = true;
    if (shouldFlash === undefined) shouldFlash = shouldSave;

    var totalBudget = state.totalBudget;
    var hasBudget = totalBudget !== null;
    var guestCount = state.guestCount || 1;

    var sumLow = 0, sumHigh = 0;
    state.categories.forEach(function(c){ sumLow += (+c.low || 0); sumHigh += (+c.high || 0); });

    // Contingency is already listed as a category above, so it is not added again here.
    var contingencyLow  = 0;
    var contingencyHigh = 0;

    var subtotalLow  = sumLow  + contingencyLow;
    var subtotalHigh = sumHigh + contingencyHigh;

    var plannerLow  = state.plannerPct !== null ? subtotalLow * (state.plannerPct / 100) : 0;
    var plannerHigh = subtotalHigh * (state.plannerPct / 100);

    var totalLow  = subtotalLow  + plannerLow;
    var totalHigh = subtotalHigh + plannerHigh;

    var varianceLow  = totalBudget - totalLow;
    var varianceHigh = totalBudget - totalHigh;

    var costPerGuestLow  = totalLow  / guestCount;
    var costPerGuestHigh = totalHigh / guestCount;

    // per-category % of budget (avg of low/high vs total budget)
    body.querySelectorAll("[data-pct]").forEach(function(cell){
      var idx = +cell.getAttribute("data-pct");
      var c = state.categories[idx];
      var pct = hasBudget && totalBudget > 0 ? ((c.low + c.high) / 2) / totalBudget : 0;
      cell.textContent = hasBudget && totalBudget > 0 && c.low !== null ? fmtPct1(pct) : "—";
    });

    document.getElementById("subtotalLowOut").textContent  = fmtUSD0.format(subtotalLow);
    document.getElementById("subtotalPctOut").textContent  = totalBudget > 0 ? fmtPct1(((subtotalLow+subtotalHigh)/2)/totalBudget) : "—";
    document.getElementById("plannerLowOut").textContent  = state.plannerPct !== null ? fmtUSD0.format(plannerLow) : "—";
    document.getElementById("totalLowOut").textContent  = fmtUSD0.format(totalLow);
    document.getElementById("totalPctOut").textContent  = totalBudget > 0 ? fmtPct1(((totalLow+totalHigh)/2)/totalBudget) : "—";

    document.getElementById("totalRangeOut").textContent = fmtUSD0.format(totalLow);

    document.getElementById("t-subtotal").textContent = fmtUSD0.format(subtotalLow);
    document.getElementById("t-planner").textContent  = state.plannerPct !== null ? fmtUSD0.format(plannerLow) : "—";
    document.getElementById("t-total").textContent    = fmtUSD0.format(totalLow);
    document.getElementById("t-budget").textContent   = hasBudget ? fmtUSD0.format(totalBudget) : "—";
    document.getElementById("t-perguest").textContent = fmtUSD2.format(costPerGuestLow);

    // Variance pill: use the worst case (High total) to decide status, show both ends
    var pill = document.getElementById("variancePill");
    var varText = document.getElementById("varianceText");
    var tVariance = document.getElementById("t-variance");
    pill.classList.remove("is-good", "is-warning", "is-critical");
    if (!hasBudget) {
      varText.textContent = "Enter a budget to see variance";
      tVariance.textContent = "—";
      tVariance.style.color = "";
      buildChart(contingencyLow, contingencyHigh, plannerLow, plannerHigh);
      if (shouldFlash) scheduleFlash();
      if (shouldSave) saveState();
      return;
    }
    var pctOverHigh = totalBudget > 0 ? (totalHigh - totalBudget) / totalBudget : 0;
    var label, cls;
    if (varianceLow >= 0 && varianceHigh >= 0) {
      cls = "is-good"; label = "Under budget by " + fmtUSD0.format(varianceLow);
    } else if (pctOverHigh <= 0.05 && varianceLow >= 0) {
      cls = "is-warning"; label = "Within " + fmtUSD0.format(Math.abs(varianceLow)) + " of budget";
    } else {
      cls = "is-critical";
      var lo = Math.min(varianceLow, varianceHigh), hi = Math.max(varianceLow, varianceHigh);
      if (hi <= 0) {
        label = "Over budget by " + fmtUSD0.format(Math.abs(varianceLow));
      } else {
        label = "Over budget by " + fmtUSD0.format(Math.abs(varianceLow));
      }
    }
    pill.classList.add(cls);
    varText.textContent = label;
    tVariance.textContent = fmtUSD0.format(varianceLow);
    tVariance.style.color = cls === "is-good" ? "var(--good)" : (cls === "is-warning" ? "var(--warning)" : "var(--critical)");

    buildChart(contingencyLow, contingencyHigh, plannerLow, plannerHigh);

    if (shouldFlash) scheduleFlash();
    if (shouldSave) saveState();
  }

  function buildChart(contingencyLow, contingencyHigh, plannerLow, plannerHigh){
    var items = state.categories.map(function(c){
      return { name:c.name, avg:(c.low + c.high)/2 };
    });
    items.push({ name:"Planner & Coordination Fee", avg:(plannerLow+plannerHigh)/2 });
    items = items.filter(function(i){ return i.avg > 0; });
    items.sort(function(a,b){ return b.avg - a.avg; });
    var max = items.length ? items[0].avg : 1;

    chartEl.innerHTML = "";
    items.forEach(function(item, i){
      var row = document.createElement("div");
      row.className = "bar-item";
      var pct = max > 0 ? (item.avg / max) * 100 : 0;
      row.innerHTML =
        '<div class="bar-row">' +
          '<div class="bar-label"><b>' + item.name + '</b><span class="bar-value">' + fmtUSD0.format(item.avg) + '</span></div>' +
          '<div class="bar-track"><div class="bar-fill" style="width:' + pct.toFixed(1) + '%"></div></div>' +
        '</div>';
      chartEl.appendChild(row);
    });
  }

  document.getElementById("guestCount").addEventListener("input", function(e){
    var v = parseInt(e.target.value, 10);
    state.guestCount = isNaN(v) || v < 1 ? 1 : v;
    recalc();
  });
  document.getElementById("totalBudget").addEventListener("input", function(e){
    state.totalBudget = optionalAmount(e.target.value);
    recalc();
  });
  document.getElementById("plannerPct").addEventListener("input", function(e){
    state.plannerPct = optionalAmount(e.target.value);
    recalc();
  });

  /* ---------- fix #3: two-step confirm on Reset, so one accidental click can't wipe edits ---------- */
  var resetBtn = document.getElementById("resetBtn");
  var resetDefaultText = resetBtn.textContent;
  var resetArmed = false;
  var resetArmTimer = null;

  function disarmReset(){
    resetArmed = false;
    clearTimeout(resetArmTimer);
    resetBtn.textContent = resetDefaultText;
    resetBtn.classList.remove("is-armed");
  }

  resetBtn.addEventListener("click", function(){
    if (!resetArmed) {
      resetArmed = true;
      resetBtn.textContent = "Click again to confirm reset";
      resetBtn.classList.add("is-armed");
      resetArmTimer = setTimeout(disarmReset, 4000);
      return;
    }

    disarmReset();
    state = cloneOriginal();
    clearSavedState();
    document.getElementById("guestCount").value = state.guestCount;
    document.getElementById("totalBudget").value = inputValue(state.totalBudget);
    document.getElementById("plannerPct").value = inputValue(state.plannerPct);
    buildRows();
    recalc(false, true);
    announceStatus("Reset to original estimate");
  });

  // Restore saved values into the visible controls on page load.
  document.getElementById("guestCount").value = state.guestCount;
  document.getElementById("totalBudget").value = inputValue(state.totalBudget);
  document.getElementById("plannerPct").value = inputValue(state.plannerPct);

  buildRows();
  recalc(false, false);
  loadRemoteState();
})();
