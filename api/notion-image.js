/**
 * GET /api/notion-image?id=<block_id>
 * Notion 图片代理 — 每次请求都去 Notion 拿最新的有效 URL 然后 302 跳转
 *
 * 解决 Notion file 类型图片 URL 约 1 小时后过期的问题。
 * HTML 里的图片地址指向本接口，永不失效。
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const blockId = req.query.id
    if (!blockId) {
        return res.status(400).json({ error: '缺少 id 参数' })
    }

    try {
        const notionRes = await fetch(
            `https://api.notion.com/v1/blocks/${blockId}`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
                    'Notion-Version': '2022-06-28',
                },
            }
        )

        if (!notionRes.ok) {
            return res.status(502).json({ error: '无法从 Notion 获取图片信息' })
        }

        const block = await notionRes.json()
        const type = block.type  // 'image' | 'video' 等

        // 取出最新的 file URL（Notion 每次返回的都是当前有效的签名 URL）
        const freshUrl = block[type]?.file?.url

        if (!freshUrl) {
            return res.status(404).json({ error: '该块不包含 file 类型资源' })
        }

        // 302 跳转到最新有效 URL
        // Cache-Control 设短一点（55分钟），确保在 Notion URL 过期前浏览器会重新请求代理
        res.setHeader('Cache-Control', 'public, max-age=3300, s-maxage=3300')
        return res.redirect(302, freshUrl)
    } catch (error) {
        console.error('notion-image proxy error:', error)
        return res.status(500).json({ error: '服务器内部错误' })
    }
}
