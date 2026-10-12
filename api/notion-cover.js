/**
 * GET /api/notion-cover?id=<page_id>
 * Notion 封面图代理 — 每次请求都去 Notion 拿最新的封面 URL 然后 302 跳转
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const pageId = req.query.id
    if (!pageId) {
        return res.status(400).json({ error: '缺少 id 参数' })
    }

    try {
        const notionRes = await fetch(
            `https://api.notion.com/v1/pages/${pageId}`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
                    'Notion-Version': '2022-06-28',
                },
            }
        )

        if (!notionRes.ok) {
            return res.status(502).json({ error: '无法从 Notion 获取页面信息' })
        }

        const page = await notionRes.json()
        const freshUrl = page.cover?.file?.url

        if (!freshUrl) {
            return res.status(404).json({ error: '该页面没有 file 类型封面' })
        }

        res.setHeader('Cache-Control', 'public, max-age=3300, s-maxage=3300')
        return res.redirect(302, freshUrl)
    } catch (error) {
        console.error('notion-cover proxy error:', error)
        return res.status(500).json({ error: '服务器内部错误' })
    }
}
