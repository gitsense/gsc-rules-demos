// Parallel execution test trigger B
// Sleeps 1000ms then returns a notice

const start = Date.now();
await new Promise(resolve => setTimeout(resolve, 1000));
const elapsed = Date.now() - start;

console.log(JSON.stringify({
  matched: true,
  block: false,
  notice: `parallel-slow-b completed (${elapsed}ms actual, 1000ms target)`
}));
