// League-Specific Scoring Service
// Handles scoring calculations based on each league's unique settings
// Supports standard, PPR, half-PPR, and IDP (Individual Defensive Players) scoring

import { SleeperLeague, SleeperPlayer } from './sleeperService';

export interface ScoringSettings {
  // Passing
  pass_yd?: number;
  pass_td?: number;
  pass_int?: number;
  pass_2pt?: number;
  pass_cmp?: number;
  pass_inc?: number;
  pass_cmp_40p?: number;
  pass_fd?: number;
  
  // Rushing
  rush_yd?: number;
  rush_td?: number;
  rush_2pt?: number;
  rush_att?: number;
  rush_40p?: number;
  rush_fd?: number;
  
  // Receiving
  rec?: number; // PPR
  rec_yd?: number;
  rec_td?: number;
  rec_2pt?: number;
  rec_tgt?: number;
  rec_40p?: number;
  rec_fd?: number;
  
  // Fumbles
  fum?: number;
  fum_lost?: number;
  fum_rec?: number;
  fum_rec_td?: number;
  
  // Kicking
  xp?: number;
  fg?: number;
  fgm_0_19?: number;
  fgm_20_29?: number;
  fgm_30_39?: number;
  fgm_40_49?: number;
  fgm_50p?: number;
  fgmiss?: number;
  
  // Team Defense
  def_td?: number;
  def_int?: number;
  def_fum_rec?: number;
  def_sack?: number;
  def_safe?: number;
  def_block_kick?: number;
  def_int_td?: number;
  def_fum_rec_td?: number;
  def_kick_ret_td?: number;
  def_punt_ret_td?: number;
  def_pts_allowed?: number;
  def_yds_allowed?: number;
  
  // Individual Defensive Players (IDP)
  idp_tackle?: number;
  idp_assist?: number;
  idp_sack?: number;
  idp_int?: number;
  idp_fum_rec?: number;
  idp_fum_force?: number;
  idp_def_td?: number;
  idp_pass_def?: number;
  idp_block_kick?: number;
  idp_safe?: number;
  idp_ret_td?: number;
  
  // Bonus scoring
  bonus_rec_yd?: number;
  bonus_rush_yd?: number;
  bonus_pass_yd?: number;
  
  // Other scoring rules
  [key: string]: number | undefined;
}

export interface PlayerStats {
  // Basic stats
  pass_yd?: number;
  pass_td?: number;
  pass_int?: number;
  pass_att?: number;
  pass_cmp?: number;
  
  rush_yd?: number;
  rush_td?: number;
  rush_att?: number;
  
  rec?: number;
  rec_yd?: number;
  rec_td?: number;
  rec_tgt?: number;
  
  fum?: number;
  fum_lost?: number;
  
  // Kicking
  xp?: number;
  fg_att?: number;
  fg_made?: number;
  fgm_0_19?: number;
  fgm_20_29?: number;
  fgm_30_39?: number;
  fgm_40_49?: number;
  fgm_50p?: number;
  
  // IDP stats
  idp_tackle?: number;
  idp_assist?: number;
  idp_sack?: number;
  idp_int?: number;
  idp_fum_rec?: number;
  idp_fum_force?: number;
  idp_def_td?: number;
  idp_pass_def?: number;
  
  [key: string]: number | undefined;
}

export interface CalculatedScore {
  total: number;
  breakdown: {
    category: string;
    points: number;
    description: string;
  }[];
}

export class ScoringService {
  
