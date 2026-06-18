export interface Goal {
  name: string;
  minute: string;
  penalty?: boolean;
  owngoal?: boolean;
}

export interface Score {
  ft: [number, number];
  ht: [number, number];
}

export interface Match {
  round: string;
  date: string;
  time?: string;
  team1: string;
  team2: string;
  score?: Score;
  goals1?: Goal[];
  goals2?: Goal[];
  group?: string;
  ground?: string;
}

export interface WorldCupData {
  name: string;
  matches: Match[];
}

export interface GroupStanding {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface GroupData {
  name: string;
  standings: GroupStanding[];
  matches: Match[];
}

export interface KnockoutRound {
  name: string;
  matches: Match[];
}
