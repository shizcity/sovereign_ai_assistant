// ─── Agent Templates Library ──────────────────────────────────────────────────
// Static template definitions for Phase 2 of Glow's Agentic Systems.
// No database needed — these are curated, versioned, and shipped with the app.

export type Framework = "n8n" | "crewai" | "openai-agents";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface AgentTemplate {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  framework: Framework;
  category: string;
  difficulty: Difficulty;
  tags: string[];
  sentinelId: number;
  sentinelSlug: string;
  sentinelName: string;
  sentinelEmoji: string;
  setupSteps: string[];
  code: string;
  starterPrompt: string;
}

// ─── n8n Templates ────────────────────────────────────────────────────────────

const emailDigestAgent: AgentTemplate = {
  id: "n8n-email-digest",
  title: "Email Digest Agent",
  description: "Monitors your Gmail every morning, summarises unread emails by priority, and sends you a clean daily briefing.",
  longDescription: "This n8n workflow connects to your Gmail account, fetches all unread emails from the past 24 hours, groups them by sender and urgency, passes them through an AI node to generate a concise summary, and delivers the briefing to your inbox (or Slack/Telegram) every morning at 8am. No code required — just import the workflow JSON and connect your accounts.",
  framework: "n8n",
  category: "Email & Communication",
  difficulty: "Beginner",
  tags: ["email", "gmail", "automation", "daily briefing", "no-code"],
  sentinelId: 1,
  sentinelSlug: "vixens-den",
  sentinelName: "Vixen's Den",
  sentinelEmoji: "🦊",
  setupSteps: [
    "Install n8n (cloud at n8n.cloud or self-hosted via Docker: docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n)",
    "Connect your Gmail account in n8n Credentials → OAuth2",
    "Import the workflow JSON below via n8n → Import from JSON",
    "Set your preferred delivery channel (email, Slack, or Telegram) in the final node",
    "Activate the workflow — it will run automatically at 8am daily",
  ],
  code: `{
  "name": "Email Digest Agent",
  "nodes": [
    {
      "parameters": {
        "rule": { "interval": [{ "field": "cronExpression", "expression": "0 8 * * *" }] }
      },
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [240, 300]
    },
    {
      "parameters": {
        "operation": "getAll",
        "filters": {
          "q": "is:unread newer_than:1d",
          "labelIds": ["INBOX"]
        },
        "returnAll": true
      },
      "name": "Get Unread Emails",
      "type": "n8n-nodes-base.gmail",
      "position": [460, 300]
    },
    {
      "parameters": {
        "jsCode": "const emails = items.map(item => ({\n  from: item.json.from,\n  subject: item.json.subject,\n  snippet: item.json.snippet,\n  date: item.json.date\n}));\nreturn [{ json: { emails, count: emails.length } }];"
      },
      "name": "Prepare Email Data",
      "type": "n8n-nodes-base.code",
      "position": [680, 300]
    },
    {
      "parameters": {
        "model": "gpt-4o-mini",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are an email assistant. Summarise the provided emails into a concise daily briefing. Group by priority: Action Required, FYI, and Low Priority. Be brief and clear."
            },
            {
              "role": "user",
              "content": "=Here are today's {{ $json.count }} unread emails:\\n\\n{{ JSON.stringify($json.emails, null, 2) }}\\n\\nPlease create a clear daily briefing."
            }
          ]
        }
      },
      "name": "AI Summarise",
      "type": "@n8n/n8n-nodes-langchain.openAi",
      "position": [900, 300]
    },
    {
      "parameters": {
        "sendTo": "={{ $vars.MY_EMAIL }}",
        "subject": "=Your Daily Email Digest — {{ $now.format('MMM D, YYYY') }}",
        "message": "={{ $json.message.content }}"
      },
      "name": "Send Briefing",
      "type": "n8n-nodes-base.gmail",
      "position": [1120, 300]
    }
  ],
  "connections": {
    "Schedule Trigger": { "main": [[{ "node": "Get Unread Emails", "type": "main", "index": 0 }]] },
    "Get Unread Emails": { "main": [[{ "node": "Prepare Email Data", "type": "main", "index": 0 }]] },
    "Prepare Email Data": { "main": [[{ "node": "AI Summarise", "type": "main", "index": 0 }]] },
    "AI Summarise": { "main": [[{ "node": "Send Briefing", "type": "main", "index": 0 }]] }
  }
}`,
  starterPrompt: "I want to build the Email Digest Agent using n8n. I've imported the template. Can you walk me through connecting my Gmail account and customising the AI summary prompt to focus on emails from my team?",
};

