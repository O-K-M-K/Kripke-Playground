// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
function id(x) { return x[0]; }
const grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "main", "symbols": ["_", "IFF", "_"], "postprocess": function(d) {return {type:'main', d:d, v:d[1].v}}},
    {"name": "IFF", "symbols": ["IFF", "_", {"literal":"↔"}, "_", "IMP"], "postprocess": function(d) {return {type:'iff', d:d, v:{op:'<->', l:d[0].v, r:d[4].v}}}},
    {"name": "IFF", "symbols": ["IMP"], "postprocess": id},
    {"name": "IMP", "symbols": ["OR", "_", {"literal":"→"}, "_", "IMP"], "postprocess": function(d) {return {type:'imp', d:d, v:{op:'->', l:d[0].v, r:d[4].v}}}},
    {"name": "IMP", "symbols": ["OR"], "postprocess": id},
    {"name": "OR", "symbols": ["OR", "_", {"literal":"∨"}, "_", "AND"], "postprocess": function(d) {return {type:'or', d:d, v:{op:'\\/', l:d[0].v, r:d[4].v}}}},
    {"name": "OR", "symbols": ["AND"], "postprocess": id},
    {"name": "AND", "symbols": ["AND", "_", {"literal":"∧"}, "_", "UNARY"], "postprocess": function(d) {return {type:'and', d:d, v:{op:'/\\', l:d[0].v, r:d[4].v}}}},
    {"name": "AND", "symbols": ["UNARY"], "postprocess": id},
    {"name": "UNARY", "symbols": [{"literal":"¬"}, "_", "UNARY"], "postprocess": function(d) {return {type:'not', d:d, v:{op:'~', a:d[2].v}}}},
    {"name": "UNARY", "symbols": [{"literal":"□"}, "_", "UNARY"], "postprocess": function(d) {return {type:'box', d:d, v:{op:'[]', a:d[2].v}}}},
    {"name": "UNARY", "symbols": [{"literal":"◇"}, "_", "UNARY"], "postprocess": function(d) {return {type:'diamond', d:d, v:{op:'<>', a:d[2].v}}}},
    {"name": "UNARY", "symbols": ["ATOM"], "postprocess": id},
    {"name": "ATOM", "symbols": [{"literal":"("}, "_", "IFF", "_", {"literal":")"}], "postprocess": function(d) {return {type:'paren', d:d, v:d[2].v}}},
    {"name": "ATOM", "symbols": [{"literal":"⊤"}], "postprocess": function(d) {return {type:'top', d:d, v:{op:'T'}}}},
    {"name": "ATOM", "symbols": [{"literal":"⊥"}], "postprocess": function(d) {return {type:'bot', d:d, v:{op:'F'}}}},
    {"name": "ATOM", "symbols": ["prop"], "postprocess": function(d) {return {type:'prop', d:d, v:{op:'prop', name:d[0].v}}}},
    {"name": "prop$ebnf$1", "symbols": []},
    {"name": "prop$ebnf$1", "symbols": ["prop$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "prop", "symbols": [/[a-z]/, "prop$ebnf$1"], "postprocess": function(d) {return {v: d[0] + d[1].join("")}}},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", /[\s]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(d) {return null}}
]
  , ParserStart: "main"
}
export default grammar
