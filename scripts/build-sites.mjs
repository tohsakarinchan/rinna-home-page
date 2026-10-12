import {build} from 'esbuild';
import {mkdir, copyFile, writeFile} from 'node:fs/promises';
await build({entryPoints:['worker/index.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022'});
await mkdir('dist/.openai',{recursive:true});
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
await writeFile('dist/server/wrangler.json', JSON.stringify({name:'rinna-homepage',main:'index.js',compatibility_date:'2026-10-01',assets:{directory:'../client',binding:'ASSETS'}}));
