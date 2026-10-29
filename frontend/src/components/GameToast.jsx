// components/GameToast.jsx
// Displays XP gain / level-up / achievement-unlock toasts. Pass it any
// gamification result object returned from the backend (has shape
// { xp: {...}, newAchievements: [...] }) and it handles the rest.

import React, { useEffect, useState } from "react";

export default function GameToast({ result }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!result) return;
    const newItems = [];

    if (result.xp?.leveledUp) {
      newItems.push({ id: "level", text: `🎉 Level Up! Now Level ${result.xp.level} — ${result.xp.levelName}` });
    }
    if (result.xp?.xpAwarded) {
      newItems.push({ id: "xp-" + Date.now(), text: `+${result.xp.xpAwarded} XP earned` });
    }
    (result.newAchievements || []).forEach((a) => {
      newItems.push({ id: a.id, text: `${a.name} unlocked!` });
    });

    if (newItems.length === 0) return;
    setItems(newItems);
    const t = setTimeout(() => setItems([]), 4000);
    return () => clearTimeout(t);
  }, [result]);

  if (items.length === 0) return null;

  return (
    <div style={{ position: "fixed", top: 80, right: 24, zIndex: 200, display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((it) => (
        <div key={it.id} className="levelup-toast" style={{ position: "static" }}>
          {it.text}
        </div>
      ))}
    </div>
  );
}