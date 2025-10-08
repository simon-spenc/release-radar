/**
 * Test script for LLM summarization
 * Run with: npx tsx test-llm.ts
 */
import { config } from 'dotenv';
import { summarizePR, summarizeLinearTicket } from './src/lib/llm-service';

// Load .env.local file
config({ path: '.env.local' });

console.log('Environment check:');
console.log('- ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);
console.log('- ANTHROPIC_API_KEY length:', process.env.ANTHROPIC_API_KEY?.length);
console.log('');

async function testPRSummarization() {
  console.log('🧪 Testing PR summarization...\n');

  const result = await summarizePR({
    prNumber: 123,
    prTitle: 'Add user authentication with OAuth',
    prDescription: 'This PR adds OAuth authentication support for Google and GitHub providers.',
    diff: `
diff --git a/src/auth/oauth.ts b/src/auth/oauth.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/auth/oauth.ts
@@ -0,0 +1,50 @@
+export class OAuthProvider {
+  constructor(private provider: string) {}
+
+  async authenticate(code: string) {
+    // OAuth flow implementation
+  }
+}
    `,
    filesChanged: ['src/auth/oauth.ts', 'src/components/LoginButton.tsx', 'README.md'],
    additions: 150,
    deletions: 20,
    repository: 'myorg/myapp',
  });

  console.log('✅ PR Summary Result:');
  console.log('Summary:', result.summary);
  console.log('Category:', result.category);
  console.log('Suggested Doc Pages:', result.suggestedDocPages);
  console.log('\n---\n');
}

async function testLinearTicketSummarization() {
  console.log('🧪 Testing Linear ticket summarization...\n');

  const result = await summarizeLinearTicket({
    ticketId: 'ENG-123',
    ticketTitle: 'Fix memory leak in WebSocket connection',
    ticketDescription: 'Users were experiencing memory leaks when keeping the app open for extended periods. This was caused by WebSocket connections not being properly cleaned up.',
  });

  console.log('✅ Linear Ticket Summary Result:');
  console.log('Summary:', result.summary);
  console.log('Category:', result.category);
  console.log('Suggested Doc Pages:', result.suggestedDocPages);
  console.log('\n---\n');
}

async function main() {
  try {
    await testPRSummarization();
    await testLinearTicketSummarization();
    console.log('🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
