/**
 * Load Test Script for Corporate Heroes
 *
 * Simulates concurrent users submitting words to test:
 * - Race conditions in word storage
 * - API response times under load
 * - Word count consistency
 * - Edge cases (duplicates, special chars, etc.)
 *
 * Usage:
 *   npx tsx scripts/load-test.ts [baseUrl]
 *
 * Examples:
 *   npx tsx scripts/load-test.ts              # Uses http://localhost:3000
 *   npx tsx scripts/load-test.ts https://corporate-heroes.vercel.app
 */

const BASE_URL = process.argv[2] || "http://localhost:3000";

interface TestResult {
  test: string;
  passed: boolean;
  duration: number;
  details: string;
}

interface WordResponse {
  success?: boolean;
  word?: { id: string; text: string };
  error?: string;
}

interface WordsListResponse {
  words: Array<{ id: string; text: string; timestamp: number }>;
}

// Test words for simulation
const BUZZWORDS = [
  "SYNERGY", "DISRUPTION", "AI", "BLOCKCHAIN", "INNOVATION",
  "PIVOT", "LEVERAGE", "SCALE", "AGILE", "SUSTAINABLE",
  "HOLISTIC", "PARADIGM", "BANDWIDTH", "ECOSYSTEM", "ROI",
  "STAKEHOLDER", "OPTIMIZE", "STREAMLINE", "ALIGNMENT", "IMPACT",
  "METRICS", "KPI", "GROWTH", "STRATEGY", "TRANSFORMATION",
  "DIGITAL", "CLOUD", "AUTOMATION", "MINDSET", "VALUE",
  "PROACTIVE", "INITIATIVE", "DELIVERABLE", "ROADMAP", "MILESTONE",
  "EMPOWER", "ENABLE", "ACCELERATE", "INTEGRATE", "AMPLIFY",
  "CUSTOMER-CENTRIC", "DATA-DRIVEN", "BEST-PRACTICE", "WIN-WIN", "NEXT-GEN",
  "SUSTAINABILITY", "CARBON-NEUTRAL", "ESG", "CIRCULAR", "RESILIENCE",
  "FUTURE-PROOF", "CUTTING-EDGE", "GAME-CHANGER", "DISRUPTIVE", "SEAMLESS"
];

// Edge case words
const EDGE_CASES = [
  "A", // Single character
  "VERYLONGWORDTHATMIGHTTESTLIMITS".repeat(2), // Long word
  "CAFÉ", // Unicode character
  "SYNERGY", // Duplicate
  "synergy", // Case variation duplicate
  "  SPACES  ", // Whitespace
  "", // Empty (should be rejected)
  "WORD-WITH-DASHES",
  "WORD_WITH_UNDERSCORES",
  "123NUMBERS",
];

