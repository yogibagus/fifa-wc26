import { Match, GroupStanding, GroupData, KnockoutRound } from "./types";

export function computeGroupStandings(matches: Match[]): Map<string, GroupStanding> {
  const standings = new Map<string, GroupStanding>();

  for (const match of matches) {
    if (!match.score?.ft) continue;

    const [s1, s2] = match.score.ft;

    if (!standings.has(match.team1)) {
      standings.set(match.team1, {
        team: match.team1,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
      });
    }
    if (!standings.has(match.team2)) {
      standings.set(match.team2, {
        team: match.team2,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
      });
    }

    const t1 = standings.get(match.team1)!;
    const t2 = standings.get(match.team2)!;

    t1.played++;
    t2.played++;
    t1.goalsFor += s1;
    t1.goalsAgainst += s2;
    t2.goalsFor += s2;
    t2.goalsAgainst += s1;
    t1.goalDifference = t1.goalsFor - t1.goalsAgainst;
    t2.goalDifference = t2.goalsFor - t2.goalsAgainst;

    if (s1 > s2) {
      t1.won++;
      t1.points += 3;
      t2.lost++;
    } else if (s1 < s2) {
      t2.won++;
      t2.points += 3;
      t1.lost++;
    } else {
      t1.drawn++;
      t2.drawn++;
      t1.points++;
      t2.points++;
    }
  }

  return standings;
}

export function organizeGroups(matches: Match[]): GroupData[] {
  const groupMap = new Map<string, Match[]>();

  for (const match of matches) {
    if (!match.group) continue;
    if (!groupMap.has(match.group)) {
      groupMap.set(match.group, []);
    }
    groupMap.get(match.group)!.push(match);
  }

  const groups: GroupData[] = [];
  const sortedKeys = Array.from(groupMap.keys()).sort();

  for (const key of sortedKeys) {
    const groupMatches = groupMap.get(key)!;
    const standingsMap = computeGroupStandings(groupMatches);
    const standings = Array.from(standingsMap.values()).sort(
      (a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor
    );
    groups.push({ name: key, standings, matches: groupMatches });
  }

  return groups;
}

export function organizeKnockout(matches: Match[]): KnockoutRound[] {
  const roundMap = new Map<string, Match[]>();
  const roundOrder = [
    "Round of 32",
    "Round of 16",
    "Quarter-final",
    "Semi-final",
    "Match for third place",
    "Final",
  ];

  for (const match of matches) {
    if (match.group) continue;
    if (!roundMap.has(match.round)) {
      roundMap.set(match.round, []);
    }
    roundMap.get(match.round)!.push(match);
  }

  return roundOrder
    .filter((r) => roundMap.has(r))
    .map((r) => ({ name: r, matches: roundMap.get(r)! }));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function getMatchStatus(match: Match): "completed" | "upcoming" | "live" {
  if (match.score?.ft) return "completed";
  const matchDate = new Date(match.date + "T00:00:00Z");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (matchDate.getTime() === today.getTime()) return "live";
  if (matchDate < today) return "completed";
  return "upcoming";
}

export function getCountryFlag(teamName: string): string {
  const flagMap: Record<string, string> = {
    "Mexico": "🇲🇽", "South Africa": "🇿🇦", "South Korea": "🇰🇷",
    "Czech Republic": "🇨🇿", "Canada": "🇨🇦", "Bosnia & Herzegovina": "🇧🇦",
    "Qatar": "🇶🇦", "Switzerland": "🇨🇭", "Brazil": "🇧🇷", "Morocco": "🇲🇦",
    "Haiti": "🇭🇹", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "USA": "🇺🇸",
    "Paraguay": "🇵🇾", "Australia": "🇦🇺", "Turkey": "🇹🇷", "Germany": "🇩🇪",
    "Curaçao": "🇨🇼", "Ivory Coast": "🇨🇮", "Ecuador": "🇪🇨",
    "Netherlands": "🇳🇱", "Japan": "🇯🇵", "Sweden": "🇸🇪", "Tunisia": "🇹🇳",
    "Belgium": "🇧🇪", "Egypt": "🇪🇬", "Iran": "🇮🇷", "New Zealand": "🇳🇿",
    "Spain": "🇪🇸", "Cape Verde": "🇨🇻", "Saudi Arabia": "🇸🇦",
    "Uruguay": "🇺🇾", "France": "🇫🇷", "Senegal": "🇸🇳", "Iraq": "🇮🇶",
    "Norway": "🇳🇴", "Argentina": "🇦🇷", "Algeria": "🇩🇿", "Austria": "🇦🇹",
    "Jordan": "🇯🇴", "Portugal": "🇵🇹", "Colombia": "🇨🇴", "Cameroon": "🇨🇲",
    "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "Ukraine": "🇺🇦", "Chile": "🇨🇱", "Peru": "🇵🇪",
    "Nigeria": "🇳🇬", "Costa Rica": "🇨🇷", "Panama": "🇵🇦", "Jamaica": "🇯🇲",
    "DR Congo": "🇨🇩", "Thailand": "🇹🇭", "Uzbekistan": "🇺🇿", "China PR": "🇨🇳",
    "Poland": "🇵🇱", "Croatia": "🇭🇷", "Denmark": "🇩🇰", "Serbia": "🇷🇸",
    "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Italy": "🇮🇹", "Romania": "🇷🇴", "Greece": "🇬🇷",
    "Congo": "🇨🇬", "Guinea": "🇬🇳", "Mali": "🇲🇱", "Gabon": "🇬🇦",
    "Venezuela": "🇻🇪", "Paraguay": "🇵🇾", "Honduras": "🇭🇳",
  };

  // For placeholder teams like "1A", "2B", "W73", etc.
  if (/^[12][A-Z]$/.test(teamName) || /^W\d+$/.test(teamName) || /^L\d+$/.test(teamName) || teamName.includes(" vs ")) {
    return "🏆";
  }

  return flagMap[teamName] || "⚽";
}
