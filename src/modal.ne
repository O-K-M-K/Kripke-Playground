# Modal propositional logic grammar for nearley
# Precedence (loosest to tightest binding):
#   IFF (<->)  ->  IMP (->)  ->  OR (\/)  ->  AND (/\)  ->  UNARY (~ [] <>)  ->  ATOM

main -> _ IFF _ {% function(d) {return {type:'main', d:d, v:d[1].v}} %}

# Biconditional (lowest precedence)
IFF -> IFF _ "↔" _ IMP {% function(d) {return {type:'iff', d:d, v:{op:'<->', l:d[0].v, r:d[4].v}}} %}
    | IMP                {% id %}

# Implication (right-associative, single arrow per level here for simplicity)
IMP -> OR _ "→" _ IMP   {% function(d) {return {type:'imp', d:d, v:{op:'->', l:d[0].v, r:d[4].v}}} %}
    | OR                 {% id %}

# Disjunction
OR -> OR _ "∨" _ AND   {% function(d) {return {type:'or', d:d, v:{op:'\\/', l:d[0].v, r:d[4].v}}} %}
    | AND                {% id %}

# Conjunction
AND -> AND _ "∧" _ UNARY {% function(d) {return {type:'and', d:d, v:{op:'/\\', l:d[0].v, r:d[4].v}}} %}
    | UNARY                {% id %}

# Unary operators: negation, box, diamond (right-associative, tightest binding)
UNARY -> "¬" _ UNARY    {% function(d) {return {type:'not', d:d, v:{op:'~', a:d[2].v}}} %}
    | "□" _ UNARY      {% function(d) {return {type:'box', d:d, v:{op:'[]', a:d[2].v}}} %}
    | "◇" _ UNARY      {% function(d) {return {type:'diamond', d:d, v:{op:'<>', a:d[2].v}}} %}
    | ATOM              {% id %}

# Atoms: propositional variables, constants, parenthesized formulas
ATOM -> "(" _ IFF _ ")" {% function(d) {return {type:'paren', d:d, v:d[2].v}} %}
    | "⊤"                {% function(d) {return {type:'top', d:d, v:{op:'T'}}} %}
    | "⊥"                {% function(d) {return {type:'bot', d:d, v:{op:'F'}}} %}
    | prop               {% function(d) {return {type:'prop', d:d, v:{op:'prop', name:d[0].v}}} %}

# A propositional letter: p, q, r, ... optionally with digits/subscript e.g. p1, p2
prop -> [a-z] [0-9]:* {% function(d) {return {v: d[0] + d[1].join("")}} %}

# Whitespace
_ -> [\s]:* {% function(d) {return null} %}
