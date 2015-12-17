var fs = require('fs');
var UglifyJS = require('uglify-js');


var dot2Sub = new UglifyJS.TreeTransformer(null, function(node){

        if (node instanceof UglifyJS.AST_Sub) {
            //console.log(node);
            //console.log("sub");
        }


    if (node instanceof UglifyJS.AST_Dot) {
        //console.log(node);
        new_node = new UglifyJS.AST_Sub({
            property: new UglifyJS.AST_String({
                quote: '"',
                value: node.property
            }),
            expression: node.expression
        });
        //console.log(node.expression.name)
        //console.log(new_node);
        //    console.log("sub_new");
        return new_node;
    }
});


// in this hash we will map string to a variable name
var strings = {};

// here's the transformer:
var consolidate = new UglifyJS.TreeTransformer(null, function(node){
    if (node instanceof UglifyJS.AST_Toplevel) {
        // since we get here after the toplevel node was processed,
        // that means at the end, we'll just create the var definition,
        // or better yet, "const", and insert it as the first statement.
        var defs = new UglifyJS.AST_Const({
            definitions: Object.keys(strings).map(function(key){
                var x = strings[key];
                return new UglifyJS.AST_VarDef({
                    name  : new UglifyJS.AST_SymbolConst({ name: x.name }),
                    value : x.node, // the original AST_String
                });
            })
        });
        node.body.unshift(defs);
        return node;
    }
    if (node instanceof UglifyJS.AST_String) {
        // when we encounter a string, we give it an unique
        // variable name (see the getStringName function below)
        // and return a symbol reference instead.
        return new UglifyJS.AST_SymbolRef({
            start : node.start,
            end   : node.end,
            name  : getStringName(node).name,
        });
    }
});

var count = 0;
function getStringName(node) {
    var str = node.getValue(); // node is AST_String
    if (strings.hasOwnProperty(str)) return strings[str];
    var name = "$OB_" + (++count);
    console.log("in" + str);
    return strings["$DEF_" + str] = { name: name, node: node };
}

var ast = null;
(function(file){
    var code = fs.readFileSync(file, "utf8");
    ast = UglifyJS.parse(code);
})("pointman.js");

var ast2 = ast;
var ast2 = ast.transform(dot2Sub);
// transform and print
var ast2 = ast2.transform(consolidate);


console.log(ast2.print_to_string({ beautify: true }));

