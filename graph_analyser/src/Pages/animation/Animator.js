// ─────────────────────────────────────────────────────────────────────────────
// Animator.js  –  step-based animation with reliable pause / resume / cancel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AnimatorController
 *
 * Returned by playSteps().  Gives the caller full control over the animation.
 *
 *   ctrl.pause()    – freeze after the current step finishes
 *   ctrl.resume()   – continue from where it paused
 *   ctrl.cancel()   – stop immediately, leave graph as-is
 *   ctrl.done       – Promise that resolves when finished OR cancelled
 *   ctrl.isPaused   – boolean getter
 */
export class AnimatorController {
  constructor() {
    this._paused    = false;
    this._cancelled = false;
    this._resumeResolvers = [];   // array so stacked waits never deadlock

    let resolveDone;
    this.done = new Promise(res => { resolveDone = res; });
    this._resolveDone = resolveDone;
  }

  get isPaused()    { return this._paused;    }
  get isCancelled() { return this._cancelled; }

  pause() {
    if (!this._cancelled) this._paused = true;
  }

  resume() {
    this._paused = false;
    // drain every pending waiter
    const resolvers = this._resumeResolvers.splice(0);
    resolvers.forEach(fn => fn());
  }

  cancel() {
    this._cancelled = true;
    this._paused    = false;
    // drain every pending waiter so the loop can exit
    const resolvers = this._resumeResolvers.splice(0);
    resolvers.forEach(fn => fn());
    this._resolveDone();
  }

  // ─── internal helpers ─────────────────────────────────────────────────────

  /**
   * Wait until resumed or cancelled.
   * Safe to call from multiple concurrent async chains.
   */
  _waitIfPaused() {
    if (!this._paused || this._cancelled) return Promise.resolve();
    return new Promise(res => { this._resumeResolvers.push(res); });
  }

  /**
   * Interruptible sleep.
   * Splits into 50 ms chunks so pause and cancel are felt immediately.
   */
  async _sleep(ms) {
    const deadline = Date.now() + ms;
    while (Date.now() < deadline) {
      if (this._cancelled) return;
      await this._waitIfPaused();
      if (this._cancelled) return;
      const left = deadline - Date.now();
      // sleep the smaller of 50 ms or remaining time
      await new Promise(res => setTimeout(res, Math.max(0, Math.min(50, left))));
    }
  }

