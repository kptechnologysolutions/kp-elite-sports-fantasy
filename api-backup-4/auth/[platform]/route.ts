import { NextRequest, NextResponse } from 'next/server';

// Mock OAuth endpoints for different platforms
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  
  // Simulate OAuth flow - in production this would redirect to the platform's OAuth page
  // For demo, we'll just redirect back with a success message
  
  const supportedPlatforms = ['espn', 'yahoo', 'sleeper', 'nfl', 'cbs'];
  
  if (!supportedPlatforms.includes(platform)) {
    return NextResponse.json(
      { error: 'Unsupported platform' },
      { status: 400 }
    );
  }

  // Simulate successful OAuth by redirecting to teams page with success param
  const redirectUrl = new URL('/teams', request.url);
  redirectUrl.searchParams.set('import', 'success');
  redirectUrl.searchParams.set('platform', platform);
  
  return NextResponse.redirect(redirectUrl);
}