export function fuzzyMatch(text = '', query = '') {
    if (!query.trim()) return true
    return query.trim().toLowerCase().split(/\s+/).every(t => text.toLowerCase().includes(t))
}

export function highlight(text = '', query = '') {
    if (!query.trim()) return escapeHtml(text)
    const terms = query.trim().split(/\s+/).filter(Boolean)
    let result = escapeHtml(text)
    terms.forEach(term => {
        result = result.replace(new RegExp(`(${escapeReg(term)})`, 'gi'), '<mark class="search-highlight">$1</mark>')
    })
    return result
}

function escapeHtml(str = '') {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function escapeReg(str = '') {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
