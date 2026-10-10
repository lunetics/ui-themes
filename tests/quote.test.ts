import { test, expect } from 'claude-code/testing'

test('a multi-line quote keeps its list instead of one flattened line', async ($, on) => {
  on('ui.render', { component: 'AssistantMessage' }, () => null as any)
  const tree = await $.ui.render({
    surface: 'terminal', component: 'AssistantMessage', requestId: 'm2',
    props: { text: '> **Open items**\n>\n> 1. first\n> 2. second', isFirstOfReply: true },
  } as any)
  const json = JSON.stringify(tree)
  expect(json).toContain('"round"')
  // list markers are their own elements, not part of one joined string
  expect(json).toContain('"1."')
  expect(json).toContain('"2."')
})