const socialMonitorAgent: AgentTemplate = {
  id: "n8n-social-monitor",
  title: "Social Media Monitor Agent",
  description: "Watches keywords on Reddit and sends instant Slack/email alerts when your brand, competitors, or topics are mentioned.",
  longDescription: "This n8n workflow polls Reddit every 30 minutes for posts matching your keywords, filters out noise using an AI relevance check, and sends you a formatted alert via Slack (or email) with the post title, link, sentiment, and a suggested response. Perfect for brand monitoring, competitor tracking, or staying on top of a niche topic.",
  framework: "n8n",
  category: "Social Media",
  difficulty: "Beginner",
  tags: ["reddit", "social media", "monitoring", "alerts", "brand", "no-code"],
  sentinelId: 2,
  sentinelSlug: "mischief-exe",
  sentinelName: "Mischief.EXE",
  sentinelEmoji: "🎭",
  setupSteps: [
    "Install n8n (cloud or self-hosted)",
    "Create a Reddit app at reddit.com/prefs/apps to get your Client ID and Secret",
    "Connect Reddit credentials in n8n",
    "Connect your Slack workspace (or use Gmail for email alerts)",
    "Import the workflow JSON and set your KEYWORDS variable",
    "Activate — it polls every 30 minutes automatically",
  ],
  code: `{
  "name": "Social Media Monitor Agent",
  "nodes": [
    {
      "parameters": {
        "rule": { "interval": [{ "field": "minutes", "minutesInterval": 30 }] }
      },
      "name": "Every 30 Minutes",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [240, 300]
    },
    {
      "parameters": {
        "operation": "search",
        "keyword": "={{ $vars.KEYWORDS }}",
        "subreddit": "all",
        "limit": 25,
        "sort": "new"
      },
      "name": "Search Reddit",
      "type": "n8n-nodes-base.reddit",
      "position": [460, 300]
    },
    {
      "parameters": {
        "conditions": {
          "number": [{ "value1": "={{ $json.score }}", "operation": "largerEqual", "value2": 5 }]
        }
      },
      "name": "Filter Low Quality",
      "type": "n8n-nodes-base.if",
      "position": [680, 300]
    },
    {
      "parameters": {
        "model": "gpt-4o-mini",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "Analyse this Reddit post. Return JSON with: { relevant: boolean, sentiment: 'positive'|'neutral'|'negative', summary: string, suggestedResponse: string }. Only mark relevant:true if it genuinely relates to the keywords."
            },
            {
              "role": "user",
              "content": "=Title: {{ $json.title }}\\nBody: {{ $json.selftext }}\\nKeywords: {{ $vars.KEYWORDS }}"
            }
          ],
          "responseFormat": "json_object"
        }
      },
      "name": "AI Relevance Check",
      "type": "@n8n/n8n-nodes-langchain.openAi",
      "position": [900, 260]
    },
    {
      "parameters": {
        "channel": "={{ $vars.SLACK_CHANNEL }}",
        "text": "=*New mention detected* {{ $json.sentiment === 'negative' ? '🔴' : $json.sentiment === 'positive' ? '🟢' : '🟡' }}\\n\\n*Post:* {{ $('Search Reddit').item.json.title }}\\n*Summary:* {{ $json.summary }}\\n*Link:* {{ $('Search Reddit').item.json.url }}\\n\\n*Suggested response:* {{ $json.suggestedResponse }}"
      },
      "name": "Send Slack Alert",
      "type": "n8n-nodes-base.slack",
      "position": [1120, 260]
    }
  ],
  "connections": {
    "Every 30 Minutes": { "main": [[{ "node": "Search Reddit", "type": "main", "index": 0 }]] },
    "Search Reddit": { "main": [[{ "node": "Filter Low Quality", "type": "main", "index": 0 }]] },
    "Filter Low Quality": { "main": [[{ "node": "AI Relevance Check", "type": "main", "index": 0 }]] },
    "AI Relevance Check": { "main": [[{ "node": "Send Slack Alert", "type": "main", "index": 0 }]] }
  }
}`,
  starterPrompt: "I want to build the Social Media Monitor Agent using n8n. I've imported the template. Can you help me set up the Reddit credentials and customise the keywords to monitor my brand name?",
};

const leadCaptureAgent: AgentTemplate = {
  id: "n8n-lead-capture",
  title: "Lead Capture & Enrichment Agent",
  description: "Captures form submissions, enriches contact data automatically, and adds qualified leads to your CRM.",
  longDescription: "This n8n workflow triggers when a new form submission arrives (Typeform, Tally, or webhook), enriches the contact using Clearbit or Hunter.io to find company info and LinkedIn, scores the lead based on your criteria, and automatically adds them to your CRM (HubSpot, Notion, or Airtable) with a full enriched profile. Saves hours of manual research per week.",
  framework: "n8n",
  category: "Sales & CRM",
  difficulty: "Intermediate",
  tags: ["leads", "crm", "enrichment", "sales", "forms", "no-code"],
  sentinelId: 1,
  sentinelSlug: "vixens-den",
  sentinelName: "Vixen's Den",
  sentinelEmoji: "🦊",
  setupSteps: [
    "Set up your form tool (Typeform, Tally, or any webhook-compatible form)",
    "Install n8n and import this workflow JSON",
    "Connect your form webhook URL to the Webhook Trigger node",
    "Add your Hunter.io API key for email enrichment (free tier available)",
    "Connect your CRM (HubSpot, Notion, or Airtable) in n8n credentials",
    "Customise the lead scoring logic in the Code node to match your ICP",
    "Activate the workflow",
  ],
  code: `{
  "name": "Lead Capture & Enrichment Agent",
  "nodes": [
    {
      "parameters": { "httpMethod": "POST", "path": "lead-capture", "responseMode": "onReceived" },
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "=https://api.hunter.io/v2/email-finder?domain={{ $json.company_domain }}&first_name={{ $json.first_name }}&last_name={{ $json.last_name }}&api_key={{ $vars.HUNTER_API_KEY }}",
        "method": "GET"
      },
      "name": "Enrich Email",
      "type": "n8n-nodes-base.httpRequest",
      "position": [460, 300]
    },
    {
      "parameters": {
        "jsCode": "const lead = $('Webhook Trigger').item.json;\nconst enriched = $input.item.json.data;\n\n// Lead scoring: adjust weights to match your ICP\nlet score = 0;\nif (lead.company_size > 50) score += 30;\nif (lead.role?.toLowerCase().includes('founder') || lead.role?.toLowerCase().includes('ceo')) score += 25;\nif (lead.budget === 'yes') score += 25;\nif (enriched?.confidence > 80) score += 20;\n\nreturn [{ json: {\n  ...lead,\n  enrichedEmail: enriched?.email,\n  emailConfidence: enriched?.confidence,\n  leadScore: score,\n  qualified: score >= 50,\n  enrichedAt: new Date().toISOString()\n}}];"
      },
      "name": "Score Lead",
      "type": "n8n-nodes-base.code",
      "position": [680, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [{ "value1": "={{ $json.qualified }}", "operation": "true" }]
        }
      },
      "name": "Qualified?",
      "type": "n8n-nodes-base.if",
      "position": [900, 300]
    },
    {
      "parameters": {
        "resource": "contact",
        "operation": "create",
        "additionalFields": {
          "firstName": "={{ $json.first_name }}",
          "lastName": "={{ $json.last_name }}",
          "email": "={{ $json.enrichedEmail || $json.email }}",
          "company": "={{ $json.company }}",
          "properties": { "lead_score": "={{ $json.leadScore }}" }
        }
      },
      "name": "Add to HubSpot",
      "type": "n8n-nodes-base.hubspot",
      "position": [1120, 260]
    }
  ],
  "connections": {
    "Webhook Trigger": { "main": [[{ "node": "Enrich Email", "type": "main", "index": 0 }]] },
    "Enrich Email": { "main": [[{ "node": "Score Lead", "type": "main", "index": 0 }]] },
    "Score Lead": { "main": [[{ "node": "Qualified?", "type": "main", "index": 0 }]] },
    "Qualified?": { "main": [[{ "node": "Add to HubSpot", "type": "main", "index": 0 }]] }
  }
}`,
  starterPrompt: "I want to build the Lead Capture & Enrichment Agent using n8n. I've imported the template. Can you help me connect my Typeform and customise the lead scoring to focus on SaaS companies with 10-200 employees?",
};

