// Norevia — contact form pages. The form is plain HTML posted to /api/contact (Worker, src/worker.js); it needs no JavaScript.
import { esc } from './text.mjs';

export const CONTACT_EMAIL = 'norevia@coldcodelabs.com';
export const LIMITS = { name: 120, email: 254, org: 160, message: 5000 };

const form = (error) => `${error ? `<div class="form-alert" role="alert"><strong>The message could not be sent.</strong> Check that your name, a valid email address and a message (up to ${LIMITS.message.toLocaleString('en-US')} characters) are filled in, then try again. If it keeps failing, write to <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> instead.</div>` : ''}
<form class="contact-form" method="post" action="/api/contact" accept-charset="utf-8">
<div class="field"><label for="c-name">Name</label><input id="c-name" name="name" type="text" required maxlength="${LIMITS.name}" autocomplete="name"></div>
<div class="field"><label for="c-email">Email</label><input id="c-email" name="email" type="email" required maxlength="${LIMITS.email}" autocomplete="email" spellcheck="false"></div>
<div class="field"><label for="c-org">Organisation <span class="muted">(optional)</span></label><input id="c-org" name="organisation" type="text" maxlength="${LIMITS.org}" autocomplete="organization"></div>
<div class="field"><label for="c-msg">Message</label><textarea id="c-msg" name="message" rows="8" required maxlength="${LIMITS.message}"></textarea></div>
<div class="hp" aria-hidden="true"><label for="c-site">Leave this field empty</label><input id="c-site" name="website" type="text" tabindex="-1" autocomplete="off"></div>
<p class="form-note">Your name, email address and message are sent to the Norevia team by email so we can reply. Nothing is stored on this website, and there are no cookies or trackers.</p>
<button class="btn" type="submit">Send message <span class="arr" aria-hidden="true">→</span></button>
</form>`;

export function pageContactBody({ pageHead }, { error = false } = {}) {
  return `${pageHead({
    eyebrow: error ? 'Contact · not sent' : 'Contact',
    title: error ? 'Something went wrong' : 'Write to the Norevia team',
    lead: error ? 'Your message was not delivered. Nothing was lost on our side: the form is below again.' : 'Questions about a run, a hypothesis or the method, ideas for an experiment, corrections to a card, or a collaboration: send us a note and we will reply by email.',
    seed: 8,
  })}
<section><div class="wrap contact-grid">
<div class="contact-main">${form(error)}</div>
<aside class="contact-side" aria-label="Other ways to reach us">
<h2>Other ways</h2>
<p>Email: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
<p>Norevia is a research project of <a href="https://coldcodelabs.com" rel="noopener noreferrer">Cold Code Labs</a>. Cards, simulations and results are open: spotted a mistake? Say which card or run it concerns.</p>
<p><a href="/about/">About Norevia</a> · <a href="/method/">How we read evidence</a> · <a href="/journal/">Journal of runs</a></p>
</aside>
</div></section>`;
}

export function pageThanksBody({ pageHead }) {
  return `${pageHead({
    eyebrow: 'Contact · sent',
    title: 'Thank you, message received',
    lead: 'Your message is on its way to the Norevia team. We will reply by email to the address you gave.',
    seed: 10,
  })}
<section><div class="wrap"><p class="ctas"><a class="btn" href="/journal/">Read the journal</a><a class="btn ghost" href="/">Back to the home page</a></p></div></section>`;
}
