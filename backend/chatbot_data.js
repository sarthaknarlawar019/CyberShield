const chatbotData = [
    {
        topic: "phishing",
        keywords: ["phishing", "phishing attack"],
        response:
            "Phishing is a cyberattack where attackers impersonate trusted people or organizations to steal sensitive information. Check the sender, links, spelling, urgency, and requests for passwords or OTPs."
    },

    {
        topic: "password_security",
        keywords: ["password", "password security"],
        response:
            "Use long, unique passwords for every account. A password manager can help you create and store strong passwords. Enable multi-factor authentication whenever possible."
    },

    {
        topic: "malware",
        keywords: ["malware", "virus"],
        response:
            "Malware is malicious software designed to damage systems, steal information, or gain unauthorized access. Keep software updated and avoid downloading files from untrusted sources."
    },

    {
        topic: "network_security",
        keywords: ["wifi", "network", "network security"],
        response:
            "Use secure Wi-Fi networks, WPA2 or WPA3 encryption, strong router passwords, and avoid sensitive activities on unknown public networks."
    },

    {
        topic: "data_privacy",
        keywords: ["privacy", "data privacy"],
        response:
            "Protect personal information by limiting what you share online, checking application permissions, using strong authentication, and avoiding suspicious websites."
    }
];

module.exports = chatbotData;
