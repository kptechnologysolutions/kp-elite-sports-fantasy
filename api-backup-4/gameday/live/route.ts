import { NextRequest } from 'next/server';
import { 
  generateGameDayData, 
  formatRedZoneAlert, 
  formatWinProbability, 
  formatPlayerInactive, 
  formatAntiCorrelation, 
  formatExposureRisk, 
  formatLiveUpdate 
} from '@/lib/services/gamedayService';

export async function GET(req: NextRequest) {
  try {
    const data = await generateGameDayData();
    
    // Format the data for display
    const formattedData = {
      redzone: data.redzone.map(formatRedZoneAlert),
      winProb: data.winProb.map(formatWinProbability),
      inactives: data.inactives.map(formatPlayerInactive),
      antiCorr: data.antiCorr.map(formatAntiCorrelation),
      exposure: data.exposure.map(formatExposureRisk),
      updates: data.updates.map(formatLiveUpdate).slice(0, 10) // Show last 10 updates
    };

    return Response.json(formattedData);
  } catch (error) {
    console.error('Gameday API error:', error);
    return Response.json({ 
      error: 'Failed to fetch game day data',
      redzone: [],
      winProb: [],
      inactives: [],
      antiCorr: [],
      exposure: [],
      updates: []
    }, { status: 500 });
  }
}