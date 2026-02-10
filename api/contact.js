function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, message, turnstileToken } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY || "";
  if (turnstileSecret) {
    if (!turnstileToken) return res.status(400).json({ error: "Missing turnstile token" });

    const verifyResp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: turnstileSecret,
        response: turnstileToken
      }).toString()
    });
    const verifyJson = await verifyResp.json();
    if (!verifyJson.success) return res.status(403).json({ error: "Turnstile failed" });
  }

  const resendApiKey = process.env.RESEND_API_KEY || "";
  const toEmail = process.env.CONTACT_TO_EMAIL || "";
  const fromEmail = process.env.CONTACT_FROM_EMAIL || "";
  if (!resendApiKey || !toEmail || !fromEmail) {
    return res.status(500).json({ error: "Email service not configured" });
  }

  const subject = `2heartpillows Kontakt: ${name}`;
  const text = `Name: ${name}\nE-Mail: ${email}\n\nNachricht:\n${message}`;

  const emailResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject,
      text
    })
  });

  if (!emailResp.ok) {
    return res.status(502).json({ error: "Email send failed" });
  }

  return res.status(200).json({ ok: true });
};

