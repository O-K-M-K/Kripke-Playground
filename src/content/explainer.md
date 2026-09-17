# How it works
This tab on the right is the lesson. Use the navigation bar at the top to move through lessons. Lessons have numerous interactive elements.

(Tooltips){Hi I'm a tooltip} to remind you of definitions or key facts relating to certain words as you move through the lesson. They look like (this){Hi I'm another tooltip!} and will often just contain a bit of information to contextualise the word or remind you of the definition. Maths will also sometimes have tooltips ($\{x \mid x \lt 8 \land \in \mathbb{R} \}$){the set of real numbers less than 8} or tooltips will have (maths){$\sum_{i=0}^n \frac1i$}.


If you see a button like this:
```Demo
name: Click me!
w0 -> w1
w1 -> bob
bob -> w0
w0: p
w1: p, q, r
bob: q, r
formula: \Box(p\to q)
```
click it to insert the Kripke Model and formula currently being talked about into the graph on the left. 
# Personal syntax nodes

Use code blocks with the language `Demo` to create demo buttons to auto load kripke frames and formulas into the project.

The syntax of these blocks are as follows
```psudocode
//   name: Click me          (optional) the button label
//   w0 -> w1                 an edge (accessibility relation)
//   w0 -> w1, w2             one source, several targets
//   w0 <-> w1                a bidirectional edge (two directed edges)
//   w0:                      a world with no true propositions
//   w1: p, q                 a world where p and q hold
//   formula: [] (p -> q)     (optional) the modal formula to check
```

The `formula` accepts ASCII shorthand, LaTeX, or the raw symbols — they all
mean the same thing:

| shorthand | LaTeX               | symbol |
| --------- | ------------------- | ------ |
| `[]`      | `\Box`              | □      |
| `<>`      | `\Diamond`          | ◇      |
| `~` / `!` | `\lnot`             | ¬      |
| `/\`      | `\land` / `\and`    | ∧      |
| `\/`      | `\lor` / `\or`      | ∨      |
| `->`      | `\to`               | →      |
| `<->`     | `\iff`              | ↔      |
| `T`       | `\t` / `\top`       | ⊤      |
| `F`       | `\f` / `\bot`       | ⊥      |

The syntax of the custom tooltip block is as follows 
```
(word){hover}
```