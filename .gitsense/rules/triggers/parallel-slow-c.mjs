// Parallel execution test trigger C
// Sleeps 1500ms then returns a notice

const start = Date.now();
await new Promise(resolve => setTimeout(resolve, 1500));
const elapsed = Date.now() - start;

console.log(JSON.stringify({
  matched: true,
  block: false,
  notice: `parallel-slow-c completed (${elapsed}ms actual, 1500ms target)`
}));
