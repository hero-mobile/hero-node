import * as Program from 'commander';
import * as dotenv from 'dotenv';
import { default as pkgReader } from './utils/pkgReader';
import { add, helper, run, upload } from './processor';

dotenv.config();
const pkgInfo = pkgReader();
Program.version(pkgInfo.version || '1.0.0');

Program.command('add <name>')
  .description('add specific chain support')
  .action(add);

Program.command('upload <file>')
  // .option('-t --type [name]', 'select which kind of payload you want to upload')
  .description('choose file to upload')
  .action(upload);

Program.command('run')
  .description('start the heronode server')
  .option('-p, --port <number>', 'use alternative port to run')
  .action(run);

Program.on('--help', () => {
  helper();
});

export { Program };
