import { useState } from "react";
import {
  useAdminSendNotification,
} from "@workspace/api-client-react";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NotificationsPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", message: "", targetType: "all", targetUserIds: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const send = useAdminSendNotification({
    mutation: {
      onSuccess: () => {
        setForm({ title: "", message: "", targetType: "all", targetUserIds: "" });
        toast({ title: "Notification sent successfully" });
      },
      onError: () => toast({ title: "Failed to send notification", variant: "destructive" }),
    },
  });

  function handleSend() {
    if (!form.title || !form.message) return;
    const targetUserIds = form.targetType === "specific"
      ? form.targetUserIds.split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
      : undefined;
    send.mutate({ data: { title: form.title, message: form.message, targetType: form.targetType, targetUserIds } });
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-lg font-semibold text-foreground">Send Notification</h1>

      <div className="bg-card border border-border rounded p-5 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Target</label>
          <select data-testid="select-target-type" value={form.targetType} onChange={set("targetType")} className="w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All Users</option>
            <option value="specific">Specific Users</option>
          </select>
        </div>

        {form.targetType === "specific" && (
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">User IDs (comma-separated)</label>
            <input data-testid="input-target-user-ids" type="text" value={form.targetUserIds} onChange={set("targetUserIds")} placeholder="1, 2, 3" className="w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono" />
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Title</label>
          <input data-testid="input-notification-title" type="text" value={form.title} onChange={set("title")} placeholder="Notification title" className="w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Message</label>
          <textarea data-testid="input-notification-message" value={form.message} onChange={set("message")} rows={4} placeholder="Notification message..." className="w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
        </div>

        <button
          data-testid="button-send-notification"
          onClick={handleSend}
          disabled={send.isPending || !form.title || !form.message}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {send.isPending ? "Sending..." : "Send Notification"}
        </button>
      </div>
    </div>
  );
}
