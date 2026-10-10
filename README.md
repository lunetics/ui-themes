# ui-themes

Switchable themes for the Claude Code terminal UI:

- Your prompts and Claude's replies drawn in padded, coloured boxes (Claude Code's defaults have no reply box and little prompt padding; the plugin draws both itself)
- Reply markdown in theme colours (headings, `inline code`, **bold**, links, bullets, quotes)
- A matching one-line status line: model (own icon and colour for Opus, Sonnet, Haiku and Fable), folder, git branch, context, 5h/7d limits
- `/ui-theme <name>` to switch everything at once

## Before and after

**Before**: Claude Code's default look. Replies have no box, prompts get a thin grey bar.

![Claude Code without ui-themes](docs/before.png)

**After**: `claude-warm` theme. Padded terracotta prompts, charcoal reply boxes, themed markdown and status line.

![Claude Code with the claude-warm theme](docs/after-claude-warm.png)

**After**: `night-blue` theme, one `/ui-theme next` away.

![Claude Code with the night-blue theme](docs/after-night-blue.png)

Ships with three themes:

| Theme | Look |
|---|---|
| `claude-warm` (default) | Terracotta prompts, charcoal replies, Claude orange and honey text |
| `night-blue` | Navy prompts, near-black replies, bright blue and cyan text |
| `titanium` | Oh My Pi inspired: steel blue prompts, brushed titanium replies |

## Install

```
/plugin marketplace add yugal1107/ui-themes
/plugin install ui-themes@ui-themes
```

Restart Claude Code once after installing.

## Use

| Command | What it does |
|---|---|
| `/ui-theme` | Show the current theme and the available ones |
| `/ui-theme <name>` | Switch theme |
| `/ui-theme next` | Cycle to the next theme |
| `/ui-theme statusline` | Show how to enable the matching status line |

### Status line

The status line is optional. Add this to `~/.claude/settings.json`:

```json
"statusLine": { "type": "command", "command": "bash ~/.claude/ui-themes/statusline.sh" }
```

It needs `jq`, and its icons need a [Nerd Font](https://www.nerdfonts.com/) in your terminal.

## Make your own theme

Themes live in `~/.claude/ui-themes/<name>.json` (the built-in ones are copied there on first start). Copy one, rename it and change the colours; it shows up in `/ui-theme` right away.

```json
{
  "name": "claude-warm",
  "prompt": { "bg": "#4a2a1c" },
  "reply": { "bg": "#1a1a1a" },
  "markdown": {
    "code": "#e0a458", "bold": "#f5e6d3", "heading": "#d97757", "link": "#d97757",
    "bullet": "#d97757", "quote": "#a8998a", "rule": "#3a3029"
  },
  "statusline": {
    "model": "#d97757", "modelOpus": "#d97757", "modelSonnet": "#e0a458",
    "modelHaiku": "#a3b18a", "modelFable": "#c49bbb", "dir": "#f5e6d3", "git": "#a3b18a", "dirty": "#e0a458",
    "label": "#a8998a", "muted": "#8a7b6e", "ok": "#a3b18a", "warn": "#e0a458",
    "hot": "#e5534b", "sep": "#5c4a3d"
  }
}
```

## Notes

- Built on Claude Code's function-hook plugin API, which is in early access and may change between releases.
- Code blocks and tables keep Claude Code's own rendering.
- While a reply is still streaming, Claude Code draws it with its own view; it moves into the coloured box once the block finishes.
- `/theme` is Claude Code's own command and is left untouched; this plugin uses `/ui-theme`.