// ─── CrewAI Templates ─────────────────────────────────────────────────────────

const researchCrew: AgentTemplate = {
  id: "crewai-research-crew",
  title: "Research Crew",
  description: "A 3-agent crew — Researcher, Analyst, and Writer — that produces a comprehensive report on any topic in minutes.",
  longDescription: "This CrewAI crew assigns three specialised agents to work sequentially: the Researcher gathers information from the web, the Analyst identifies key insights and patterns, and the Writer produces a clean, structured report. Give it any topic and it returns a professional briefing you can use immediately. Ideal for market research, competitor analysis, or learning a new subject fast.",
  framework: "crewai",
  category: "Research & Analysis",
  difficulty: "Intermediate",
  tags: ["research", "analysis", "report", "crewai", "python", "multi-agent"],
  sentinelId: 3,
  sentinelSlug: "lunaris-vault",
  sentinelName: "Lunaris.Vault",
  sentinelEmoji: "🌙",
  setupSteps: [
    "Install Python 3.10+ and pip",
    "Run: pip install crewai crewai-tools",
    "Set your OpenAI API key: export OPENAI_API_KEY='your-key-here'",
    "Save the code below as research_crew.py",
    "Run: python research_crew.py",
    "Enter your research topic when prompted",
  ],
  code: `# research_crew.py
# CrewAI Research Crew — Researcher + Analyst + Writer
# pip install crewai crewai-tools

from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool
import os

# Set your API keys
# os.environ["OPENAI_API_KEY"] = "your-openai-key"
# os.environ["SERPER_API_KEY"] = "your-serper-key"  # free at serper.dev

search_tool = SerperDevTool()

# ── Define the Agents ──────────────────────────────────────────────────────────

researcher = Agent(
    role="Senior Research Specialist",
    goal="Find comprehensive, accurate information about {topic} from reliable sources",
    backstory="""You are an expert researcher with 15 years of experience. 
    You know how to find the most relevant and credible information quickly.
    You always verify facts from multiple sources before reporting.""",
    tools=[search_tool],
    verbose=True,
    allow_delegation=False,
)

analyst = Agent(
    role="Strategic Analyst",
    goal="Analyse the research findings and identify the most important insights, trends, and implications",
    backstory="""You are a sharp strategic analyst who excels at finding patterns 
    in information and drawing meaningful conclusions. You cut through noise 
    and focus on what actually matters.""",
    verbose=True,
    allow_delegation=False,
)

writer = Agent(
    role="Professional Report Writer",
    goal="Transform the analysis into a clear, well-structured, actionable report",
    backstory="""You are an expert writer who creates reports that are both 
    comprehensive and easy to read. You use clear headings, bullet points where 
    appropriate, and always end with concrete recommendations.""",
    verbose=True,
    allow_delegation=False,
)

# ── Define the Tasks ───────────────────────────────────────────────────────────

research_task = Task(
    description="""Research the following topic thoroughly: {topic}
    
    Gather information on:
    1. Current state and key facts
    2. Main players or stakeholders involved
    3. Recent developments (last 6 months)
    4. Challenges and opportunities
    5. Expert opinions and data points
    
    Use the search tool to find current, reliable information.""",
    expected_output="A comprehensive collection of research findings with sources, covering all 5 areas above.",
    agent=researcher,
)

analysis_task = Task(
    description="""Analyse the research findings provided and identify:
    
    1. The 3-5 most important insights
    2. Key trends and patterns
    3. Risks and opportunities
    4. What this means for someone interested in {topic}
    
    Be specific and data-driven in your analysis.""",
    expected_output="A structured analysis with clear insights, trends, and implications.",
    agent=analyst,
    context=[research_task],
)

writing_task = Task(
    description="""Write a professional report on {topic} based on the research and analysis.
    
    Structure:
    - Executive Summary (2-3 sentences)
    - Key Findings (bullet points)
    - Detailed Analysis (3-4 paragraphs)
    - Opportunities & Risks
    - Recommendations (3-5 actionable items)
    - Sources
    
    Make it clear, concise, and immediately useful.""",
    expected_output="A complete, well-formatted research report ready to share.",
    agent=writer,
    context=[research_task, analysis_task],
)

# ── Assemble and Run the Crew ──────────────────────────────────────────────────

crew = Crew(
    agents=[researcher, analyst, writer],
    tasks=[research_task, analysis_task, writing_task],
    process=Process.sequential,
    verbose=True,
)

if __name__ == "__main__":
    topic = input("Enter your research topic: ")
    result = crew.kickoff(inputs={"topic": topic})
    print("\\n" + "="*60)
    print("FINAL REPORT")
    print("="*60)
    print(result)
    
    # Save to file
    with open(f"report_{topic[:30].replace(' ', '_')}.md", "w") as f:
        f.write(str(result))
    print(f"\\nReport saved to file.")`,
  starterPrompt: "I want to build the Research Crew using CrewAI. I've saved the template code. Can you walk me through setting up my API keys and explain how I can customise the agents to focus on market research for a SaaS product?",
};

