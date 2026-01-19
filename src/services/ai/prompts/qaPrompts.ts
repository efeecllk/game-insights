/**
 * Prompt templates for Q&A chat
 */

import type { GameCategory } from '@/types';
import type { AIInsight } from '../types';

/**
 * System prompt for Q&A chat
 */
export const QA_SYSTEM_PROMPT = `You are a helpful game analytics assistant. Your role is to help users understand their game data and make informed decisions.

CAPABILITIES:
1. Answer questions about game metrics and data
2. Explain insights and their implications
3. Suggest actions and next steps
4. Help navigate the analytics dashboard
5. Create segments and set alerts when requested

GUIDELINES:
- Be concise but thorough
- Use specific numbers when available
- Reference existing insights when relevant
- Suggest follow-up actions when appropriate
- Be honest about limitations

RESPONSE FORMAT:
- Use markdown formatting for clarity
- Include bullet points for multiple items
- Highlight key metrics with **bold**
- Keep responses focused and actionable`;

/**
 * Build context for Q&A chat
 */
export function buildChatContext(params: {
  gameType: GameCategory;
  insights: AIInsight[];
  currentPage?: string;
  recentMessages?: { role: 'user' | 'assistant'; content: string }[];
}): string {
  const { gameType, insights, currentPage, recentMessages } = params;

  let context = `CONTEXT:
Game Type: ${gameType}
Current Page: ${currentPage || 'Unknown'}
Available Insights: ${insights.length}
`;

  // Summarize insights by category
  if (insights.length > 0) {
    const byCategory: Record<string, number> = {};
    const warnings: string[] = [];
    const opportunities: string[] = [];

    for (const insight of insights) {
      byCategory[insight.category] = (byCategory[insight.category] || 0) + 1;
      if (insight.type === 'warning') {
        warnings.push(insight.title);
      }
      if (insight.type === 'opportunity') {
        opportunities.push(insight.title);
      }
    }

    context += `\nInsight Summary:\n`;
    for (const [cat, count] of Object.entries(byCategory)) {
      context += `- ${cat}: ${count} insight(s)\n`;
    }

    if (warnings.length > 0) {
      context += `\nActive Warnings:\n`;
      for (const warning of warnings.slice(0, 3)) {
        context += `- ${warning}\n`;
      }
    }

    if (opportunities.length > 0) {
      context += `\nOpportunities:\n`;
      for (const opp of opportunities.slice(0, 3)) {
        context += `- ${opp}\n`;
      }
    }
  }

  // Add recent conversation context
  if (recentMessages && recentMessages.length > 0) {
    context += `\nRecent Conversation:\n`;
    for (const msg of recentMessages.slice(-4)) {
      context += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content.slice(0, 100)}...\n`;
    }
  }

  return context;
}

/**
 * Generate contextual suggestions based on current state
 */
export function generateSuggestions(params: {
  insights: AIInsight[];
  gameType: GameCategory;
  currentPage?: string;
}): string[] {
  const { insights, gameType, currentPage } = params;
  const suggestions: string[] = [];

  // Page-specific suggestions
  switch (currentPage) {
    case '/':
    case '/overview':
      suggestions.push('What are the key metrics I should focus on?');
      suggestions.push('Give me a summary of my game health');
      break;
    case '/analytics':
      suggestions.push('What trends do you see in my data?');
      suggestions.push('Which segments are performing best?');
      break;
    case '/monetization':
      suggestions.push('How can I improve revenue?');
      suggestions.push('Which players are most likely to convert?');
      break;
    case '/funnels':
      suggestions.push('Where are players dropping off?');
      suggestions.push('What can I do to improve conversion?');
      break;
    default:
      suggestions.push('Help me understand my data');
  }

  // Insight-based suggestions
  if (insights.length > 0) {
    const warnings = insights.filter((i) => i.type === 'warning');
    if (warnings.length > 0) {
      suggestions.push(`Tell me more about "${warnings[0].title}"`);
    }

    const opportunities = insights.filter((i) => i.type === 'opportunity');
    if (opportunities.length > 0) {
      suggestions.push(`How can I act on "${opportunities[0].title}"?`);
    }

    // Category-based suggestions
    const categories = [...new Set(insights.map((i) => i.category))];
    if (categories.includes('retention')) {
      suggestions.push('Why is retention low?');
    }
    if (categories.includes('monetization')) {
      suggestions.push('How can I increase ARPU?');
    }
  }

  // Game-type specific suggestions
  switch (gameType) {
    case 'puzzle':
      suggestions.push('Which levels need rebalancing?');
      break;
    case 'gacha_rpg':
      suggestions.push('How are my banner conversions?');
      break;
    case 'battle_royale':
      suggestions.push('What does the rank distribution look like?');
      break;
    case 'idle':
      suggestions.push('How is the prestige cycle performing?');
      break;
    case 'match3_meta':
      suggestions.push('How is the meta progression going?');
      break;
  }

  // Return unique suggestions (max 5)
  return [...new Set(suggestions)].slice(0, 5);
}

/**
 * Build a prompt for tool execution requests
 */
export function buildToolRequestPrompt(
  action: 'segment' | 'alert' | 'navigate',
  params: Record<string, unknown>
): string {
  switch (action) {
    case 'segment':
      return `Create a user segment with the following parameters:
Name: ${params.name || 'New Segment'}
Description: ${params.description || ''}
Filters: ${JSON.stringify(params.filters || [])}`;

    case 'alert':
      return `Set up an alert with the following configuration:
Metric: ${params.metric || ''}
Condition: ${params.condition || 'change'}
Threshold: ${params.threshold || 10}`;

    case 'navigate':
      return `Navigate to the ${params.page || 'requested'} page`;

    default:
      return '';
  }
}

/**
 * Parse a response for potential tool calls
 */
export function parseToolCalls(response: string): {
  action: string;
  params: Record<string, unknown>;
}[] {
  const toolCalls: { action: string; params: Record<string, unknown> }[] = [];

  // Look for navigation requests
  const navMatch = response.match(/navigate to (?:the )?(\w+)/i);
  if (navMatch) {
    toolCalls.push({
      action: 'navigate',
      params: { page: navMatch[1] },
    });
  }

  // Look for segment creation
  if (response.toLowerCase().includes('create') && response.toLowerCase().includes('segment')) {
    toolCalls.push({
      action: 'segment',
      params: {},
    });
  }

  // Look for alert creation
  if (response.toLowerCase().includes('set') && response.toLowerCase().includes('alert')) {
    toolCalls.push({
      action: 'alert',
      params: {},
    });
  }

  return toolCalls;
}
