// ═══════════════════════════════ TOASTS DE NOTIFICATION ══════════════════════
// Feedback instantané TDAH-friendly — dopamine à chaque action
import React from 'react';
import useGameStore from '../../stores/useGameStore';

const TOAST_STYLES = {
  xp:     { bg: 'bg-empire-gold/15', border: 'border-empire-gold/40', text: 'text-empire-gold' },
  badge:  { bg: 'bg-purple-500/15',  border: 'border-purple-500/40',  text: 'text-purple-400' },
  niveau: { bg: 'bg-empire-green/15', border: 'border-empire-green/40', text: 'text-empire-green' },
  serie:  { bg: 'bg-empire-momentum/15', border: 'border-empire-momentum/40', text: 'text-empire-momentum' },
  info:   { bg: 'bg-empire-blue/15', border: 'border-empire-blue/40', text: 'text-empire-blue' },
  erreur: { bg: 'bg-empire-red/15',  border: 'border-empire-red/40',  text: 'text-empire-red' },
};

export default function NotificationToast() {
  const { notifications } = useGameStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((notif, i) => {
        const style = TOAST_STYLES[notif.type] || TOAST_STYLES.info;
        return (
          <div
            key={notif.id}
            className={`${style.bg} ${style.text} border ${style.border} rounded-xl px-4 py-3 animate-slide-in backdrop-blur-sm`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <p className="text-sm font-medium">{notif.texte}</p>
          </div>
        );
      })}
    </div>
  );
}
