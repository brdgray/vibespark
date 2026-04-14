-- ============================================================
-- VibeSpark — Seed Data
-- Run this AFTER creating your admin user account.
-- Replace 'YOUR_ADMIN_USER_ID' with your actual Supabase auth user UUID.
-- ============================================================

-- Startup Stages
insert into startup_stages (name, slug, sort_order) values
  ('Idea', 'idea', 1),
  ('Prototype', 'prototype', 2),
  ('MVP', 'mvp', 3),
  ('Live', 'live', 4),
  ('Growing', 'growing', 5),
  ('Monetizing', 'monetizing', 6),
  ('Scaling', 'scaling', 7)
on conflict (slug) do nothing;

-- Startup Categories
insert into startup_categories (name, slug) values
  ('Developer Tools', 'developer-tools'),
  ('Productivity', 'productivity'),
  ('Design', 'design'),
  ('Education', 'education'),
  ('E-Commerce', 'ecommerce'),
  ('Marketing', 'marketing'),
  ('Sales', 'sales'),
  ('Customer Support', 'customer-support'),
  ('Creator Tools', 'creator-tools'),
  ('Healthcare', 'healthcare'),
  ('Finance', 'finance'),
  ('Legal', 'legal'),
  ('Recruiting', 'recruiting'),
  ('Operations', 'operations'),
  ('Data & Analytics', 'data-analytics'),
  ('Consumer Apps', 'consumer-apps'),
  ('Enterprise Software', 'enterprise-software')
on conflict (slug) do nothing;

-- ============================================================
-- Sample Startups (replace 'YOUR_ADMIN_USER_ID' before running)
-- ============================================================
do $$
declare
  admin_id uuid := 'YOUR_ADMIN_USER_ID';
  cat_dev uuid;
  cat_prod uuid;
  cat_mark uuid;
  cat_creator uuid;
  cat_edu uuid;
  cat_sales uuid;
  cat_support uuid;
  cat_data uuid;
  cat_fin uuid;
  cat_ops uuid;
  cat_design uuid;
  cat_health uuid;
  stage_idea uuid;
  stage_proto uuid;
  stage_mvp uuid;
  stage_live uuid;
  stage_growing uuid;
  stage_monetizing uuid;
  stage_scaling uuid;