const supportCrew: AgentTemplate = {
  id: "crewai-support-crew",
  title: "Customer Support Crew",
  description: "A 3-agent crew — Triage, FAQ Responder, and Escalation Manager — that handles support tickets automatically.",
  longDescription: "This CrewAI crew processes incoming support tickets through three specialised agents: Triage classifies the issue and urgency, FAQ Responder checks a knowledge base and drafts an answer for common questions, and Escalation Manager flags complex issues with a suggested resolution path. Feed it a ticket and it returns a complete response draft plus an escalation decision.",
  framework: "crewai",
  category: "Customer Support",
  difficulty: "Intermediate",
  tags: ["support", "customer service", "tickets", "crewai", "python", "automation"],
  sentinelId: 3,
  sentinelSlug: "lunaris-vault",
  sentinelName: "Lunaris.Vault",
  sentinelEmoji: "🌙",
  setupSteps: [
    "Install Python 3.10+ and run: pip install crewai",
    "Set your OpenAI API key: export OPENAI_API_KEY='your-key'",
    "Edit the KNOWLEDGE_BASE dict in the code to add your product's FAQs",
    "Save as support_crew.py and run: python support_crew.py",
    "Paste a support ticket when prompted",
    "Integrate with your ticketing system (Zendesk, Linear, etc.) via their API",
  ],
  code: `# support_crew.py
# CrewAI Customer Support Crew
# pip install crewai

from crewai import Agent, Task, Crew, Process

# ── Your Knowledge Base ────────────────────────────────────────────────────────
# Add your product's common questions and answers here
KNOWLEDGE_BASE = {
    "reset password": "Go to Settings → Security → Reset Password. Check your email for the reset link.",
    "billing": "Billing is managed at Settings → Billing. Invoices are sent on the 1st of each month.",
    "cancel subscription": "You can cancel at any time at Settings → Billing → Cancel Plan. Access continues until the end of the billing period.",
    "refund": "Refunds are available within 14 days of purchase. Contact billing@yourcompany.com.",
    "api key": "API keys are at Settings → Developer → API Keys. Keep them secret and rotate every 90 days.",
    "data export": "Export your data at Settings → Account → Export Data. You'll receive a download link within 24 hours.",
}

# ── Define the Agents ──────────────────────────────────────────────────────────

triage_agent = Agent(
    role="Support Triage Specialist",
    goal="Classify incoming support tickets by category and urgency",
    backstory="""You are an experienced support triage specialist. You quickly 
    identify what type of issue a customer has (billing, technical, account, feature request) 
    and how urgent it is (critical, high, medium, low).""",
    verbose=True,
    allow_delegation=False,
)

faq_agent = Agent(
    role="FAQ Response Specialist",
    goal="Check the knowledge base and draft a helpful, friendly response for common questions",
    backstory="""You are a friendly and knowledgeable support agent. You have 
    deep knowledge of the product and always give clear, step-by-step answers. 
    You are empathetic and solution-focused.""",
    verbose=True,
    allow_delegation=False,
)

escalation_agent = Agent(
    role="Escalation Manager",
    goal="Decide if a ticket needs human escalation and prepare a complete handoff summary",
    backstory="""You are a senior support manager who knows when an issue is 
    too complex for automated handling. You prepare thorough escalation summaries 
    so human agents can resolve issues quickly.""",
    verbose=True,
    allow_delegation=False,
)

# ── Define the Tasks ───────────────────────────────────────────────────────────

triage_task = Task(
    description="""Analyse this support ticket and classify it:
    
    TICKET: {ticket}
    
    Provide:
    1. Category (billing/technical/account/feature_request/other)
    2. Urgency (critical/high/medium/low)
    3. Key issue in one sentence
    4. Relevant keywords from the ticket""",
    expected_output="A structured triage report with category, urgency, key issue, and keywords.",
    agent=triage_agent,
)

faq_task = Task(
    description="""Based on the triage, check the knowledge base and draft a response.
    
    KNOWLEDGE BASE:
    {knowledge_base}
    
    Draft a helpful response to the ticket. If the answer is in the knowledge base, 
    use it. If not, acknowledge the issue and explain what will happen next.
    Always be warm, clear, and solution-focused.""",
    expected_output="A complete, friendly response draft ready to send to the customer.",
    agent=faq_agent,
    context=[triage_task],
)

escalation_task = Task(
    description="""Review the ticket, triage, and draft response. Decide:
    
    1. Can this be resolved with the draft response? (yes/no)
    2. If no, who should handle it? (billing_team/engineering/account_manager/senior_support)
    3. What is the priority? (P1/P2/P3)
    4. Write a 2-sentence handoff summary for the human agent
    
    Output a final JSON decision.""",
    expected_output="JSON with: { autoResolve: boolean, escalateTo: string|null, priority: string, handoffSummary: string, responseDraft: string }",
    agent=escalation_agent,
    context=[triage_task, faq_task],
)

# ── Assemble and Run the Crew ──────────────────────────────────────────────────

crew = Crew(
    agents=[triage_agent, faq_agent, escalation_agent],
    tasks=[triage_task, faq_task, escalation_task],
    process=Process.sequential,
    verbose=True,
)

if __name__ == "__main__":
    print("Customer Support Crew — paste your support ticket below:")
    ticket = input("> ")
    
    result = crew.kickoff(inputs={
        "ticket": ticket,
        "knowledge_base": str(KNOWLEDGE_BASE)
    })
    
    print("\\n" + "="*60)
    print("SUPPORT CREW DECISION")
    print("="*60)
    print(result)`,
  starterPrompt: "I want to build the Customer Support Crew using CrewAI. I've saved the template. Can you help me customise the knowledge base for my SaaS product and explain how to connect this to Zendesk to process real tickets automatically?",
};

