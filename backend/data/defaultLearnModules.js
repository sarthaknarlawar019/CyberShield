module.exports = [
  {
    title: "Cybersecurity Fundamentals",
    description: "Understand the core ideas behind modern digital protection.",
    content:
      "Cybersecurity protects systems, networks, applications, and data from misuse. The three core goals are confidentiality, integrity, and availability. Good security is built from layers: strong identity, safe devices, secure networks, careful data handling, monitoring, and fast response when something looks wrong.",
    category: "fundamentals",
    order: 1,
  },
  {
    title: "Password Security",
    description: "Create stronger account protection with practical password habits.",
    content:
      "Use long, unique passwords for every important account. A strong password is hard to guess, not reused, and stored in a password manager. Enable multi-factor authentication whenever possible. Never share OTPs, recovery codes, or password reset links with anyone, even if the message sounds urgent.",
    category: "password_security",
    order: 2,
  },
  {
    title: "Phishing Awareness",
    description: "Spot suspicious emails, login pages, and messages before clicking.",
    content:
      "Phishing tries to create panic, curiosity, or trust. Check the sender domain, link destination, spelling, urgency, attachment type, and requests for credentials or payment. When in doubt, open the official website yourself instead of clicking the message link.",
    category: "phishing",
    order: 3,
  },
  {
    title: "Malware Protection",
    description: "Recognize malware risks and keep devices clean.",
    content:
      "Malware includes viruses, trojans, ransomware, spyware, and malicious scripts. Reduce risk by updating apps, avoiding cracked software, scanning downloads, disabling macros from unknown files, and backing up important data. If a device behaves strangely, disconnect it from the network and investigate.",
    category: "malware",
    order: 4,
  },
  {
    title: "Social Engineering",
    description: "Understand how attackers manipulate trust and pressure.",
    content:
      "Social engineering targets people instead of software. Attackers may impersonate support staff, managers, banks, delivery companies, or classmates. Verify unusual requests through a second trusted channel, especially requests involving money, login codes, files, or private information.",
    category: "social_engineering",
    order: 5,
  },
  {
    title: "Data Privacy",
    description: "Protect personal and sensitive data across apps and devices.",
    content:
      "Limit the information you share publicly, review app permissions, use secure connections, and avoid uploading sensitive files to unknown services. Treat IDs, phone numbers, addresses, financial details, and private documents as high-value data.",
    category: "data_privacy",
    order: 6,
  },
  {
    title: "Network Security Basics",
    description: "Learn safer behavior on Wi-Fi, public networks, and routers.",
    content:
      "Use trusted Wi-Fi networks, avoid sensitive logins on unknown public networks, keep router firmware updated, and change default router passwords. Watch for fake hotspots with familiar names. For sensitive work, prefer mobile data or a trusted VPN.",
    category: "network_security",
    order: 7,
  },
  {
    title: "Login Anomaly Detection",
    description: "Recognize risky login behavior before it becomes account takeover.",
    content:
      "Suspicious login signals include many failed attempts, a new device, unusual login time, unfamiliar location, impossible travel, or repeated password reset requests. When these appear together, reset credentials, revoke active sessions, and enable MFA.",
    category: "login_security",
    order: 8,
  },
  {
    title: "Security Logs and Alerts",
    description: "Read security events and decide what needs action.",
    content:
      "Useful logs show who acted, what changed, where it happened, when it happened, and the result. Look for repeated failures, spikes in requests, denied access, new admin actions, blocked accounts, suspicious IPs, and unusual file or URL activity.",
    category: "security_logs",
    order: 9,
  },
  {
    title: "Incident Response Basics",
    description: "Handle suspicious activity with a simple response process.",
    content:
      "A good response follows five steps: identify the issue, contain the damage, remove the cause, recover safely, and review what happened. Document evidence, preserve logs, notify the right people, and apply fixes before returning to normal.",
    category: "incident_response",
    order: 10,
  },
];
