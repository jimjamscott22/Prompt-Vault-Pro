interface Resource {
  title: string
  description: string
  url: string
  tag: string
}

const promptGuides: Resource[] = [
  {
    title: 'Anthropic Prompt Engineering',
    description: 'Official guide covering Claude-specific techniques: chain-of-thought, XML tags, role prompting, and more.',
    url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview',
    tag: 'Official Docs',
  },
  {
    title: 'OpenAI Prompt Engineering Guide',
    description: 'Six strategies for getting better results from large language models, with worked examples.',
    url: 'https://platform.openai.com/docs/guides/prompt-engineering',
    tag: 'Official Docs',
  },
  {
    title: 'Google Prompting Essentials',
    description: "Google's practical guide to prompt design, few-shot examples, and chain-of-thought reasoning.",
    url: 'https://ai.google.dev/gemini-api/docs/prompting-strategies',
    tag: 'Official Docs',
  },
  {
    title: 'Learn Prompting',
    description: 'Free, open-source community course covering beginner to advanced prompt engineering concepts.',
    url: 'https://learnprompting.org',
    tag: 'Community',
  },
  {
    title: 'Prompt Engineering Guide (DAIR.AI)',
    description: 'Comprehensive guide covering techniques like ReAct, PAL, self-consistency, and tree of thoughts.',
    url: 'https://www.promptingguide.ai',
    tag: 'Community',
  },
]

const codingPrompts: Resource[] = [
  {
    title: 'Awesome ChatGPT Prompts',
    description: 'Massive community-curated list of prompts for coding, debugging, code review, and more.',
    url: 'https://github.com/f/awesome-chatgpt-prompts',
    tag: 'GitHub',
  },
  {
    title: 'PromptHub — Coding Collection',
    description: 'Searchable library of tested prompts for software development tasks.',
    url: 'https://app.prompthub.us/templates',
    tag: 'Library',
  },
  {
    title: 'System Prompts for Code Review',
    description: 'Curated set of system prompts designed to get thorough, actionable code review feedback.',
    url: 'https://github.com/abilzerian/LLM-Prompt-Library',
    tag: 'GitHub',
  },
  {
    title: 'Claude Code Best Practices',
    description: 'Anthropic\'s guide to writing effective CLAUDE.md files and coding context for AI-assisted development.',
    url: 'https://docs.anthropic.com/en/docs/claude-code/best-practices',
    tag: 'Official Docs',
  },
  {
    title: 'Fabric Patterns',
    description: 'Open-source collection of AI prompts ("patterns") for coding, summarising, analysis, and more.',
    url: 'https://github.com/danielmiessler/fabric/tree/main/patterns',
    tag: 'GitHub',
  },
]

const tagColors: Record<string, string> = {
  'Official Docs': 'var(--type-prompt)',
  'Community': 'var(--type-context)',
  'GitHub': 'var(--type-snippet)',
  'Library': '#60a5fa',
}

function ResourceCard({ resource }: { resource: Resource }) {
  const tagColor = tagColors[resource.tag] ?? 'var(--text-muted)'

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderLeft: `3px solid ${tagColor}`,
        borderRadius: '10px',
        padding: '1rem 1.125rem',
        textDecoration: 'none',
        transition: 'transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.transform = 'translateY(-1px)'
        el.style.boxShadow = `0 4px 20px ${tagColor}22`
        el.style.borderColor = `${tagColor}`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
        el.style.borderColor = 'var(--border-default)'
        el.style.borderLeftColor = tagColor
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.375rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '0.9375rem',
            color: 'var(--text-primary)',
            lineHeight: 1.3,
          }}
        >
          {resource.title}
        </span>
        <span
          style={{
            flexShrink: 0,
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: tagColor,
            background: `${tagColor}18`,
            border: `1px solid ${tagColor}44`,
            borderRadius: '5px',
            padding: '0.2rem 0.5rem',
            whiteSpace: 'nowrap',
          }}
        >
          {resource.tag}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        {resource.description}
      </p>
      <div style={{ marginTop: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {new URL(resource.url).hostname}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          <path d="M5.833 1H9v3.167M9 1 4.5 5.5M2 2.5H1v6.5h6.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </a>
  )
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '1.0625rem',
          color: 'var(--text-primary)',
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>
      <span
        style={{
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '20px',
          padding: '0.15rem 0.5rem',
        }}
      >
        {count}
      </span>
    </div>
  )
}

export default function ResourcesPage() {
  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.625rem',
            color: 'var(--text-primary)',
            margin: '0 0 0.375rem',
            letterSpacing: '-0.02em',
          }}
        >
          Prompt Resources
        </h1>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          Curated guides and ready-made prompts to level up your AI-assisted workflow.
        </p>
      </div>

      {/* Prompt Engineering Guides */}
      <section style={{ marginBottom: '2.5rem' }}>
        <SectionHeader title="Prompt Engineering Guides" count={promptGuides.length} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {promptGuides.map(r => <ResourceCard key={r.url} resource={r} />)}
        </div>
      </section>

      {/* Ready-Made Coding Prompts */}
      <section>
        <SectionHeader title="Ready-Made Coding Prompts" count={codingPrompts.length} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {codingPrompts.map(r => <ResourceCard key={r.url} resource={r} />)}
        </div>
      </section>
    </div>
  )
}
