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

  const slug = req.query.slug
  if (!slug) {
    return setCors(res).status(400).json({ error: '缺少 slug 参数' })
  }

  const headers = {
    Authorization: `Bearer ${notionToken}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  }

  try {
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${notionDatabaseId}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: {
          property: 'Slug',
          rich_text: { equals: slug },
        },
      }),
    })

    if (!queryRes.ok) {
      return setCors(res).status(502).json({ error: '查询失败' })
    }

    const queryData = await queryRes.json()
    if (!queryData.results?.length) {
      return setCors(res).status(404).json({ error: '文章不存在' })
    }

    const page = queryData.results[0]
    const pageId = page.id

    const meta = {
      title: page.properties.Name?.title?.[0]?.plain_text || '',
      date: page.properties.Date?.date?.start || '',
      cover: resolveCoverUrl(page),
      tags: page.properties.Tags?.multi_select?.map((t) => t.name) || [],
      location: page.properties.Location?.rich_text?.[0]?.plain_text || '',
    }

    const blocks = await fetchAllBlocks(pageId, headers)
    const html = blocksToHtml(blocks)

    return setCors(res).status(200).json({ meta, html })
  } catch (error) {
    console.error('Unexpected error:', error)
    return setCors(res).status(500).json({ error: '服务器内部错误' })
  }
}

async function fetchAllBlocks(blockId, headers) {
  const blocks = []
  let cursor

  do {
    const qs = cursor ? `?start_cursor=${cursor}` : ''
    const r = await fetch(`https://api.notion.com/v1/blocks/${blockId}/children${qs}`, { headers })
    if (!r.ok) break

    const data = await r.json()
    for (const block of data.results) {
      if (block.has_children) {
        block.children = await fetchAllBlocks(block.id, headers)
      }
      blocks.push(block)
    }
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  return blocks
}

function blocksToHtml(blocks) {
  let html = ''
  let i = 0

  while (i < blocks.length) {
    const block = blocks[i]
    const type = block.type

    if (type === 'bulleted_list_item') {
      html += '<ul class="notion-ul">'
      while (i < blocks.length && blocks[i].type === 'bulleted_list_item') {
        const b = blocks[i]
        const inner = richTextToHtml(b.bulleted_list_item?.rich_text)
        const children = b.children?.length ? blocksToHtml(b.children) : ''
        html += `<li>${inner}${children}</li>`
        i++
      }
      html += '</ul>'
      continue
    }

    if (type === 'numbered_list_item') {
      html += '<ol class="notion-ol">'
      while (i < blocks.length && blocks[i].type === 'numbered_list_item') {
        const b = blocks[i]
        const inner = richTextToHtml(b.numbered_list_item?.rich_text)
        const children = b.children?.length ? blocksToHtml(b.children) : ''
        html += `<li>${inner}${children}</li>`
        i++
      }
      html += '</ol>'
      continue
    }

    html += blockToHtml(block)
    i++
  }

  return html
}

function blockToHtml(block) {
  const type = block.type
  const data = block[type]

  switch (type) {
    case 'paragraph': {
      const text = richTextToHtml(data?.rich_text)
      return text ? `<p>${text}</p>` : '<br>'
    }
    case 'heading_1':
      return `<h1>${richTextToHtml(data?.rich_text)}</h1>`
    case 'heading_2':
      return `<h2>${richTextToHtml(data?.rich_text)}</h2>`
    case 'heading_3':
      return `<h3>${richTextToHtml(data?.rich_text)}</h3>`
    case 'quote':
      return `<blockquote>${richTextToHtml(data?.rich_text)}</blockquote>`
    case 'code': {
      const lang = data?.language || ''
      const code = escapeHtml(data?.rich_text?.[0]?.plain_text || '')
      return `<pre><code class="language-${lang}">${code}</code></pre>`
    }
    case 'callout': {
      const emoji = data?.icon?.emoji || 'ℹ️'
      const text = richTextToHtml(data?.rich_text)
      return `<div class="notion-callout"><span class="callout-icon">${emoji}</span><div>${text}</div></div>`
    }
    case 'to_do': {
      const checked = data?.checked ? 'checked' : ''
      const text = richTextToHtml(data?.rich_text)
      return `<label class="notion-todo"><input type="checkbox" disabled ${checked}>${text}</label>`
    }
    case 'toggle': {
      const summary = richTextToHtml(data?.rich_text)
      const children = block.children?.length ? blocksToHtml(block.children) : ''
      return `<details class="notion-toggle"><summary>${summary}</summary>${children}</details>`
    }
    case 'divider':
      return '<hr>'
    case 'image': {
      const src = normalizeMediaUrl(data?.external?.url || data?.file?.url || '')
      const caption = richTextToHtml(data?.caption)
      return `<figure><img src="${src}" alt="${caption || ''}" loading="lazy"><figcaption>${caption}</figcaption></figure>`
    }
    case 'bookmark': {
      const href = data?.url || ''
      const caption = richTextToHtml(data?.caption)
      return `<a class="notion-bookmark" href="${href}" target="_blank" rel="noopener">${caption || href}</a>`
    }
    case 'embed': {
      const src = data?.url || ''
      return `<div class="notion-embed"><iframe src="${src}" allowfullscreen loading="lazy"></iframe></div>`
    }
    case 'video': {
      const src = normalizeMediaUrl(data?.external?.url || data?.file?.url || '')
      const embedSrc = toEmbedUrl(src)
      if (embedSrc) {
        return `<div class="notion-embed"><iframe src="${embedSrc}" allowfullscreen loading="lazy"></iframe></div>`
      }
      return `<video src="${src}" controls style="max-width:100%;border-radius:8px;"></video>`
    }
    case 'table_of_contents':
      return ''
    case 'column_list':
    case 'column':
      return block.children?.length ? blocksToHtml(block.children) : ''
    default:
      return ''
  }
}

function toEmbedUrl(url = '') {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`

  const bv = url.match(/bilibili\.com\/video\/(BV[^/?]+)/)
  if (bv) return `https://player.bilibili.com/player.html?bvid=${bv[1]}&autoplay=0`

  return null
}

function richTextToHtml(richTexts = []) {
  return richTexts
    .map((t) => {
      let text = escapeHtml(t.plain_text)
      if (t.annotations?.bold) text = `<strong>${text}</strong>`
      if (t.annotations?.italic) text = `<em>${text}</em>`
      if (t.annotations?.strikethrough) text = `<del>${text}</del>`
      if (t.annotations?.underline) text = `<u>${text}</u>`
      if (t.annotations?.code) text = `<code>${text}</code>`
      if (t.href) text = `<a href="${t.href}" target="_blank" rel="noopener">${text}</a>`
      return text
    })
    .join('')
}

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalizeMediaUrl(url = '') {
  if (!url) return ''
  return url.startsWith('http://') ? url.replace(/^http:\/\//, 'https://') : url
}

function resolveCoverUrl(page) {
  const external = page.cover?.external?.url
  if (external) return normalizeMediaUrl(external)
  if (page.cover?.file?.url) return `/api/notion-cover?id=${encodeURIComponent(page.id)}`
  return ''
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  return res
}
