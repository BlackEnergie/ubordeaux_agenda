'use strict';

/* =============================================
   Convertisseur d'Échelle — Logique applicative
   ============================================= */

// ── Enregistrement du Service Worker (PWA) ──────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .catch(err => console.warn('Service Worker non enregistré :', err));
  });
}

// ── État de l'application ────────────────────────────────────────────────────
let scaleN = 100;          // Dénominateur de 1:N (ex : 100 pour 1:100)
let lastEdited = 'plan';   // Quelle colonne a été saisie en dernier

// ── Références DOM ───────────────────────────────────────────────────────────
const scalePreset      = document.getElementById('scalePreset');
const customScaleGroup = document.getElementById('customScaleGroup');
const customScaleInput = document.getElementById('customScaleInput');
const scaleChip        = document.getElementById('scaleChip');
const scaleHint        = document.getElementById('scaleHint');
const scaleBadge       = document.getElementById('scaleBadge');

const planValueEl = document.getElementById('planValue');
const planUnitEl  = document.getElementById('planUnit');
const realValueEl = document.getElementById('realValue');
const realUnitEl  = document.getElementById('realUnit');

const resultHighlight = document.getElementById('resultHighlight');
const resultPlanEl    = document.getElementById('resultPlan');
const resultRealEl    = document.getElementById('resultReal');

const refTableBody = document.getElementById('refTableBody');
const toggleTableBtn = document.getElementById('toggleTable');
const tableWrapper   = document.getElementById('tableWrapper');

// ── Conversions d'unités ─────────────────────────────────────────────────────

/** Convertit une valeur en centimètres depuis l'unité donnée. */
function toCm(value, unit) {
  return unit === 'm' ? value * 100 : value;
}

/** Convertit une valeur en centimètres vers l'unité donnée. */
function fromCm(valueCm, unit) {
  return unit === 'm' ? valueCm / 100 : valueCm;
}

// ── Formatage des nombres ─────────────────────────────────────────────────────

/**
 * Formate un nombre pour l'affichage :
 * - Jusqu'à 8 chiffres significatifs
 * - Notation locale française
 */
function fmt(n) {
  if (!isFinite(n)) return '—';
  // Supprime les imprécisions flottantes inférieures à 1e-9
  const cleaned = parseFloat(n.toPrecision(10));
  return cleaned.toLocaleString('fr-FR', {
    maximumFractionDigits: 8,
    useGrouping: true,
  });
}

/** Formate en ajoutant l'unité. */
function fmtUnit(n, unit) {
  return `${fmt(n)} ${unit}`;
}

// ── Mise à jour de l'interface ────────────────────────────────────────────────

/** Rafraîchit les éléments d'information sur l'échelle en cours. */
function updateScaleUI() {
  const label = `1 : ${scaleN.toLocaleString('fr-FR')}`;
  scaleChip.textContent = label;
  scaleBadge.textContent = label;

  const realCmFor1cm = scaleN;          // 1 cm plan → scaleN cm réel
  const realMFor1cm  = scaleN / 100;    // en mètres

  if (realMFor1cm >= 1) {
    scaleHint.innerHTML = `1 cm sur le plan = <strong>${fmt(realMFor1cm)} m</strong> en réalité`;
  } else {
    scaleHint.innerHTML = `1 cm sur le plan = <strong>${fmt(realCmFor1cm)} cm</strong> en réalité`;
  }
}

/** Calcule et affiche le résultat dans la colonne opposée. */
function computeAndRender() {
  if (lastEdited === 'plan') {
    const pv = parseFloat(planValueEl.value);
    if (isNaN(pv) || pv < 0) {
      realValueEl.value = '';
      hideResult();
      return;
    }
    const planCm = toCm(pv, planUnitEl.value);
    const realCm = planCm * scaleN;
    const realInUnit = fromCm(realCm, realUnitEl.value);
    realValueEl.value = sanitizeOutput(realInUnit);
    showResult(pv, planUnitEl.value, realInUnit, realUnitEl.value);
  } else {
    const rv = parseFloat(realValueEl.value);
    if (isNaN(rv) || rv < 0) {
      planValueEl.value = '';
      hideResult();
      return;
    }
    const realCm = toCm(rv, realUnitEl.value);
    const planCm = realCm / scaleN;
    const planInUnit = fromCm(planCm, planUnitEl.value);
    planValueEl.value = sanitizeOutput(planInUnit);
    showResult(planInUnit, planUnitEl.value, rv, realUnitEl.value);
  }
}

/** Arrondit à 10 chiffres significatifs pour éviter la notation scientifique dans les champs. */
function sanitizeOutput(n) {
  if (!isFinite(n)) return '';
  return parseFloat(n.toPrecision(10));
}

