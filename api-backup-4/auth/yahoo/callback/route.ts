import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  if (error) {
    // User denied authorization
    return NextResponse.redirect(
      new URL(`/teams?error=${encodeURIComponent(error)}`, request.url)
    );
  }
  
  if (!code) {
    return NextResponse.redirect(
      new URL('/teams?error=no_code', request.url)
    );
  }
  
  try {
    // Exchange code for access token
    const clientId = process.env.NEXT_PUBLIC_YAHOO_CLIENT_ID;
    const clientSecret = process.env.YAHOO_CLIENT_SECRET;
    const redirectUri = `${request.nextUrl.origin}/api/auth/yahoo/callback`;
    
    if (!clientId || !clientSecret) {
      throw new Error('Yahoo OAuth credentials not configured');
    }
    
    // Get access token from Yahoo
    const tokenResponse = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      throw new Error('Failed to exchange code for token');
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    // Get user's fantasy teams
    const teamsResponse = await fetch('https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!teamsResponse.ok) {
      throw new Error('Failed to fetch fantasy teams');
    }
    
    const teamsData = await teamsResponse.json();
    
    // Store the access token in a secure cookie
    const response = NextResponse.redirect(
      new URL('/teams/import/yahoo/select', request.url)
    );
    
    // Set secure HTTP-only cookie with token
    response.cookies.set('yahoo_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/',
    });
    
    // Store teams data in session storage via URL params (temporary)
    const leagues = teamsData.fantasy_content?.users?.[0]?.user?.[1]?.games?.[0]?.game?.[1]?.leagues || [];
    if (leagues.length > 0) {
      response.cookies.set('yahoo_leagues', JSON.stringify(leagues), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 300, // 5 minutes
        path: '/',
      });
    }
    
    return response;
  } catch (error) {
    console.error('Yahoo OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/teams?error=${encodeURIComponent('OAuth authentication failed')}`, request.url)
    );
  }
}