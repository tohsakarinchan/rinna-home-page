/**
 * GET /api/blog-list
 * Cloudflare Pages Function — 从 Notion 数据库拉取已发布的旅游文章列表
 *
 * 所需环境变量（在 Cloudflare Dashboard > Settings > Environment Variables 中配置）：
 *   NOTION_TOKEN       — Notion Integration Token (secret_xxx)
 *   NOTION_DATABASE_ID — 博客数据库的 ID（32位，不含连字符）
 */
export async function onRequestGet(context) {
    const { env, request } = context
    const url = new URL(request.url)

    const pageSize = parseInt(url.searchParams.get('page_size')) || 6
    const startCursor = url.searchParams.get('cursor') || undefined

    const headers = {
        'Authorization': `Bearer ${env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
    }

    try {
        const notionRes = await fetch(
            `https://api.notion.com/v1/databases/${env.NOTION_DATABASE_ID}/query`,
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
            return new Response(JSON.stringify({ error: '获取文章列表失败' }), {
                status: 502,
                headers: corsHeaders(),
            })
        }

        const data = await notionRes.json()

        const posts = data.results.map(page => ({
            id: page.id,
            slug: page.properties.Slug?.rich_text?.[0]?.plain_text || page.id,
            title: page.properties.Name?.title?.[0]?.plain_text || '无标题',
            date: page.properties.Date?.date?.start || '',
            cover: page.cover?.external?.url || page.cover?.file?.url || page.properties.Cover?.url || '',
            summary: page.properties.Summary?.rich_text?.[0]?.plain_text || '',
            tags: page.properties.Tags?.multi_select?.map(t => t.name) || [],
        }))

        return new Response(JSON.stringify({
            posts,
            hasMore: data.has_more,
            nextCursor: data.next_cursor
        }), {
            status: 200,
            headers: corsHeaders(),
        })
    } catch (error) {
        console.error('Unexpected error:', error)
        return new Response(JSON.stringify({ error: '服务器内部错误' }), {
            status: 500,
            headers: corsHeaders(),
        })
    }
}

// 处理 CORS 预检请求
export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders() })
}

function corsHeaders() {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }
}
