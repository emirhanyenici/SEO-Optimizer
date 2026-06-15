import os from 'os';
import path from 'path';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';

interface ClaudeCredentials {
  claudeAiOauth: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}

function readClaudeOAuthToken(): { token: string; expiresAt: number } {
  const credPath = path.join(os.homedir(), '.claude', '.credentials.json');
  const creds: ClaudeCredentials = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
  const { accessToken, expiresAt } = creds.claudeAiOauth;
  return {
    token: accessToken,
    expiresAt: Math.floor(expiresAt / 1000),
  };
}

// 7 Phase-1 agents hit the API concurrently, so transient 429 (rate limit) and
// 529 (overloaded) responses are common. Bumping retries above the SDK default
// of 2 (it backs off exponentially and honours Retry-After) keeps a single
// hiccup from turning an agent red.
const MAX_RETRIES = 5;

export function createAnthropicClient(): Anthropic {
  if (process.env.ANTHROPIC_API_KEY) {
    return new Anthropic({ maxRetries: MAX_RETRIES });
  }

  return new Anthropic({
    maxRetries: MAX_RETRIES,
    credentials: async () => readClaudeOAuthToken(),
  });
}
