// Turns an admin password into ADMIN_PASSWORD_HASH for server/.env, so the password itself is never stored.
//   npm run hash-password            (asks for the password; typing is hidden)
import crypto from 'node:crypto';
import readline from 'node:readline';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);
const MIN_LENGTH = 12;

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      // Hide what is typed
      rl._writeToOutput = (text) => {
        if (text.includes(question)) rl.output.write(text);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (process.stdin.isTTY) process.stdout.write('\n');
      resolve(answer);
    });
  });
}

const password = await ask('New admin password: ');
if (process.stdin.isTTY && (await ask('Type it again: ')) !== password) {
  console.error('The passwords do not match.');
  process.exit(1);
}
if (password.length < MIN_LENGTH) {
  console.error(`Use at least ${MIN_LENGTH} characters.`);
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const hash = await scrypt(password, salt, 64);
console.log('\nPut this line in server/.env (and remove any ADMIN_PASSWORD= line):\n');
console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt.toString('base64')}:${hash.toString('base64')}`);
