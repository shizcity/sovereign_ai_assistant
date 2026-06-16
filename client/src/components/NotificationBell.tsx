import { useState } from "react";
import { Bell, BellOff, CheckCheck, Users, TrendingUp, Trophy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";

const TYPE_ICON: Record<string, React.ReactNode> = {
  rapport_levelup: <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />,
  roundtable_complete: <Users className="w-3.5 h-3.5 text-purple-400" />,
  achievement_unlocked: <Trophy className="w-3.5 h-3.5 text-yellow-400" />,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const { data: notifications } = trpc.notifications.list.useQuery(
    { limit: 20 },
    { enabled: open }
  );
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const unreadCount = unreadData?.count ?? 0;

  const handleOpen = () => {
    setOpen((v) => !v);
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-white/50 hover:text-white/90 hover:bg-white/8 transition-all"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-cyan-500 text-[9px] font-bold text-black leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-white/10 bg-[#0d0d0f] shadow-2xl shadow-black/60 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <span className="text-sm font-semibold text-white/90">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {!notifications || notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-white/30">
                  <BellOff className="w-6 h-6" />
                  <p className="text-xs">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.read) markRead.mutate({ id: n.id });
                    }}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/4 ${
                      !n.read ? "bg-cyan-500/5" : ""
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-white/8 flex items-center justify-center">
                      {TYPE_ICON[n.type] ?? <Bell className="w-3.5 h-3.5 text-white/40" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium leading-snug ${!n.read ? "text-white/90" : "text-white/60"}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-white/40 leading-snug mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-white/25 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
