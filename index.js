const SUCC = {
  0: "1",
  1: "2",
  2: "3",
  3: "4",
  4: "5",
  5: "6",
  6: "7",
  7: "8",
  8: "9",
  9: "0",
};

const PRED = Object.fromEntries(Object.entries(SUCC).map(([k, v]) => [v, k]));

/**
 * @param {string} digit A single character string representing a digit (0-9).
 */
function incrementDigit(digit) {
  const next = SUCC[digit];
  const carry = next === "0" ? true : false;
  return [next, carry];
}

function stripLeadingZeros(number) {
  return number.replace(/^0+/, "") || "0";
}

function addDigits(a, b, carryIn = false, carry = false) {
  if (carryIn) {
    const [aWithCarry, carryOut] = incrementDigit(a);
    return addDigits(aWithCarry, b, false, carryOut);
  }
  if (b === "0") {
    return [a, carry];
  }
  const [incrementedA, aCarry] = incrementDigit(a);
  return addDigits(incrementedA, PRED[b], false, carry || aCarry);
}

const trampoline =
  (fn) =>
  (...args) => {
    let result = fn(...args);
    while (typeof result === "function") {
      result = result();
    }
    return result;
  };

function decrementThunk(number) {
  const stripNumber = stripLeadingZeros(number);
  // No negative numbers supported
  if (stripNumber === "1" || stripNumber === "0") {
    return "0";
  }
  const lastDigit = stripNumber.at(-1);
  if (lastDigit !== "0") {
    return stripNumber.slice(0, -1) + PRED[lastDigit];
  }
  return () => {
    const prefix = decrementThunk(stripNumber.slice(0, -1));
    return (typeof prefix === "function" ? prefix() : prefix) + "9";
  };
}
const decrement = trampoline(decrementThunk);

function addThunked(a, b, carry = false, result = "") {
  const maxLength = Math.max(a.length, b.length);
  const padA = a.padStart(maxLength, "0");
  const padB = b.padStart(maxLength, "0");
  const [leastSignificantResult, carried] = addDigits(
    padA.at(-1),
    padB.at(-1),
    carry,
  );
  if (maxLength === 1) {
    const carryPrefix = carried ? "1" : "";
    return carryPrefix + leastSignificantResult + result;
  }
  return () =>
    addThunked(
      padA.slice(0, -1),
      padB.slice(0, -1),
      carried,
      leastSignificantResult + result,
    );
}

function repeatAddThunked(a, b, times) {
  if (times === "0") {
    return a;
  }
  const nextA = add(a, b);
  const nextTimes = decrement(times);
  return () => repeatAdd(nextA, b, nextTimes);
}
const repeatAdd = trampoline(repeatAddThunked);

function multiplyThunked(a, b, pos = 0, result = "0") {
  const stripA = stripLeadingZeros(a);
  const stripB = stripLeadingZeros(b);
  if (stripB === "0") {
    return stripLeadingZeros(result);
  }
  const d = stripB.at(-1);
  const partialNoShift = repeatAdd("0", stripA, d);
  const partial = partialNoShift + "0".repeat(pos);

  const nextResult = add(result, partial);
  const nextB = stripB.slice(0, -1);

  return () => multiplyThunked(a, nextB, pos + 1, nextResult);
}

function assertEqual(actual, expected) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: expected ${expected}, got ${actual}`);
  }
}

/**
 * A function to multiply two non-negative integers represented as strings.
 * @param {string} a A string representing a non-negative integer (e.g., "123").
 * @param {string} b A string representing a non-negative integer (e.g., "456").
 * @return {string} The product of the two integers as a string.
 */
export const multiply = trampoline(multiplyThunked);

/**
 * A function to add two non-negative integers represented as strings.
 * @param {string} a A string representing a non-negative integer (e.g., "123").
 * @param {string} b A string representing a non-negative integer (e.g., "456").
 * @return {string} The sum of the two integers as a string.
 */
export const add = trampoline(addThunked);

// Basic tests
function test() {
  assertEqual(add("123", "456"), "579");
  assertEqual(add("999", "1"), "1000");
  assertEqual(add("0", "0"), "0");
  assertEqual(add("500", "500"), "1000");
  assertEqual(
    add("12345678901234567890", "98765432109876543210"),
    "111111111011111111100",
  );

  assertEqual(multiply("123", "456"), "56088");
  assertEqual(multiply("0", "12345"), "0");
  assertEqual(multiply("999", "999"), "998001");
  assertEqual(multiply("123456789", "987654321"), "121932631112635269");
  assertEqual(
    multiply("12345678901234567890", "98765432109876543210"),
    "1219326311370217952237463801111263526900",
  );
}
