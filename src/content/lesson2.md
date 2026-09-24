*Note: This lesson assumes a basic understanding of set theory, specifically the concepts of reflexivity and transitivity*

# Frame Conditons 
Before we get into the [different semantic interpretations]{epistemic, deontic, temporal} of the worlds we need to understand the different constraints we can put the frames under as those inform and help with understanding why the interpretations look the way they do.

The big idea is that we need these constraints to make our semantic interpretations of the frames actually make logical sense. For example if we decided to interpret our frames as representing states in linear time but then had cycles in our graph that would be hard to logically reconcile.

## Reflexive
This is an example of a condition we can have on a frame. It basically means that each world can 'see' itself. Visually you can see this as each world having an arrow pointing to itself. Each frame condition has a corresponding [axiom]{statement accepted as true without proof}. This being an axiom means it must hold true for every world for every [valuation]{this just means set of truth assignments e.g., p, q, r...}. We can say our axiom is $\Box A \to A$.  This axiom specifically ends up enforcing the reflexive property as only frames where every world under every valuation have this property.  [We call this property $T$]{don't ask why} So how does it do that? 

The big idea is that for the [frame to be reflexive]{that is every world in the frame is reflexive} $T$ must hold at every world under every possible valuation.

Look at the following example
```Demo
name: Example
w0 -> w0
w1 -> w1
w0: p 
w1:
w2: p
w3:
formula: []p->p
```

$w_0$ and $w_1$ are the same world under every truth evaluation and $w_2$ and $w_3$  are different worlds under every truth evaluation. Here we can see only the set of reflexive worlds are green $\{w_0,w_1\}$ whereas in the set of non-reflexive worlds $\{w_2,w_3\}$ only $w_2$ is green. 

Lets think about why this happens.

First lets remember how $\to$ works. $A \to B$ is only false when $A$ is true and $B$ is false.  

So $\Box p \to p$ is only false when $\Box p$ is true and $p$ is false. For $\Box p$ to be true it means every connecting world must must be a $p$-world. For $p$ to then be false it means that the world itself must not be a $p$-worlds. 

For $w_0$ $\Box p$ is true as it can see itself, a $p$-world and $p$ is true as it is a $p$-world.

For $w_1$ $\Box p$ is false as the world it can see is not a $p$-world therefore the implication is vicariously true.

For $w_2$ $\Box p$ is [trivially true]{go back to lesson 1 if you cant see why} and $p$ is true as it is a $p$-world 

For $w_3$ $\Box p$ is true as $\Box A$ is vicariously true for any world with no outgoing connections but $p$ is false as $w_3$ is not a $p$-world. 

This property can not be false for worlds that are reflexive. That is to say, this property is true for all reflexive worlds.

So what about worlds with connections.

Lets take worlds that loop.
```Demo
name: Example
w0 <-> w1
w0:
w1:
formula: []p->p
```

Here $T$ holds but only under this specific valuation. Try set $p$ at $w_0$ and see how the model reacts. 

$w_1$ is now false. This is because its connecting world $w_0$ is now a $p$-world but it itself is not. Same idea goes for making $w_1$ a $p$-world and $w_0$ not. The same idea goes for any size loop.

And what about just branching worlds. Well eventually (if they don't loop) you will reach a node with no outgoing edges and we get the situation that $w_3$ had.

There is a more mathematical version of this proof but hopefully this gets the gist across and convinces you.

If you want a slightly different explanation of this proof see [here](https://philosophy.stackexchange.com/questions/86585/how-to-prove-in-modal-logic-that-a%E2%86%92a-is-valid-t-axiom-iff-r-is-reflexive).

## Other frame conditions
I won't do similar style ['proofs']{it wasn't really a proof} for each other frame condition but it is helpful to know the others that are out there.

### Dense (Q) 
$\Box \Box p \to \Box p \iff$ [$wRu \to$]{if world w connects to world u}  [$\exists v(wRv \land vRu)$]{there exists v the connections w->v and v->u} 
```Demo
name: Dense Example
w -> u
w -> v
v -> u
u -> v
w: 
u:
v:
formula: [][]p -> []p
```

More simply put for each connection $wRu$ we can split that connection by putting a world $v$ in the middle creating the path $w \to v \to u$. By doing this though we have created a new connection $wRv$ so for this model to be valid we need to split $w \to v$ by putting another node between them. We can use $u$ to do this creating the path $w \to u \to v$. 

### Transitive (4)
$\Box p \to \Box \Box p \iff wRv \land vRu \to wRu$ 
This is a bit like the dense axiom but in reverse. If there is a path $w \to v$ and $v \to u$ then we can cut out the middle man and have a path $w \to u$.
```Demo
name: Transitive example
w -> v
v -> u
w -> u
w:
u:
v:
formula: []p -> [][]p
```

### Serial (D)
[$\Box p \to$]{If p is neccessary} [$\Diamond a$]{then p is possible} [$\iff$]{if and only if} [$\forall w$]{for all worlds} [$\exists v$]{there exists a v} [$(wRv)$]{such that $w \to v$ is in the relation}   

# Correspondence Theory