const dailyBriefingCrew: AgentTemplate = {
  id: "crewai-daily-briefing",
  title: "Daily Briefing Crew",
  description: "A 3-agent crew — News Scout, Weather Analyst, and Briefing Writer — that delivers your personalised morning briefing.",
  longDescription: "This CrewAI crew runs every morning to produce your personalised daily briefing. The News Scout finds top stories in your chosen topics, the Weather Analyst fetches your local forecast and translates it into practical advice, and the Briefing Writer combines everything into a clean, motivating morning summary. Schedule it with cron or n8n to land in your inbox before you wake up.",
  framework: "crewai",
  category: "Personal Productivity",
  difficulty: "Beginner",
  tags: ["morning briefing", "news", "weather", "productivity", "crewai", "python"],
  sentinelId: 4,
  sentinelSlug: "aetheris-flow",
  sentinelName: "Aetheris.Flow",
  sentinelEmoji: "🌊",
  setupSteps: [
    "Install Python 3.10+ and run: pip install crewai crewai-tools requests",
    "Get a free Serper API key at serper.dev for news search",
    "Get a free OpenWeatherMap API key at openweathermap.org",
    "Set environment variables: OPENAI_API_KEY, SERPER_API_KEY, WEATHER_API_KEY",
    "Edit MY_CITY and MY_TOPICS in the code to personalise",
    "Run: python daily_briefing.py",
    "Schedule with cron: 0 7 * * * python /path/to/daily_briefing.py",
  ],
  code: `# daily_briefing.py
# CrewAI Daily Briefing Crew
# pip install crewai crewai-tools requests

from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool
import requests
import os
from datetime import datetime

# ── Configuration — edit these ─────────────────────────────────────────────────
MY_CITY = "New York"
MY_TOPICS = ["AI and technology", "business and startups", "health and wellness"]
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "your-openweathermap-key")

# ── Tools ──────────────────────────────────────────────────────────────────────
search_tool = SerperDevTool()

def get_weather(city: str) -> dict:
    """Fetch current weather and forecast from OpenWeatherMap."""
    url = f"https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={WEATHER_API_KEY}&units=imperial&cnt=8"
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        forecasts = [
            f"{item['dt_txt']}: {item['main']['temp']}°F, {item['weather'][0]['description']}"
            for item in data.get('list', [])[:4]
        ]
        return {"city": city, "forecasts": forecasts, "status": "success"}
    except Exception as e:
        return {"city": city, "error": str(e), "status": "error"}

# ── Define the Agents ──────────────────────────────────────────────────────────

news_scout = Agent(
    role="News Scout",
    goal=f"Find the top 3 most important and interesting news stories in: {', '.join(MY_TOPICS)}",
    backstory="""You are a sharp news curator who knows how to find stories that are 
    genuinely important and interesting — not clickbait. You focus on stories with 
    real implications and practical relevance.""",
    tools=[search_tool],
    verbose=True,
    allow_delegation=False,
)

weather_analyst = Agent(
    role="Weather & Lifestyle Analyst",
    goal=f"Analyse the weather for {MY_CITY} and give practical daily advice",
    backstory="""You translate weather data into practical life advice. You tell people 
    what to wear, whether to bring an umbrella, and how the weather might affect their day — 
    in a friendly, conversational way.""",
    verbose=True,
    allow_delegation=False,
)

briefing_writer = Agent(
    role="Morning Briefing Writer",
    goal="Combine the news and weather into an energising, concise morning briefing",
    backstory="""You write the perfect morning briefing — informative but not overwhelming, 
    positive but honest, and always ending with one motivating thought for the day. 
    Your briefings make people feel prepared and ready to take on the day.""",
    verbose=True,
    allow_delegation=False,
)

# ── Define the Tasks ───────────────────────────────────────────────────────────

news_task = Task(
    description=f"""Find the top 3 news stories from today ({datetime.now().strftime('%B %d, %Y')}) 
    in these topics: {', '.join(MY_TOPICS)}.
    
    For each story provide: headline, 2-sentence summary, why it matters, and source URL.""",
    expected_output="3 news stories with headline, summary, significance, and source.",
    agent=news_scout,
)

weather_task = Task(
    description=f"""Analyse the weather data for {MY_CITY} and provide:
    1. Today's weather summary (temperature range, conditions)
    2. Practical advice (what to wear, umbrella needed?)
    3. Best time to be outdoors
    4. Any weather-related warnings
    
    Weather data: {get_weather(MY_CITY)}""",
    expected_output="A friendly weather summary with practical daily advice.",
    agent=weather_analyst,
)

briefing_task = Task(
    description=f"""Write today's morning briefing for {datetime.now().strftime('%A, %B %d, %Y')}.
    
    Structure:
    🌅 Good morning! (one warm opening sentence)
    
    ☀️ WEATHER
    (weather summary and advice)
    
    📰 TODAY'S TOP STORIES
    (3 news stories, each with headline and 2-sentence summary)
    
    💡 THOUGHT FOR THE DAY
    (one motivating insight or quote)
    
    Keep the total under 400 words. Make it feel like a message from a trusted friend.""",
    expected_output="A complete, warm, concise morning briefing under 400 words.",
    agent=briefing_writer,
    context=[news_task, weather_task],
)

# ── Assemble and Run the Crew ──────────────────────────────────────────────────

crew = Crew(
    agents=[news_scout, weather_analyst, briefing_writer],
    tasks=[news_task, weather_task, briefing_task],
    process=Process.sequential,
    verbose=True,
)

if __name__ == "__main__":
    print(f"Generating your morning briefing for {datetime.now().strftime('%A, %B %d')}...\\n")
    result = crew.kickoff()
    print("\\n" + "="*60)
    print("YOUR MORNING BRIEFING")
    print("="*60)
    print(result)`,
  starterPrompt: "I want to build the Daily Briefing Crew using CrewAI. I've saved the template. Can you help me set up the API keys and show me how to schedule it to run automatically every morning at 7am?",
};

// ─── OpenAI Agents SDK Templates ─────────────────────────────────────────────

