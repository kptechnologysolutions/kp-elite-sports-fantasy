'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, Copy, CheckCircle, AlertTriangle, 
  ArrowRight, FileCode2, Key, Globe, Shield
} from 'lucide-react';

export default function YahooSetupPage() {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const envVars = {
    clientId: 'NEXT_PUBLIC_YAHOO_CLIENT_ID=your_yahoo_client_id_here',
    clientSecret: 'YAHOO_CLIENT_SECRET=your_yahoo_client_secret_here',
    appUrl: 'NEXT_PUBLIC_APP_URL=http://localhost:3000'
  };

  return (
    <main className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 mb-4">
            <span className="text-2xl">🟣</span>
          </div>
          <h1 className="text-3xl font-bold">Yahoo Fantasy OAuth Setup</h1>
          <p className="text-muted-foreground mt-2">
            Follow these steps to connect your Yahoo Fantasy leagues
          </p>
        </div>

        {/* Prerequisites Alert */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Prerequisites:</strong> You need a Yahoo account and at least one fantasy football league to import teams.
          </AlertDescription>
        </Alert>

        {/* Step 1: Register App */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <CardTitle>Register Your App with Yahoo</CardTitle>
                <CardDescription>Create a Yahoo App to get OAuth credentials</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm">Visit the Yahoo Developer Portal and create a new app:</p>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => window.open('https://developer.yahoo.com/apps/', '_blank')}
              >
                <span>Open Yahoo Developer Portal</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="font-medium text-sm">App Configuration:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• <strong>App Name:</strong> HalGrid Fantasy (or your choice)</li>
                <li>• <strong>App Type:</strong> Web Application</li>
                <li>• <strong>Redirect URI:</strong> 
                  <code className="ml-2 px-2 py-1 bg-background rounded text-xs">
                    http://localhost:3000/api/auth/yahoo/callback
                  </code>
                </li>
                <li>• <strong>API Permissions:</strong> Fantasy Sports (Read)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Copy Credentials */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <CardTitle>Copy Your OAuth Credentials</CardTitle>
                <CardDescription>Get your Client ID and Client Secret from Yahoo</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm mb-3">After creating your app, Yahoo will provide:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">Client ID</Badge>
                  <span className="text-xs text-muted-foreground">- Public identifier for your app</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">Client Secret</Badge>
                  <span className="text-xs text-muted-foreground">- Private key (keep secure!)</span>
                </div>
              </div>
            </div>
            
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Never share your Client Secret publicly or commit it to version control!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Step 3: Update .env.local */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <CardTitle>Update Your Environment Variables</CardTitle>
                <CardDescription>Add credentials to your .env.local file</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCode2 className="h-4 w-4" />
                  <span className="font-mono text-sm">.env.local</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(
                    `${envVars.clientId}\n${envVars.clientSecret}\n${envVars.appUrl}`,
                    'all'
                  )}
                >
                  {copiedId === 'all' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="space-y-2">
                {Object.entries(envVars).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 bg-background rounded"
                  >
                    <code className="text-xs flex-1">{value}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(value, key)}
                    >
                      {copiedId === key ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Alert>
              <AlertDescription>
                Replace <code>your_yahoo_client_id_here</code> and <code>your_yahoo_client_secret_here</code> with your actual Yahoo credentials.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Step 4: Restart Server */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <CardTitle>Restart Your Development Server</CardTitle>
                <CardDescription>Apply the new environment variables</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm mb-3">Stop your server (Ctrl+C) and restart it:</p>
              <code className="block p-3 bg-background rounded text-sm">
                npm run dev
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/teams')}
          >
            Back to Teams
          </Button>
          <Button
            className="flex-1 bg-purple-500 hover:bg-purple-600"
            onClick={() => router.push('/teams/import')}
          >
            <span>Continue to Import</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Help Section */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Yahoo Developer Documentation</p>
                <a 
                  href="https://developer.yahoo.com/fantasysports/guide/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  View Fantasy Sports API Guide →
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Common Issues</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                  <li>• Make sure redirect URI matches exactly</li>
                  <li>• Client Secret must be kept private</li>
                  <li>• Server restart required after .env changes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}