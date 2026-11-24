// Hollow Pines Inn booking form, EXORCISED edition: the same form with every planted bug fixed.
const PRICES = { garden: 140, attic: 180, lantern: 220 };
const form = document.getElementById('booking');
const error = form.querySelector('.error');
const confirmation = document.getElementById('confirmation');
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function fail(message) {
  error.textContent = message;
  confirmation.hidden = true;
}

function ticketStub(name, room) {
  const dots = '·'.repeat(Math.max(3, 32 - Array.from(name).length));
  return `${name} ${dots} ${room.toUpperCase()}`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = form.guest.value.trim();
  const email = form.email.value.trim();
  const nights = Number(form.nights.value);
  const room = form.room.value;
  error.textContent = '';

  if (!name) return fail('Please tell us your name.');
  if (!email || !form.email.checkValidity()) return fail('That email address does not look right.');
  if (!Number.isInteger(nights) || nights < 1 || nights > 30) return fail('Choose between 1 and 30 nights.');

  confirmation.hidden = false;
  confirmation.querySelector('.avatar').textContent = (Array.from(name)[0] ?? '').toUpperCase();
  confirmation.querySelector('.who').textContent = name;
  confirmation.querySelector('.tag').textContent = name;
  confirmation.querySelector('.total').textContent = `${money.format(nights * PRICES[room])} for ${nights} night${nights === 1 ? '' : 's'}`;
  confirmation.querySelector('.stub').textContent = ticketStub(name, room);
});