const webSearchAgent: AgentTemplate = {
  id: "openai-web-search",
  title: "Web Search Agent",
  description: "A tool-calling agent that searches the web, synthesises results, and returns structured summaries with sources.",
  longDescription: "This OpenAI Agents SDK agent uses the built-in web search tool to find current information on any query, synthesises multiple sources into a coherent answer, and returns a structured response with citations. It handles follow-up questions, can drill deeper into specific aspects, and knows when to stop searching. A solid foundation for any research or information-gathering use case.",
  framework: "openai-agents",
  category: "Research & Analysis",
  difficulty: "Intermediate",
  tags: ["web search", "research", "tool-calling", "openai", "python", "agents-sdk"],
  sentinelId: 5,
  sentinelSlug: "rift-exe",
  sentinelName: "Rift.EXE",
  sentinelEmoji: "⚡",
  setupSteps: [
    "Install Python 3.10+ and run: pip install openai-agents",
    "Set your OpenAI API key: export OPENAI_API_KEY='your-key'",
    "Save the code as web_search_agent.py",
    "Run: python web_search_agent.py",
    "Type your search query when prompted",
    "The agent will search, synthesise, and return a structured answer with sources",
  ],
  code: `# web_search_agent.py
# OpenAI Agents SDK — Web Search Agent with structured output
# pip install openai-agents

import asyncio
from agents import Agent, Runner, WebSearchTool
from pydantic import BaseModel
from typing import List

# ── Structured Output Schema ───────────────────────────────────────────────────

class SearchResult(BaseModel):
    summary: str
    key_points: List[str]
    sources: List[str]
    confidence: str  # "high" | "medium" | "low"
    follow_up_questions: List[str]

# ── Define the Agent ───────────────────────────────────────────────────────────

search_agent = Agent(
    name="Web Search Specialist",
    instructions="""You are an expert research agent with access to web search.

    When given a query:
    1. Search for current, reliable information from multiple sources
    2. Synthesise the findings into a clear, accurate summary
    3. Extract 3-5 key points that directly answer the query
    4. List your sources (URLs or publication names)
    5. Rate your confidence based on source quality and consistency
    6. Suggest 2-3 follow-up questions the user might want to explore
    
    Always prioritise accuracy over speed. If sources conflict, acknowledge it.
    Return your response as structured JSON matching the schema.""",
    tools=[WebSearchTool()],
    output_type=SearchResult,
)

# ── Runner ─────────────────────────────────────────────────────────────────────

async def search(query: str) -> SearchResult:
    """Run the search agent on a query and return structured results."""
    result = await Runner.run(search_agent, query)
    return result.final_output

async def interactive_session():
    """Run an interactive search session with follow-up support."""
    print("Web Search Agent — powered by OpenAI Agents SDK")
    print("Type 'quit' to exit\\n")
    
    conversation_context = []
    
    while True:
        query = input("Search: ").strip()
        if query.lower() in ("quit", "exit", "q"):
            break
        if not query:
            continue
        
        # Add context from previous searches for follow-up questions
        full_query = query
        if conversation_context:
            full_query = f"Previous context: {conversation_context[-1]}\\n\\nNew query: {query}"
        
        print("\\nSearching...\\n")
        
        try:
            result = await search(full_query)
            
            print("=" * 60)
            print("SUMMARY")
            print("=" * 60)
            print(result.summary)
            
            print("\\nKEY POINTS")
            print("-" * 40)
            for i, point in enumerate(result.key_points, 1):
                print(f"{i}. {point}")
            
            print("\\nSOURCES")
            print("-" * 40)
            for source in result.sources:
                print(f"• {source}")
            
            print(f"\\nConfidence: {result.confidence.upper()}")
            
            print("\\nYOU MIGHT ALSO WANT TO KNOW:")
            for q in result.follow_up_questions:
                print(f"  → {q}")
            
            print()
            conversation_context.append(result.summary[:200])
            
        except Exception as e:
            print(f"Search error: {e}\\n")

if __name__ == "__main__":
    asyncio.run(interactive_session())`,
  starterPrompt: "I want to build the Web Search Agent using the OpenAI Agents SDK. I've saved the template. Can you walk me through how the tool-calling works and show me how to extend it to also search academic papers using a custom tool?",
};

