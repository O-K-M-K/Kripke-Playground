declare module "nearley" {
  export class Grammar {
    static fromCompiled(rules: unknown): Grammar
  }
  export class Parser {
    constructor(grammar: Grammar)
    feed(chunk: string): this
    results: unknown[]
  }
  const nearley: { Grammar: typeof Grammar; Parser: typeof Parser }
  export default nearley
}

declare module "*/modal.js" {
  const grammar: unknown
  export default grammar
}
