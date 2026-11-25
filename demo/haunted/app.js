// Hollow Pines Inn booking form, HAUNTED edition. The bugs are planted on purpose.
// Messages come from ../shared/i18n-inn.js; the bugs behave the same in every language.
const PRICES = { garden: 140, attic: 180, lantern: 220 };
const t = (key, vars) => (window.GhostI18n ? window.GhostI18n.t(key, vars) : key);
const form = document.getElementById('booking');
const error = form.querySelector('.error');
const confirmation = document.getElementById('confirmation');
let lastError = null;
let lastBooking = null;

function fail(key) {
  lastError = key;
  lastBooking = null;
  error.textContent = t(key);
  confirmation.hidden = true;
}

// planted: pads with dots to 32 characters; longer names make repeat() throw
function ticketStub(name, room) {
  return `${name} ${'·'.repeat(32 - name.length)} ${room.toUpperCase()}`;
}

function showConfirmation({ name, nights, room }) {
  const total = nights * PRICES[room];
  confirmation.hidden = false;
  // planted: innerHTML with the guest's own text, and name[0] splits emoji in half
  confirmation.innerHTML = `
    <div class="avatar">${name[0].toUpperCase()}</div>
    <h3>${t('heldTitle', { name })}</h3>
    <p>${t('doorTag')} <span class="tag">${name}</span></p>
    <p class="total">${t('total', { total: `$${total}`, nights })}</p>
    <p class="stub"></p>`;
  confirmation.querySelector('.stub').textContent = ticketStub(name, room);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = form.guest.value;                    // planted: never trimmed
  const email = form.email.value;
  const nights = parseInt(form.nights.value, 10);   // planted: negative and huge numbers pass
  const room = form.room.value;
  error.textContent = '';
  lastError = null;

  if (!name) return fail('errName');
  // planted: rejects real addresses with + or an apostrophe
  if (!/^[a-z0-9.]+@[a-z0-9-]+\.[a-z]+$/i.test(email)) return fail('errEmail');
  if (!nights) return fail('errNights');

  lastBooking = { name, nights, room };
  showConfirmation(lastBooking);
});

window.GhostI18n?.onChange(() => {
  if (lastError) error.textContent = t(lastError);
  if (lastBooking) showConfirmation(lastBooking);
});
