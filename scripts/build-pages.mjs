import {spawnSync} from 'node:child_process';
import {cp,mkdir,writeFile,rm} from 'node:fs/promises';
const result=spawnSync('npm',['run','build'],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
await rm('docs',{recursive:true,force:true});await mkdir('docs',{recursive:true});
await cp('dist','docs',{recursive:true});await writeFile('docs/.nojekyll','');
console.log('GitHub Pages output ready in docs/');
