import { escapeHtml, renderTagEmail } from '@/lib/notifications/templates'

describe('escapeHtml', () => {
  it('escapes markup characters', () => {
    expect(escapeHtml(`<b onclick="x">Tom & 'Jerry'</b>`)).toBe(
      '&lt;b onclick=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/b&gt;'
    )
  })
})

describe('renderTagEmail', () => {
  const base = { toName: 'Ada', title: "You've been assigned a task", body: 'Write report', url: 'https://app.example/activity/tasks/1', settingsUrl: 'https://app.example/settings' }

  it('uses the notification title as the subject and links to the item', () => {
    const { subject, html } = renderTagEmail(base)
    expect(subject).toBe("You've been assigned a task")
    expect(html).toContain('Hi Ada,')
    expect(html).toContain('Write report')
    expect(html).toContain('href="https://app.example/activity/tasks/1"')
  })

  it('escapes user-controlled text so task titles cannot inject HTML', () => {
    const { html } = renderTagEmail({ ...base, toName: '<i>Ada</i>', body: '<script>alert(1)</script>' })
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<i>Ada</i>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('omits the button when there is no link', () => {
    const { html } = renderTagEmail({ ...base, url: null })
    expect(html).not.toContain('Open in E4G Team')
  })
})