const dataAnalystAgent: AgentTemplate = {
  id: "openai-data-analyst",
  title: "Data Analyst Agent",
  description: "Reads a CSV file, analyses trends and anomalies, and writes a structured report with actionable insights.",
  longDescription: "This OpenAI Agents SDK agent accepts a CSV file path, uses a Python code execution tool to load and analyse the data, identifies trends, outliers, and patterns, and produces a structured analytical report with specific recommendations. It can handle sales data, user metrics, financial data, or any tabular dataset. The agent writes and executes its own analysis code, so it adapts to whatever data you give it.",
  framework: "openai-agents",
  category: "Data & Analytics",
  difficulty: "Advanced",
  tags: ["data analysis", "csv", "pandas", "insights", "openai", "python", "code-execution"],
  sentinelId: 5,
  sentinelSlug: "rift-exe",
  sentinelName: "Rift.EXE",
  sentinelEmoji: "⚡",
  setupSteps: [
    "Install dependencies: pip install openai-agents pandas numpy matplotlib",
    "Set your OpenAI API key: export OPENAI_API_KEY='your-key'",
    "Save the code as data_analyst_agent.py",
    "Prepare your CSV file (the agent will ask for the path)",
    "Run: python data_analyst_agent.py",
    "Provide the CSV path and describe what you want to analyse",
  ],
  code: `# data_analyst_agent.py
# OpenAI Agents SDK — Data Analyst Agent with code execution
# pip install openai-agents pandas numpy

import asyncio
import pandas as pd
import json
from agents import Agent, Runner, function_tool
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# ── Tools ──────────────────────────────────────────────────────────────────────

@function_tool
def load_and_profile_csv(file_path: str) -> str:
    """Load a CSV file and return a statistical profile of the data."""
    try:
        df = pd.read_csv(file_path)
        profile = {
            "shape": {"rows": len(df), "columns": len(df.columns)},
            "columns": list(df.columns),
            "dtypes": df.dtypes.astype(str).to_dict(),
            "missing_values": df.isnull().sum().to_dict(),
            "numeric_summary": df.describe().to_dict() if len(df.select_dtypes(include='number').columns) > 0 else {},
            "sample_rows": df.head(3).to_dict(orient='records'),
        }
        return json.dumps(profile, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})

@function_tool
def analyse_column(file_path: str, column_name: str) -> str:
    """Perform deep analysis on a specific column."""
    try:
        df = pd.read_csv(file_path)
        if column_name not in df.columns:
            return json.dumps({"error": f"Column '{column_name}' not found"})
        
        col = df[column_name]
        analysis = {"column": column_name, "dtype": str(col.dtype)}
        
        if pd.api.types.is_numeric_dtype(col):
            analysis.update({
                "mean": float(col.mean()),
                "median": float(col.median()),
                "std": float(col.std()),
                "min": float(col.min()),
                "max": float(col.max()),
                "outliers_count": int(((col - col.mean()).abs() > 2 * col.std()).sum()),
                "trend": "increasing" if col.corr(pd.Series(range(len(col)))) > 0.3 else
                         "decreasing" if col.corr(pd.Series(range(len(col)))) < -0.3 else "stable",
            })
        else:
            analysis.update({
                "unique_values": int(col.nunique()),
                "top_values": col.value_counts().head(5).to_dict(),
                "null_count": int(col.isnull().sum()),
            })
        
        return json.dumps(analysis, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})

@function_tool
def find_correlations(file_path: str) -> str:
    """Find correlations between numeric columns."""
    try:
        df = pd.read_csv(file_path)
        numeric_df = df.select_dtypes(include='number')
        if len(numeric_df.columns) < 2:
            return json.dumps({"message": "Not enough numeric columns for correlation analysis"})
        
        corr_matrix = numeric_df.corr()
        strong_correlations = []
        
        for i in range(len(corr_matrix.columns)):
            for j in range(i + 1, len(corr_matrix.columns)):
                corr_val = corr_matrix.iloc[i, j]
                if abs(corr_val) > 0.5:
                    strong_correlations.append({
                        "col1": corr_matrix.columns[i],
                        "col2": corr_matrix.columns[j],
                        "correlation": round(float(corr_val), 3),
                        "strength": "strong" if abs(corr_val) > 0.7 else "moderate",
                        "direction": "positive" if corr_val > 0 else "negative",
                    })
        
        return json.dumps({"correlations": strong_correlations})
    except Exception as e:
        return json.dumps({"error": str(e)})

# ── Structured Output ──────────────────────────────────────────────────────────

class DataReport(BaseModel):
    executive_summary: str
    dataset_overview: str
    key_findings: List[str]
    anomalies_and_risks: List[str]
    recommendations: List[str]
    next_steps: List[str]

# ── Define the Agent ───────────────────────────────────────────────────────────

analyst_agent = Agent(
    name="Senior Data Analyst",
    instructions="""You are an expert data analyst. When given a CSV file path:

    1. Load and profile the dataset to understand its structure
    2. Analyse each important column in depth
    3. Find correlations between numeric columns
    4. Identify trends, anomalies, and patterns
    5. Produce a structured analytical report with specific, actionable recommendations
    
    Be thorough but concise. Focus on insights that matter for business decisions.
    Always explain what the data means in plain language, not just statistics.""",
    tools=[load_and_profile_csv, analyse_column, find_correlations],
    output_type=DataReport,
)

# ── Runner ─────────────────────────────────────────────────────────────────────

async def analyse_file(file_path: str, focus: str = "") -> DataReport:
    query = f"Analyse the CSV file at: {file_path}"
    if focus:
        query += f"\\n\\nFocus particularly on: {focus}"
    
    result = await Runner.run(analyst_agent, query)
    return result.final_output

if __name__ == "__main__":
    async def main():
        file_path = input("Enter the path to your CSV file: ").strip()
        focus = input("What do you want to focus on? (press Enter to skip): ").strip()
        
        print("\\nAnalysing your data...\\n")
        report = await analyse_file(file_path, focus)
        
        print("=" * 60)
        print("DATA ANALYSIS REPORT")
        print("=" * 60)
        print(f"\\nEXECUTIVE SUMMARY\\n{report.executive_summary}")
        print(f"\\nDATASET OVERVIEW\\n{report.dataset_overview}")
        print("\\nKEY FINDINGS")
        for f in report.key_findings:
            print(f"  • {f}")
        print("\\nANOMALIES & RISKS")
        for a in report.anomalies_and_risks:
            print(f"  ⚠ {a}")
        print("\\nRECOMMENDATIONS")
        for r in report.recommendations:
            print(f"  → {r}")
        print("\\nNEXT STEPS")
        for n in report.next_steps:
            print(f"  ✓ {n}")
    
    asyncio.run(main())`,
  starterPrompt: "I want to build the Data Analyst Agent using the OpenAI Agents SDK. I've saved the template. Can you walk me through how the function tools work and show me how to add a visualisation tool that generates matplotlib charts?",
};

