# Emergency Help Network — Privacy Policy & Terms of Use

*Last updated: [DATE — fill in when you publish this]*

---

## Part 1: Privacy Policy

### 1. Who we are

Emergency Help Network ("EHN", "we", "us") is a community emergency-response app connecting people who need help with nearby volunteers, and providing hospitals with real-time visibility into incoming emergencies. This policy explains what data we collect, why, and what you can do about it.

**IMPORTANT — read this first:** EHN is a best-effort community tool built and maintained by a single developer. It is **not** a replacement for official emergency services. In any life-threatening situation, call **112** (India's national emergency number) first, or your local police (100), ambulance (108), or fire (101) service. EHN does not guarantee response time, helper availability, or that your alert will be seen — see Part 2, Section 6 for full limitation of liability.

### 2. Data we collect

| Category | What | Why |
|---|---|---|
| Account info | Name, phone number, email (optional), password (hashed, never stored in plain text) | To create and secure your account |
| Health info (optional) | Blood group, medical info you choose to add | Shown to responders/hospitals during an emergency so they can help appropriately |
| Location | Live GPS location during an active emergency; your general location periodically while the app is open (for nearby-helper matching) | To alert nearby helpers and let responders find you |
| Emergency contacts | Names and phone numbers of contacts you add | To notify them via SMS/WhatsApp/call/email if you trigger an SOS or miss a safety check-in |
| Emergency records | Type, severity, description, photos (if you add them), timeline of what happened | To coordinate response and give hospitals context |
| Chat messages | Text messages sent during an active emergency | To let you coordinate with responders |
| Device info | Push notification token (FCM) | To send you emergency alerts |

We do **not** collect your data when you're not using the app, beyond what's described above (e.g. we don't track your location in the background when there's no active emergency or check-in running).

### 3. Who sees your data

- **Nearby helpers** who accept your emergency see your name, phone, blood group, medical info (if provided), and live location for the duration of that emergency.
- **Hospital dashboard staff** see the same information for emergencies in their area, to coordinate care.
- **Your trusted contacts** receive an SMS/WhatsApp/call/email with your location if you trigger an SOS or a safety check-in expires unconfirmed.
- **We (the developer)** can access data as needed for debugging, abuse prevention, and legal compliance — never sold or shared with advertisers.
- **Third-party services** we rely on to run EHN: Twilio (SMS/WhatsApp/calls), Resend (email), Firebase (push notifications), Google Maps (location/maps), MongoDB Atlas (database hosting), Render and Vercel (application hosting), Sentry (error tracking). Each processes only the data needed to perform its function (e.g. Twilio sees the phone numbers and message text needed to send an SMS).

### 4. How long we keep it

- Account data: kept until you delete your account.
- Emergency records: kept for [X months/years — decide a retention period] for safety/legal purposes, then anonymized or deleted.
- Chat messages: tied to the emergency record's retention period above.

### 5. Your rights

Under India's Digital Personal Data Protection Act (DPDP) 2023, you have the right to:
- Access the personal data we hold about you
- Correct or update inaccurate data
- Withdraw consent and request deletion of your account and data
- Know who your data has been shared with

To exercise any of these, contact: **[YOUR EMAIL/CONTACT HERE]**

### 6. Security

Passwords are hashed (never stored in plain text). We use HTTPS for all data in transit. Sensitive credentials (API keys, database access) are kept out of our source code. That said, no system is perfectly secure — if you believe your account or data has been compromised, contact us immediately.

### 7. Children's privacy

EHN is not directed at children under 18. We don't knowingly collect data from minors. If you believe a minor has created an account, contact us and we'll remove it.

### 8. Changes to this policy

We'll update the "Last updated" date above when this policy changes. Continued use of the app after a change means you accept the updated policy.

---

## Part 2: Terms of Use

### 1. Acceptance

By creating an account or using EHN, you agree to these terms.

### 2. What EHN is — and isn't

EHN connects people needing help with nearby community volunteers and hospitals. It is a **supplementary, best-effort tool**, not a licensed emergency dispatch service, ambulance provider, or substitute for calling 112/100/108/101.

### 3. Your responsibilities

- Provide accurate information, especially your phone number and emergency contacts.
- Only trigger an SOS for genuine emergencies. Repeated false alarms may result in account restrictions (see Section 5).
- If you respond to someone else's emergency as a helper, you do so voluntarily and at your own judgment — EHN does not train, vet, or certify helpers as medical or rescue professionals.

### 4. No guarantee of response

We do not guarantee:
- That any helper will see or respond to your alert
- Response time
- That your location will be accurate (GPS accuracy varies)
- Uptime of the service (servers can go down, have outages, or be delayed)

### 5. Account restrictions

We may suspend or restrict accounts that:
- Repeatedly trigger false alarms
- Abuse the platform (harassment, spam, fraudulent use)
- Violate these terms

### 6. Limitation of liability

To the maximum extent permitted by law, EHN and its developer are not liable for any injury, loss, or damage arising from use of, or inability to use, the app — including but not limited to delayed or absent responses, inaccurate location data, or service outages. EHN is provided "as is" without warranties of any kind.

### 7. Governing law

These terms are governed by the laws of India. Any disputes are subject to the jurisdiction of the courts in [YOUR CITY/STATE — e.g. Patna, Bihar].

### 8. Contact

Questions about these terms or the privacy policy: **[YOUR EMAIL/CONTACT HERE]**

---

### Before you publish this

This is a solid starting draft, not final legal advice. A few things worth doing before it goes live:
1. Fill in the bracketed placeholders (date, contact email, retention period, jurisdiction).
2. Decide your actual data retention period for emergency records and update Part 1, Section 4.
3. If you plan to scale beyond a personal project (e.g. onboarding real hospitals as paying/formal partners), it's worth a quick review by an actual lawyer, particularly around the DPDP Act consent-collection requirements and the liability section — this draft leans protective but hasn't been reviewed by one.
4. Add a link to this document in your app (a "Privacy Policy" link on the registration screen is the standard pattern, and required for both Play Store and App Store listings).
