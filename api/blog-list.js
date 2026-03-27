export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return setCors(res).status(204).end()
  }

  if (req.method !== 'GET') {
    return setCors(res).status(405).json({ error: 'Method Not Allowed' })
  }

  const notionToken = process.env.NOTION_TOKEN
  const notionDatabaseId = process.env.NOTION_DATABASE_ID

  if (!notionToken || !notionDatabaseId) {
    return setCors(res).status(500).json({ error: '缺少 NOTION_TOKEN 或 NOTION_DATABASE_ID 环境变量' })
  }

  const pageSize = parseInt(req.query.page_size, 10) || 6
  const startCursor = req.query.cursor || undefined

  const headers = {
    Authorization: `Bearer ${notionToken}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  }

  try {
    const notionRes = await fetch(`https://api.notion.com/v1/databases/${notionDatabaseId}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        page_size: pageSize,
        start_cursor: startCursor,
        filter: {
          property: 'Status',
          select: { equals: 'Published' },
        },
        sorts: [{ property: 'Date', direction: 'descending' }],
      }),
    })

    if (!notionRes.ok) {
      const err = await notionRes.text()
      console.error('Notion API error:', err)
      return setCors(res).status(502).json({ error: '获取文章列表失败' })
    }

    const data = await notionRes.json()

    const posts = data.results.map((page) => ({
      id: page.id,
      slug: page.properties.Slug?.rich_text?.[0]?.plain_text || page.id,
      title: page.properties.Name?.title?.[0]?.plain_text || '无标题',
      date: page.properties.Date?.date?.start || '',
      cover: resolveCoverUrl(page),
      summary: page.properties.Summary?.rich_text?.[0]?.plain_text || '',
      tags: page.properties.Tags?.multi_select?.map((t) => t.name) || [],
    }))

    return setCors(res).status(200).json({
      posts,
      has_more: data.has_more,
      next_cursor: data.next_cursor,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return setCors(res).status(500).json({ error: '服务器内部错误' })
  }
}

function normalizeMediaUrl(url = '') {
  if (!url) return ''
  return url.startsWith('http://') ? url.replace(/^http:\/\//, 'https://') : url
}

function resolveCoverUrl(page) {
  const external = page.cover?.external?.url
  if (external) return normalizeMediaUrl(external)

  // Notion file URL 是短期签名链接，交给代理接口实时刷新
  if (page.cover?.file?.url) return `/api/notion-cover?id=${encodeURIComponent(page.id)}`

  return normalizeMediaUrl(page.properties.Cover?.url || '')
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  return res
}
