import { describe, test, expect } from "bun:test";
import { ts } from "./languages/ts.ts";
import { json } from "./languages/json.ts";

describe("ts language", () => {
    const keyword = ts.find(r => r.category === "keyword")!;

    test("keyword rule has g flag", () => {
        expect(keyword.pattern.flags).toContain("g");
    });

    test("keyword rule matches reserved words", () => {
        const re = new RegExp(keyword.pattern.source, "g");
        const matches = [..."const x = async function foo() {}".matchAll(re)].map(m => m[0]);
        expect(matches).toContain("const");
        expect(matches).toContain("async");
        expect(matches).toContain("function");
    });
});

describe("json language", () => {
    test("boolean rule matches true and false, not other words", () => {
        const rule = json.find(r => r.category === "boolean")!;
        const re = new RegExp(rule.pattern.source, "g");
        const matches = [..."{ \"a\": true, \"b\": false, \"c\": \"truly\" }".matchAll(re)].map(m => m[0]);
        expect(matches).toContain("true");
        expect(matches).toContain("false");
        expect(matches).not.toContain("truly");
    });
});
