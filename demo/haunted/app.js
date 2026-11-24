// Hollow Pines Inn booking form, HAUNTED edition. The bugs are planted on purpose.
const PRICES = { garden: 140, attic: 180, lantern: 220 };
const form = document.getElementById('booking');
const error = form.querySelector('.error');
const confirmation = document.getElementById('confirmation');

function fail(message) {
  error.textContent = message;
  confirmation.hidden = true;
}

// planted: pads with dots to 32 characters; longer names make repeat() throw
function ticketStub(name, room) {
  return `${name} ${'·'.repeat(32 - name.length)} ${room.toUpperCase()}`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = form.guest.value;                    // planted: never trimmed
  const email = form.email.value;
  const nights = parseInt(form.nights.value, 10);   // planted: negative and huge numbers pass
  const room = form.room.value;
  error.textContent = '';

  if (!name) return fail('Please tell us your name.');
  // planted: rejects real addresses with + or an apostrophe
  if (!/^[a-z0-9.]+@[a-z0-9-]+\.[a-z]+$/i.test(email)) return fail('That email address does not look right.');
  if (!nights) return fail('How many nights?');

  const total = nights * PRICES[room];
  confirmation.hidden = false;
  // planted: innerHTML with the guest's own text, and name[0] splits emoji in half
  confirmation.innerHTML = `
    <div class="avatar">${name[0].toUpperCase()}</div>
    <h3>Your room is held, ${name}!</h3>
    <p>Name on the door: <span class="tag">${name}</span></p>
    <p class="total">$${total} for ${nights} nights</p>
    <p class="stub"></p>`;
  confirmation.querySelector('.stub').textContent = ticketStub(name, room);
});
