type SavePickerType = {
    description: string
    accept: Record<string, string[]>
}

function pickerTypesForName(name: string): SavePickerType[] | undefined {
    const lower = name.toLowerCase()

    if (lower.endsWith('.md5')) {
        return [{ description: 'MD5 file', accept: { 'text/plain': ['.md5'] } }]
    }

    if (lower.endsWith('.txt')) {
        return [{ description: 'Text file', accept: { 'text/plain': ['.txt'] } }]
    }

    return undefined
}

export async function saveUrlAs(url: string | null, suggestedName?: string | null) {
    suggestedName = suggestedName ?? 'download.txt'
    if (!import.meta.client) return
    if (!url) return

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to download: ${res.status} ${res.statusText}`)
    const blob = await res.blob()

    const picker = (window as any).showSaveFilePicker as undefined | ((opts: any) => Promise<any>)
    const types = pickerTypesForName(suggestedName)

    if (typeof picker === 'function') {
        const handle = await picker({
            suggestedName,
            ...(types ? { types } : {}),
        })
        const stream = await handle.createWritable()
        await stream.write(blob)
        await stream.close()
        return
    }

    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = suggestedName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(a.href)
}
