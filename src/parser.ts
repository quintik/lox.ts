import { Token } from './token';
import { TokenTypes as T, TokenType } from './token-type';
import { Expr, Binary, Unary, Literal, Grouping } from './expr';
import { Lox } from './lox';

export class Parser {
    private tokens: Token[];
    private current: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    public parse() {
        try {
            return this.expression();
        } catch (err) {
            return null;
        }
    }

    private expression() {
        return this.equality();
    }

    private equality() {
        let expr = this.comparison();

        while (this.match(T.BANG_EQUAL, T.EQUAL_EQUAL)) {
            const operator = this.previous();
            const right = this.comparison();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    private comparison() {
        let expr = this.addition();

        while (this.match(T.GREATER, T.GREATER_EQUAL, T.LESS, T.LESS_EQUAL)) {
            const operator = this.previous();
            const right = this.addition();
            expr = new Binary(expr, operator, right)
        }

        return expr;
    }

    private addition() {
        let expr = this.multiplication();

        while (this.match(T.MINUS, T.PLUS)) {
            const operator = this.previous();
            const right = this.multiplication();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    private multiplication() {
        let expr = this.unary();

        while (this.match(T.SLASH, T.STAR)) {
            const operator = this.previous();
            const right = this.unary();
            expr = new Binary(expr, operator, right);
        }

        return expr;
    }

    private unary(): Expr {
        if (this.match(T.BANG, T.MINUS)) {
            const operator = this.previous();
            const right = this.unary();
            return new Unary(operator, right);
        }

        return this.primary();
    }

    private primary() {
        if (this.match(T.FALSE)) return new Literal(false);
        if (this.match(T.TRUE)) return new Literal(true);
        if (this.match(T.NIL)) return new Literal(null);

        if (this.match(T.NUMBER, T.STRING)) {
            return new Literal(this.previous().literal);
        }

        if (this.match(T.LEFT_PAREN)) {
            const expr = this.expression();
            this.consume(T.RIGHT_PAREN, "Expect ')' after expression!");
            return new Grouping(expr);
        }

        throw this.error(this.peek(), "Expect expression!");
    }

    private consume(type: TokenType, message: string) {
        if (this.check(type)) return this.advance();

        throw this.error(this.peek(), message);
    }

    private match(...types: TokenType[]) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }

        return false;
    }

    private check(type: TokenType) {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    private advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private isAtEnd() {
        return this.peek().type === T.EOF;
    }

    private peek() {
        return this.tokens[this.current];
    }

    private previous() {
        return this.tokens[this.current - 1];
    }

    private error(token: Token, message: string) {
        Lox.error(token, message);
        return new Error();
    }

    private synchronize() {
        this.advance();

        while (!this.isAtEnd()) {
            if (this.previous().type === T.SEMICOLON) return;

            switch (this.peek().type) {
                case T.CLASS:
                case T.FUN:
                case T.VAR:
                case T.FOR:
                case T.IF:
                case T.WHILE:
                case T.PRINT:
                case T.RETURN:
                    return;
            }

            this.advance();
        }
    }
}