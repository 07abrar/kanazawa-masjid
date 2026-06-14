export function generateChallenge() {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  const ops = [
    { question: `${a} + ${b}`, answer: a + b },
    { question: `${a + b} - ${b}`, answer: a },
    { question: `${a} × ${b}`, answer: a * b },
  ]
  return ops[Math.floor(Math.random() * ops.length)]
}
