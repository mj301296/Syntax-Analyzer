const fs = require('fs');
const input = fs.readFileSync(0, 'utf8')
var line = '';
var lines = input.split("\n"); //to convert multi line input to to a single line input
for (var i = 0; i < lines.length; i++) {
    line += " " + lines[i].trim();
}
line = line.substring(1);
function lexer(expr) {
    const tokens = [];
    let s;
    for (let m = expr; m.length > 0; m = m.slice(s[0].length)) {
        if (s = m.match(/^[ \t]+/)) { //s starts with linear whitespace
            continue; //skip linear whitespace
        }
        else if (s = m.match(/^\d+/)) { //one or more digits
            tokens.push(new Token('INT', s[0]));
        }
        else if (s = m.match(/^./)) {  //any single char
            tokens.push(new Token(s[0], s[0]));
        }
    }
    return tokens;
}
class Token {
    constructor(kind, lexeme) {
        Object.assign(this, { kind, lexeme });
    }
}

class Parser {
    constructor(tokens) {
        this._tokens = tokens;
        this._index = 0;
        this.lookahead = this._nextToken();
    }
    parse() {
        try {
            let result = this.val();
            if (!this.check('EOF')) {
                const msg = `error: expecting 'EOF' but got '${this.lookahead.lexeme}'`;
                throw new SyntaxError(msg);

            }
            return result;
        }
        catch (err) {
            return err.message;
        }
    }
    check(kind) {
        return this.lookahead.kind === kind;
    }
    match(kind) {
        if (this.check(kind)) {
            this.lookahead = this._nextToken();
        }
        else {
            const msg = `error: expecting '${kind}' but got '${this.lookahead.lexeme}'`;
            throw new SyntaxError(msg);
        }
    }
    _nextToken() {
        if (this._index < this._tokens.length) {
            return this._tokens[this._index++];
        }
        else {
            return new Token('EOF', '<EOF>');
        }
    }

    /*   val
     : INT
     | '{' initializers '}'
     ;*/

    val() {
        if (this.check('INT')) {
            const tok = this.lookahead;
            this.match('INT');
            return Number.parseInt(tok.lexeme);
        }
        else {
            this.match('{');
            const e = this.initializers();
            this.match('}');
            return e;
        }
    }
    /* initializers
       : initializer ( ',' initializer )* ','? //optional comma after last init
       | //empty
       ;*/
    initializers() {
        let i = [];
        let temp = [];
        if (this.lookahead.kind != 'EOF') {
            if (this.check('}')) {      //for '{}' return empty array
                return i;
            }
            temp = this.initializer(); //call 1st initilizer and push it's output into a array
            if (temp[0] == 'V') {
                i.push(temp[3]);
            }
            else if (temp[0] = 'S') {
                let terminator = temp[2];
                if (temp[2] < temp[1]) { //use the highest index for further processing
                    terminator = temp[1];
                }
                for (let pos = 0; pos < (terminator + 1); pos++) {
                    if (pos == (temp[1])) {
                        if (i[pos] == null) {
                            i.push(temp[3]);
                        }
                        else {
                            i[pos] = temp[3]; //to override the previous value
                        }
                        if (temp[2] != 0) {

                            while (pos < temp[2]) {//for range push data till end of 2nd index
                                pos++;
                                i.push(temp[3]);
                            }
                        }
                        break;
                    }
                    else if (i[pos] == null) {//insert 0 till index is reached
                        i.push(0);
                    }
                }
            }
            while (this.check(',')) { //for 0 or more iterations call identifier only if , is found
                const tok = this.lookahead;
                const op = tok.lexeme;
                this.match(tok.kind);
                if (this.check('}')) {//for last trailing comma
                    break;
                }
                let temp2 = [];
                temp2 = this.initializer();
                if (temp2[0] == 'V') {
                    i.push(temp2[3]);
                }
                else if (temp2[0] = 'S') {
                    let terminator = temp2[2];
                    if (temp2[2] < temp2[1]) {//use the highest index for further processing
                        terminator = temp2[1];
                    }
                    for (let pos = 0; pos < (terminator + 1); pos++) {
                        if (pos == (temp2[1])) {
                            if (i[pos] == null) {
                                i.push(temp2[3]);
                            }
                            else {
                                i[pos] = temp2[3]; //to override the previous value
                            }
                            if (temp2[2] != 0) {
                                while (pos < temp2[2]) {//for range push data till end of 2nd index
                                    pos++;
                                    i.push(temp2[3]);
                                }
                            }
                            break;
                        }
                        else if (i[pos] == null) {//insert 0 till index is reached
                            i.push(0);
                        }
                    }
                }
            }
        }
        else {
            this.match(' ')
            i.push(' ');
        }
        return i;
    }

    /*  initializer
     : '[' INT '] '=' val              //simple designated initializer[3]=5
     | '[' INT '...' INT ']' '=' val   //range designated initializer
     | val                             //positional initializer
     ;
    */
    initializer() {
        let inti = [];
        if (this.check('[')) {
            this.match('[');
            const tok = this.lookahead;
            let tok3 = 0;
            let flag = 0;
            this.match('INT');
            if (this.check('.')) {
                flag = 1;
                this.match('.');
                this.match('.');
                this.match('.');
                tok3 = this.lookahead.lexeme;
                this.match('INT');
            }
            this.match(']');
            this.match('=');
            //return in format ['IDENTIFIER', 'START INDEX', 'END INDEX', 'VALUE']
            // IDENTIFIER: V = INT value , S = Simple and range designated value
            if (flag) {
                inti = ['S', Number.parseInt(tok.lexeme), Number.parseInt(tok3), this.val()];
            }
            else {
                inti = ['S', Number.parseInt(tok.lexeme), 0, this.val()];
            }
            return inti;
        }
        else {
            let inti2 = ['V', ' ', ' ', this.val()];
            return inti2;
        }
    }
}

const tokens = lexer(line);
const out = [];
let result;
result = new Parser(tokens).parse();
if (typeof result == 'string') { //error is returned in string type
    fs.writeFileSync(2, result);
    process.abort();
}
else {
    console.log(result);
}