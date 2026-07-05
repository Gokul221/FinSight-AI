"use client";

import { useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Copy, RefreshCw, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/AppContext";

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card p-6">
      <div className="mb-5 pb-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        {description && (
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 border-b border-white/[0.04] last:border-0">
      <label className="text-xs text-slate-400 sm:w-40 flex-shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function ProfileTab() {
  const { user, userLoading } = useApp();

  return (
    <SectionCard
      title="Profile Information"
      description="Your personal details and account settings"
    >
      <div className="space-y-0">
        <FieldRow label="Full Name">
          <Input
            value={userLoading ? "" : user?.name ?? ""}
            className="bg-white/[0.04] border-white/[0.08] text-slate-200 text-sm h-9 focus:border-indigo-500/50"
          />
        </FieldRow>
        <FieldRow label="Email">
          <Input
            value={userLoading ? "" : user?.email ?? ""}
            type="email"
            className="bg-white/[0.04] border-white/[0.08] text-slate-200 text-sm h-9 focus:border-indigo-500/50"
          />
        </FieldRow>
        <FieldRow label="Plan">
          <div className="flex items-center gap-2">
            <span className="badge-indigo text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              Pro Plan
            </span>
            <span className="text-[10px] text-slate-500">Renews Feb 1, 2025</span>
          </div>
        </FieldRow>
        <FieldRow label="Password">
          <Button
            variant="outline"
            size="sm"
            className="border-white/[0.1] text-slate-300 hover:bg-white/5 text-xs h-8"
          >
            Change Password
          </Button>
        </FieldRow>
      </div>
      <div className="mt-5 flex gap-2">
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
        >
          Save Changes
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-slate-200 text-xs"
        >
          Cancel
        </Button>
      </div>
    </SectionCard>
  );
}

function ApiKeyRow({ label, maskedValue }: { label: string; maskedValue: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-white/[0.04] last:border-0">
      <div className="sm:w-48 flex-shrink-0">
        <p className="text-xs font-medium text-slate-300">{label}</p>
      </div>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 flex items-center gap-2">
          <code className="text-xs font-num text-slate-400 flex-1">
            {shown ? maskedValue.replace("...", "xxxxxxxxxxx") : maskedValue}
          </code>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-slate-500 hover:text-slate-300 hover:bg-white/5"
          onClick={() => setShown(!shown)}
        >
          {shown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5"
          onClick={handleCopy}
        >
          <Copy className="w-3 h-3 mr-1" />
          {copied ? "Copied!" : "Copy"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Regen
        </Button>
      </div>
    </div>
  );
}

function ApiKeysTab() {
  return (
    <div className="space-y-4">
      <div className="glass-card p-4 flex items-start gap-3 border-l-2 border-amber-500">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300">
          Never share your API keys. These are stored encrypted and only accessible by you.
        </p>
      </div>

      <SectionCard
        title="API Keys"
        description="Keys used to connect to AI and database services"
      >
        <ApiKeyRow label="OpenAI API Key" maskedValue="sk-...4f9a" />
        <ApiKeyRow label="Supabase URL" maskedValue="https://xyz...abc.supabase.co" />
        <ApiKeyRow label="Supabase Anon Key" maskedValue="eyJ...9a2k" />
      </SectionCard>
    </div>
  );
}

function PreferencesTab() {
  const { darkMode, setDarkMode } = useApp();
  const [prefs, setPrefs] = useState({
    emailAlerts: true,
    autoInsights: true,
    weeklySummary: false,
  });

  const toggle = (key: string) => {
    if (key === "darkMode") {
      setDarkMode(!darkMode);
    } else {
      setPrefs((p) => ({ ...p, [key]: !p[key as keyof typeof prefs] }));
    }
  };

  const toggleItems = [
    { key: "darkMode" as const, label: "Dark Mode", desc: "Use dark theme across the dashboard" },
    { key: "emailAlerts" as const, label: "Email Alerts", desc: "Receive price and earnings alerts by email" },
    { key: "autoInsights" as const, label: "AI Auto-Insights", desc: "Automatically generate daily portfolio insights" },
    { key: "weeklySummary" as const, label: "Weekly Portfolio Summary", desc: "Receive a weekly digest of your portfolio performance" },
  ];

  return (
    <SectionCard
      title="Preferences"
      description="Customize your FinSight AI experience"
    >
      <div className="space-y-0">
        {toggleItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-4 border-b border-white/[0.04] last:border-0"
          >
            <div>
              <p className="text-sm text-slate-200 font-medium">{item.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </div>
            <Switch
              checked={item.key === "darkMode" ? darkMode : prefs[item.key as keyof typeof prefs]}
              onCheckedChange={() => toggle(item.key)}
              className="data-[state=checked]:bg-indigo-600"
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export default function SettingsPage() {
  return (
    <DashboardShell>
      <div className="space-y-5 max-w-2xl">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your profile, API keys, and preferences
          </p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="bg-white/[0.04] border border-white/[0.08] p-1 mb-5">
            <TabsTrigger
              value="profile"
              className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="api-keys"
              className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400"
            >
              API Keys
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400"
            >
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="api-keys">
            <ApiKeysTab />
          </TabsContent>
          <TabsContent value="preferences">
            <PreferencesTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
