export const LCG_VARIANT = {
    m: 2097151 as number, // 2^21 - 1
    a: 512 as number, // 8^3
    c: 144 as number,
    seed: 3 as number,
}

export const RC5_VARIANT = {
    w: 64,
    r: 20,
    b: 16,
    blockBytes: 16,
}