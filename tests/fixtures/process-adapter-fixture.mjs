let input = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) input += chunk;

const request = JSON.parse(input);

switch (request.mode) {
  case "malformed":
    process.stdout.write("not-json\n");
    break;
  case "exit":
    process.stderr.write("fixture exit\n");
    process.exit(7);
    break;
  case "structured-exit":
    process.stdout.write(`${JSON.stringify({
      schema: "fixture/process-response/v0.1",
      ok: false,
      error: { code: "DONOR_REFUSAL" },
    })}\n`);
    process.exitCode = 9;
    break;
  case "oversize":
    process.stdout.write("x".repeat(4096));
    break;
  case "hang":
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    break;
  default:
    process.stdout.write(`${JSON.stringify({
      schema: "fixture/process-response/v0.1",
      ok: true,
      value: request.value ?? null,
      argv: process.argv.slice(2),
    })}\n`);
}
