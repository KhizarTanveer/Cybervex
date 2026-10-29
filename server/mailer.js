// Email notifications through the company mailbox (Titan Mail SMTP).
// Every form submission sends two emails: a notification to the team (Reply-To set to the visitor)
// and a short confirmation to the visitor. Sending happens after the form has been answered, so a
// slow or failing mail server never blocks or breaks the form.
import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT = '465',
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM_NAME = 'Cybervex Digital',
  NOTIFY_TO,
} = process.env;

const enabled = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
const notifyTo = NOTIFY_TO || SMTP_USER;
const from = { name: MAIL_FROM_NAME, address: SMTP_USER };

const transport = enabled
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      // Always encrypted, except to a mail relay on this same machine
      requireTLS: Number(SMTP_PORT) !== 465 && SMTP_HOST !== 'localhost',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      // Never follow file paths or URLs inside message content
      disableFileAccess: true,
      disableUrlAccess: true,
    })
  : null;

if (!enabled) {
  console.warn('[mail] SMTP_HOST / SMTP_USER / SMTP_PASS not set — email notifications are off.');
} else {
  transport.verify().then(
    () => console.log(`[mail] ready — sending as ${SMTP_USER}`),
    (err) => console.warn(`[mail] cannot sign in to ${SMTP_HOST}: ${err.response || err.message}`)
  );
}

// Visitors can type anything, so confirmation emails to them are capped overall. This stops the
// forms being used to flood other people's inboxes and protects the mailbox's sending reputation.
const CONFIRMATIONS_PER_HOUR = 60;
let confirmationWindow = { count: 0, reset: 0 };
const confirmationAllowed = () => {
  const now = Date.now();
  if (now > confirmationWindow.reset) confirmationWindow = { count: 0, reset: now + 3600e3 };
  confirmationWindow.count += 1;
  return confirmationWindow.count <= CONFIRMATIONS_PER_HOUR;
};

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Single-line text for subjects and greetings
const oneLine = (value, max = 80) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const firstName = (name) => oneLine(name, 40).split(' ')[0];

const layout = (title, bodyHtml) => `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
  <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden">
    <tr><td style="background:#0b0b0b;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:1px">CYBERVEX <span style="color:#C8A96A">Digital</span></td></tr>
    <tr><td style="padding:28px">
      <h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h1>
      ${bodyHtml}
    </td></tr>
    <tr><td style="padding:16px 28px;background:#fafafa;color:#71717a;font-size:12px">Cybervex Digital · info@cybervexdigital.com</td></tr>
  </table>
</body></html>`;

const detailsTable = (rows) =>
  `<table role="presentation" style="border-collapse:collapse;width:100%;font-size:14px">${rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="width:1%;padding:8px 24px 8px 0;color:#71717a;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td>` +
        `<td style="padding:8px 0;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`
    )
    .join('')}</table>`;

const detailsText = (rows) => rows.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join('\n');

const paragraph = (text) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">${text}</p>`;

async function send(message, what) {
  if (!enabled) return;
  try {
    await transport.sendMail({ from, ...message });
  } catch (err) {
    console.warn(`[mail] could not send ${what}: ${err.response || err.message}`);
  }
}

// Contact page message → team notification + confirmation to the sender
export function notifyContactMessage(msg) {
  const rows = [['Name', msg.name], ['Email', msg.email], ['Phone', msg.phone], ['Message', msg.message]];
  send(
    {
      to: notifyTo,
      replyTo: { name: oneLine(msg.name), address: msg.email },
      subject: `New message from ${oneLine(msg.name, 60)}`,
      text: `New message from the website Contact page.\n\n${detailsText(rows)}\n\nReply to this email to answer them directly.`,
      html: layout('New website message', paragraph('Someone sent a message from the Contact page.') + detailsTable(rows) +
        paragraph('<br>Reply to this email to answer them directly.')),
    },
    'contact notification'
  );

  if (!confirmationAllowed()) return;
  // Deliberately doesn't repeat the visitor's message, so the form can't relay arbitrary text
  const name = firstName(msg.name);
  send(
    {
      to: msg.email,
      replyTo: notifyTo,
      subject: 'We received your message — Cybervex Digital',
      text: `Hi ${name},\n\nThank you for contacting Cybervex Digital. We've received your message and will reply within one business day.\n\nCybervex Digital\ninfo@cybervexdigital.com`,
      html: layout('Thank you for your message', paragraph(`Hi ${escapeHtml(name)},`) +
        paragraph("Thank you for contacting Cybervex Digital. We've received your message and will reply within one business day.") +
        paragraph('Best regards,<br>Cybervex Digital')),
    },
    'contact confirmation'
  );
}

// Job application → team notification (resume attached) + confirmation to the applicant
export function notifyJobApplication(app, resume) {
  const rows = [['Position', app.jobTitle], ['Name', app.fullName], ['Email', app.email], ['Phone', app.phone], ['City', app.city]];
  send(
    {
      to: notifyTo,
      replyTo: { name: oneLine(app.fullName), address: app.email },
      subject: `New application: ${oneLine(app.jobTitle, 60)} — ${oneLine(app.fullName, 60)}`,
      text: `New job application from the Careers page.\n\n${detailsText(rows)}\n\nThe resume is attached and also in the admin panel.`,
      html: layout('New job application', paragraph('Someone applied from the Careers page.') + detailsTable(rows) +
        paragraph('<br>The resume is attached and also available in the admin panel.')),
      attachments: [{ filename: resume.name, content: resume.buffer, contentType: 'application/pdf' }],
    },
    'application notification'
  );

  if (!confirmationAllowed()) return;
  const name = firstName(app.fullName);
  const position = oneLine(app.jobTitle);
  send(
    {
      to: app.email,
      replyTo: notifyTo,
      subject: `Application received: ${position} — Cybervex Digital`,
      text: `Hi ${name},\n\nThank you for applying for the ${position} position at Cybervex Digital. We've received your application and resume. Our team will review it and contact you if your profile matches the role.\n\nCybervex Digital\ninfo@cybervexdigital.com`,
      html: layout('Application received', paragraph(`Hi ${escapeHtml(name)},`) +
        paragraph(`Thank you for applying for the <strong>${escapeHtml(position)}</strong> position at Cybervex Digital. We've received your application and resume.`) +
        paragraph('Our team will review it and contact you if your profile matches the role.') +
        paragraph('Best regards,<br>Cybervex Digital')),
    },
    'application confirmation'
  );
}
