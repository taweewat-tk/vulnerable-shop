// src/__tests__/flaky.test.ts
// Three different ways a test can be unreliable. Do not "fix" these by
// adding retries — each one has a real root cause.

// --- species 1: timing / async race -------------------------------------
// ROOT CAUSE: the two operations were submitted back to back, each behind its
// own independently jittered setTimeout, and the test then asserted that they
// *landed* in submission order. Timers fire in delay order, so whenever the
// first task drew a longer jitter than the second (~1/3 of runs) the order was
// violated — on any machine, idle or loaded. Submission order was never a
// guarantee, only a coincidence the assertion depended on.
//
// FIX: make the ordering a real dependency instead of a race — await the first
// operation to land before submitting the second. Now the sequence is enforced
// by the code under test, not by which timer happens to be shorter. The jitter
// stays: it no longer has anything to decide.
//
// Lesson: never assert on the completion order of *independent* async work.
// If the order matters, sequence it; if it does not, do not assert on it.
test('flaky/timing: sequenced async operations land in order', async () => {
  const landed: string[] = [];
  const jitterMs = (): number => Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
  const schedule = (label: string): Promise<void> =>
    new Promise((resolve) => {
      setTimeout(() => {
        landed.push(label);
        resolve();
      }, jitterMs());
    });

  await schedule('first');
  await schedule('second');

  expect(landed).toEqual(['first', 'second']);
});

// --- species 2: order dependence ----------------------------------------
// ROOT CAUSE: `sequence` lives at module scope and was never reset, so the two
// tests shared one counter. Each test only passed if it happened to run in the
// position its assertion assumed — `--randomize` shuffles the order, so
// whichever test ran first grabbed id 1 and the other one blew up.
//
// FIX: reset the counter in beforeEach so every test starts from a known
// state, and let each test drive the counter to the value it asserts on
// instead of inheriting it from a sibling. Both tests now pass in any order.
let sequence = 0;
function nextId(): number {
  sequence += 1;
  return sequence;
}

beforeEach(() => {
  sequence = 0;
});

test('flaky/order: hands out the first id', () => {
  expect(nextId()).toBe(1);
});

test('flaky/order: hands out the second id', () => {
  nextId(); // this test owns the first id too — it does not borrow it
  expect(nextId()).toBe(2);
});

// --- species 3: shared mutable state ------------------------------------
// ROOT CAUSE: two problems compounding. The `cache` Map is module scope and
// was never cleared between tests, and each test drew its sku at random from a
// pool of only three values — so the two tests collided on the same key often
// enough to flicker. Whichever ran first seeded the price, and the other one
// then read that leftover instead of the value its assertion expected.
//
// FIX: clear the cache in beforeEach so no state survives a test boundary, and
// give each test its own fixed, distinct sku so the keys can never collide.
// The randomness bought nothing here except a coin flip on the result.
const cache = new Map<string, number>();

function rememberPrice(sku: string, price: number): number {
  if (!cache.has(sku)) cache.set(sku, price);
  return cache.get(sku) as number;
}

beforeEach(() => {
  cache.clear();
});

test('flaky/shared-state: remembers a price for the session', () => {
  const sku = 'SKU-remembered';
  rememberPrice(sku, 100);
  expect(rememberPrice(sku, 250)).toBe(100);
});

test('flaky/shared-state: a new price wins for a fresh sku', () => {
  const sku = 'SKU-fresh';
  expect(rememberPrice(sku, 999)).toBe(999);
});
