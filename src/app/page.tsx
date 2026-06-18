"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Hls from "hls.js";
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
  ArrowLeft,
  Play,
  Radio,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
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

// ─── Stream Channels ────────────────────────────────────────────────────────
const STREAM_CHANNELS = [
  {
    id: "tv360",
    name: "TV360 Sports",
    quality: "HD 1080p",
    url: "https://ec05-pop1-hlc.tv360.vn/bpk-token/gv54oov24drdv4cb6e6di66hhi2xxrz2/bpk-tv/155/output/155-audio_198800_eng_iv_5=196800-video_iv_5=3417600.m3u8",
  },
  {
    id: "rtbgo",
    name: "RTB Go",
    quality: "HD 720p",
    url: "https://d1211whpimeups.cloudfront.net/smil:rtbgo/chunklist_b4096000_slENG.m3u8",
  },
];

// ─── Compact Countdown ──────────────────────────────────────────────────────
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
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground hidden sm:inline">Kickoff in</span>
      <div className="flex items-center gap-1">
        {[
          { label: "d", value: timeLeft.days },
          { label: "h", value: timeLeft.hours },
          { label: "m", value: timeLeft.minutes },
          { label: "s", value: timeLeft.seconds },
        ].map((item) => (
          <span key={item.label} className="inline-flex items-baseline gap-0.5">
            <span className="text-sm font-bold tabular-nums text-emerald-400">
              {String(item.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── HLS Video Player ───────────────────────────────────────────────────────
function HLSPlayer({ url, channelId }: { url: string; channelId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track current channel to reset state on change
  const [currentChannelId, setCurrentChannelId] = useState(channelId);
  if (currentChannelId !== channelId) {
    setCurrentChannelId(channelId);
    setIsLoading(true);
    setError(null);
    setIsPlaying(false);
  }

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Destroy previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError("Network error — stream may be unavailable in your region");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError("Media error — attempting recovery...");
              hls.recoverMediaError();
              break;
            default:
              setError("Stream error — please try another channel");
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = url;
      // Loading will be handled by video events naturally
    } else {
      // HLS not supported — set error via ref to avoid setState in effect
      hlsRef.current = null;
      window.requestAnimationFrame(() => {
        setError("HLS is not supported in this browser");
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url, channelId]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (video.paused) {
        await video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } catch {
      // autoplay blocked
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // fullscreen not supported
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-xl overflow-hidden group"
    >
      <video
        ref={videoRef}
        className="w-full aspect-video bg-black"
        playsInline
        onClick={togglePlay}
      />

      {/* Loading overlay */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-xs text-muted-foreground">Loading stream...</p>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-3 p-6">
          <div className="p-3 rounded-full bg-red-500/10">
            <Radio className="h-6 w-6 text-red-400" />
          </div>
          <p className="text-sm text-center text-red-400 max-w-sm">{error}</p>
          <p className="text-xs text-muted-foreground">
            Try switching to another channel
          </p>
        </div>
      )}

      {/* Play overlay (when paused) */}
      {!isPlaying && !isLoading && !error && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="p-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors">
            <Play className="h-8 w-8 text-emerald-400 fill-emerald-400" />
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <div className="flex gap-0.5">
                  <div className="w-3 h-4 bg-white rounded-sm" />
                  <div className="w-3 h-4 bg-white rounded-sm" />
                </div>
              ) : (
                <Play className="h-5 w-5 text-white fill-white" />
              )}
            </button>
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5 text-white" />
              ) : (
                <Volume2 className="h-5 w-5 text-white" />
              )}
            </button>
            <div className="flex items-center gap-1.5 ml-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-white/80 font-medium">LIVE</span>
            </div>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5 text-white" />
            ) : (
              <Maximize className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Match Card ─────────────────────────────────────────────────────────────
function MatchCard({
  match,
  onWatchLive,
}: {
  match: Match;
  onWatchLive: (match: Match) => void;
}) {
  const status = getMatchStatus(match);
  const [expanded, setExpanded] = useState(false);

  const hasGoals =
    match.goals1 && match.goals2 && (match.goals1.length > 0 || match.goals2.length > 0);

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md hover:shadow-emerald-500/5">
      <CardContent className="p-0">
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border/30">
          <div className="flex items-center gap-2">
            {status === "completed" && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5 bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
              >
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
            <span className="text-xs text-muted-foreground">{match.round}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Watch Live button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] gap-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2"
              onClick={(e) => {
                e.stopPropagation();
                onWatchLive(match);
              }}
            >
              <Play className="h-3 w-3 fill-emerald-400" />
              Watch
            </Button>
            {match.ground && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="hidden sm:inline">{match.ground}</span>
              </div>
            )}
          </div>
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
              className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border/30"
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
                  <div className="px-4 pb-3 pt-1 border-t border-border/30 space-y-1">
                    {match.goals1?.map((g, i) => (
                      <div key={`g1-${i}`} className="flex items-center gap-2 text-xs">
                        <span className="text-emerald-400">⚽</span>
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
                        <span className="text-emerald-400">⚽</span>
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
        <div className="flex items-center gap-1.5 px-4 py-2 bg-muted/20 border-t border-border/30 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatDate(match.date)}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Group Stage Table ──────────────────────────────────────────────────────
function GroupTable({
  group,
  onWatchLive,
}: {
  group: GroupData;
  onWatchLive: (match: Match) => void;
}) {
  const [showMatches, setShowMatches] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-emerald-400" />
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
                      <th className="text-left py-2 pr-2 font-medium w-6">#</th>
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
                          idx < 2 ? "bg-emerald-500/5" : ""
                        }`}
                      >
                        <td className="py-2 pr-2">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                              idx < 2
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-muted/50 text-muted-foreground"
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
                        <td className="text-center py-2 px-1 tabular-nums">{team.won}</td>
                        <td className="text-center py-2 px-1 tabular-nums text-muted-foreground">
                          {team.drawn}
                        </td>
                        <td className="text-center py-2 px-1 tabular-nums text-muted-foreground">
                          {team.lost}
                        </td>
                        <td className="text-center py-2 px-1 tabular-nums hidden sm:table-cell">
                          {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                        </td>
                        <td className="text-center py-2 pl-1 tabular-nums font-bold text-emerald-400">
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
                  <span className="inline-block w-2 h-2 rounded-sm bg-emerald-500/20 mr-1 border border-emerald-500/30" />
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
                <MatchCard key={idx} match={match} onWatchLive={onWatchLive} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ─── Knockout Round ─────────────────────────────────────────────────────────
function KnockoutRoundCard({
  round,
  onWatchLive,
}: {
  round: KnockoutRound;
  onWatchLive: (match: Match) => void;
}) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
        {round.name === "Final" && <Trophy className="h-5 w-5 text-amber-400" />}
        {round.name === "Semi-final" && <Flame className="h-5 w-5 text-orange-400" />}
        {round.name === "Quarter-final" && <CircleDot className="h-5 w-5 text-emerald-400" />}
        {round.name === "Round of 32" && <Tv className="h-5 w-5 text-sky-400" />}
        {round.name === "Round of 16" && <Tv className="h-5 w-5 text-violet-400" />}
        {round.name === "Match for third place" && <Trophy className="h-5 w-5 text-amber-600" />}
        {round.name}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {round.matches.map((match, idx) => (
          <MatchCard key={idx} match={match} onWatchLive={onWatchLive} />
        ))}
      </div>
    </div>
  );
}

// ─── Schedule View ──────────────────────────────────────────────────────────
function ScheduleView({
  matches,
  onWatchLive,
}: {
  matches: Match[];
  onWatchLive: (match: Match) => void;
}) {
  const [filter, setFilter] = useState<"all" | "completed" | "upcoming">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return matches;
    return matches.filter((m) => getMatchStatus(m) === filter);
  }, [matches, filter]);

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
                <MatchCard key={idx} match={match} onWatchLive={onWatchLive} />
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
        <Card key={stat.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <stat.icon className="h-4 w-4 text-emerald-400" />
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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Flame className="h-3.5 w-3.5 text-orange-400" />
          Top Scorers
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {scorers.map((s, idx) => (
            <div
              key={s.name}
              className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    idx === 0
                      ? "bg-amber-500/20 text-amber-400"
                      : idx === 1
                      ? "bg-gray-400/20 text-gray-300"
                      : idx === 2
                      ? "bg-amber-700/20 text-amber-600"
                      : "bg-muted/50 text-muted-foreground"
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
                <span className="text-lg font-bold tabular-nums text-emerald-400">{s.goals}</span>
                <span className="text-xs text-muted-foreground">goals</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Match Detail / Streaming View ──────────────────────────────────────────
function MatchDetailView({
  match,
  onBack,
}: {
  match: Match;
  onBack: () => void;
}) {
  const [selectedChannel, setSelectedChannel] = useState(STREAM_CHANNELS[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Back button + match header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mt-0.5 shrink-0 gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {getMatchStatus(match) === "live" && (
              <Badge className="text-[10px] px-1.5 py-0 h-5 bg-red-500 text-white animate-pulse">
                LIVE NOW
              </Badge>
            )}
            {getMatchStatus(match) === "completed" && (
              <Badge className="text-[10px] px-1.5 py-0 h-5 bg-emerald-500/15 text-emerald-400">
                FULL TIME
              </Badge>
            )}
            {getMatchStatus(match) === "upcoming" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                UPCOMING
              </Badge>
            )}
            {match.group && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                {match.group}
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0 h-5">
              <Calendar className="h-2.5 w-2.5" />
              {formatDate(match.date)}
            </Badge>
            {match.time && (
              <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0 h-5">
                <Clock className="h-2.5 w-2.5" />
                {match.time}
              </Badge>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-2">
              <span className="text-2xl">{getCountryFlag(match.team1)}</span>
              {match.team1}
            </span>
            {match.score?.ft ? (
              <span className="text-emerald-400 tabular-nums">
                {match.score.ft[0]} - {match.score.ft[1]}
              </span>
            ) : (
              <span className="text-muted-foreground text-lg">vs</span>
            )}
            <span className="flex items-center gap-2">
              {match.team2}
              <span className="text-2xl">{getCountryFlag(match.team2)}</span>
            </span>
          </h2>
          {match.ground && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {match.ground}
            </p>
          )}
        </div>
      </div>

      {/* Video Player */}
      <HLSPlayer
        url={selectedChannel.url}
        channelId={selectedChannel.id}
      />

      {/* Channel Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-emerald-400" />
            Choose Channel
          </CardTitle>
          <CardDescription>
            Select a broadcast source for this match
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-2 sm:grid-cols-2">
            {STREAM_CHANNELS.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  selectedChannel.id === channel.id
                    ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30"
                    : "border-border/50 hover:bg-muted/30 hover:border-border"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    selectedChannel.id === channel.id
                      ? "bg-emerald-500/20"
                      : "bg-muted/50"
                  }`}
                >
                  <Tv
                    className={`h-4 w-4 ${
                      selectedChannel.id === channel.id
                        ? "text-emerald-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{channel.name}</p>
                    {selectedChannel.id === channel.id && (
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] text-emerald-400 font-medium">Playing</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{channel.quality}</p>
                </div>
                <Badge
                  variant={selectedChannel.id === channel.id ? "default" : "outline"}
                  className={`text-[10px] shrink-0 ${
                    selectedChannel.id === channel.id
                      ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30"
                      : ""
                  }`}
                >
                  {selectedChannel.id === channel.id ? "Active" : "Switch"}
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Match Goals Summary */}
      {match.score?.ft && (match.goals1?.length || 0) + (match.goals2?.length || 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CircleDot className="h-3.5 w-3.5 text-emerald-400" />
              Match Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  {getCountryFlag(match.team1)} {match.team1}
                </p>
                <div className="space-y-1">
                  {match.goals1?.map((g, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-emerald-400">⚽</span>
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
                  {(!match.goals1 || match.goals1.length === 0) && (
                    <p className="text-xs text-muted-foreground">No goals</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  {getCountryFlag(match.team2)} {match.team2}
                </p>
                <div className="space-y-1">
                  {match.goals2?.map((g, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-emerald-400">⚽</span>
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
                  {(!match.goals2 || match.goals2.length === 0) && (
                    <p className="text-xs text-muted-foreground">No goals</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function Home() {
  const [data, setData] = useState<WorldCupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Derive initial selected match from URL
  const [initialMatchResolved, setInitialMatchResolved] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Sync with URL search params on initial load
  if (!initialMatchResolved && data) {
    setInitialMatchResolved(true);
    const params = new URLSearchParams(window.location.search);
    const matchIdx = params.get("match");
    if (matchIdx) {
      const idx = parseInt(matchIdx, 10);
      if (!isNaN(idx) && idx >= 0 && idx < data.matches.length) {
        setSelectedMatch(data.matches[idx]);
      }
    }
  }

  const handleWatchLive = useCallback(
    (match: Match) => {
      if (!data) return;
      const idx = data.matches.indexOf(match);
      const url = new URL(window.location.href);
      if (idx >= 0) {
        url.searchParams.set("match", String(idx));
      }
      window.history.pushState({}, "", url.toString());
      setSelectedMatch(match);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [data]
  );

  const handleBack = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("match");
    window.history.pushState({}, "", url.toString());
    setSelectedMatch(null);
  }, []);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const matchIdx = params.get("match");
      if (matchIdx && data) {
        const idx = parseInt(matchIdx, 10);
        if (!isNaN(idx) && idx >= 0 && idx < data.matches.length) {
          setSelectedMatch(data.matches[idx]);
          return;
        }
      }
      setSelectedMatch(null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [data]);

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
      {/* ─── Compact Header ──────────────────────────────────────────────── */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            onClick={() => {
              if (selectedMatch) handleBack();
            }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-500/10">
                <Trophy className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-sm font-bold leading-none">
                  FIFA World Cup 2026
                </h1>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  USA · Mexico · Canada
                </p>
              </div>
            </div>
          </button>
          <CountdownTimer />
        </div>
      </header>

      {/* ─── Main Content ────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <p className="text-muted-foreground text-sm">Loading World Cup data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        ) : data ? (
          selectedMatch ? (
            <MatchDetailView match={selectedMatch} onBack={handleBack} />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Stats */}
              <StatsBanner data={data} />

              {/* Top Scorers + Quick Info */}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Tv className="h-3.5 w-3.5 text-emerald-400" />
                        Live Stream Schedule
                      </CardTitle>
                      <CardDescription>
                        Click Watch to open the live stream player
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {data.matches
                          .filter((m) => !m.score?.ft)
                          .slice(0, 5)
                          .map((match, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors group"
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[10px] gap-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2 opacity-60 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleWatchLive(match)}
                                >
                                  <Play className="h-3 w-3 fill-emerald-400" />
                                  Watch
                                </Button>
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
                      <GroupTable key={group.name} group={group} onWatchLive={handleWatchLive} />
                    ))}
                  </div>
                </TabsContent>

                {/* Schedule */}
                <TabsContent value="schedule" className="mt-6">
                  <ScheduleView matches={data.matches} onWatchLive={handleWatchLive} />
                </TabsContent>

                {/* Knockout */}
                <TabsContent value="knockout" className="mt-6">
                  <div className="space-y-10">
                    {knockouts.map((round) => (
                      <KnockoutRoundCard key={round.name} round={round} onWatchLive={handleWatchLive} />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )
        ) : null}
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CircleDot className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-medium">FIFA World Cup 2026</span>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Data from{" "}
              <a
                href="https://github.com/openfootball/worldcup.json"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                openfootball
              </a>
              . Not affiliated with FIFA.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              🇺🇸 🇲🇽 🇨🇦
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
