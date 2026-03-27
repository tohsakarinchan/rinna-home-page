/**
 * GET /api/blog-list
 * Vercel Serverless Function — 从 Notion 数据库拉取已发布的旅游文章列表
 *
 * 所需环境变量（在 Vercel Dashboard > Settings > Environment Variables 中配置）：
 *   NOTION_TOKEN       — Notion Integration Token (secret_xxx)
 *   NOTION_DATABASE_ID — 博客数据库的 ID（32位，不含连字符）
 */
export default async function handler(req, res) {
    // 只允许 GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const pageSize = parseInt(req.query.page_size) || 6
    const startCursor = req.query.cursor || undefined

    const headers = {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
    }

    try {
        const notionRes = await fetch(
            `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
            {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    page_size: pageSize,
                    start_cursor: startCursor,
                    filter: {
                        property: 'Status',
                        select: { equals: 'Published' },
                    },
                    sorts: [
                        { property: 'Date', direction: 'descending' },
                    ],
                }),
            }
        )

        if (!notionRes.ok) {
            const err = await notionRes.text()
            console.error('Notion API error:', err)
            return res.status(502).json({ error: '获取文章列表失败' })
        }

        const data = await notionRes.json()

        const posts = data.results.map(page => ({
            id: page.id,
            slug: page.properties.Slug?.rich_text?.[0]?.plain_text || page.id,
            title: page.properties.Name?.title?.[0]?.plain_text || '无标题',
            date: page.properties.Date?.date?.start || '',
            cover: page.cover?.external?.url || (page.cover?.file?.url ? `/api/notion-cover?id=${page.id}` : ''),
            summary: page.properties.Summary?.rich_text?.[0]?.plain_text || '',
            tags: page.properties.Tags?.multi_select?.map(t => t.name) || [],
        }))

        return res.status(200).json({
            posts,
            has_more: data.has_more,
            next_cursor: data.next_cursor,
        })
    } catch (error) {
        console.error('Unexpected error:', error)
        return res.status(500).json({ error: '服务器内部错误' })
    }
}
