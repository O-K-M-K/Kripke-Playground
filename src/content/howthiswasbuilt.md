# How it was built 

## Model Validator
The model validator was initially written in Haskell, which you can find [here](), and then converted to typescript. 

## Graph
The graph is just made using [React Flow](https://reactflow.dev/)

## Markdown Parser
Each lesson is written in an extended markdown syntax. The two extensions are `[word]{hover}` for [tooltips]{I'm a tooltip!} and `Demo` code blocks which let me construct graphs from the text editor. 

## Latex Parser
I use a [Nearley](https://nearley.js.org/) grammar to parse each modal formula.
