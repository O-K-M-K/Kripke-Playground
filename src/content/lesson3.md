# Deontic Logic
Here we will see why I bothered with lesson 2.

Firstly the syntax and semantics

| Modal        | Deontic  | Semantics  |
| ------------ | -------- | ---------- |
| $\Box p$     | $O \phi$ | Obligatory |
| $\Diamond p$ | $P \phi$ | Permitted  |
| $\Box ¬ p$   | $F \phi$ | Forbidden  |
$O$ and $P$ are duals as before with $P$ being defined as $¬O¬\phi$. Don't ask why we use [$\phi$]{phi} now instead of $p$ we just do... 

Here we add our axiom **Serial (D)**. Remember this adds $\Box p \to \Diamond p$ or in our new notation $O\phi \to P\phi$. In our semantics this is saying if some $\phi$ is obligatory it is therefore permitted. It wouldn't make sense for something that is obligatory to not be permitted. 


## Paradoxes
Ross's paradox
$O \phi \vdash O(\phi \lor \psi)$     

Contrary-to-duty paradox