begin
  select id into cat_dev from startup_categories where slug = 'developer-tools';
  select id into cat_prod from startup_categories where slug = 'productivity';
  select id into cat_mark from startup_categories where slug = 'marketing';
  select id into cat_creator from startup_categories where slug = 'creator-tools';
  select id into cat_edu from startup_categories where slug = 'education';
  select id into cat_sales from startup_categories where slug = 'sales';
  select id into cat_support from startup_categories where slug = 'customer-support';
  select id into cat_data from startup_categories where slug = 'data-analytics';
  select id into cat_fin from startup_categories where slug = 'finance';
  select id into cat_ops from startup_categories where slug = 'operations';
  select id into cat_design from startup_categories where slug = 'design';
  select id into cat_health from startup_categories where slug = 'healthcare';
  select id into stage_idea from startup_stages where slug = 'idea';
  select id into stage_proto from startup_stages where slug = 'prototype';
  select id into stage_mvp from startup_stages where slug = 'mvp';
  select id into stage_live from startup_stages where slug = 'live';
  select id into stage_growing from startup_stages where slug = 'growing';
  select id into stage_monetizing from startup_stages where slug = 'monetizing';
  select id into stage_scaling from startup_stages where slug = 'scaling';

  insert into startups (name, slug, tagline, description, website_url, category_id, stage_id, verification_status, is_featured, target_audience, pricing_model, ai_stack, founded_at, location, team_size, created_by) values

  ('CodePilot AI',
   'codepilot-ai',
   'AI pair programmer that understands your entire codebase',
   'CodePilot AI indexes your entire repository and provides context-aware code completions, refactoring suggestions, bug fixes, and documentation generation — all without leaving your editor. Unlike generic AI tools, CodePilot knows your architecture, your patterns, and your team''s coding style.',
   'https://codepilot.ai',
   cat_dev, stage_growing, 'verified', true,
   'Software engineers and development teams who want AI that actually understands their codebase',
   'freemium', array['GPT-4o', 'Cursor', 'Tree-sitter'], '2024-01-15', 'San Francisco, CA', 4, admin_id),

  ('FlowWrite',
   'flowwrite',
   'Write 10x faster with AI that matches your voice',
   'FlowWrite learns your writing style across documents, emails, and past work — then generates first drafts that sound like you, not a robot. It works in any app via a browser extension, including Gmail, Notion, and Google Docs. Users report cutting writing time by 60-80%.',
   'https://flowwrite.app',
   cat_prod, stage_live, 'verified', true,
   'Founders, content creators, marketers, and professionals who write frequently',
   'freemium', array['Claude 3.5', 'GPT-4o'], '2024-03-01', 'Remote', 3, admin_id),

  ('SparkCopy',
   'sparkcopy',
   'Instant ad copy powered by real conversion data',
   'SparkCopy generates high-converting ad copy by training on millions of top-performing campaigns across Facebook, Google, and TikTok. Input your product, audience, and goal — and get 10+ high-quality variants in seconds. A/B test directly in the dashboard.',
   'https://sparkcopy.io',
   cat_mark, stage_monetizing, 'verified', false,
   'D2C brands, performance marketers, and agencies running paid social',
   'paid', array['GPT-4o', 'Fine-tuned models'], '2023-11-20', 'Austin, TX', 5, admin_id),

  ('ReelForge',
   'reelforge',
   'Turn long videos into viral short-form clips automatically',
   'ReelForge uses AI to identify the highest-engagement moments in your video, clip them perfectly, add captions and b-roll, and format for TikTok, Reels, and YouTube Shorts — all in minutes. Used by podcasters, YouTubers, and marketing teams to 10x their content output.',
   'https://reelforge.ai',
   cat_creator, stage_growing, 'verified', true,
   'Podcasters, YouTubers, and marketing teams who want to repurpose long-form video content',
   'freemium', array['Whisper', 'GPT-4o Vision', 'FFmpeg AI'], '2024-02-10', 'New York, NY', 6, admin_id),

  ('TutorMind',
   'tutormind',
   'Personalized AI tutoring that adapts to how you learn',
   'TutorMind builds a learning model for each student and adjusts lesson plans, pacing, question difficulty, and examples in real-time based on comprehension signals. It covers K-12 math, science, and coding. Parents and students say it''s like having a private tutor 24/7.',
   'https://tutormind.co',
   cat_edu, stage_mvp, 'verified', false,
   'K-12 students, parents, and self-learners who need personalized education support',
   'paid', array['GPT-4o', 'Custom fine-tuned models', 'Supabase'], '2024-04-01', 'Chicago, IL', 3, admin_id),

  ('DealSense',
   'dealsense',
   'AI that reads between the lines of your sales calls',
   'DealSense transcribes and analyzes your sales calls in real-time, surfacing buyer intent signals, objections, and next-best actions. It integrates with HubSpot and Salesforce and auto-updates CRM fields after every call. Sales teams close 23% more deals with DealSense.',
   'https://dealsense.io',
   cat_sales, stage_live, 'verified', false,
   'B2B sales teams and sales managers at companies with 10-500 employees',
   'paid', array['Whisper', 'GPT-4o', 'Salesforce API'], '2023-09-01', 'Boston, MA', 8, admin_id),

  ('HelperBot',
   'helperbot',
   'Your entire support knowledge base, alive as an AI agent',
   'HelperBot turns your docs, FAQs, Notion pages, and past tickets into an intelligent support agent. It handles 85% of tickets automatically, escalates complex issues to your team, and learns from every resolution. Setup takes 10 minutes, no code required.',
   'https://helperbot.ai',
   cat_support, stage_growing, 'verified', false,
   'SaaS companies and e-commerce brands with growing support queues',
   'freemium', array['Claude 3.5', 'Pinecone', 'OpenAI Embeddings'], '2024-01-08', 'Remote', 4, admin_id),

  ('Dataweave',
   'dataweave',
   'Ask your data questions in plain English, get charts instantly',
   'Dataweave connects to your database, data warehouse, or CSV files and lets anyone on your team ask business questions in plain English. It writes the SQL, runs the query, and returns beautiful charts — no analyst required. Supports Postgres, BigQuery, Snowflake, and more.',
   'https://dataweave.app',
   cat_data, stage_live, 'verified', true,
   'Business teams and founders who need data insights without depending on analysts',
   'freemium', array['GPT-4o', 'Text-to-SQL models', 'Chart.js'], '2024-02-28', 'Seattle, WA', 5, admin_id),

  ('ClauseGuard',
   'clauseguard',
   'AI contract review that catches what lawyers charge $500/hr to find',
   'ClauseGuard reviews contracts in seconds, flags risky clauses, explains obligations in plain English, and suggests standard alternatives. It covers NDAs, SaaS agreements, employment contracts, and more. Built for startups who can''t afford legal review on every document.',
   'https://clauseguard.co',
   cat_fin, stage_mvp, 'verified', false,
   'Startups, freelancers, and small businesses who sign contracts regularly but can''t afford legal fees',
   'freemium', array['Claude 3.5', 'Legal fine-tuned models', 'Supabase'], '2024-03-15', 'London, UK', 2, admin_id),

  ('HireFlow',
   'hireflow',
   'Screen 100 candidates in the time it used to take to screen 5',
   'HireFlow ingests resumes, creates custom screening criteria from your job description, scores candidates, and surfaces the top 10% with detailed reasoning — all before you''ve had your first coffee. It integrates with Greenhouse, Lever, and Workday.',
   'https://hireflow.ai',
   cat_ops, stage_growing, 'verified', false,
   'HR teams, recruiters, and founders at fast-growing companies who are overwhelmed with applications',
   'paid', array['GPT-4o', 'Claude', 'ATS APIs'], '2023-12-01', 'San Francisco, CA', 7, admin_id),

  ('DesignSpark',
   'designspark',
   'Go from idea to polished UI in 60 seconds',
   'DesignSpark takes a plain-English description of your screen or component and generates pixel-perfect, production-ready Figma designs. It understands design systems, knows when to use cards vs. tables vs. lists, and respects your brand guidelines.',
   'https://designspark.io',
   cat_design, stage_proto, 'verified', false,
   'Founders, product managers, and startups who want to prototype faster without a designer',
   'freemium', array['GPT-4o Vision', 'Stable Diffusion XL', 'Figma API'], '2024-04-10', 'Remote', 2, admin_id),

  ('MindPulse',
   'mindpulse',
   'Track your mental health and get AI-guided support between therapy sessions',
   'MindPulse helps users check in daily with brief mood and energy logs, spots patterns using AI, and provides personalized coping suggestions based on evidence-based CBT techniques. It''s designed to complement therapy, not replace it. HIPAA-compliant.',
   'https://mindpulse.health',
   cat_health, stage_mvp, 'verified', false,
   'Adults in therapy or mental health programs who want daily support between sessions',
   'freemium', array['Claude 3.5', 'CBT fine-tuned models', 'Supabase'], '2024-02-20', 'Toronto, Canada', 3, admin_id)

  on conflict (slug) do nothing;

  -- Add team members for top startups
  insert into startup_team_members (startup_id, name, title, is_public)
  select s.id, 'Alex Chen', 'CEO & Co-founder', true from startups s where s.slug = 'codepilot-ai'
  on conflict do nothing;

  insert into startup_team_members (startup_id, name, title, is_public)
  select s.id, 'Sarah Park', 'CTO', true from startups s where s.slug = 'codepilot-ai'
  on conflict do nothing;

  insert into startup_team_members (startup_id, name, title, is_public)
  select s.id, 'Marcus Williams', 'CEO', true from startups s where s.slug = 'flowwrite'
  on conflict do nothing;

  insert into startup_team_members (startup_id, name, title, is_public)
  select s.id, 'Jordan Lee', 'Founder & CEO', true from startups s where s.slug = 'reelforge'
  on conflict do nothing;

  -- Add social links
  insert into startup_social_links (startup_id, platform, url)
  select s.id, 'Twitter', 'https://twitter.com/codepilotai' from startups s where s.slug = 'codepilot-ai'
  on conflict do nothing;

  insert into startup_social_links (startup_id, platform, url)
  select s.id, 'Product Hunt', 'https://producthunt.com/posts/codepilot-ai' from startups s where s.slug = 'codepilot-ai'
  on conflict do nothing;

end $$;
