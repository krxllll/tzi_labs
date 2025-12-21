export function sanitizeBaseName(name: string) {
    const cleaned = name
        .trim()
        .replace(/[/\\?%*:|"<>]/g, '_')
        .replace(/\s+/g, '_')

    return cleaned.replace(/\.[^/.]+$/i, '') || 'file'
}