  _finish() {
    if (!this._cancelled) this._resolveDone();
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * playSteps(cy, steps, delay, ctrl?)
 *
 * Plays `steps` on the Cytoscape instance `cy` with `delay` ms between each.
 * Returns the AnimatorController (creates one if `ctrl` is not supplied).
 */
export function playSteps(cy, steps, delay = 600, ctrl) {
  const controller = ctrl ?? new AnimatorController();

  (async () => {
    for (const step of steps) {
      if (controller._cancelled) break;

      // ── honour pause BEFORE applying the step ────────────────────────────
      await controller._waitIfPaused();
      if (controller._cancelled) break;

      if (step.type === 'WAIT') {
        await controller._sleep(step.duration ?? delay);
        continue;
      }

      applyStep(cy, step);
      await controller._sleep(delay);
    }
    controller._finish();
  })();

  return controller;
}

// ─────────────────────────────────────────────────────────────────────────────

function applyStep(cy, step) {
  switch (step.type) {

    // ── traversal / path ─────────────────────────────────────────────────────
    case 'VISIT_NODE': {
      const el = cy.getElementById(step.node);
      if (el.length) el.addClass('visited');
      break;
    }

    case 'RELAX_EDGE': {
      const el = cy.getElementById(step.edge);
      if (el.length) el.addClass('relaxed');
      break;
    }

    case 'UPDATE_DISTANCE': {
      const el = cy.getElementById(step.node);
      if (el.length) el.style('label', `${step.node}\n${step.distance === Infinity ? '∞' : step.distance}`);
      break;
    }

    case 'FINAL_PATH_NODE': {
      const el = cy.getElementById(step.node);
      if (el.length) {
        el.addClass('final-path');
        el.style({ 'background-color': '#22c55e', 'border-color': '#15803d', 'border-width': 3 });
      }
      break;
    }

    case 'FINAL_PATH_EDGE': {
      const el = cy.getElementById(step.edge);
      if (el.length) {
        el.addClass('final-path');
        el.style({ 'line-color': '#22c55e', 'target-arrow-color': '#22c55e', width: 5 });
      }
      break;
    }

    case 'HIGHLIGHT_PATH':
      (step.path || []).forEach(id => cy.getElementById(id).addClass('final-path'));
      break;

    // ── generic colour / label ───────────────────────────────────────────────
    case 'COLOR_NODE': {
      const el = cy.getElementById(step.node);
      if (el.length) el.style('background-color', step.color);
      break;
    }

    case 'COLOR_EDGE': {
      const el = cy.getElementById(step.edge);
      if (el.length) {
        el.style('line-color', step.color);
        el.style('target-arrow-color', step.color);
      }
      break;
    }

    case 'UPDATE_LABEL': {
      const el = cy.getElementById(step.node);
      if (el.length) el.style('label', step.label);
      break;
    }

    // ── graph generation ─────────────────────────────────────────────────────
    case 'CLEAR_GRAPH':
      cy.elements().remove();
      break;

    case 'ADD_NODE':
      cy.add({
        group: 'nodes',
        data: step.node,
        position: {
          x: step.position?.x ?? Math.random() * 600,
          y: step.position?.y ?? Math.random() * 400,
        },
      });
      break;

    case 'ADD_EDGE':
      try { cy.add({ group: 'edges', data: step.edge }); } catch (_) {}
      break;

    case 'REMOVE_EDGE': {
      const e = cy.getElementById(step.edgeId);
      if (e?.length) e.remove();
      break;
    }

    case 'APPLY_LAYOUT':
      cy.layout({ name: step.layout }).run();
      break;

    // ── structural balance ───────────────────────────────────────────────────
    case 'BALANCE_ASSIGN_NODE': {
      const el = cy.getElementById(step.node);
      if (!el.length) break;
      el.removeClass('balance-A balance-B unassigned');
      if (step.partition === 0) {
        el.addClass('balance-A');
        el.style({ 'background-color': '#3b82f6', 'border-color': '#1d4ed8', 'border-width': 3 });
      } else if (step.partition === 1) {
        el.addClass('balance-B');
        el.style({ 'background-color': '#f97316', 'border-color': '#c2410c', 'border-width': 3 });
      } else {
        el.addClass('unassigned');
        el.style({ 'background-color': '#94a3b8', 'border-color': '#64748b', 'border-width': 2 });
      }
      if (step.label !== undefined) el.style('label', step.label);
      break;
    }

    case 'BALANCE_VISIT_EDGE': {
      const el = cy.getElementById(step.edge);
      if (el.length) el.style({ 'line-color': '#facc15', 'target-arrow-color': '#facc15', width: 4 });
      break;
    }

    case 'BALANCE_EDGE_OK': {
      const el = cy.getElementById(step.edge);
      if (!el.length) break;
      el.removeClass('conflict');
      el.style({ 'line-color': '#22c55e', 'target-arrow-color': '#22c55e', width: 3 });
      break;
    }

    case 'BALANCE_EDGE_CONFLICT': {
      const el = cy.getElementById(step.edge);
      if (!el.length) break;
      el.addClass('conflict');
      el.style({ 'line-color': '#ef4444', 'target-arrow-color': '#ef4444', width: 5 });
      break;
    }

    case 'BALANCE_EDGE_FLIP': {
      const el = cy.getElementById(step.edge);
      if (!el.length) break;
      el.addClass('flipped');
      el.style({
        'line-color': '#f59e0b',
        'target-arrow-color': '#f59e0b',
        width: 4,
        'line-style': 'dashed',
      });
      if (step.label !== undefined) el.style('label', step.label);
      break;
    }

    case 'PULSE_EDGE': {
      const el = cy.getElementById(step.edge);
      if (!el.length) break;
      let pulses = step.count ?? 3;
      const doPulse = () => {
        if (!el || el.removed()) return;
        el.animate({ style: { 'line-color': '#fff', width: 7 } }, {
          duration: 200, complete: () => {
            if (!el || el.removed()) return;
            el.animate({ style: { 'line-color': '#ef4444', width: 5 } }, {
              duration: 200, complete: () => { if (--pulses > 0) doPulse(); },
            });
          },
        });
      };
      doPulse();
      break;
    }

    // ── PageRank ─────────────────────────────────────────────────────────────
    case 'RANK_NODE': {
      const el = cy.getElementById(step.node);
      if (!el.length) break;
      // Make the node large enough that the 2-line label is readable
      el.style({
        'background-color':    step.color,
        'border-color':        step.borderColor ?? '#ffffff55',
        'border-width':        step.borderWidth  ?? 2,
        'label':               step.label,
        'width':               step.size ?? 52,
        'height':              step.size ?? 52,
        'font-size':           '11px',
        'color':               '#090000',
        'text-outline-color':  '#f0e9e999',
        'text-outline-width':  3,
        'text-valign':         'center',
        'text-halign':         'center',
        'text-wrap':           'wrap',
        'text-max-width':      '60px',
      });
      break;
    }

    // ── HITS ─────────────────────────────────────────────────────────────────
    case 'HITS_NODE': {
      const el = cy.getElementById(step.node);
      if (!el.length) break;
      el.style({
        'background-color':    step.color,
        'border-color':        step.borderColor   ?? '#818cf8',
        'border-width':        step.hubBorderWidth ?? 4,
        'label':               step.label,
        'width':               step.size ?? 56,
        'height':              step.size ?? 56,
        'font-size':           '10px',
        'color':               '#120101',
        'text-outline-color':  '#fef7f799',
        'text-outline-width':  3,
        'text-valign':         'center',
        'text-halign':         'center',
        'text-wrap':           'wrap',
        'text-max-width':      '64px',
      });
      break;
    }

    default:
      break;
  }
}
