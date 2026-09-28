# Model Checker

## Haskell

A model checker for [Kripke semantics](https://en.wikipedia.org/wiki/Kripke_semantics)
of propositional modal logic. It evaluates modal formulae against Kripke models
and uses property-based testing (QuickCheck) to verify that the standard modal
axioms hold over the frame classes that characterise them.

### Modules

**`Kripke.Checker`** — evaluation and validity.

- `verifyModel :: Model -> Bool` — a well-formedness check: every world referenced
  by the relation or valuation is in `worlds`, and every world has an entry in
  both the relation and the valuation.
- `satisfies :: Model -> Formula -> World -> Bool` — the satisfaction relation
  (`M, w ⊨ φ`), recursing over the formula. `Box f` holds at `w` iff `f` holds at
  every world accessible from `w`.
- `validInModel :: Model -> Formula -> Worlds` — the set of worlds in the model
  at which the formula is satisfied.
- `testModel` — a small three-world example model for experimentation.

### Tests (`test/Spec.hs`)

An `exitcode-stdio` QuickCheck suite that checks modal axioms are valid over the
appropriate frame classes. Random models are generated with `genModel`, and
`allValuations` exhaustively varies the valuation over the relevant atoms so an
axiom must hold under every assignment:

- **K** (`□(p → q) → (□p → □q)`) - valid over all frames.
- **T** (`□p → p`) - valid over reflexive frames; `addReflexive` /
  `genReflexiveModel` build reflexive frames to test it.
- **4** (`□p → □□p`) - valid over transitive frames. (in progress)


## Typescript

Eventually differential testing will be implemented.
