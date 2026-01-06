/**
 * Integration Recipes Store
 * Community-contributed integration configurations and guides
 * Phase 4: Community & Ecosystem
 */

import { dbPut, dbGetAll, dbGet, dbDelete, generateId } from './db';
import type { IntegrationType } from './integrationStore';
import type { GameCategory } from '../types';

// ============================================================================
// Types
// ============================================================================

export type RecipeDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface RecipeStep {
    order: number;
    title: string;
    description: string;
    code?: string;
    codeLanguage?: 'javascript' | 'typescript' | 'json' | 'sql' | 'bash' | 'yaml';
    imageUrl?: string;
    tip?: string;
    warning?: string;
}

export interface IntegrationRecipe {
    id: string;
    title: string;
    description: string;
    author: string;
    version: string;

    // Integration details
    integrationType: IntegrationType;
    gameTypes: GameCategory[];

    // Content
    steps: RecipeStep[];
    prerequisites: string[];
    troubleshooting: Array<{
        problem: string;
        solution: string;
    }>;

    // Metadata
    difficulty: RecipeDifficulty;
    estimatedTime: string; // e.g., "10 minutes"
    tags: string[];
    verified: boolean;

    // Stats
    views: number;
    helpful: number;
    notHelpful: number;

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Built-in Recipes
// ============================================================================

export const STARTER_RECIPES: IntegrationRecipe[] = [
    // Google Sheets Recipe
    {
        id: 'recipe-google-sheets-analytics',
        title: 'Google Sheets Analytics Export',
        description: 'Set up Google Sheets as a data source for importing game analytics data exported from your game.',
        author: 'Game Insights Team',
        version: '1.0.0',
        integrationType: 'google_sheets',
        gameTypes: ['puzzle', 'idle', 'battle_royale', 'match3_meta', 'gacha_rpg', 'custom'],
        steps: [
            {
                order: 1,
                title: 'Create a Google Sheet',
                description: 'Create a new Google Sheet to store your analytics data. Name it something descriptive like "MyGame Analytics".',
                tip: 'Use a dedicated Google account for your game to keep personal and game data separate.',
            },
            {
                order: 2,
                title: 'Structure Your Data',
                description: 'Ensure your sheet has headers in the first row. Common columns include: user_id, timestamp, event_name, revenue, level, etc.',
                code: 'user_id | timestamp | event_name | revenue | level | platform\n123 | 2024-01-15 | level_complete | 0 | 5 | ios',
                codeLanguage: 'yaml',
            },
            {
                order: 3,
                title: 'Get Spreadsheet ID',
                description: 'Copy the spreadsheet ID from the URL. It\'s the long string between /d/ and /edit.',
                code: 'https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit',
                codeLanguage: 'bash',
                tip: 'The ID looks like: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
            },
            {
                order: 4,
                title: 'Connect in Game Insights',
                description: 'Go to Data Sources > Add Integration > Google Sheets. Paste your spreadsheet ID and authorize access.',
            },
            {
                order: 5,
                title: 'Configure Sync',
                description: 'Choose your sync frequency and select which sheet/range to import.',
                tip: 'Start with manual sync to verify data imports correctly, then switch to scheduled sync.',
            },
        ],
        prerequisites: [
            'A Google account',
            'Game analytics data in spreadsheet format',
        ],
        troubleshooting: [
            {
                problem: 'Authorization failed',
                solution: 'Make sure you\'re signed into the correct Google account and have granted all required permissions.',
            },
            {
                problem: 'No data appears after sync',
                solution: 'Verify the sheet name and range are correct. Check that your sheet has headers in the first row.',
            },
        ],
        difficulty: 'beginner',
        estimatedTime: '5 minutes',
        tags: ['google-sheets', 'spreadsheet', 'csv', 'export'],
        verified: true,
        views: 1250,
        helpful: 98,
        notHelpful: 3,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
    // Firebase Analytics Recipe
    {
        id: 'recipe-firebase-analytics',
        title: 'Firebase Analytics for Mobile Games',
        description: 'Connect Firebase Analytics to import player events, user properties, and engagement data from your mobile game.',
        author: 'Game Insights Team',
        version: '1.0.0',
        integrationType: 'firebase',
        gameTypes: ['puzzle', 'idle', 'match3_meta', 'gacha_rpg'],
        steps: [
            {
                order: 1,
                title: 'Set Up Firebase Project',
                description: 'Create a Firebase project at console.firebase.google.com if you haven\'t already.',
            },
            {
                order: 2,
                title: 'Enable Analytics',
                description: 'In the Firebase console, go to Analytics and enable it for your project.',
                tip: 'Enable BigQuery export for more detailed data access.',
            },
            {
                order: 3,
                title: 'Log Custom Events',
                description: 'Implement custom event logging in your game for key actions you want to track.',
                code: `// Unity C#
FirebaseAnalytics.LogEvent("level_complete", new Parameter[] {
    new Parameter("level", 5),
    new Parameter("score", 1250),
    new Parameter("time_spent", 45)
});`,
                codeLanguage: 'typescript',
            },
            {
                order: 4,
                title: 'Create Service Account',
                description: 'In Firebase Console > Project Settings > Service Accounts, generate a new private key.',
                warning: 'Keep this key secure! Never commit it to version control.',
            },
            {
                order: 5,
                title: 'Connect in Game Insights',
                description: 'Go to Data Sources > Add Integration > Firebase. Upload your service account key and select your project.',
            },
        ],
        prerequisites: [
            'Firebase project with Analytics enabled',
            'Firebase SDK integrated in your game',
            'Admin access to Firebase console',
        ],
        troubleshooting: [
            {
                problem: 'Events not appearing in Game Insights',
                solution: 'Firebase events can take up to 24 hours to appear. Check DebugView in Firebase Console for real-time events.',
            },
            {
                problem: 'Permission denied error',
                solution: 'Ensure your service account has the "Firebase Analytics Viewer" role.',
            },
        ],
        difficulty: 'intermediate',
        estimatedTime: '15 minutes',
        tags: ['firebase', 'mobile', 'analytics', 'events'],
        verified: true,
        views: 980,
        helpful: 87,
        notHelpful: 5,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
    // Supabase Recipe
    {
        id: 'recipe-supabase-game-backend',
        title: 'Supabase as Game Backend Database',
        description: 'Use Supabase as your game backend and connect it to Game Insights for real-time analytics.',
        author: 'Game Insights Team',
        version: '1.0.0',
        integrationType: 'supabase',
        gameTypes: ['puzzle', 'idle', 'battle_royale', 'match3_meta', 'gacha_rpg', 'custom'],
        steps: [
            {
                order: 1,
                title: 'Create Supabase Project',
                description: 'Sign up at supabase.com and create a new project.',
            },
            {
                order: 2,
                title: 'Design Analytics Tables',
                description: 'Create tables to store your game analytics data.',
                code: `-- Create events table
CREATE TABLE game_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast queries
CREATE INDEX idx_events_user ON game_events(user_id);
CREATE INDEX idx_events_time ON game_events(created_at);`,
                codeLanguage: 'sql',
            },
            {
                order: 3,
                title: 'Get API Credentials',
                description: 'In Supabase Dashboard > Settings > API, copy your project URL and anon/service key.',
                warning: 'Use the service_role key for server-side access only. Never expose it in client code.',
            },
            {
                order: 4,
                title: 'Connect in Game Insights',
                description: 'Go to Data Sources > Add Integration > Supabase. Enter your project URL and API key.',
            },
            {
                order: 5,
                title: 'Select Table',
                description: 'Choose the table you want to analyze (e.g., game_events) and configure column mappings.',
            },
        ],
        prerequisites: [
            'Supabase account',
            'Basic SQL knowledge',
        ],
        troubleshooting: [
            {
                problem: 'Connection timeout',
                solution: 'Check that your Supabase project is not paused (free tier pauses after 1 week of inactivity).',
            },
            {
                problem: 'Row Level Security blocking access',
                solution: 'Ensure your API key has the correct permissions, or create a policy allowing read access.',
            },
        ],
        difficulty: 'beginner',
        estimatedTime: '10 minutes',
        tags: ['supabase', 'postgres', 'database', 'realtime'],
        verified: true,
        views: 750,
        helpful: 72,
        notHelpful: 4,
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
    // Webhook Recipe
    {
        id: 'recipe-webhook-realtime',
        title: 'Real-Time Webhooks from Your Game Server',
        description: 'Set up webhooks to send real-time game events to Game Insights for instant analytics.',
        author: 'Game Insights Team',
        version: '1.0.0',
        integrationType: 'webhook',
        gameTypes: ['battle_royale', 'gacha_rpg', 'custom'],
        steps: [
            {
                order: 1,
                title: 'Create Webhook Endpoint',
                description: 'In Game Insights, go to Data Sources > Add Integration > Webhook to create a new endpoint.',
                tip: 'Copy the generated webhook URL - you\'ll need it for your server.',
            },
            {
                order: 2,
                title: 'Configure Secret Key',
                description: 'Set a secret key to verify webhook authenticity. Keep this secure on your server.',
            },
            {
                order: 3,
                title: 'Send Events from Your Server',
                description: 'Implement webhook calls in your game server when important events occur.',
                code: `// Node.js example
const crypto = require('crypto');

async function sendGameEvent(event) {
    const payload = JSON.stringify({
        user_id: event.userId,
        event_name: event.name,
        timestamp: new Date().toISOString(),
        data: event.data
    });

    const signature = crypto
        .createHmac('sha256', process.env.WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

    await fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature
        },
        body: payload
    });
}`,
                codeLanguage: 'javascript',
            },
            {
                order: 4,
                title: 'Define Event Schema',
                description: 'In Game Insights, define the expected schema for your events so they\'re validated correctly.',
            },
            {
                order: 5,
                title: 'Test the Integration',
                description: 'Send a test event and verify it appears in the real-time events view.',
            },
        ],
        prerequisites: [
            'Game server with HTTP client capability',
            'Ability to modify server code',
        ],
        troubleshooting: [
            {
                problem: 'Events not received',
                solution: 'Check your server logs for HTTP errors. Verify the webhook URL is correct.',
            },
            {
                problem: 'Signature validation failed',
                solution: 'Ensure the secret key matches and the signature is computed correctly (HMAC-SHA256).',
            },
        ],
        difficulty: 'intermediate',
        estimatedTime: '20 minutes',
        tags: ['webhook', 'realtime', 'server', 'events'],
        verified: true,
        views: 620,
        helpful: 58,
        notHelpful: 6,
        createdAt: '2024-02-15T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
    // Unity Recipe
    {
        id: 'recipe-unity-analytics',
        title: 'Unity Analytics to Game Insights',
        description: 'Export Unity Analytics data to Game Insights for deeper analysis and custom dashboards.',
        author: 'Game Insights Team',
        version: '1.0.0',
        integrationType: 'unity',
        gameTypes: ['puzzle', 'idle', 'match3_meta'],
        steps: [
            {
                order: 1,
                title: 'Enable Unity Analytics',
                description: 'In Unity Editor, go to Window > Services and enable Analytics.',
            },
            {
                order: 2,
                title: 'Implement Custom Events',
                description: 'Add custom analytics events to track key game actions.',
                code: `using Unity.Services.Analytics;

public class GameAnalytics : MonoBehaviour
{
    public void OnLevelComplete(int level, int score)
    {
        var parameters = new Dictionary<string, object>
        {
            { "level", level },
            { "score", score },
            { "time_spent", Time.timeSinceLevelLoad }
        };

        AnalyticsService.Instance.CustomData("level_complete", parameters);
    }
}`,
                codeLanguage: 'typescript',
            },
            {
                order: 3,
                title: 'Enable Data Export',
                description: 'In Unity Dashboard, go to Analytics > Data Export and enable BigQuery or Raw Data export.',
            },
            {
                order: 4,
                title: 'Connect via API',
                description: 'Use the Unity Analytics API key to connect Game Insights to your Unity project.',
            },
        ],
        prerequisites: [
            'Unity 2021.3 or later',
            'Unity Gaming Services account',
            'Unity Analytics package installed',
        ],
        troubleshooting: [
            {
                problem: 'Events not appearing in Unity Dashboard',
                solution: 'Make sure you called AnalyticsService.Instance.Flush() and wait a few minutes for data to process.',
            },
        ],
        difficulty: 'intermediate',
        estimatedTime: '25 minutes',
        tags: ['unity', 'game-engine', 'analytics', 'c-sharp'],
        verified: true,
        views: 540,
        helpful: 52,
        notHelpful: 3,
        createdAt: '2024-03-01T00:00:00Z',
        updatedAt: '2024-06-15T00:00:00Z',
    },
];

// ============================================================================
// IndexedDB Operations
// ============================================================================

const STORE_NAME = 'recipes';

export async function saveRecipe(recipe: IntegrationRecipe): Promise<void> {
    return dbPut(STORE_NAME, recipe);
}

export async function getAllRecipes(): Promise<IntegrationRecipe[]> {
    return dbGetAll(STORE_NAME);
}

export async function getRecipe(id: string): Promise<IntegrationRecipe | undefined> {
    return dbGet(STORE_NAME, id);
}

export async function deleteRecipe(id: string): Promise<void> {
    return dbDelete(STORE_NAME, id);
}

export async function getRecipesByIntegrationType(type: IntegrationType): Promise<IntegrationRecipe[]> {
    const all = await getAllRecipes();
    return all.filter(r => r.integrationType === type);
}

export async function getRecipesByDifficulty(difficulty: RecipeDifficulty): Promise<IntegrationRecipe[]> {
    const all = await getAllRecipes();
    return all.filter(r => r.difficulty === difficulty);
}

// ============================================================================
// Helper Functions
// ============================================================================

export function createRecipe(
    title: string,
    description: string,
    integrationType: IntegrationType,
    steps: RecipeStep[],
    options: {
        author?: string;
        gameTypes?: GameCategory[];
        prerequisites?: string[];
        difficulty?: RecipeDifficulty;
        estimatedTime?: string;
        tags?: string[];
    } = {}
): IntegrationRecipe {
    const now = new Date().toISOString();

    return {
        id: generateId(),
        title,
        description,
        author: options.author || 'Anonymous',
        version: '1.0.0',
        integrationType,
        gameTypes: options.gameTypes || ['custom'],
        steps,
        prerequisites: options.prerequisites || [],
        troubleshooting: [],
        difficulty: options.difficulty || 'intermediate',
        estimatedTime: options.estimatedTime || '15 minutes',
        tags: options.tags || [],
        verified: false,
        views: 0,
        helpful: 0,
        notHelpful: 0,
        createdAt: now,
        updatedAt: now,
    };
}

export async function incrementRecipeViews(recipeId: string): Promise<void> {
    const recipe = await getRecipe(recipeId);
    if (recipe) {
        recipe.views++;
        await saveRecipe(recipe);
    }
}

export async function markRecipeHelpful(recipeId: string, helpful: boolean): Promise<void> {
    const recipe = await getRecipe(recipeId);
    if (recipe) {
        if (helpful) {
            recipe.helpful++;
        } else {
            recipe.notHelpful++;
        }
        await saveRecipe(recipe);
    }
}

export async function initializeStarterRecipes(): Promise<void> {
    const existing = await getAllRecipes();
    const existingIds = new Set(existing.map(r => r.id));

    for (const recipe of STARTER_RECIPES) {
        if (!existingIds.has(recipe.id)) {
            await saveRecipe(recipe);
        }
    }
}

export function getDifficultyColor(difficulty: RecipeDifficulty): string {
    switch (difficulty) {
        case 'beginner': return 'text-[#7A8B5B]';
        case 'intermediate': return 'text-[#E5A84B]';
        case 'advanced': return 'text-[#E25C5C]';
        default: return 'text-[#8F8B82]';
    }
}

export function getDifficultyLabel(difficulty: RecipeDifficulty): string {
    switch (difficulty) {
        case 'beginner': return 'Beginner';
        case 'intermediate': return 'Intermediate';
        case 'advanced': return 'Advanced';
        default: return 'Unknown';
    }
}
