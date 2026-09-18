# Modal Logic
*Note: This sections assumes a foundational understanding of propositional logic*

Before we get into the exciting graphy stuff on the left we need to understand what modal logic is. 

The *modal* in Modal Logic refers to **modality** meaning: 'a particular way in which something is done, experienced, or exists'. From this, without knowing anything about modal logic itself, we can make an educated guess that modal logic is something to do about the ways in which a thing might be true.  

Modal logic is a logic that extends prop logic by adding two new symbols. $\Box$ meaning **necessity**. $\Diamond$ meaning **possibility**. If $P$ is a valid proposition in propositional logic then $\Box P$ means *it is necessary that p*.  

> There are lots of different kinds of necessity. It is humanly impossible for me to run at 100mph. Given the sorts of creatures that we are, no human can do that. But still, it isn’t physically impossible for me to run that fast. We haven’t got the technology to do it yet, but it is surely physically possible to swap my biological legs for robotic ones which could run at 100mph. By contrast, it is physically impossible for me to run faster than the speed of light. The laws of physics forbid any object from accelerating up to that speed. But even that isn’t logically impossible. It isn’t a contradiction to imagine that the laws of physics might have been different, and that they might have allowed objects to move faster than light.

\- [Introducing modal logic](https://forallx.openlogicproject.org/html/Ch42.html) 

We could write the previous sentences about impossibility in modal logic like this:
($¬$){Not}($\Diamond$){possible}($A$){for me to run 100mph} where our interpretation of $\Diamond$ is in relation to humanly, physically or logically in each case. It is (not){$¬$} (humanly possible){$\Diamond$} (for me to run 100mph){$A$}


The first interesting thing to recognise about our new opperators is that they are (intuitively connected to each other){this leads to the idea of duals but thats for another time}. 

($\Diamond$){It is possible that} ($p$){I will wear a hat} ($\leftrightarrow$){if and only if} ($¬\Box$){it is not necessary/it is optional} ($¬p$){that I will not wear a hat/for me to not wear a hat} 

($\Box$){It is necessary that} ($p$){I will wear a hat} ($\leftrightarrow$){if and only if} ($¬\Diamond$){it is impossible} ($¬p$){that I will not wear a hat} 

This leads us nicely to the following vague semantic interpretations:

$\Box$ - Necessary

$¬\Box$ - Optional/not necessary

$\Diamond$ - Possible

$¬\Diamond$ impossible/not possible





# Kripke Frames and Models

## Frames
A Kripke frame is a pair is a triple ($\langle W, R, V \rangle$){the angle brackets just mean an ordered pair} where $W$ is a set and $R$ is a (binary relation){associates some elements of set A with some elements of set B} and $V$ is our (valuation function){takes in a prop and returns the worlds where our prop is true}. Elements of $W$ are called worlds, these are the nodes in our graph on the left. $R$ is called the accessibility relation, think of each relation $(w_0,w_1)$ as a edge between $w0$ and $w1$ in our graph. ($V$){our function name} ($:$){has type} ($\text{Prop}$){a simple proposition e.g., $p$} $\to$ ($\mathcal{P}(W)$){powerset of W}. For example if $\text{raining}$ was true at $w0$ and $w2$ but not $w1$ then $V(\text{raining})=\{w0,w2\}$

## Models
A Kripke model adds $\Vdash$ to our pair making it the triplet $\langle W,R,\Vdash \rangle$. $\Vdash$ is know as the *satisfaction relation*, a relation between worlds in $W$ and and modal logic formulas. $w \Vdash A$ is read as "w satisfies A". All this lets us represent is that some modal formula $A$ we have written is satisfied by a world. 

So we have three Items, a set of worlds ($W$){the nodes in our graph}, a binary relation ($R$){the edges of our graph}, and the satisfaction relation $\Vdash$. 


We define $w \Vdash A$ as ($w$){some world in our model} ($\Vdash$){satisfies} ($p$){some proposition} ($\leftrightarrow$){if and only if} ($p$){that same proposition} ($\in$){is in} ($V(w)$){the set of propositions our valuation function returns for the given world}

Click the button below for the simplest example of this
```Demo
name: Click me!
w0: p
formula: p
```

$w \Vdash ¬A \iff w \not\Vdash A$
$w \Vdash A \to B \iff w \not\Vdash A \lor w \Vdash B$

$w \Vdash \Box A \iff u \Vdash A$ forall $u$ such that $w R u$   
That is to say $\Box A$ holds when $A$ is true in **all** worlds accessible from $w$

$w \Vdash \Diamond A \iff u \Vdash A$ there exists $u$ such that $wRu$  
That is to say $\Diamond A$ holds when $A$ is true in at least one world accessible from $w$.

Kripke models can be represented as **directed graphs** hence the setup on the left hand side. The following section gently introduces modal logic in conjunction with Kripke Models with examples.
### Aside
If at this point you are wondering why we haven't defined the other operators it is because we can build all the other operators in prop logic from those 4. I didn't even need to define $\Diamond$ as 
($\Diamond p$){it is possible that p} = ($¬\Box¬p$){it is not necessary that p has to be true}

I wont demonstrate the rest here you will just have to trust me.

(From here we can just unwrap the formula using recursion to check if the world satisfies it.){glossed over a full explanation here but its not relevant at the moment so don't worry if you don't get it.}


## Examples

```demo
name: Click me
w0 -> w1
w0:
w1: p
formula: p
```

We can build the following (kripke frame){$\langle W, R, V \rangle$}  
$$
\begin{align}
W &= \{w_0,w_1\} \\
R &= \{(w_0,w_1)\} \\
V(w_0)&=\emptyset\\
V(w_1)&=\{p\}
\end{align}
$$
Create our formula $A$.
$$
A = p
$$
We then get
$$
\begin{align}
w_0 \not\Vdash A \\
w_1 \Vdash A 
\end{align}
$$
This intuitively makes sense. $p$ is there at $w_1$ and not there at $w_0$.

If we changed our formula to $A = \Box p$ see what happens to the model:

```demo
name: Click me!
w0 -> w1
w0:
w1: p
formula: []p
```

Lets work through why it gives the result it does.

Remember our definition of $\Box p$ was that $p$ has to hold for all worlds connecting to the original world. From $w0$ the only connecting world, $w1$, is a world where $p$ is true. That is why $w_1 \Vdash A$ but what about $w_0$? Our definition does not say that $p$ needs to also hold at $w_0$ just that all connecting worlds to it need to have $p$. 

Now try this example:
```demo
name: Click me!
w0 -> w1
w0 -> w2
w0:
w1: p
w2:
formula: []p
```

See how $w_0$ now turns red, that is to say $w_0 \not\Vdash A$. This is because at our newly introduced world $w_2$ $p$ is (false){because its not at the world}. Also notice how $w_2$ is green, that is to say $w_2 \Vdash A$. This is because $w_2$ has no worlds connected to it so trivially it must be true.



# Semantics
Semantics refer to the meaning of a word, symbol or sentence. In our case we have defined the semantics of $\Box$ to be *necessary* but nothing stops us from interpreting it in the context of time and calling it *globally* meaning *across all time periods*. This idea of being able to change the assigned meanings to symbols will come in useful later.

[Ross Kirsling](https://rkirsling.github.io/modallogic/) provides a good linguistic example.

> It **must** have rained overnight. This is an example of *epistemic* logic as it is talking about worlds consistent with one's knowledge. 
> 
> You **must** arrive before noon is *deontic* logic as it is talking about worlds consistent with one's obligations. There is a world where you arrived after noon and as such the proposition does not hold at that world.
> 
> All these sentences can be represented as $\Box p$ but the box operator has a different semantic interpretation in each case.


Currently we are using the word *world* but we haven't really defined what we mean by that. What does it mean for there to be another *world*? This is intentional as we can assign different meanings to what *world* means in our model allowing us to talk about vastly different things. For example each *world* could represent a (point in time){as in linear temporal logic} or could represent them as (worlds consistent with ones knowledge){epistemic logic} or as (worlds consisten with ones obligations){deontic logic}.


# Exercise
What does this mean?
$$
\Diamond \Box p \to \Box \Diamond p 
$$
If it is possible that it is necessary that it rains then it is neccessary that it is possible it rains


![[Pasted image 20260917163935.png]]

$w_1$ we start with $\Box p$. Does every successor satisfy $p$ yes. $\Diamond \Box p$ does some successor satisfy $\Box p$ yes because $w_5$ and $w_6$ do. 
Ok so we go to the second bit
$\Box \Diamond p$ 

Does at least one sucsessor satisfy $p$. Yes $w_5$ . Does every sucsessor satisfy $\Diamond p$ . $w_5$ does not satisfy it so its false.

$w_0$ we start with $\Diamond \Box p$ .

$p$ is true at $w_1$ so $\Box p$ is true. Then its asking if at least one successor satisfies $\Box p$ which $w_1$ does. So we now move to the then side of the statmement. Because the left side was true the right side must be true for the overall statement to be true.

$\Diamond p$ is asking if at least one sucsessor satisfies $p$ which $w_0$ does. $\Box \Diamond p$ is asking if every sucsessor satisfies that so yes. 