"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Calendar,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Tv,
  Loader2,
  CircleDot,
  Flame,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type WorldCupData,
  type Match,
  type GroupData,
  type KnockoutRound,
} from "@/lib/types";
import {
  organizeGroups,
  organizeKnockout,
  formatDate,
  getMatchStatus,
  getCountryFlag,
} from "@/lib/data";

// ─── Countdown Timer ────────────────────────────────────────────────────────
function CountdownTimer() {
  const targetDate = new Date("2026-06-11T18:00:00Z").getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex gap-3 sm:gap-4 justify-center">
      {[
        { label: "Days", value: timeLeft.days },
        { label: "Hours", value: timeLeft.hours },
        { label: "Minutes", value: timeLeft.minutes },
        { label: "Seconds", value: timeLeft.seconds },
      ].map((item) => (
        <div key={item.label} className="flex flex-col items-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 sm:px-5 sm:py-3 min-w-[60px] sm:min-w-[80px] border border-white/20">
            <span className="text-2xl sm:text-4xl font-bold tabular-nums text-white">
              {String(item.value).padStart(2, "0")}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs text-white/70 mt-1.5 uppercase tracking-wider font-medium">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Match Card ─────────────────────────────────────────────────────────────
function MatchCard({ match }: { match: Match }) {
  const status = getMatchStatus(match);
  const [expanded, setExpanded] = useState(false);

  const hasGoals =
    match.goals1 && match.goals2 && (match.goals1.length > 0 || match.goals2.length > 0);

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border-border/50">
      <CardContent className="p-0">
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/50">
          <div className="flex items-center gap-2">
            {status === "completed" && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                FT
              </Badge>
            )}
            {status === "live" && (
              <Badge className="text-[10px] px-1.5 py-0 h-5 bg-red-500 text-white animate-pulse">
                LIVE
              </Badge>
            )}
            {status === "upcoming" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                Upcoming
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {match.round}
            </span>
          </div>
          {match.ground && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {match.ground}
            </div>
          )}
        </div>

        {/* Teams and Score */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-lg">{getCountryFlag(match.team1)}</span>
              <span className="font-medium text-sm truncate">{match.team1}</span>
            </div>
            <div className="flex items-center gap-2 mx-4 shrink-0">
              {match.score?.ft ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tabular-nums">{match.score.ft[0]}</span>
                  <span className="text-muted-foreground text-sm">-</span>
                  <span className="text-lg font-bold tabular-nums">{match.score.ft[1]}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {match.time || "TBD"}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span className="font-medium text-sm truncate text-right">{match.team2}</span>
              <span className="text-lg">{getCountryFlag(match.team2)}</span>
            </div>
          </div>
        </div>

        {/* Expandable Goals */}
        {hasGoals && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border/50"
            >
              {expanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              Goal Details
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3 pt-1 border-t border-border/50 space-y-1">
                    {match.goals1?.map((g, i) => (
                      <div key={`g1-${i}`} className="flex items-center gap-2 text-xs">
                        <span className="text-emerald-600 dark:text-emerald-400">⚽</span>
                        <span className="font-medium">{g.name}</span>
                        <span className="text-muted-foreground">{g.minute}&apos;</span>
                        {g.penalty && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                            PEN
                          </Badge>
                        )}
                        {g.owngoal && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                            OG
                          </Badge>
                        )}
                      </div>
                    ))}
                    {match.goals2?.map((g, i) => (
                      <div key={`g2-${i}`} className="flex items-center gap-2 text-xs">
                        <span className="text-emerald-600 dark:text-emerald-400">⚽</span>
                        <span className="font-medium">{g.name}</span>
                        <span className="text-muted-foreground">{g.minute}&apos;</span>
                        {g.penalty && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                            PEN
                          </Badge>
                        )}
                        {g.owngoal && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                            OG
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Date footer */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-muted/30 border-t border-border/50 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatDate(match.date)}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Group Stage Table ──────────────────────────────────────────────────────
function GroupTable({ group }: { group: GroupData }) {
  const [showMatches, setShowMatches] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            {group.name}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setShowMatches(!showMatches)}
          >
            {showMatches ? "Standings" : "Matches"}
            {showMatches ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <AnimatePresence mode="wait">
          {!showMatches ? (
            <motion.div
              key="standings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left py-2 pr-2 font-medium">#</th>
                      <th className="text-left py-2 pr-2 font-medium">Team</th>
                      <th className="text-center py-2 px-1 font-medium">P</th>
                      <th className="text-center py-2 px-1 font-medium">W</th>
                      <th className="text-center py-2 px-1 font-medium">D</th>
                      <th className="text-center py-2 px-1 font-medium">L</th>
                      <th className="text-center py-2 px-1 font-medium hidden sm:table-cell">GD</th>
                      <th className="text-center py-2 pl-1 font-medium">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.standings.map((team, idx) => (
                      <tr
                        key={team.team}
                        className={`border-b last:border-0 ${
                          idx < 2
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                            : ""
                        }`}
                      >
                        <td className="py-2 pr-2">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                              idx < 2
                                ? "bg-emerald-500 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-2 pr-2 font-medium flex items-center gap-1.5">
                          <span>{getCountryFlag(team.team)}</span>
                          <span className="truncate max-w-[100px] sm:max-w-none">{team.team}</span>
                        </td>
                        <td className="text-center py-2 px-1 tabular-nums text-muted-foreground">
                          {team.played}
                        </td>
                        <td className="text-center py-2 px-1 tabular-nums">
                          {team.won}
                        </td>
                        <td className="text-center py-2 px-1 tabular-nums text-muted-foreground">
                          {team.drawn}
                        </td>
                        <td className="text-center py-2 px-1 tabular-nums text-muted-foreground">
                          {team.lost}
                        </td>
                        <td className="text-center py-2 px-1 tabular-nums hidden sm:table-cell">
                          {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                        </td>
                        <td className="text-center py-2 pl-1 tabular-nums font-bold">
                          {team.points}
                        </td>
                      </tr>
                    ))}
                    {group.standings.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-4 text-center text-muted-foreground text-xs">
                          No matches played yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {group.standings.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  <span className="inline-block w-2 h-2 rounded-sm bg-emerald-500 mr-1" />
                  Top 2 qualify for Round of 32
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="matches"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-2"
            >
              {group.matches.map((match, idx) => (
                <MatchCard key={idx} match={match} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ─── Knockout Round ─────────────────────────────────────────────────────────
function KnockoutRoundCard({ round }: { round: KnockoutRound }) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
        {round.name === "Final" && <Trophy className="h-5 w-5 text-amber-500" />}
        {round.name === "Semi-final" && <Flame className="h-5 w-5 text-orange-500" />}
        {round.name === "Quarter-final" && <CircleDot className="h-5 w-5 text-emerald-500" />}
        {round.name === "Round of 32" && <Tv className="h-5 w-5 text-blue-500" />}
        {round.name === "Round of 16" && <Tv className="h-5 w-5 text-violet-500" />}
        {round.name === "Match for third place" && <Trophy className="h-5 w-5 text-amber-700" />}
        {round.name}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {round.matches.map((match, idx) => (
          <MatchCard key={idx} match={match} />
        ))}
      </div>
    </div>
  );
}

// ─── Schedule View ──────────────────────────────────────────────────────────
function ScheduleView({ matches }: { matches: Match[] }) {
  const [filter, setFilter] = useState<"all" | "completed" | "upcoming">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return matches;
    return matches.filter((m) => getMatchStatus(m) === filter);
  }, [matches, filter]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of filtered) {
      const key = m.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div>
      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(
          [
            { key: "all", label: "All Matches" },
            { key: "completed", label: "Completed" },
            { key: "upcoming", label: "Upcoming" },
          ] as const
        ).map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
            className="text-xs"
          >
            {f.label}
            <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
              {f.key === "all"
                ? matches.length
                : matches.filter((m) => getMatchStatus(m) === f.key).length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Grouped matches */}
      <div className="space-y-6">
        {grouped.map(([date, dateMatches]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">{formatDate(date)}</h3>
              <Separator className="flex-1" />
              <Badge variant="secondary" className="text-[10px]">
                {dateMatches.length} match{dateMatches.length > 1 ? "es" : ""}
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {dateMatches.map((match, idx) => (
                <MatchCard key={idx} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stats Banner ───────────────────────────────────────────────────────────
function StatsBanner({ data }: { data: WorldCupData }) {
  const completedMatches = data.matches.filter((m) => m.score?.ft).length;
  const upcomingMatches = data.matches.filter((m) => !m.score?.ft).length;
  const totalGoals = data.matches.reduce((acc, m) => {
    if (!m.score?.ft) return acc;
    return acc + m.score.ft[0] + m.score.ft[1];
  }, 0);

  const stats = [
    { label: "Total Matches", value: data.matches.length, icon: CircleDot },
    { label: "Completed", value: completedMatches, icon: Tv },
    { label: "Upcoming", value: upcomingMatches, icon: Calendar },
    { label: "Goals Scored", value: totalGoals, icon: Trophy },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <stat.icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Top Scorers ────────────────────────────────────────────────────────────
function TopScorers({ data }: { data: WorldCupData }) {
  const scorers = useMemo(() => {
    const goalMap = new Map<string, { name: string; goals: number; team: string }>();

    for (const match of data.matches) {
      if (!match.score?.ft) continue;

      const processGoals = (goals: Match["goals1"], teamSide: string) => {
        if (!goals) return;
        for (const g of goals) {
          if (g.owngoal) continue;
          const key = `${g.name}-${teamSide}`;
          if (!goalMap.has(key)) {
            goalMap.set(key, { name: g.name, goals: 0, team: teamSide });
          }
          goalMap.get(key)!.goals++;
        }
      };

      processGoals(match.goals1, match.team1);
      processGoals(match.goals2, match.team2);
    }

    return Array.from(goalMap.values())
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10);
  }, [data]);

  if (scorers.length === 0) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Top Scorers
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {scorers.map((s, idx) => (
            <div
              key={s.name}
              className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0
                      ? "bg-amber-500 text-white"
                      : idx === 1
                      ? "bg-gray-400 text-white"
                      : idx === 2
                      ? "bg-amber-700 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    {getCountryFlag(s.team)} {s.team}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tabular-nums">{s.goals}</span>
                <span className="text-xs text-muted-foreground">goals</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function Home() {
  const [data, setData] = useState<WorldCupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/worldcup")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((d: WorldCupData) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const groups = useMemo(() => (data ? organizeGroups(data.matches) : []), [data]);
  const knockouts = useMemo(() => (data ? organizeKnockout(data.matches) : []), [data]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(16,185,129,0.3),transparent_50%)]" />

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/5 blur-xl" />
        <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-teal-500/5 blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 sm:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-200 border-emerald-400/30 hover:bg-emerald-500/30">
              <CircleDot className="h-3 w-3 mr-1" />
              United States • Mexico • Canada
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-2 tracking-tight">
              FIFA World Cup
            </h1>
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-5xl sm:text-7xl font-black text-emerald-300">2026</span>
            </div>

            <p className="text-emerald-200/80 text-sm sm:text-base max-w-xl mx-auto mb-8">
              Follow every match, track group standings, and watch the knockout
              bracket unfold. 48 teams, 104 matches, 1 champion.
            </p>

            <CountdownTimer />

            <div className="flex items-center justify-center gap-2 mt-6 text-emerald-300/60 text-xs">
              <ArrowRight className="h-3 w-3" />
              Tournament kicks off June 11, 2026
            </div>
          </motion.div>
        </div>
      </header>

      {/* ─── Main Content ────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-muted-foreground text-sm">Loading World Cup data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        ) : data ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Stats */}
            <StatsBanner data={data} />

            {/* Top Scorers + Quick Info */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="border-border/50 h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Tv className="h-4 w-4 text-emerald-500" />
                      Live Stream Schedule
                    </CardTitle>
                    <CardDescription>
                      Watch every match live as it happens
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {data.matches
                        .filter((m) => !m.score?.ft)
                        .slice(0, 5)
                        .map((match, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <span>{getCountryFlag(match.team1)}</span>
                              <span className="font-medium">{match.team1}</span>
                              <span className="text-muted-foreground">vs</span>
                              <span className="font-medium">{match.team2}</span>
                              <span>{getCountryFlag(match.team2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {match.group && (
                                <Badge variant="outline" className="text-[10px] px-1.5">
                                  {match.group}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-[10px] gap-1">
                                <Calendar className="h-2.5 w-2.5" />
                                {formatDate(match.date)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      {data.matches.filter((m) => !m.score?.ft).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Tournament hasn&apos;t started yet. Stay tuned!
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <TopScorers data={data} />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="groups" className="w-full">
              <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
                <TabsTrigger value="groups" className="gap-1.5">
                  <Trophy className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Group</span> Stage
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Schedule
                </TabsTrigger>
                <TabsTrigger value="knockout" className="gap-1.5">
                  <Flame className="h-3.5 w-3.5" />
                  Knockout
                </TabsTrigger>
              </TabsList>

              {/* Group Stage */}
              <TabsContent value="groups" className="mt-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groups.map((group) => (
                    <GroupTable key={group.name} group={group} />
                  ))}
                </div>
              </TabsContent>

              {/* Schedule */}
              <TabsContent value="schedule" className="mt-6">
                <ScheduleView matches={data.matches} />
              </TabsContent>

              {/* Knockout */}
              <TabsContent value="knockout" className="mt-6">
                <div className="space-y-10">
                  {knockouts.map((round) => (
                    <KnockoutRoundCard key={round.name} round={round} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        ) : null}
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold">FIFA World Cup 2026</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Data sourced from{" "}
              <a
                href="https://github.com/openfootball/worldcup.json"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                openfootball
              </a>
              . Not affiliated with FIFA. For informational purposes only.
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>🇺🇸 🇲🇽 🇨🇦</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
