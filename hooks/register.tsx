import type { EngineInterface, Register } from 'claude-code'

import { MD, renderMarkdown } from './markdown'

// Themes live in ~/.claude/ui-themes/<name>.json and the active name in ~/.claude/ui-themes/active.
// The built-in themes and the status line script are copied there on first start;
// the status line script reads the same files.

type Theme = {
  name: string
  prompt: { bg: string }
  reply: { bg: string }
  markdown: Partial<typeof MD>
}

const theme: Theme = {
  name: 'claude-warm',
  prompt: { bg: '#4a2a1c' },
  reply: { bg: '#1a1a1a' },
  markdown: {},
}

let dir = ''

async function themesDir($: EngineInterface) {
  if (!dir) dir = `${(await $.env.get('HOME')) ?? ''}/.claude/ui-themes`
  return dir
}

// Copy built-in themes (without overwriting the user's edits) and the latest status line script.
async function seed($: EngineInterface) {
  const d = await themesDir($)
  const shipped = `${$.plugin.root}/themes`
  for (const f of await $.fs.list(shipped)) {
    if (f.name.endsWith('.json') && !(await $.fs.exists(`${d}/${f.name}`))) {
      await $.fs.write(`${d}/${f.name}`, await $.fs.read(`${shipped}/${f.name}`))
    }
  }
  await $.fs.write(`${d}/statusline.sh`, await $.fs.read(`${$.plugin.root}/statusline/statusline.sh`))
  if (!(await $.fs.exists(`${d}/active`))) await $.fs.write(`${d}/active`, 'claude-warm\n')
}

async function load($: EngineInterface, name?: string) {
  const d = await themesDir($)
  const active = (name ?? (await $.fs.read(`${d}/active`))).trim()
  const t = JSON.parse(await $.fs.read(`${d}/${active}.json`)) as Theme
  Object.assign(theme, t)
  Object.assign(MD, t.markdown)
  return active
}

async function themeNames($: EngineInterface) {
  return (await $.fs.list(await themesDir($)))
    .map(f => f.name)
    .filter(n => n.endsWith('.json'))
    .map(n => n.slice(0, -5))
    .sort()
}

async function applyTheme($: EngineInterface, name: string) {
  await load($, name)
  await $.fs.write(`${await themesDir($)}/active`, name + '\n')
  $.ui.invalidate('ui.render')
}

const PICKER = 'ui-theme-picker'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      await seed($)
      await load($)
    } catch {}
    $.ui.invalidate('ui.render')
    await $.command.register({
      name: 'ui-theme',
      description: 'Switch the UI theme (message boxes, reply colours, status line)',
      argumentHint: '[name | next | list | statusline]',
    })
    return next(e)
  })

  on('command.run', { command: 'ui-theme' }, async ($, e) => {
    try {
      const d = await themesDir($)
      const names = await themeNames($)
      const list = names.map(n => (n === theme.name ? `**${n}**` : `\`${n}\``)).join(' · ')
      let want = e.args.trim()
      if (!want) {
        // no name: open a picker the person moves through with the arrow keys
        await $.ui.open({ id: PICKER, title: 'UI theme', focus: true, closeOnEscape: true, rows: names.length + 4 })
        return {}
      }
      if (want === 'list') {
        return { text: `Theme: **${theme.name}**\n\n${list}\n\n\`/ui-theme\` to pick from a list, \`/ui-theme <name>\` to switch, \`/ui-theme next\` to cycle, \`/ui-theme statusline\` to set up the matching status line.\nAdd your own by copying a file in \`${d}\`.` }
      }
      if (want === 'next') want = names[(names.indexOf(theme.name) + 1) % names.length] ?? theme.name
      if (want === 'statusline') {
        return { text: `To use the themed status line, add this to \`~/.claude/settings.json\`:\n\n\`\`\`json\n"statusLine": { "type": "command", "command": "bash ${d}/statusline.sh" }\n\`\`\`\n\nIt needs \`jq\` and looks best with a Nerd Font.` }
      }
      if (!names.includes(want)) {
        return { text: `No theme \`${want}\`. Available: ${list}` }
      }
      await applyTheme($, want)
      return { text: `Theme switched to **${want}**. The status line follows on its next refresh.` }
    } catch (err) {
      return { text: `Theme error: ${String(err)}` }
    }
  })

  // The picker: one row per theme with its description; Enter applies it, Esc closes
  on('ui.render', { component: 'Pane', requestId: PICKER }, async ($, e) => {
    if (e.surface === 'mobile') {
      const { Text } = $.ui.resolve(e)
      return <Text>Themes: {(await themeNames($)).join(', ')}. Use {'/ui-theme <name>'} to switch.</Text>
    }
    const { Box, Text, Select } = $.ui.resolve(e)
    const d = await themesDir($)
    const options = []
    for (const n of await themeNames($)) {
      let about = ''
      try { about = (JSON.parse(await $.fs.read(`${d}/${n}.json`)) as { description?: string }).description ?? '' } catch {}
      options.push({ value: n, label: about ? `${n}  —  ${about}` : n })
    }
    return (
      <Box flexDirection="column" paddingX={1}>
        <Select
          key="theme"
          autoFocus
          options={options}
          value={theme.name}
          onSelect={async (value: string) => {
            await applyTheme($, value)
            await $.ui.close({ id: PICKER })
            $.ui.toast(`Theme: ${value}`)
          }}
        />
        <Text dimColor>↑/↓ to choose · Enter to apply · Esc to close</Text>
      </Box>
    )
  })

  // Your prompts: padded box in the theme's prompt colour
  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    // skip task notifications and messages from other agents; style everything you sent (live or resumed)
    if (e.props.task || e.props.from) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box backgroundColor={theme.prompt.bg} paddingX={2} paddingY={1} marginTop={1}>
        <Text>{e.props.text}</Text>
      </Box>
    )
  })

  // Claude's replies: padded box in the theme's reply colour, markdown in theme colours
  on('ui.render', { component: 'AssistantMessage' }, ($, e) => {
    const t = $.ui.resolve(e)
    const { Box } = t
    return (
      <Box backgroundColor={theme.reply.bg} paddingX={2} paddingY={1} marginTop={1}>
        {renderMarkdown(e.props.text, t)}
      </Box>
    )
  })
}
