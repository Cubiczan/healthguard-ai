"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
// ScrollArea available for future use
import {
  Shield, Heart, Activity, AlertTriangle, Users, Brain,
  Stethoscope, Send, Plus, Check, Clock,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus,
  UserPlus, Wind, Zap, FileText,
  Bot, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

// ─── Types ──────────────────────────────────────────────────────────────
interface Patient {
  id: string; name: string; age: number; gender: string;
  conditions: string; medications: string; latestVitals: VitalsReading | null;
  activeAlertCount: number; hasCriticalAlert: boolean; createdAt: string;
}

interface VitalsReading {
  id: string; patientId: string; heartRate: number; systolic: number;
  diastolic: number; temperature: number; spo2: number; notes: string; recordedAt: string;
}

interface Alert {
  id: string; patientId: string; type: string; category: string;
  message: string; severity: number; acknowledged: boolean; createdAt: string;
  patient?: { id: string; name: string };
}

interface DashboardData {
  totalPatients: number; totalActiveAlerts: number; totalAcknowledgedAlerts: number;
  vitalsReviewedToday: number; severityBreakdown: Record<string, number>;
  latestVitals: Array<VitalsReading & { patient: { id: string; name: string } }>;
  recentAlerts: Alert[];
  averages: { heartRate: number; systolic: number; diastolic: number; spo2: number };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Animation Variants ──────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.35 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

// ─── Helpers ────────────────────────────────────────────────────────────
function severityColor(type: string) {
  if (type === "critical") return "bg-red-500/15 text-red-400 border-red-500/30";
  if (type === "warning") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return "bg-sky-500/15 text-sky-400 border-sky-500/30";
}

function severityIcon(type: string) {
  if (type === "critical") return <AlertTriangle className="h-3.5 w-3.5" />;
  if (type === "warning") return <Zap className="h-3.5 w-3.5" />;
  return <FileText className="h-3.5 w-3.5" />;
}

function getBPStatus(sys: number) {
  if (sys >= 160) return { label: "Crisis", color: "text-red-400" };
  if (sys >= 140) return { label: "High", color: "text-amber-400" };
  if (sys >= 120) return { label: "Elevated", color: "text-yellow-400" };
  return { label: "Normal", color: "text-emerald-400" };
}

function getSpO2Status(spo2: number) {
  if (spo2 < 90) return { label: "Critical", color: "text-red-400" };
  if (spo2 < 93) return { label: "Low", color: "text-amber-400" };
  return { label: "Normal", color: "text-emerald-400" };
}

// ─── Main Page ──────────────────────────────────────────────────────────
export default function HealthGuardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-950/30 via-slate-950 to-slate-950 bg-grid">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-teal-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <Shield className="h-4.5 w-4.5 text-white" />
              </div>
              <div className="absolute -inset-1.5 bg-teal-500/10 rounded-xl blur-md" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-100">
                HealthGuard <span className="text-teal-400">AI</span>
              </h1>
              <p className="text-[10px] text-slate-500 -mt-0.5">Intelligent Healthcare Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-medium text-teal-300">Gemini Active</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <Brain className="h-3 w-3" />
              <span className="hidden sm:inline">XPRIZE Submission</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-slate-800/50 bg-slate-950/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent h-auto p-0 gap-0 border-0">
              {[
                { value: "dashboard", label: "Dashboard", icon: Activity },
                { value: "assistant", label: "AI Assistant", icon: Brain },
                { value: "patients", label: "Patients", icon: Users },
                { value: "alerts", label: "Alerts", icon: AlertTriangle },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs data-[state=active]:bg-transparent data-[state=active]:text-teal-400 data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-teal-400 rounded-none px-3 sm:px-4 py-3 gap-1.5 text-slate-400 hover:text-slate-300 transition-all"
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <main className="py-4 sm:py-6">
              <TabsContent value="dashboard" className="mt-0">
                <DashboardTab />
              </TabsContent>
              <TabsContent value="assistant" className="mt-0">
                <AssistantTab patients={[]} />
              </TabsContent>
              <TabsContent value="patients" className="mt-0">
                <PatientsTab />
              </TabsContent>
              <TabsContent value="alerts" className="mt-0">
                <AlertsTab />
              </TabsContent>
            </main>
          </Tabs>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 mt-auto bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-[10px] text-slate-600">
            HealthGuard AI — Intelligent Healthcare Decision Support
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-teal-500/60">
            <Shield className="h-3 w-3" />
            Built with Gemini for XPRIZE Build with Gemini Challenge
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Dashboard Tab ───────────────────────────────────────────────────────
function DashboardTab() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <motion.div {...stagger} className="space-y-4" animate>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32 bg-slate-800/40 rounded-xl" />
        ))}
      </motion.div>
    );
  }

  // Build heart rate chart data
  const patientMap = new Map<string, VitalsReading[]>();
  for (const v of data.latestVitals) {
    const arr = patientMap.get(v.patient.name) || [];
    arr.push(v);
    patientMap.set(v.patient.name, arr);
  }

  const heartRateData = Array.from(patientMap.entries()).flatMap(([name, readings]) =>
    readings.slice(0, 8).reverse().map(r => ({
      time: format(new Date(r.recordedAt), "MMM d"),
      [name]: r.heartRate,
    }))
  );

  const allTimestamps = heartRateData.map(d => d.time);
  const uniqueTimes = [...new Set(allTimestamps)];
  const mergedHRData = uniqueTimes.map(time => {
    const entry: Record<string, string | number> = { time };
    for (const [name, readings] of patientMap) {
      const match = readings.find(r => format(new Date(r.recordedAt), "MMM d") === time);
      if (match) entry[name] = match.heartRate;
    }
    return entry;
  });

  const chartColors = ["#2dd4bf", "#f97316", "#a78bfa"];

  const statsCards = [
    {
      label: "Total Patients",
      value: data.totalPatients,
      icon: Users,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
      border: "border-teal-500/20",
    },
    {
      label: "Active Alerts",
      value: data.totalActiveAlerts,
      icon: AlertTriangle,
      color: data.severityBreakdown.critical ? "text-red-400" : "text-amber-400",
      bg: data.severityBreakdown.critical ? "bg-red-500/10" : "bg-amber-500/10",
      border: data.severityBreakdown.critical ? "border-red-500/20" : "border-amber-500/20",
      sub: `${data.severityBreakdown.critical || 0} critical`,
    },
    {
      label: "Vitals Reviewed Today",
      value: data.vitalsReviewedToday,
      icon: Stethoscope,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Avg Heart Rate",
      value: `${data.averages.heartRate} bpm`,
      icon: Heart,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      sub: `SpO2: ${data.averages.spo2}%`,
    },
  ];

  return (
    <motion.div {...stagger} animate className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statsCards.map((stat, i) => (
          <motion.div key={stat.label} {...fadeUp} transition={{ delay: i * 0.06 }}>
            <Card className="bg-slate-900/60 border-slate-800/60 hover:border-teal-500/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-slate-500 font-medium">{stat.label}</span>
                  <div className={cn("p-1.5 rounded-lg border", stat.bg, stat.border)}>
                    <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-100">{stat.value}</div>
                {stat.sub && (
                  <span className="text-[10px] text-slate-500 mt-1">{stat.sub}</span>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Heart Rate Chart */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="lg:col-span-2">
          <Card className="bg-slate-900/60 border-slate-800/60">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-200">Heart Rate Trends</CardTitle>
                  <CardDescription className="text-[10px] text-slate-500">Latest readings across patients</CardDescription>
                </div>
                <Heart className="h-4 w-4 text-rose-400/60" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mergedHRData}>
                    <defs>
                      {Array.from(patientMap.keys()).map((name, i) => (
                        <linearGradient key={name} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartColors[i % 3]} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={chartColors[i % 3]} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[55, 105]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#0f172a", border: "1px solid rgba(148,163,184,0.1)", borderRadius: "8px", fontSize: "11px" }}
                      labelStyle={{ color: "#94a3b8", fontSize: "10px" }}
                    />
                    {Array.from(patientMap.keys()).map((name, i) => (
                      <Area
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={chartColors[i % 3]}
                        strokeWidth={2}
                        fill={`url(#grad-${i})`}
                        dot={false}
                        activeDot={{ r: 3 }}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Severity Breakdown */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <Card className="bg-slate-900/60 border-slate-800/60 h-full">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm font-semibold text-slate-200">Alert Severity</CardTitle>
              <CardDescription className="text-[10px] text-slate-500">Unresolved alerts breakdown</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="h-52 flex flex-col justify-center">
                <div className="space-y-4">
                  {[
                    { type: "Critical", count: data.severityBreakdown.critical || 0, color: "bg-red-500", light: "bg-red-500/10", text: "text-red-400", max: data.totalActiveAlerts || 1 },
                    { type: "Warning", count: data.severityBreakdown.warning || 0, color: "bg-amber-500", light: "bg-amber-500/10", text: "text-amber-400", max: data.totalActiveAlerts || 1 },
                    { type: "Info", count: data.severityBreakdown.info || 0, color: "bg-sky-500", light: "bg-sky-500/10", text: "text-sky-400", max: data.totalActiveAlerts || 1 },
                  ].map(item => (
                    <div key={item.type}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-medium text-slate-400">{item.type}</span>
                        <span className={cn("text-[11px] font-bold", item.text)}>{item.count}</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className={cn("h-full rounded-full", item.color)}
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.count / item.max) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-4 bg-slate-800" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-100">{data.totalAcknowledgedAlerts}</div>
                  <div className="text-[10px] text-slate-500">Acknowledged</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Alerts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Alerts */}
        <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
          <Card className="bg-slate-900/60 border-slate-800/60">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-200">Recent Alerts</CardTitle>
                  <CardDescription className="text-[10px] text-slate-500">Last 7 days</CardDescription>
                </div>
                <AlertTriangle className="h-4 w-4 text-amber-400/60" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {data.recentAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all hover:border-opacity-50",
                      alert.type === "critical"
                        ? "bg-red-500/5 border-red-500/15 hover:border-red-500/30"
                        : alert.type === "warning"
                          ? "bg-amber-500/5 border-amber-500/15 hover:border-amber-500/30"
                          : "bg-sky-500/5 border-sky-500/15 hover:border-sky-500/30"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn("mt-0.5 p-1 rounded border", severityColor(alert.type))}>
                        {severityIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-semibold text-slate-300 truncate">
                            {alert.patient?.name || "Unknown"}
                          </span>
                          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", severityColor(alert.type))}>
                            {alert.type}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2">{alert.message}</p>
                        <span className="text-[9px] text-slate-600 mt-1 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity / Patient Summary */}
        <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
          <Card className="bg-slate-900/60 border-slate-800/60">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-200">Patient Vitals Summary</CardTitle>
                  <CardDescription className="text-[10px] text-slate-500">Latest readings per patient</CardDescription>
                </div>
                <Activity className="h-4 w-4 text-teal-400/60" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {Array.from(patientMap.entries()).map(([name, readings], idx) => {
                  const latest = readings[0];
                  const bpStatus = getBPStatus(latest.systolic);
                  const spo2Status = getSpO2Status(latest.spo2);
                  const prev = readings[1];
                  const hrTrend = prev ? (latest.heartRate > prev.heartRate ? "up" : latest.heartRate < prev.heartRate ? "down" : "stable") : "stable";

                  return (
                    <div key={name} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: chartColors[idx % 3] }}
                          />
                          <span className="text-[11px] font-semibold text-slate-200">{name}</span>
                        </div>
                        <span className="text-[9px] text-slate-600">
                          {formatDistanceToNow(new Date(latest.recordedAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <div className="text-[9px] text-slate-500 mb-0.5">BP</div>
                          <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                            {latest.systolic}/{latest.diastolic}
                            <span className={cn("text-[9px]", bpStatus.color)}>({bpStatus.label})</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-500 mb-0.5">HR</div>
                          <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                            {latest.heartRate} bpm
                            {hrTrend === "up" && <TrendingUp className="h-3 w-3 text-red-400" />}
                            {hrTrend === "down" && <TrendingDown className="h-3 w-3 text-emerald-400" />}
                            {hrTrend === "stable" && <Minus className="h-3 w-3 text-slate-500" />}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-500 mb-0.5">SpO2</div>
                          <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                            <Wind className="h-3 w-3 text-sky-400/60" />
                            {latest.spo2}%
                            <span className={cn("text-[9px]", spo2Status.color)}>({spo2Status.label})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── AI Assistant Tab ───────────────────────────────────────────────────
function AssistantTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/patients")
      .then(r => r.json())
      .then(setPatients)
      .catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: content.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const patientContext = selectedPatient
        ? `Patient: ${selectedPatient.name}, Age: ${selectedPatient.age}, Gender: ${selectedPatient.gender}\nConditions: ${selectedPatient.conditions}\nMedications: ${selectedPatient.medications}\nLatest Vitals: HR ${selectedPatient.latestVitals?.heartRate || "N/A"} bpm, BP ${selectedPatient.latestVitals?.systolic || "N/A"}/${selectedPatient.latestVitals?.diastolic || "N/A"} mmHg, Temp ${selectedPatient.latestVitals?.temperature || "N/A"}°F, SpO2 ${selectedPatient.latestVitals?.spo2 || "N/A"}%`
        : undefined;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          patientContext,
        }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error processing your request. Please try again." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading, messages, selectedPatient]);

  const quickActions = [
    {
      label: "Analyze Patient Vitals",
      icon: Stethoscope,
      prompt: selectedPatient
        ? `Analyze the current vitals for ${selectedPatient.name}. Are there any concerning trends I should be aware of?`
        : "Provide a general guide on how to analyze patient vitals for clinical decision support.",
    },
    {
      label: "Generate Health Summary",
      icon: FileText,
      prompt: selectedPatient
        ? `Generate a comprehensive health summary for ${selectedPatient.name} based on their conditions, medications, and latest vitals.`
        : "What should a comprehensive patient health summary include for clinical review?",
    },
    {
      label: "Alert Review Protocol",
      icon: AlertTriangle,
      prompt: "What is the recommended protocol for triaging and reviewing clinical alerts by severity? How should critical vs warning alerts be handled differently?",
    },
  ];

  return (
    <motion.div {...fadeUp} className="h-[calc(100vh-10rem)] flex gap-4">
      {/* Patient Context Sidebar */}
      <div className="hidden lg:block w-64 shrink-0">
        <Card className="bg-slate-900/60 border-slate-800/60 h-full">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-semibold text-slate-300">Patient Context</CardTitle>
            <CardDescription className="text-[10px] text-slate-500">Select a patient for AI context</CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedPatient(null)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-[11px] transition-all",
                  !selectedPatient
                    ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                    : "text-slate-400 hover:bg-slate-800/60 border border-transparent"
                )}
              >
                General Query
              </button>
              {patients.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-[11px] transition-all flex items-center gap-2",
                    selectedPatient?.id === p.id
                      ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                      : "text-slate-400 hover:bg-slate-800/60 border border-transparent"
                  )}
                >
                  {p.hasCriticalAlert && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  )}
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>

            {selectedPatient && (
              <div className="mt-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="text-[11px] font-semibold text-slate-300 mb-1">{selectedPatient.name}</div>
                <div className="text-[10px] text-slate-500">{selectedPatient.age}y {selectedPatient.gender}</div>
                <div className="text-[10px] text-slate-500 mt-1">{selectedPatient.conditions}</div>
                {selectedPatient.latestVitals && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <VitalPill label="HR" value={`${selectedPatient.latestVitals.heartRate}`} unit="bpm" />
                    <VitalPill label="BP" value={`${selectedPatient.latestVitals.systolic}/${selectedPatient.latestVitals.diastolic}`} unit="mmHg" />
                    <VitalPill label="SpO2" value={`${selectedPatient.latestVitals.spo2}`} unit="%" />
                    <VitalPill label="Temp" value={`${selectedPatient.latestVitals.temperature}`} unit="°F" />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Card className="bg-slate-900/60 border-slate-800/60 flex-1 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
                  <Brain className="h-8 w-8 text-teal-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">HealthGuard AI Assistant</h3>
                <p className="text-[11px] text-slate-500 max-w-sm mb-4">
                  Powered by Gemini. Ask about patient vitals, clinical guidelines, alert triage, or generate health summaries.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickActions.map(action => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.prompt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40 text-[10px] text-slate-400 hover:text-teal-300 hover:border-teal-500/30 transition-all"
                    >
                      <action.icon className="h-3 w-3" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    msg.role === "user"
                      ? "bg-teal-500/20 border border-teal-500/30"
                      : "bg-slate-800 border border-slate-700/50"
                  )}>
                    {msg.role === "user" ? <UserPlus className="h-3.5 w-3.5 text-teal-400" /> : <Bot className="h-3.5 w-3.5 text-slate-400" />}
                  </div>
                  <div className={cn(
                    "max-w-[80%] rounded-xl px-4 py-2.5 text-[12px] leading-relaxed",
                    msg.role === "user"
                      ? "bg-teal-600/20 text-teal-100 border border-teal-500/20"
                      : "bg-slate-800/70 text-slate-300 border border-slate-700/40"
                  )}>
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800 border border-slate-700/50">
                  <Bot className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <div className="bg-slate-800/70 border border-slate-700/40 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 text-teal-400 animate-spin" />
                    <span className="text-[11px] text-slate-400">Analyzing with Gemini...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length > 0 && (
            <div className="px-4 pb-2">
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {quickActions.map(action => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/40 border border-slate-700/30 text-[9px] text-slate-500 hover:text-teal-300 hover:border-teal-500/30 transition-all whitespace-nowrap disabled:opacity-50"
                  >
                    <action.icon className="h-2.5 w-2.5" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4">
            <form
              onSubmit={e => { e.preventDefault(); sendMessage(input); }}
              className="flex items-center gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={selectedPatient ? `Ask about ${selectedPatient.name}...` : "Ask HealthGuard AI..."}
                disabled={loading}
                className="bg-slate-800/60 border-slate-700/50 text-sm text-slate-200 placeholder:text-slate-600 focus:border-teal-500/40 focus:ring-teal-500/20 rounded-xl h-10"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                size="sm"
                className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl h-10 w-10 p-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function VitalPill({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="px-2 py-1 rounded bg-slate-900/60">
      <div className="text-[9px] text-slate-500">{label}</div>
      <div className="text-[10px] font-semibold text-slate-300">{value}<span className="text-slate-500 ml-0.5">{unit}</span></div>
    </div>
  );
}

// ─── Patients Tab ───────────────────────────────────────────────────────
function PatientsTab() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [vitalsData, setVitalsData] = useState<Record<string, VitalsReading[]>>({});
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showAddVitals, setShowAddVitals] = useState<string | null>(null);
  const [newVitals, setNewVitals] = useState({ heartRate: "", systolic: "", diastolic: "", temperature: "", spo2: "", notes: "" });
  const [newPatient, setNewPatient] = useState({ name: "", age: "", gender: "Male", conditions: "", medications: "" });

  const fetchPatients = useCallback(() => {
    fetch("/api/patients")
      .then(r => r.json())
      .then(d => { setPatients(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const toggleExpand = async (patientId: string) => {
    if (expandedId === patientId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(patientId);
    if (!vitalsData[patientId]) {
      try {
        const res = await fetch(`/api/patients/${patientId}/vitals`);
        const data = await res.json();
        setVitalsData(prev => ({ ...prev, [patientId]: data }));
      } catch { /* ignore */ }
    }
  };

  const handleAddPatient = async () => {
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPatient),
      });
      if (res.ok) {
        setShowAddPatient(false);
        setNewPatient({ name: "", age: "", gender: "Male", conditions: "", medications: "" });
        fetchPatients();
      }
    } catch { /* ignore */ }
  };

  const handleAddVitals = async () => {
    if (!showAddVitals) return;
    try {
      const res = await fetch(`/api/patients/${showAddVitals}/vitals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heartRate: parseInt(newVitals.heartRate) || undefined,
          systolic: parseInt(newVitals.systolic) || undefined,
          diastolic: parseInt(newVitals.diastolic) || undefined,
          temperature: parseFloat(newVitals.temperature) || undefined,
          spo2: parseInt(newVitals.spo2) || undefined,
          notes: newVitals.notes,
        }),
      });
      if (res.ok) {
        setShowAddVitals(null);
        setNewVitals({ heartRate: "", systolic: "", diastolic: "", temperature: "", spo2: "", notes: "" });
        fetchPatients();
        if (expandedId === showAddVitals) {
          const vRes = await fetch(`/api/patients/${showAddVitals}/vitals`);
          const vData = await vRes.json();
          setVitalsData(prev => ({ ...prev, [showAddVitals]: vData }));
        }
      }
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <motion.div {...stagger} animate className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 bg-slate-800/40 rounded-xl" />)}
      </motion.div>
    );
  }

  return (
    <motion.div {...fadeUp} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Patient Records</h2>
          <p className="text-[10px] text-slate-500">{patients.length} patients monitored</p>
        </div>
        <Dialog open={showAddPatient} onOpenChange={setShowAddPatient}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-500 text-white text-xs gap-1.5 rounded-lg">
              <UserPlus className="h-3.5 w-3.5" /> Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-sm text-slate-200">Add New Patient</DialogTitle>
              <DialogDescription className="text-[11px] text-slate-500">Enter patient information to begin monitoring</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-400">Name</Label>
                  <Input value={newPatient.name} onChange={e => setNewPatient(p => ({ ...p, name: e.target.value }))} placeholder="Full name" className="h-8 text-xs bg-slate-800 border-slate-700" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-slate-400">Age</Label>
                  <Input type="number" value={newPatient.age} onChange={e => setNewPatient(p => ({ ...p, age: e.target.value }))} placeholder="Age" className="h-8 text-xs bg-slate-800 border-slate-700" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-400">Gender</Label>
                <select
                  value={newPatient.gender}
                  onChange={e => setNewPatient(p => ({ ...p, gender: e.target.value }))}
                  className="w-full h-8 rounded-md border border-slate-700 bg-slate-800 px-2 text-xs text-slate-300"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-400">Conditions</Label>
                <Input value={newPatient.conditions} onChange={e => setNewPatient(p => ({ ...p, conditions: e.target.value }))} placeholder="e.g., Diabetes, Hypertension" className="h-8 text-xs bg-slate-800 border-slate-700" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-400">Medications</Label>
                <Input value={newPatient.medications} onChange={e => setNewPatient(p => ({ ...p, medications: e.target.value }))} placeholder="e.g., Metformin 500mg BID" className="h-8 text-xs bg-slate-800 border-slate-700" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddPatient} className="bg-teal-600 hover:bg-teal-500 text-white text-xs rounded-lg">Add Patient</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Patient Cards */}
      <div className="space-y-3">
        {patients.map((patient, idx) => {
          const isExpanded = expandedId === patient.id;
          const vitals = vitalsData[patient.id] || [];

          return (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={cn(
                "bg-slate-900/60 border-slate-800/60 transition-all hover:border-teal-500/20",
                patient.hasCriticalAlert && "ring-1 ring-red-500/20",
              )}>
                <CardContent className="p-0">
                  {/* Patient Header */}
                  <button
                    onClick={() => toggleExpand(patient.id)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-slate-200">{patient.name}</span>
                        <Badge variant="outline" className="text-[9px] text-slate-500 border-slate-700/50">
                          {patient.age}y {patient.gender}
                        </Badge>
                        {patient.activeAlertCount > 0 && (
                          <Badge variant="outline" className={cn("text-[9px] border", severityColor(patient.hasCriticalAlert ? "critical" : "warning"))}>
                            {patient.activeAlertCount} alert{patient.activeAlertCount > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate">{patient.conditions || "No conditions recorded"}</div>
                    </div>

                    {/* Latest Vitals Quick View */}
                    {patient.latestVitals && (
                      <div className="hidden sm:flex items-center gap-3 mr-3">
                        <div className="text-center">
                          <div className="text-[9px] text-slate-500">BP</div>
                          <div className={cn("text-[11px] font-semibold", getBPStatus(patient.latestVitals.systolic).color)}>
                            {patient.latestVitals.systolic}/{patient.latestVitals.diastolic}
                          </div>
                        </div>
                        <div className="w-px h-6 bg-slate-800" />
                        <div className="text-center">
                          <div className="text-[9px] text-slate-500">HR</div>
                          <div className="text-[11px] font-semibold text-slate-300">{patient.latestVitals.heartRate}</div>
                        </div>
                        <div className="w-px h-6 bg-slate-800" />
                        <div className="text-center">
                          <div className="text-[9px] text-slate-500">SpO2</div>
                          <div className={cn("text-[11px] font-semibold", getSpO2Status(patient.latestVitals.spo2).color)}>
                            {patient.latestVitals.spo2}%
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => { e.stopPropagation(); setShowAddVitals(patient.id); }}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-teal-400"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-slate-800/50">
                          <div className="pt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Vitals Chart */}
                            <div>
                              <div className="text-[11px] font-semibold text-slate-300 mb-2">Vitals History</div>
                              {vitals.length > 0 ? (
                                <div className="h-48">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={vitals.map(v => ({
                                      date: format(new Date(v.recordedAt), "MMM d"),
                                      hr: v.heartRate,
                                      sys: v.systolic,
                                      spo2: v.spo2,
                                    }))}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                      <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(148,163,184,0.1)", borderRadius: "8px", fontSize: "10px" }} />
                                      <Line type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={1.5} dot={false} name="Heart Rate" />
                                      <Line type="monotone" dataKey="sys" stroke="#f97316" strokeWidth={1.5} dot={false} name="Systolic" />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              ) : (
                                <div className="h-48 flex items-center justify-center text-[11px] text-slate-500">Loading vitals...</div>
                              )}
                            </div>

                            {/* Vitals Table */}
                            <div>
                              <div className="text-[11px] font-semibold text-slate-300 mb-2">Recent Readings</div>
                              <div className="max-h-48 overflow-y-auto space-y-1.5">
                                {vitals.slice(-5).reverse().map(v => (
                                  <div key={v.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/40 text-[10px]">
                                    <span className="text-slate-500 w-16 shrink-0">{format(new Date(v.recordedAt), "MMM d, HH:mm")}</span>
                                    <span className="text-slate-400 flex-1">HR <span className="text-slate-200 font-medium">{v.heartRate}</span></span>
                                    <span className="text-slate-400 flex-1">BP <span className={cn("font-medium", getBPStatus(v.systolic).color)}>{v.systolic}/{v.diastolic}</span></span>
                                    <span className="text-slate-400 flex-1">SpO2 <span className={cn("font-medium", getSpO2Status(v.spo2).color)}>{v.spo2}%</span></span>
                                    <span className="text-slate-400 flex-1">Temp <span className="text-slate-200 font-medium">{v.temperature}°F</span></span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {patient.medications && (
                            <div className="mt-3 pt-3 border-t border-slate-800/30">
                              <div className="text-[10px] text-slate-500">
                                <span className="font-medium">Medications:</span> {patient.medications}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Add Vitals Dialog */}
      <Dialog open={!!showAddVitals} onOpenChange={() => setShowAddVitals(null)}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-sm text-slate-200">Add Vitals Reading</DialogTitle>
            <DialogDescription className="text-[11px] text-slate-500">Record new vitals for {patients.find(p => p.id === showAddVitals)?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: "heartRate", label: "Heart Rate", placeholder: "72", unit: "bpm" },
                { key: "systolic", label: "Systolic", placeholder: "120", unit: "mmHg" },
                { key: "diastolic", label: "Diastolic", placeholder: "80", unit: "mmHg" },
                { key: "temperature", label: "Temperature", placeholder: "98.6", unit: "°F" },
                { key: "spo2", label: "SpO2", placeholder: "98", unit: "%" },
              ].map(field => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-[11px] text-slate-400">{field.label} ({field.unit})</Label>
                  <Input
                    value={newVitals[field.key as keyof typeof newVitals]}
                    onChange={e => setNewVitals(v => ({ ...v, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="h-8 text-xs bg-slate-800 border-slate-700"
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400">Notes</Label>
              <Textarea
                value={newVitals.notes}
                onChange={e => setNewVitals(v => ({ ...v, notes: e.target.value }))}
                placeholder="Optional clinical notes"
                className="h-16 text-xs bg-slate-800 border-slate-700 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddVitals} className="bg-teal-600 hover:bg-teal-500 text-white text-xs rounded-lg">Save Reading</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Alerts Tab ─────────────────────────────────────────────────────────
function AlertsTab() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [ackLoading, setAckLoading] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (filter !== "all" && filter !== "acknowledged") params.set("type", filter);
    if (filter === "acknowledged") params.set("acknowledged", "true");
    else if (filter !== "all") {
      params.set("acknowledged", "false");
    }

    (async () => {
      try {
        const res = await fetch(`/api/alerts?${params}`);
        const data = await res.json();
        if (!cancelled) { setAlerts(data); setLoading(false); }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [filter, refreshKey]);

  const handleAcknowledge = async (alertId: string) => {
    setAckLoading(alertId);
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alertId, acknowledged: true }),
      });
      setRefreshKey(k => k + 1);
    } catch { /* ignore */ }
    setAckLoading(null);
  };

  const filters = [
    { value: "all", label: "All", count: null },
    { value: "critical", label: "Critical", color: "text-red-400" },
    { value: "warning", label: "Warning", color: "text-amber-400" },
    { value: "info", label: "Info", color: "text-sky-400" },
    { value: "acknowledged", label: "Acknowledged", color: "text-slate-400" },
  ];

  if (loading) {
    return (
      <motion.div {...stagger} animate className="space-y-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 bg-slate-800/40 rounded-xl" />)}
      </motion.div>
    );
  }

  return (
    <motion.div {...fadeUp} className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all whitespace-nowrap",
              filter === f.value
                ? "bg-teal-500/15 text-teal-300 border-teal-500/30"
                : "bg-slate-800/40 text-slate-500 border-slate-700/30 hover:text-slate-300 hover:border-slate-600"
            )}
          >
            {f.label}
          </button>
        ))}
        <span className="text-[10px] text-slate-600 ml-auto">{alerts.length} alert{alerts.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Alert List */}
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <Check className="h-8 w-8 text-emerald-400/40 mx-auto mb-2" />
            <p className="text-[11px] text-slate-500">No alerts match the current filter</p>
          </div>
        ) : (
          alerts.map((alert, idx) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card className={cn(
                "bg-slate-900/60 border transition-all",
                alert.acknowledged
                  ? "border-slate-800/40 opacity-60"
                  : alert.type === "critical"
                    ? "border-red-500/20 hover:border-red-500/40"
                    : alert.type === "warning"
                      ? "border-amber-500/15 hover:border-amber-500/30"
                      : "border-sky-500/15 hover:border-sky-500/30"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Severity Icon */}
                    <div className={cn("p-2 rounded-lg border shrink-0", severityColor(alert.type))}>
                      {severityIcon(alert.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[11px] font-semibold text-slate-200">
                          {alert.patient?.name || "Unknown Patient"}
                        </span>
                        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", severityColor(alert.type))}>
                          {alert.type}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-slate-500 border-slate-700/50">
                          {alert.category}
                        </Badge>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-slate-500 border-slate-700/50">
                          Severity: {alert.severity}/5
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{alert.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] text-slate-600 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                        </span>
                        {alert.acknowledged && (
                          <span className="text-[9px] text-emerald-500/60 flex items-center gap-1">
                            <Check className="h-2.5 w-2.5" />
                            Acknowledged
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    {!alert.acknowledged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={ackLoading === alert.id}
                        className="shrink-0 h-8 text-[10px] text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                      >
                        {ackLoading === alert.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Acknowledge
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
