# Arithmestring

This library does addition and multiplication on strings.

It never converts them to numbers under the hood.

Negative numbers are not supported.

Very useful.

```js
import { add, multiply } from "arithmestring";

console.log(add("123", "456")); // "579"
console.log(multiply("99", "99")); // "9801"
```