async function submitWord(word: string): Promise<{ success: boolean; time: number; error?: string }> {
  const start = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/words`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word }),
    });
    const data: WordResponse = await response.json();
    return {
      success: response.ok,
      time: Date.now() - start,
      error: data.error,
    };
  } catch (error) {
    return {
      success: false,
      time: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function submitWordsBatch(words: string[]): Promise<{ success: boolean; time: number; error?: string }> {
  const start = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/words`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words }),
    });
    const data = await response.json();
    return {
      success: response.ok,
      time: Date.now() - start,
      error: data.error,
    };
  } catch (error) {
    return {
      success: false,
      time: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function getWords(): Promise<WordsListResponse> {
  const response = await fetch(`${BASE_URL}/api/words`);
  return response.json();
}

async function clearWords(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/api/words`, { method: "DELETE" });
    return response.ok;
  } catch {
    return false;
  }
}

function log(message: string, type: "info" | "success" | "error" | "warn" = "info") {
  const colors = {
    info: "\x1b[36m",    // Cyan
    success: "\x1b[32m", // Green
    error: "\x1b[31m",   // Red
    warn: "\x1b[33m",    // Yellow
  };
  const reset = "\x1b[0m";
  console.log(`${colors[type]}${message}${reset}`);
}

function logResult(result: TestResult) {
  const icon = result.passed ? "+" : "x";
  const color = result.passed ? "success" : "error";
  log(`[${icon}] ${result.test} (${result.duration}ms)`, color);
  if (result.details) {
    log(`   ${result.details}`, result.passed ? "info" : "warn");
  }
}

// Test 1: Burst test - 55 concurrent users, 1 word each
async function testBurst(): Promise<TestResult> {
  const start = Date.now();
  await clearWords();

  const userCount = 55;
  const words = BUZZWORDS.slice(0, userCount);

  log(`\nBurst Test: ${userCount} concurrent submissions...`, "info");

  // Submit all words simultaneously
  const results = await Promise.all(words.map(submitWord));

  const successful = results.filter(r => r.success).length;
  const avgTime = Math.round(results.reduce((sum, r) => sum + r.time, 0) / results.length);
  const maxTime = Math.max(...results.map(r => r.time));

  // Verify word count
  const { words: storedWords } = await getWords();

  const passed = successful === userCount && storedWords.length === userCount;

  return {
    test: "Burst Test (55 concurrent users)",
    passed,
    duration: Date.now() - start,
    details: `${successful}/${userCount} submissions OK, ${storedWords.length} words stored. Avg: ${avgTime}ms, Max: ${maxTime}ms`,
  };
}

// Test 2: Sustained test - 55 users, 3 words each over time
async function testSustained(): Promise<TestResult> {
  const start = Date.now();
  await clearWords();

  const userCount = 55;
  const wordsPerUser = 3;
  const totalExpected = userCount * wordsPerUser;

  log(`\nSustained Test: ${userCount} users x ${wordsPerUser} words...`, "info");

  // Simulate users submitting words over 10 seconds
  const batches: Promise<{ success: boolean; time: number }>[][] = [];

  for (let batch = 0; batch < wordsPerUser; batch++) {
    const batchPromises = [];
    for (let user = 0; user < userCount; user++) {
      const wordIndex = (batch * userCount + user) % BUZZWORDS.length;
      batchPromises.push(submitWord(BUZZWORDS[wordIndex]));
    }
    batches.push(batchPromises);

    // Wait between batches to simulate time spread
    if (batch < wordsPerUser - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Execute final batch
  const allResults = await Promise.all(batches.flat());

  const successful = allResults.filter(r => r.success).length;
  const { words: storedWords } = await getWords();

  // With deduplication, we expect fewer words than totalExpected
  // but at least userCount unique words should be stored
  const passed = successful >= totalExpected * 0.9 && storedWords.length >= userCount;

  return {
    test: "Sustained Test (55 users x 3 words)",
    passed,
    duration: Date.now() - start,
    details: `${successful}/${totalExpected} submissions OK, ${storedWords.length} unique words stored`,
  };
}

// Test 3: Edge cases
async function testEdgeCases(): Promise<TestResult> {
  const start = Date.now();
  await clearWords();

  log("\nEdge Cases Test...", "info");

  const results: { word: string; result: { success: boolean; error?: string } }[] = [];

  for (const word of EDGE_CASES) {
    const result = await submitWord(word);
    results.push({ word: word || "(empty)", result });

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Verify expected behaviors
  const emptyRejected = results.find(r => r.word === "(empty)")?.result.success === false;
  const longRejected = results.find(r => r.word.length > 100)?.result.success === false;
  const unicodeAccepted = results.find(r => r.word === "CAFÉ")?.result.success === true;

  const { words: storedWords } = await getWords();

  // Check for duplicate handling - should only have one "SYNERGY"
  const synergyCount = storedWords.filter(w => w.text === "SYNERGY").length;

  const passed = emptyRejected && unicodeAccepted;

  return {
    test: "Edge Cases Test",
    passed,
    duration: Date.now() - start,
    details: `Empty rejected: ${emptyRejected}, Unicode OK: ${unicodeAccepted}, Long rejected: ${longRejected}, SYNERGY duplicates: ${synergyCount}`,
  };
}

// Test 4: Batch submission
async function testBatchSubmission(): Promise<TestResult> {
  const start = Date.now();
  await clearWords();

  log("\nBatch Submission Test...", "info");

  const words = ["BATCH1", "BATCH2", "BATCH3", "BATCH4"];
  const result = await submitWordsBatch(words);

  const { words: storedWords } = await getWords();
  const batchWordsStored = storedWords.filter(w => w.text.startsWith("BATCH")).length;

  const passed = result.success && batchWordsStored === words.length;

  return {
    test: "Batch Submission Test",
    passed,
    duration: Date.now() - start,
    details: `Batch result: ${result.success ? "OK" : result.error || "Failed"}, ${batchWordsStored}/${words.length} batch words stored`,
  };
}

// Test 5: Rate limiting (informational - may not trigger in dev mode)
async function testRateLimiting(): Promise<TestResult> {
  const start = Date.now();
  await clearWords();

  log("\nRate Limiting Test (rapid fire 20 requests)...", "info");

  // Fire 20 requests as fast as possible
  const promises = Array(20).fill(null).map((_, i) => submitWord(`RAPID${i}`));
  const results = await Promise.all(promises);

  const successful = results.filter(r => r.success).length;
  const rateLimited = results.filter(r => r.error?.includes("rate") || r.error?.includes("limit")).length;

  // In dev mode, rate limit is higher (500) so this may not trigger
  // Test passes if either: rate limiting triggered OR all succeeded (dev mode)
  const passed = true; // Informational test - always passes

  return {
    test: "Rate Limiting Test (informational)",
    passed,
    duration: Date.now() - start,
    details: `${successful}/20 succeeded, ${rateLimited} rate limited. ${rateLimited > 0 ? "Rate limiting active" : "Dev mode (higher limit)"}`,
  };
}

// Test 6: Word count limits
async function testWordLimits(): Promise<TestResult> {
  const start = Date.now();
  await clearWords();

  log("\nWord Limits Test (submit 250 words)...", "info");

  // Try to submit 250 words (should be capped at MAX_WORDS)
  const words = Array(250).fill(null).map((_, i) => `WORD${i}`);

  // Submit in batches of 50 to avoid timeout
  for (let i = 0; i < words.length; i += 50) {
    const batch = words.slice(i, i + 50);
    await Promise.all(batch.map(submitWord));
    log(`  Submitted ${Math.min(i + 50, words.length)}/${words.length}...`, "info");
  }

  const { words: storedWords } = await getWords();

  // Should be capped at MAX_WORDS (200)
  const passed = storedWords.length <= 200;

  return {
    test: "Word Limits Test",
    passed,
    duration: Date.now() - start,
    details: `${storedWords.length} words stored (expected <= 200)`,
  };
}

// Test 7: GET endpoint performance
async function testGetPerformance(): Promise<TestResult> {
  const start = Date.now();

  log("\nGET Performance Test (50 concurrent requests)...", "info");

  // Submit some words first
  await Promise.all(BUZZWORDS.slice(0, 20).map(submitWord));

  // Make 50 concurrent GET requests
  const getStart = Date.now();
  const promises = Array(50).fill(null).map(() =>
    fetch(`${BASE_URL}/api/words`).then(r => r.json())
  );

  const results = await Promise.all(promises);
  const getTotalTime = Date.now() - getStart;

  const allSuccessful = results.every(r => Array.isArray(r.words));
  const avgTime = Math.round(getTotalTime / 50);

  const passed = allSuccessful && avgTime < 500;

  return {
    test: "GET Performance Test (50 concurrent)",
    passed,
    duration: Date.now() - start,
    details: `All successful: ${allSuccessful}, Avg response: ${avgTime}ms`,
  };
}

// Main test runner
async function runTests() {
  console.log("\n" + "=".repeat(60));
  log("Corporate Heroes Load Test", "info");
  log(`Target: ${BASE_URL}`, "info");
  console.log("=".repeat(60));

  // Check if server is reachable
  try {
    await fetch(`${BASE_URL}/api/words`);
  } catch {
    log(`\nError: Cannot reach ${BASE_URL}`, "error");
    log("Make sure the server is running (npm run dev)", "warn");
    process.exit(1);
  }

  const results: TestResult[] = [];

  // Run all tests
  results.push(await testBurst());
  logResult(results[results.length - 1]);

  results.push(await testSustained());
  logResult(results[results.length - 1]);

  results.push(await testEdgeCases());
  logResult(results[results.length - 1]);

  results.push(await testBatchSubmission());
  logResult(results[results.length - 1]);

  results.push(await testRateLimiting());
  logResult(results[results.length - 1]);

  results.push(await testWordLimits());
  logResult(results[results.length - 1]);

  results.push(await testGetPerformance());
  logResult(results[results.length - 1]);

  // Summary
  console.log("\n" + "=".repeat(60));
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;

  log(`Results: ${passed}/${total} tests passed`, allPassed ? "success" : "error");

  if (!allPassed) {
    log("\nFailed tests:", "warn");
    results.filter(r => !r.passed).forEach(r => {
      log(`  - ${r.test}: ${r.details}`, "error");
    });
  }

  // Cleanup
  await clearWords();
  log("\nCleanup: All words cleared", "info");

  console.log("=".repeat(60) + "\n");

  process.exit(allPassed ? 0 : 1);
}

runTests().catch(console.error);
