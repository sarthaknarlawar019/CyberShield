// data/dailyChallenges.js
// A rotating bank of quick daily challenges. One is selected deterministically
// per calendar day (same challenge for everyone on a given day, like Wordle),
// so it doesn't require any admin/cron setup.

module.exports = [
  {
    id: "dc1",
    category: "phishing",
    question: "Which URL is most likely to be a phishing link?",
    options: ["https://www.amazon.com/orders", "http://amaz0n-secure-login.tk", "https://paypal.com/signin", "https://github.com"],
    correctIndex: 1,
    explanation: "A misspelled brand name (amaz0n) plus a suspicious .tk domain are classic phishing signs.",
  },
  {
    id: "dc2",
    category: "password_security",
    question: "Which password is strongest?",
    options: ["password123", "Tr0ub4dor&3!Xk9", "qwerty", "123456789"],
    correctIndex: 1,
    explanation: "Length + mixed case + symbols + numbers makes it far harder to brute-force.",
  },
  {
    id: "dc3",
    category: "network_security",
    question: "You're at a coffee shop and need to check your bank account. Safest option?",
    options: ["Use the shop's open Wi-Fi directly", "Use mobile data or a trusted VPN", "Ask staff for the Wi-Fi password", "Use any available Wi-Fi network"],
    correctIndex: 1,
    explanation: "Open public Wi-Fi can be intercepted; mobile data or a trusted VPN is much safer for sensitive logins.",
  },
  {
    id: "dc4",
    category: "social_engineering",
    question: "A caller claiming to be 'Microsoft Support' asks for remote access to fix a virus you never reported. Best move?",
    options: ["Give them access, they sound official", "Hang up and contact Microsoft through official channels", "Give them your password to speed things up", "Follow their instructions exactly"],
    correctIndex: 1,
    explanation: "Unsolicited tech-support calls are a classic scam — always verify independently through official channels.",
  },
  {
    id: "dc5",
    category: "malware",
    question: "A site offers a 'cracked' (free, pirated) version of paid software. Risk level?",
    options: ["No risk if the site looks professional", "High risk of malware/spyware bundled in", "Only risky on Windows", "No risk if you have antivirus"],
    correctIndex: 1,
    explanation: "Cracked/pirated software is one of the most common malware delivery methods, regardless of how the site looks.",
  },
];