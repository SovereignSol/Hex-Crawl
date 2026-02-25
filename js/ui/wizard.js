import { deepClone } from "../state.js";
import { nextLevelSteps } from "../engine/rules.js";
import { computeDerived } from "../engine/derived.js";
import { validateDraft } from "../engine/validation.js";
import { uiTag } from "./uiCodes.js";
import { buildSpellPickerStep, buildInvocationPickerStep, buildArcanumPickerStep, buildPatronStep, buildPactBoonStep, buildHpStep, buildAsiFeatStep, buildSummaryStep } from "./wizardSteps.js";

// This module is split to keep wizard core clean.
export function openLevelUpWizard(app, snapshot, allData){
  const steps = nextLevelSteps(snapshot);
  if(steps.length === 0){
    app.toast("Already level 20.");
    return;
  }

  const draft = deepClone(snapshot);
  draft.class.level = snapshot.class.level + 1;

  // Ensure slots and max recalculation will happen after commit.
  // Draft starts with unchanged current HP, wizard may toggle "also raise current if full".
  const modal = createModalShell();
  const state = {
    snapshot,
    draft,
    steps,
    activeStepId: steps[0].id,
    stepStates: {}, // per step local data, like hp input etc
    allData
  };

  // Render loop
  function render(){
    const left = modal.querySelector("[data-left]");
    const center = modal.querySelector("[data-center]");
    const right = modal.querySelector("[data-right]");

    left.innerHTML = renderStepsList(state);
    const active = state.steps.find(s => s.id === state.activeStepId);

    // Build the active step content
    center.innerHTML = renderHeader(state, active) + `<div data-step-body></div>`;
    const body = center.querySelector("[data-step-body]");

    const builders = {
      hp: buildHpStep,
      patron: buildPatronStep,
      pactBoon: buildPactBoonStep,
      spells: buildSpellPickerStep,
      invocations: buildInvocationPickerStep,
      arcanum: buildArcanumPickerStep,
      asi: buildAsiFeatStep,
      summary: buildSummaryStep
    };

    const build = builders[active.id];
    if(!build){
      body.innerHTML = `<div class="card"><div class="warn-text">Missing step builder for ${active.id}</div></div>`;
    } else {
      build({ state, body, app, modal, rerender: render, allData: state.allData });
    }

    // Right preview uses derived from draft
    right.innerHTML = renderPreview(state);

    // Wire step navigation
    left.querySelectorAll("[data-step-id]").forEach(el => {
      el.addEventListener("click", () => {
        state.activeStepId = el.getAttribute("data-step-id");
        render();
      });
    });

    // Header actions
    const btnCancel = center.querySelector("#wiz-cancel");
    const btnConfirm = center.querySelector("#wiz-confirm");
    btnCancel.addEventListener("click", () => close());

    const problems = validateDraft(state.snapshot, state.draft, state);
    btnConfirm.disabled = problems.length > 0;

    btnConfirm.addEventListener("click", () => {
      const problems2 = validateDraft(state.snapshot, state.draft, state);
      if(problems2.length > 0){
        app.toast("Fix required steps before confirming.");
        state.activeStepId = state.steps.find(s => s.id !== "summary")?.id || "summary";
        render();
        return;
      }
      // Atomic commit
      app.commitFromWizard(state.draft);
      close();
    });
  }

  function close(){
    modal.remove();
  }

  render();
  document.getElementById("modal-root").appendChild(modal);
}

function createModalShell(){
  const el = document.createElement("div");
  el.className = "modal-backdrop";
  el.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="side" data-left></div>
      <div class="center" data-center></div>
      <div class="side right" data-right></div>
    </div>
  `;
  return el;
}

function renderStepsList(state){
  const problems = validateDraft(state.snapshot, state.draft, state);

  const allOk = problems.length === 0;

  return `
    <div class="modal-header">
      <div>
        <div class="modal-title">${uiTag("UI-100")} Level Up Wizard</div>
        <div class="modal-subtitle">Complete each step, then confirm atomically.</div>
      </div>
    </div>

    <div style="display:grid; gap:10px;">
      ${state.steps.map(s => `
        <div class="step-item ${state.activeStepId === s.id ? "active" : ""}" data-step-id="${s.id}">
          <div class="row">
            <div style="display:flex; gap:10px; align-items:center;">
              ${uiTag(s.ui)}
              <div style="font-weight:800">${s.title}</div>
            </div>
            <div class="badge ${allOk ? "ok" : "warn"}">${allOk ? "OK" : "Needs"}</div>
          </div>
          <div class="small-note">Step id: ${s.id}</div>
        </div>
      `).join("")}
    </div>

    <hr class="sep" />

    <div class="card">
      <div style="font-weight:800">${uiTag("UI-101")} Validation</div>
      ${problems.length === 0 ? `<div class="ok-text">All requirements satisfied.</div>` : `
        <div class="warn-text">Fix these before Confirm:</div>
        <ul class="small-note">
          ${problems.map(p => `<li>${escapeHtml(p)}</li>`).join("")}
        </ul>
      `}
    </div>
  `;
}

function renderHeader(state, active){
  const from = state.snapshot.class.level;
  const to = state.draft.class.level;
  return `
    <div class="modal-header">
      <div>
        <div class="modal-title">${uiTag(active.ui)} ${escapeHtml(active.title)}</div>
        <div class="modal-subtitle">Level ${from} → ${to}</div>
      </div>
      <div class="modal-actions">
        <button id="wiz-cancel" class="btn danger"><span class="ui-tag">UI-190</span>Cancel</button>
        <button id="wiz-confirm" class="btn primary"><span class="ui-tag">UI-191</span>Confirm</button>
      </div>
    </div>
  `;
}

function renderPreview(state){
  const s = state.snapshot;
  const d = state.draft;
  const sd = computeDerived(s);
  const dd = computeDerived(d);

  const diff = (a,b) => (b - a);
  const hpGain = diff(sd.hpMax, dd.hpMax);

  return `
    <div class="modal-header">
      <div>
        <div class="modal-title">${uiTag("UI-150")} Draft Preview</div>
        <div class="modal-subtitle">Live preview of draft changes</div>
      </div>
    </div>

    <div class="card">
      <div class="kv"><div class="k">${uiTag("UI-151")} Level</div><div class="v">${s.class.level} → ${d.class.level}</div></div>
      <div class="kv"><div class="k">${uiTag("UI-152")} HP Max</div><div class="v">${sd.hpMax} → ${dd.hpMax} (${hpGain >= 0 ? "+" : ""}${hpGain})</div></div>
      <div class="kv"><div class="k">${uiTag("UI-153")} Pact Slots</div><div class="v">${sd.pactSlotsMax} → ${dd.pactSlotsMax} (Lv ${dd.pactSlotLevel})</div></div>
      <div class="kv"><div class="k">${uiTag("UI-154")} Cantrips</div><div class="v">${d.spells.cantrips.length} / ${dd.cantripsKnownMax}</div></div>
      <div class="kv"><div class="k">${uiTag("UI-155")} Known Spells</div><div class="v">${d.spells.known.length} / ${dd.spellsKnownMax}</div></div>
      <div class="kv"><div class="k">${uiTag("UI-156")} Invocations</div><div class="v">${d.class.invocations.length} / ${dd.invocationsKnownMax}</div></div>
    </div>

    <div class="card">
      <div style="font-weight:800">${uiTag("UI-157")} Draft Notes</div>
      <div class="small-note">
        Draft changes are not permanent until Confirm. Cancel discards draft completely.
      </div>
    </div>
  `;
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