const multiAgentHandoff: AgentTemplate = {
  id: "openai-multi-agent-handoff",
  title: "Multi-Agent Handoff System",
  description: "An orchestrator agent that routes tasks to specialist sub-agents — Writer, Researcher, and Coder — based on what the task requires.",
  longDescription: "This OpenAI Agents SDK template demonstrates the handoff pattern — the most powerful architecture for production agents. An Orchestrator agent receives any task, analyses what type of work it requires, and hands off to the right specialist: Writer for content, Researcher for information gathering, or Coder for code generation. Each specialist completes their part and returns control. This pattern scales to any number of specialists and is the foundation of enterprise-grade agent systems.",
  framework: "openai-agents",
  category: "Agent Architecture",
  difficulty: "Advanced",
  tags: ["multi-agent", "handoff", "orchestration", "architecture", "openai", "python", "production"],
  sentinelId: 6,
  sentinelSlug: "nyx",
  sentinelName: "Nyx",
  sentinelEmoji: "🌑",
  setupSteps: [
    "Install: pip install openai-agents",
    "Set your OpenAI API key: export OPENAI_API_KEY='your-key'",
    "Save the code as multi_agent_handoff.py",
    "Run: python multi_agent_handoff.py",
    "Give the orchestrator any task — it will route to the right specialist automatically",
    "Study the handoff pattern to extend with your own specialist agents",
  ],
  code: `# multi_agent_handoff.py
# OpenAI Agents SDK — Multi-Agent Handoff System
# pip install openai-agents

import asyncio
from agents import Agent, Runner, handoff, RunContextWrapper
from pydantic import BaseModel
from typing import Optional

# ── Specialist Agents ──────────────────────────────────────────────────────────

writer_agent = Agent(
    name="Writer",
    instructions="""You are an expert content writer. You create clear, engaging, 
    well-structured written content. When given a writing task:
    - Understand the audience and purpose
    - Create compelling, accurate content
    - Use appropriate tone and style
    - Structure content logically with clear sections
    After completing the writing task, hand back to the Orchestrator.""",
    handoffs=[],  # Will be set after orchestrator is defined
)

researcher_agent = Agent(
    name="Researcher",
    instructions="""You are a thorough research specialist. When given a research task:
    - Identify what information is needed
    - Gather comprehensive, accurate information
    - Verify facts and note any uncertainties
    - Organise findings clearly with sources
    - Distinguish between established facts and emerging information
    After completing research, hand back to the Orchestrator with your findings.""",
    handoffs=[],
)

coder_agent = Agent(
    name="Coder",
    instructions="""You are an expert software engineer. When given a coding task:
    - Understand the requirements completely before writing code
    - Write clean, well-commented, production-ready code
    - Include error handling and edge cases
    - Explain what the code does and how to use it
    - Suggest improvements or alternatives when relevant
    After completing the coding task, hand back to the Orchestrator.""",
    handoffs=[],
)

# ── Orchestrator Agent ─────────────────────────────────────────────────────────

orchestrator_agent = Agent(
    name="Orchestrator",
    instructions="""You are a master orchestrator. Your job is to:
    
    1. Analyse any incoming task to understand what type of work it requires
    2. Route to the appropriate specialist:
       - WRITER: for content creation, copywriting, editing, documentation, emails, reports
       - RESEARCHER: for fact-finding, analysis, summarisation, information gathering
       - CODER: for writing code, debugging, explaining code, building scripts or tools
    3. For complex tasks that need multiple specialists, break them down and route sequentially
    4. Combine the specialists' outputs into a final, cohesive response
    
    Always explain your routing decision briefly before handing off.
    If a task is simple and doesn't need a specialist, handle it yourself.""",
    handoffs=[
        handoff(writer_agent, tool_name_override="route_to_writer",
                tool_description_override="Route a writing or content creation task to the Writer specialist"),
        handoff(researcher_agent, tool_name_override="route_to_researcher",
                tool_description_override="Route a research or information-gathering task to the Researcher specialist"),
        handoff(coder_agent, tool_name_override="route_to_coder",
                tool_description_override="Route a coding, debugging, or technical task to the Coder specialist"),
    ],
)

# Give specialists the ability to hand back to orchestrator
writer_agent.handoffs = [handoff(orchestrator_agent, tool_name_override="return_to_orchestrator",
                                  tool_description_override="Return completed work to the Orchestrator")]
researcher_agent.handoffs = [handoff(orchestrator_agent, tool_name_override="return_to_orchestrator",
                                      tool_description_override="Return completed research to the Orchestrator")]
coder_agent.handoffs = [handoff(orchestrator_agent, tool_name_override="return_to_orchestrator",
                                 tool_description_override="Return completed code to the Orchestrator")]

# ── Runner ─────────────────────────────────────────────────────────────────────

async def run_task(task: str) -> str:
    """Run any task through the multi-agent system."""
    result = await Runner.run(
        orchestrator_agent,
        task,
        max_turns=20,  # Prevent infinite loops
    )
    return result.final_output

async def interactive_session():
    """Interactive session with the multi-agent system."""
    print("Multi-Agent Handoff System")
    print("The Orchestrator will route your task to the right specialist.")
    print("Type 'quit' to exit.\\n")
    
    while True:
        task = input("Task: ").strip()
        if task.lower() in ("quit", "exit", "q"):
            break
        if not task:
            continue
        
        print("\\nProcessing...\\n")
        try:
            result = await run_task(task)
            print("=" * 60)
            print("RESULT")
            print("=" * 60)
            print(result)
            print()
        except Exception as e:
            print(f"Error: {e}\\n")

# ── Example Usage ──────────────────────────────────────────────────────────────

EXAMPLE_TASKS = [
    "Write a LinkedIn post about the benefits of remote work",
    "Research the current state of quantum computing and its practical applications",
    "Write a Python function that validates email addresses using regex",
    "Research AI agent frameworks and then write a comparison blog post",  # Multi-specialist task
]

if __name__ == "__main__":
    print("Example tasks you can try:")
    for i, task in enumerate(EXAMPLE_TASKS, 1):
        print(f"  {i}. {task}")
    print()
    asyncio.run(interactive_session())`,
  starterPrompt: "I want to build the Multi-Agent Handoff System using the OpenAI Agents SDK. I've saved the template. Can you explain how the handoff pattern works under the hood and show me how to add a fourth specialist — a Data Analyst agent — to the system?",
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const AGENT_TEMPLATES: AgentTemplate[] = [
  // n8n
  emailDigestAgent,
  socialMonitorAgent,
  leadCaptureAgent,
  // CrewAI
  researchCrew,
  supportCrew,
  dailyBriefingCrew,
  // OpenAI Agents SDK
  webSearchAgent,
  dataAnalystAgent,
  multiAgentHandoff,
];

export const FRAMEWORK_LABELS: Record<Framework, string> = {
  "n8n": "n8n",
  "crewai": "CrewAI",
  "openai-agents": "OpenAI Agents SDK",
};

export const FRAMEWORK_COLORS: Record<Framework, string> = {
  "n8n": "from-orange-500 to-amber-500",
  "crewai": "from-purple-500 to-violet-500",
  "openai-agents": "from-cyan-500 to-blue-500",
};

export const FRAMEWORK_BG: Record<Framework, string> = {
  "n8n": "bg-orange-500/10 text-orange-300 border-orange-500/20",
  "crewai": "bg-purple-500/10 text-purple-300 border-purple-500/20",
  "openai-agents": "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  "Beginner": "bg-green-500/10 text-green-300 border-green-500/20",
  "Intermediate": "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
  "Advanced": "bg-red-500/10 text-red-300 border-red-500/20",
};
