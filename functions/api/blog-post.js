/**
 * GET /api/blog-post?slug=tokyo-2024
 * Cloudflare Pages Function — 从 Notion 读取单篇旅游文章并转成 HTML
 *
 * 所需环境变量：
 *   NOTION_TOKEN       — Notion Integration Token
 *   NOTION_DATABASE_ID — 博客数据库 ID
 */
export async function onRequestGet(context) {
    const { env, request } = context
    const url = new URL(request.url)
    const slug = url.searchParams.get('slug')

    if (!slug) {
        return jsonResponse({ error: '缺少 slug 参数' }, 400)
    }

    const notionHeaders = {
        'Authorization': `Bearer ${env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
    }

    try {
        // 1. 通过 slug 在数据库中查找对应页面
        const queryRes = await fetch(
            `https://api.notion.com/v1/databases/${env.NOTION_DATABASE_ID}/query`,
            {
                method: 'POST',
                headers: notionHeaders,
                body: JSON.stringify({
                    filter: {
                        property: 'Slug',
                        rich_text: { equals: slug },
                    },
                }),
            }
        )

        if (!queryRes.ok) {
            return jsonResponse({ error: '查询失败' }, 502)
        }

        const queryData = await queryRes.json()

        if (!queryData.results?.length) {
            return jsonResponse({ error: '文章不存在' }, 404)
        }

        const page = queryData.results[0]
        const pageId = page.id

        // 2. 提取 meta 信息
        const meta = {
            title: page.properties.Name?.title?.[0]?.plain_text || '',
            date: page.properties.Date?.date?.start || '',
            cover: normalizeMediaUrl(page.cover?.external?.url || page.cover?.file?.url || ''),
            tags: page.properties.Tags?.multi_select?.map(t => t.name) || [],
            location: page.properties.Location?.rich_text?.[0]?.plain_text || '',
        }

        // 3. 获取页面所有内容块（自动处理分页）
        const blocks = await fetchAllBlocks(pageId, notionHeaders)

        // 4. 将 Notion blocks 转成 HTML
        const html = blocksToHtml(blocks)

        return jsonResponse({ meta, html })
    } catch (error) {
        console.error('Unexpected error:', error)
        return jsonResponse({ error: '服务器内部错误' }, 500)
    }
}

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders() })
}

// ── 工具函数 ────────────────────────────────────────────────

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: corsHeaders(),
    })
}

function corsHeaders() {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
}

/**
 * 递归获取某个块下所有子块（支持 Notion 分页 100条/次）
 */
async function fetchAllBlocks(blockId, headers) {
    const blocks = []
    let cursor = undefined

    do {
        const qs = cursor ? `?start_cursor=${cursor}` : ''
        const res = await fetch(
            `https://api.notion.com/v1/blocks/${blockId}/children${qs}`,
            { headers }
        )
        if (!res.ok) break

        const data = await res.json()
        for (const block of data.results) {
            // 如果块本身有子块，递归获取（如 toggle, bulleted_list_item 下的缩进内容）
            if (block.has_children) {
                block.children = await fetchAllBlocks(block.id, headers)
            }
            blocks.push(block)
        }
        cursor = data.has_more ? data.next_cursor : undefined
    } while (cursor)

    return blocks
}

/**
 * 将 Notion rich_text 数组转成带样式的 HTML 字符串
 */
function richTextToHtml(richTexts = []) {
    return richTexts.map(t => {
        let text = escapeHtml(t.plain_text)
        if (t.annotations?.bold) text = `<strong>${text}</strong>`
        if (t.annotations?.italic) text = `<em>${text}</em>`
        if (t.annotations?.strikethrough) text = `<del>${text}</del>`
        if (t.annotations?.underline) text = `<u>${text}</u>`
        if (t.annotations?.code) text = `<code>${text}</code>`
        if (t.href) text = `<a href="${t.href}" target="_blank" rel="noopener">${text}</a>`
        return text
    }).join('')
}

function escapeHtml(str = '') {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

/**
 * 将 Notion blocks 数组转成 HTML 字符串
 * 支持的块类型：paragraph, heading_1/2/3, bulleted/numbered list,
 *              to_do, quote, code, divider, image, bookmark, callout, toggle, embed
 */
function blocksToHtml(blocks) {
    let html = ''
    let i = 0

    while (i < blocks.length) {
        const block = blocks[i]
        const type = block.type

        // 将连续的 bulleted_list_item 包在 <ul> 里
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

        // 将连续的 numbered_list_item 包在 <ol> 里
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

        // 其余块类型逐个处理
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
            // 嵌入 iframe（适合 YouTube、bilibili、地图等）
            return `<div class="notion-embed"><iframe src="${src}" allowfullscreen loading="lazy"></iframe></div>`
        }

        case 'video': {
            const src = normalizeMediaUrl(data?.external?.url || data?.file?.url || '')
            // 如果是 YouTube/Bilibili 链接转成 embed URL 再用 iframe
            const embedSrc = toEmbedUrl(src)
            if (embedSrc) {
                return `<div class="notion-embed"><iframe src="${embedSrc}" allowfullscreen loading="lazy"></iframe></div>`
            }
            return `<video src="${src}" controls style="max-width:100%;border-radius:8px;"></video>`
        }

        case 'table_of_contents':
            return '' // 可按需实现

        case 'column_list':
        case 'column':
            // 把子块直接输出（不实现多列布局）
            return block.children?.length ? blocksToHtml(block.children) : ''

        default:
            return ''
    }
}

/**
 * 将 YouTube / Bilibili 链接转为可嵌入的 embed URL
 */
function toEmbedUrl(url = '') {
    // YouTube
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`

    // Bilibili
    const bv = url.match(/bilibili\.com\/video\/(BV[^/?]+)/)
    if (bv) return `https://player.bilibili.com/player.html?bvid=${bv[1]}&autoplay=0`

    return null
}

function normalizeMediaUrl(url = '') {
    if (!url) return ''
    // Vercel 生产环境是 HTTPS，避免外链为 HTTP 导致浏览器 mixed content 拦截
    return url.startsWith('http://') ? url.replace(/^http:\/\//, 'https://') : url
}