  /**
   * Calculate player fantasy points based on league scoring settings
   */
  calculatePlayerScore(
    stats: PlayerStats,
    scoringSettings: ScoringSettings,
    playerPosition: string
  ): CalculatedScore {
    const breakdown: { category: string; points: number; description: string }[] = [];
    let total = 0;
    
    // Passing scoring
    if (stats.pass_yd && scoringSettings.pass_yd) {
      const points = (stats.pass_yd * scoringSettings.pass_yd);
      breakdown.push({
        category: 'Passing',
        points,
        description: `${stats.pass_yd} yards × ${scoringSettings.pass_yd} = ${points.toFixed(2)}`
      });
      total += points;
    }
    
    if (stats.pass_td && scoringSettings.pass_td) {
      const points = stats.pass_td * scoringSettings.pass_td;
      breakdown.push({
        category: 'Passing',
        points,
        description: `${stats.pass_td} TD × ${scoringSettings.pass_td} = ${points}`
      });
      total += points;
    }
    
    if (stats.pass_int && scoringSettings.pass_int) {
      const points = stats.pass_int * scoringSettings.pass_int;
      breakdown.push({
        category: 'Passing',
        points,
        description: `${stats.pass_int} INT × ${scoringSettings.pass_int} = ${points}`
      });
      total += points;
    }
    
    // Rushing scoring
    if (stats.rush_yd && scoringSettings.rush_yd) {
      const points = stats.rush_yd * scoringSettings.rush_yd;
      breakdown.push({
        category: 'Rushing',
        points,
        description: `${stats.rush_yd} yards × ${scoringSettings.rush_yd} = ${points.toFixed(2)}`
      });
      total += points;
    }
    
    if (stats.rush_td && scoringSettings.rush_td) {
      const points = stats.rush_td * scoringSettings.rush_td;
      breakdown.push({
        category: 'Rushing',
        points,
        description: `${stats.rush_td} TD × ${scoringSettings.rush_td} = ${points}`
      });
      total += points;
    }
    
    // Receiving scoring (PPR leagues)
    if (stats.rec && scoringSettings.rec) {
      const points = stats.rec * scoringSettings.rec;
      breakdown.push({
        category: 'Receiving',
        points,
        description: `${stats.rec} receptions × ${scoringSettings.rec} = ${points}`
      });
      total += points;
    }
    
    if (stats.rec_yd && scoringSettings.rec_yd) {
      const points = stats.rec_yd * scoringSettings.rec_yd;
      breakdown.push({
        category: 'Receiving',
        points,
        description: `${stats.rec_yd} yards × ${scoringSettings.rec_yd} = ${points.toFixed(2)}`
      });
      total += points;
    }
    
    if (stats.rec_td && scoringSettings.rec_td) {
      const points = stats.rec_td * scoringSettings.rec_td;
      breakdown.push({
        category: 'Receiving',
        points,
        description: `${stats.rec_td} TD × ${scoringSettings.rec_td} = ${points}`
      });
      total += points;
    }
    
    // Fumbles
    if (stats.fum_lost && scoringSettings.fum_lost) {
      const points = stats.fum_lost * scoringSettings.fum_lost;
      breakdown.push({
        category: 'Fumbles',
        points,
        description: `${stats.fum_lost} fumbles lost × ${scoringSettings.fum_lost} = ${points}`
      });
      total += points;
    }
    
    // Kicking scoring
    if (playerPosition === 'K') {
      if (stats.xp && scoringSettings.xp) {
        const points = stats.xp * scoringSettings.xp;
        breakdown.push({
          category: 'Kicking',
          points,
          description: `${stats.xp} XP × ${scoringSettings.xp} = ${points}`
        });
        total += points;
      }
      
      // Field goals by distance
      ['fgm_0_19', 'fgm_20_29', 'fgm_30_39', 'fgm_40_49', 'fgm_50p'].forEach(fgType => {
        if (stats[fgType] && scoringSettings[fgType]) {
          const points = stats[fgType] * scoringSettings[fgType];
          breakdown.push({
            category: 'Kicking',
            points,
            description: `${stats[fgType]} FG (${fgType.replace('fgm_', '').replace('_', '-')}) × ${scoringSettings[fgType]} = ${points}`
          });
          total += points;
        }
      });
    }
    
    // IDP (Individual Defensive Player) scoring
    if (['LB', 'DB', 'DL'].includes(playerPosition)) {
      if (stats.idp_tackle && scoringSettings.idp_tackle) {
        const points = stats.idp_tackle * scoringSettings.idp_tackle;
        breakdown.push({
          category: 'Defense',
          points,
          description: `${stats.idp_tackle} tackles × ${scoringSettings.idp_tackle} = ${points}`
        });
        total += points;
      }
      
      if (stats.idp_assist && scoringSettings.idp_assist) {
        const points = stats.idp_assist * scoringSettings.idp_assist;
        breakdown.push({
          category: 'Defense',
          points,
          description: `${stats.idp_assist} assists × ${scoringSettings.idp_assist} = ${points}`
        });
        total += points;
      }
      
      if (stats.idp_sack && scoringSettings.idp_sack) {
        const points = stats.idp_sack * scoringSettings.idp_sack;
        breakdown.push({
          category: 'Defense',
          points,
          description: `${stats.idp_sack} sacks × ${scoringSettings.idp_sack} = ${points}`
        });
        total += points;
      }
      
      if (stats.idp_int && scoringSettings.idp_int) {
        const points = stats.idp_int * scoringSettings.idp_int;
        breakdown.push({
          category: 'Defense',
          points,
          description: `${stats.idp_int} interceptions × ${scoringSettings.idp_int} = ${points}`
        });
        total += points;
      }
      
      if (stats.idp_fum_rec && scoringSettings.idp_fum_rec) {
        const points = stats.idp_fum_rec * scoringSettings.idp_fum_rec;
        breakdown.push({
          category: 'Defense',
          points,
          description: `${stats.idp_fum_rec} fumble recoveries × ${scoringSettings.idp_fum_rec} = ${points}`
        });
        total += points;
      }
      
      if (stats.idp_def_td && scoringSettings.idp_def_td) {
        const points = stats.idp_def_td * scoringSettings.idp_def_td;
        breakdown.push({
          category: 'Defense',
          points,
          description: `${stats.idp_def_td} defensive TD × ${scoringSettings.idp_def_td} = ${points}`
        });
        total += points;
      }
    }
    
    return {
      total: Math.round(total * 100) / 100,
      breakdown
    };
  }
  
