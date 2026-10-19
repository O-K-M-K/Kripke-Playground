# How it was built 
*Note: This is an explination of the Haskell and testing side of the project more than the frontend ui.*



## Model Validator
The model validator was initially written in Haskell, which you can find [here](https://github.com/O-K-M-K/Kripke-Playground/blob/main/haskell/src/Kripke/Checker.hs), and then converted to typescript. The model checker uses property based testing based on the modal systems, which you can find [here](https://github.com/O-K-M-K/Kripke-Playground/blob/main/haskell/test/Spec.hs)


## Graph
The graph is just made using [React Flow](https://reactflow.dev/)

## Markdown Parser
Each lesson is written in an extended markdown syntax. The two extensions are `[word]{hover}` for [tooltips]{I'm a tooltip!} and `Demo` code blocks which let me construct graphs from the text editor. 

## Latex Parser
I use a [Nearley](https://nearley.js.org/) grammar to parse each modal formula.
