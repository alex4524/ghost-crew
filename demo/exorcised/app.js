// Hollow Pines Inn booking form, EXORCISED edition: the same form with every planted bug fixed.
// Messages come from ../shared/i18n-inn.js and are always inserted as text, never as HTML.
const PRICES = { garden: 140, attic: 180, lantern: 220 };
const t = (key, vars) => (window.GhostI18n ? window.GhostI18n.t(key, vars) : key);
const form = document.getElementById('booking');
const error = form.querySelector('.error');
const confirmation = document.getElementById('confirmation');
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
let lastError = null;
let lastBooking = null;

function fail(key) {
  lastError = key;
  lastBooking = null;
  error.textContent = t(key);
  confirmation.hidden = true;
}

function ticketStub(name, room) {
  const dots = '·'.repeat(Math.max(3, 32 - Array.from(name).length));
  return `${name} ${dots} ${room.toUpperCase()}`;
}

function showConfirmation({ name, nights, room }) {
  confirmation.hidden = false;
  confirmation.querySelector('.avatar').textContent = (Array.from(name)[0] ?? '').toUpperCase();
  confirmation.querySelector('.held').textContent = t('heldTitle', { name });
  confirmation.querySelector('.tag').textContent = name;
  confirmation.querySelector('.total').textContent = t(nights === 1 ? 'totalOne' : 'totalMany', { total: money.format(nights * PRICES[room]), nights });
  confirmation.querySelector('.stub').textContent = ticketStub(name, room);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = form.guest.value.trim();
  const email = form.email.value.trim();
  const nights = Number(form.nights.value);
  const room = form.room.value;
  error.textContent = '';
  lastError = null;

  if (!name) return fail('errName');
  if (!email || !form.email.checkValidity()) return fail('errEmail');
  if (!Number.isInteger(nights) || nights < 1 || nights > 30) return fail('errNightsRange');

  lastBooking = { name, nights, room };
  showConfirmation(lastBooking);
});

window.GhostI18n?.onChange(() => {
  if (lastError) error.textContent = t(lastError);
  if (lastBooking) showConfirmation(lastBooking);
});
