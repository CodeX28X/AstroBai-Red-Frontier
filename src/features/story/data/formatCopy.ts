// Runtime copy substitution only; never evaluates an expression or gameplay rule.
export function formatCopy(text: string, tokens: Readonly<Record<string,string|number>>): string {
  return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match: string, key: string) => String(tokens[key] ?? '—'))
}