function showResult(planVal, planUnit, realVal, realUnit) {
  resultPlanEl.textContent = fmtUnit(planVal, planUnit);
  resultRealEl.textContent = fmtUnit(realVal, realUnit);
  resultHighlight.classList.remove('d-none');
}

function hideResult() {
  resultHighlight.classList.add('d-none');
}

// ── Table de référence ────────────────────────────────────────────────────────

/**
 * Génère des valeurs de référence pertinentes selon l'échelle.
 * Les valeurs sont exprimées en cm côté plan.
 */
function generateRefValues() {
  // Valeurs standards en cm côté plan
  const bases = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];
  // Pour chaque base, on garde la valeur si la réalité est raisonnable
  // On filtre selon l'échelle pour garder les lignes pertinentes
  const rows = [];
  for (const pcm of bases) {
    const realCm = pcm * scaleN;
    rows.push({ planCm: pcm, realCm, realM: realCm / 100 });
  }
  return rows;
}

function buildRefTable() {
  const rows = generateRefValues();
  refTableBody.innerHTML = '';

  rows.forEach(({ planCm, realCm, realM }) => {
    const planDisplay = planCm >= 100
      ? `${fmt(planCm / 100)} m`
      : `${fmt(planCm)} cm`;

    const tr = document.createElement('tr');
    tr.dataset.planCm = planCm;

    const tdPlan = document.createElement('td');
    tdPlan.textContent = planDisplay;

    const tdRealCm = document.createElement('td');
    tdRealCm.textContent = `${fmt(realCm)} cm`;

    const tdRealM = document.createElement('td');
    tdRealM.textContent = `${fmt(realM)} m`;

    tr.append(tdPlan, tdRealCm, tdRealM);
    refTableBody.appendChild(tr);
  });
}

/**
 * Met en évidence la ligne du tableau la plus proche de la valeur plan saisie.
 */
function highlightNearestRow() {
  const pv = parseFloat(planValueEl.value);
  if (isNaN(pv) || pv <= 0) {
    clearHighlight();
    return;
  }
  const planCm = toCm(pv, planUnitEl.value);
  let minDiff = Infinity;
  let bestRow = null;

  refTableBody.querySelectorAll('tr').forEach(tr => {
    const rowCm = parseFloat(tr.dataset.planCm);
    const diff = Math.abs(rowCm - planCm);
    if (diff < minDiff) {
      minDiff = diff;
      bestRow = tr;
    }
  });

  clearHighlight();
  if (bestRow && minDiff <= planCm * 0.5) {
    bestRow.classList.add('highlighted');
  }
}

function clearHighlight() {
  refTableBody.querySelectorAll('tr.highlighted').forEach(tr => tr.classList.remove('highlighted'));
}

// ── Mise à jour globale ───────────────────────────────────────────────────────

function applyScale(n) {
  scaleN = n;
  updateScaleUI();
  buildRefTable();
  computeAndRender();
}

// ── Gestionnaires d'événements ────────────────────────────────────────────────

scalePreset.addEventListener('change', () => {
  if (scalePreset.value === 'custom') {
    customScaleGroup.style.display = '';
    customScaleInput.focus();
  } else if (scalePreset.value !== '') {
    customScaleGroup.style.display = 'none';
    applyScale(parseInt(scalePreset.value, 10));
  }
});

customScaleInput.addEventListener('input', () => {
  const n = parseInt(customScaleInput.value, 10);
  if (n > 0) applyScale(n);
});

planValueEl.addEventListener('input', () => {
  lastEdited = 'plan';
  computeAndRender();
  highlightNearestRow();
});

planUnitEl.addEventListener('change', () => {
  computeAndRender();
  highlightNearestRow();
});

realValueEl.addEventListener('input', () => {
  lastEdited = 'real';
  computeAndRender();
});

realUnitEl.addEventListener('change', () => {
  computeAndRender();
});

// Bouton masquer/afficher la table
toggleTableBtn.addEventListener('click', () => {
  const collapsed = tableWrapper.classList.toggle('collapsed');
  toggleTableBtn.textContent = collapsed ? 'Afficher' : 'Masquer';
  toggleTableBtn.setAttribute('aria-expanded', String(!collapsed));
});

// ── PWA : bannière d'installation ─────────────────────────────────────────────
let deferredPrompt = null;
const installBanner = document.getElementById('installBanner');
const installBtn    = document.getElementById('installBtn');
const dismissBtn    = document.getElementById('dismissInstall');

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  installBanner.classList.remove('d-none');
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBanner.classList.add('d-none');
});

dismissBtn.addEventListener('click', () => {
  installBanner.classList.add('d-none');
});

window.addEventListener('appinstalled', () => {
  installBanner.classList.add('d-none');
  deferredPrompt = null;
});

// ── Initialisation ────────────────────────────────────────────────────────────
applyScale(100);
