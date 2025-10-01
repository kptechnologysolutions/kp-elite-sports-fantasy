export type PlatformId = 'sleeper' | 'espn' | 'yahoo' | 'cbs' | 'nfl';

export interface RawLeague {
  platform: PlatformId;
  leagueId: string;
  name: string;
  scoring: any;
}
export interface RawPlayerEntry {
  externalId?: string; // platform id if available
  displayName: string;
  position: string; // e.g., 'RB'
  team: string;     // e.g., 'SF'
}
export interface RawRoster {
  platform: PlatformId;
  leagueId: string;
  teamId: string;
  players: RawPlayerEntry[];
}

export interface NormalizedPlayer {
  pid: string; // internal stable id
  name: string;
  pos: string;
  nfl: string;
}
export interface NormalizedRoster {
  leagueKey: string;
  teamKey: string;
  players: NormalizedPlayer[];
}

export type RiskMode = 'safe' | 'balanced' | 'aggressive';