  /**
   * Determine if league uses PPR, Half-PPR, or Standard scoring
   */
  getScoringType(scoringSettings: ScoringSettings): 'PPR' | 'Half-PPR' | 'Standard' {
    const pprValue = scoringSettings.rec || 0;
    
    if (pprValue >= 1) return 'PPR';
    if (pprValue > 0) return 'Half-PPR';
    return 'Standard';
  }
  
  /**
   * Check if league uses IDP (Individual Defensive Players)
   */
  isIDPLeague(scoringSettings: ScoringSettings, rosterPositions: string[]): boolean {
    // Check for IDP positions in roster
    const idpPositions = ['LB', 'DB', 'DL', 'DE', 'DT', 'CB', 'S', 'OLB', 'ILB'];
    const hasIDPPositions = rosterPositions.some(pos => idpPositions.includes(pos));
    
    // Check for IDP scoring rules
    const hasIDPScoring = Boolean(
      scoringSettings.idp_tackle || 
      scoringSettings.idp_assist || 
      scoringSettings.idp_sack ||
      scoringSettings.idp_int ||
      scoringSettings.idp_fum_rec
    );
    
    return hasIDPPositions || hasIDPScoring;
  }
  
  /**
   * Get scoring summary for a league
   */
  getLeagueScoringInfo(league: SleeperLeague): {
    type: string;
    isIDP: boolean;
    keyRules: string[];
    rosterPositions: string[];
  } {
    const scoringType = this.getScoringType(league.scoring_settings);
    const isIDP = this.isIDPLeague(league.scoring_settings, league.roster_positions);
    
    const keyRules: string[] = [];
    
    // Add key scoring rules
    if (league.scoring_settings.rec) {
      keyRules.push(`${league.scoring_settings.rec} pt per reception`);
    }
    
    if (league.scoring_settings.pass_yd) {
      keyRules.push(`${league.scoring_settings.pass_yd} pts per passing yard`);
    }
    
    if (league.scoring_settings.rush_yd) {
      keyRules.push(`${league.scoring_settings.rush_yd} pts per rushing yard`);
    }
    
    if (league.scoring_settings.rec_yd) {
      keyRules.push(`${league.scoring_settings.rec_yd} pts per receiving yard`);
    }
    
    if (isIDP) {
      if (league.scoring_settings.idp_tackle) {
        keyRules.push(`${league.scoring_settings.idp_tackle} pts per tackle`);
      }
      if (league.scoring_settings.idp_sack) {
        keyRules.push(`${league.scoring_settings.idp_sack} pts per sack`);
      }
    }
    
    return {
      type: scoringType + (isIDP ? ' + IDP' : ''),
      isIDP,
      keyRules,
      rosterPositions: league.roster_positions
    };
  }
  
  /**
   * Calculate projected points based on league scoring and player projections
   */
  calculateProjectedPoints(
    playerProjections: PlayerStats,
    scoringSettings: ScoringSettings,
    playerPosition: string
  ): number {
    const score = this.calculatePlayerScore(playerProjections, scoringSettings, playerPosition);
    return score.total;
  }
  
  /**
   * Compare scoring impact between different leagues
   */
  compareLeagueScoring(
    playerStats: PlayerStats,
    league1: SleeperLeague,
    league2: SleeperLeague,
    playerPosition: string
  ): {
    league1Score: number;
    league2Score: number;
    difference: number;
    explanation: string;
  } {
    const score1 = this.calculatePlayerScore(playerStats, league1.scoring_settings, playerPosition);
    const score2 = this.calculatePlayerScore(playerStats, league2.scoring_settings, playerPosition);
    
    const difference = score1.total - score2.total;
    
    let explanation = '';
    if (Math.abs(difference) < 0.5) {
      explanation = 'Similar scoring in both leagues';
    } else if (difference > 0) {
      explanation = `Higher scoring in ${league1.name} due to different settings`;
    } else {
      explanation = `Higher scoring in ${league2.name} due to different settings`;
    }
    
    return {
      league1Score: score1.total,
      league2Score: score2.total,
      difference,
      explanation
    };
  }
}

// Export singleton instance
export const scoringService = new ScoringService();