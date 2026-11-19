import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity, ArrowUpRight, Bell, BriefcaseBusiness, Building2, ChevronDown, ChevronLeft, ChevronRight,
  Command, Compass, Cpu, Database, FolderKanban, Gauge, Home, Mail, Menu, Moon, Package,
  PanelLeftClose, PanelLeftOpen, Search, Settings, Signal, Sun, Users, Workflow, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppStore, actions } from "@/hooks/use-store";
import { cx, StatusBadge } from "./ui";
import { demoProspects } from "@/demo-data";
import { useNavigate } from "@tanstack/react-router";

const sections = [
  { title: "Workspace", links: [
    { label: "Overview", to: "/", icon: Home }, { label: "Products", to: "/products", icon: Package },
    { label: "Business Profile", to: "/business-profile", icon: Building2 }, { label: "ICP Builder", to: "/icp", icon: TargetIcon },
  ]},
  { title: "Sales intelligence", links: [
    { label: "Discover Prospects", to: "/discover", icon: Compass }, { label: "Prospects", to: "/prospects", icon: Users },
    { label: "Buying Signals", to: "/signals", icon: Signal },
  ]},
  { title: "Engagement", links: [
    { label: "Outreach Studio", to: "/outreach", icon: Mail }, { label: "Reply Intelligence", to: "/replies", icon: Workflow },
  ]},
  { title: "System", links: [
    { label: "Agent Activity", to: "/activity", icon: Activity }, { label: "Local AI & Models", to: "/local-ai", icon: Cpu }, { label: "Settings", to: "/settings", icon: Settings },
  ]},
];
function TargetIcon(props: React.ComponentProps<typeof Gauge>) { return <Gauge {...props}/>; }
const routeNames: Record<string, string> = Object.fromEntries(sections.flatMap(s => s.links.map(l => [l.to, l.label])));

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = useRouterState({ select: r => r.location.pathname });
  const nav = useNavigate();
  const theme = useAppStore(s => s.prefs.theme);
  const prospects = useAppStore(s => s.prospects);
  const signals = useAppStore(s => s.signals);
  const currentName = routeNames[pathname] ?? (pathname.startsWith("/prospects/") ? "Prospect detail" : "Workspace");
  const matches = prospects.filter(p => search && `${p.company} ${p.industry} ${p.location}`.toLowerCase().includes(search.toLowerCase())).slice(0, 5);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(v => !v); } if (e.key === "Escape") { setMobileOpen(false); setSearchOpen(false); } };
    window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn);
  }, []);
  const toggleTheme = () => actions.setPrefs({ theme: theme === "light" ? "dark" : "light" });
  const sidebar = <div className={cx("flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200", collapsed ? "w-[66px]" : "w-[244px]")}>
    <div className={cx("flex h-[60px] shrink-0 items-center border-b border-sidebar-border", collapsed ? "justify-center px-2" : "gap-2.5 px-4")}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground"><Command className="h-4 w-4"/></div>
      {!collapsed && <div className="min-w-0 flex-1"><div className="text-sm font-semibold leading-4">Harvey<span className="ml-1 text-primary">AI</span></div><div className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">LOCAL SALES INTELLIGENCE</div></div>}
      {!collapsed && <button aria-label="Collapse sidebar" className="rounded-sm p-1 text-muted-foreground hover:bg-sidebar-accent" onClick={() => setCollapsed(true)}><PanelLeftClose className="h-4 w-4"/></button>}
    </div>
    {collapsed && <button aria-label="Expand sidebar" className="mx-auto mt-3 rounded-sm p-1.5 text-muted-foreground hover:bg-sidebar-accent" onClick={() => setCollapsed(false)}><PanelLeftOpen className="h-4 w-4"/></button>}
    <nav className="flex-1 overflow-y-auto px-2 py-3">
      {sections.map(section => <div key={section.title} className="mb-4">
        {!collapsed && <div className="mb-1 px-2.5 pt-2 text-[9px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">{section.title}</div>}
        <div className="space-y-0.5">{section.links.map(({ label, to, icon: Icon }) => {
          const active = pathname === to || (to !== "/" && pathname.startsWith(`${to}/`));
          const link = <Link key={to} to={to} onClick={() => setMobileOpen(false)} className={cx("group flex h-9 items-center gap-3 rounded-sm px-2.5 text-[12px] transition-colors", active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground", collapsed && "justify-center px-0")}>
            <Icon className={cx("h-4 w-4 shrink-0", active && "text-primary")}/>{!collapsed && <span className="truncate">{label}</span>}{!collapsed && label === "Buying Signals" && signals.some(s => s.status === "new") && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"/>}
          </Link>;
          return collapsed ? <TooltipProvider key={to}><Tooltip><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right">{label}</TooltipContent></Tooltip></TooltipProvider> : link;
        })}</div>
      </div>)}
    </nav>
    {!collapsed && <div className="border-t border-sidebar-border p-3">
      <div className="flex items-center gap-2 rounded-sm bg-sidebar-accent/60 p-2.5"><div className="relative"><span className="block h-2 w-2 rounded-full bg-warning"/><span className="absolute -inset-1 animate-pulse rounded-full bg-warning/15"/></div><div className="min-w-0"><div className="text-[11px] font-medium">Local backend offline</div><div className="text-[10px] text-muted-foreground">Connect at localhost:8000</div></div><button className="ml-auto text-muted-foreground" aria-label="Open local AI settings" onClick={() => nav({ to: "/local-ai" })}><ArrowUpRight className="h-3.5 w-3.5"/></button></div>
      <div className="mt-2 flex items-center justify-between px-1 text-[9px] text-muted-foreground"><span>Harvey v0.1.0</span><span className="inline-flex items-center gap-1"><Database className="h-3 w-3"/> Local only</span></div>
    </div>}
  </div>;

  return <div className="flex min-h-screen w-full bg-background">
    <aside className="fixed inset-y-0 left-0 z-30 hidden md:block">{sidebar}</aside>
    {mobileOpen && <div className="fixed inset-0 z-50 md:hidden"><button aria-label="Close navigation" className="absolute inset-0 bg-foreground/30" onClick={() => setMobileOpen(false)}/><div className="absolute inset-y-0 left-0 shadow-xl">{sidebar}</div></div>}
    <div className={cx("min-w-0 flex-1 transition-[margin]", collapsed ? "md:ml-[66px]" : "md:ml-[244px]")}>
      <header className="sticky top-0 z-20 flex h-[60px] items-center gap-3 border-b border-border bg-background/95 px-3 backdrop-blur-sm sm:px-5">
        <Button aria-label="Open navigation" variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setMobileOpen(true)}><Menu className="h-4 w-4"/></Button>
        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span>Workspace</span><ChevronRight className="h-3 w-3"/><span className="font-medium text-foreground">{currentName}</span></div>
        <div className="flex-1 sm:flex-none"/>
        <Popover open={searchOpen} onOpenChange={setSearchOpen}><PopoverTrigger asChild><button onClick={() => setSearchOpen(true)} className="flex h-8 w-full max-w-[240px] items-center gap-2 rounded-sm border border-input bg-background px-2.5 text-left text-xs text-muted-foreground"><Search className="h-3.5 w-3.5"/><span className="flex-1">Search prospects…</span><kbd className="hidden rounded-sm border px-1 font-mono text-[9px] sm:inline">⌘ K</kbd></button></PopoverTrigger><PopoverContent align="end" className="w-[min(380px,calc(100vw-24px))] p-2"><Input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Company, industry, location…" className="h-9 rounded-sm text-xs"/>{search && <div className="mt-2 max-h-64 overflow-auto">{matches.length ? matches.map(p => <button key={p.id} className="flex w-full items-center justify-between rounded-sm px-2 py-2 text-left hover:bg-muted" onClick={() => { nav({ to: "/prospects/$prospectId", params: { prospectId: p.id } }); setSearchOpen(false); setSearch(""); }}><span><span className="block text-xs font-medium">{p.company}</span><span className="text-[10px] text-muted-foreground">{p.industry} · {p.location}</span></span><StatusBadge status={p.status}/></button>) : <p className="p-3 text-xs text-muted-foreground">No matching prospects.</p>}</div>}</PopoverContent></Popover>
        <Popover open={notifOpen} onOpenChange={setNotifOpen}><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Notifications" className="relative h-8 w-8 rounded-sm"><Bell className="h-4 w-4"/>{signals.some(s => s.status === "new") && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive ring-2 ring-background"/>}</Button></PopoverTrigger><PopoverContent align="end" className="w-72 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold">Notifications</span><span className="text-[10px] text-muted-foreground">Sample activity</span></div>{signals.filter(s => s.status === "new").slice(0, 3).map(s => <div key={s.id} className="border-t py-2"><div className="text-xs font-medium">{s.title}</div><div className="text-[10px] text-muted-foreground">{s.date} · {s.priority} priority</div></div>)}{!signals.some(s => s.status === "new") && <p className="py-5 text-center text-xs text-muted-foreground">You're all caught up.</p>}</PopoverContent></Popover>
        <Button variant="ghost" size="icon" aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`} onClick={toggleTheme} className="h-8 w-8 rounded-sm">{theme === "light" ? <Moon className="h-4 w-4"/> : <Sun className="h-4 w-4"/>}</Button>
        <Popover open={profileOpen} onOpenChange={setProfileOpen}><PopoverTrigger asChild><button aria-label="Open user menu" className="flex items-center gap-2 rounded-sm px-1 py-1 hover:bg-muted"><Avatar className="h-7 w-7 rounded-sm"><AvatarFallback className="rounded-sm bg-primary/10 text-[10px] text-primary">NW</AvatarFallback></Avatar><span className="hidden text-xs font-medium sm:block">Northwind</span><ChevronDown className="hidden h-3 w-3 text-muted-foreground sm:block"/></button></PopoverTrigger><PopoverContent align="end" className="w-48 p-1"><button className="w-full rounded-sm px-2.5 py-2 text-left text-xs hover:bg-muted" onClick={() => { nav({ to: "/business-profile" }); setProfileOpen(false); }}>Business profile</button><button className="w-full rounded-sm px-2.5 py-2 text-left text-xs hover:bg-muted" onClick={() => { nav({ to: "/settings" }); setProfileOpen(false); }}>Preferences</button><div className="my-1 border-t"/><div className="px-2.5 py-2 text-[10px] text-muted-foreground">Local workspace · no account</div></PopoverContent></Popover>
      </header>
      <main className="mx-auto min-h-[calc(100vh-60px)] max-w-[1440px] p-4 sm:p-6 lg:p-8">{children}</main>
      <footer className="border-t border-border px-5 py-3 text-[10px] text-muted-foreground"><div className="mx-auto flex max-w-[1440px] items-center justify-between"><span>Harvey AI · Local-first sales workspace</span><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-warning"/> Backend disconnected</span></div></footer>
    </div>
  </div>;
}
