// Parallel execution test trigger A
// Sleeps 500ms then returns a notice

const start = Date.now();
await new Promise(resolve => setTimeout(resolve, 500));
const elapsed = Date.now() - start;

console.log(JSON.stringify({
  matched: true,
  block: false,
  notice: `parallel-slow-a completed (${elapsed}ms actual, 500ms target)`
}));
