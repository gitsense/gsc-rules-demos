// Parallel execution test trigger B
// Sleeps 1000ms then returns a notice

await new Promise(resolve => setTimeout(resolve, 1000));

console.log(JSON.stringify({
  matched: true,
  block: false,
  notice: "parallel-slow-b completed (1000ms delay)"
}));
