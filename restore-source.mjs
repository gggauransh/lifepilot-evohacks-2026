import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
if(process.argv.includes('--assets')){
 const require=createRequire(path.join(root,'package.json'));
 const tesseract=path.dirname(require.resolve('tesseract.js/package.json'));
 const core=path.dirname(require.resolve('tesseract.js-core/package.json',{paths:[tesseract]}));
 const pdf=path.dirname(require.resolve('pdfjs-dist/package.json'));
 const destination=path.join(root,'public/ocr');await fs.mkdir(destination,{recursive:true});
 await fs.copyFile(path.join(tesseract,'dist/worker.min.js'),path.join(destination,'worker.min.js'));
 for(const name of ['tesseract-core-lstm.wasm.js','tesseract-core-simd-lstm.wasm.js','tesseract-core-relaxedsimd-lstm.wasm.js'])await fs.copyFile(path.join(core,name),path.join(destination,name));
 await fs.copyFile(path.join(pdf,'build/pdf.worker.min.mjs'),path.join(destination,'pdf.worker.min.mjs'));
 const model=await fetch('https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/eng.traineddata');
 if(!model.ok)throw Error('Official English model download failed: '+model.status);
 await fs.writeFile(path.join(destination,'eng.traineddata'),Buffer.from(await model.arrayBuffer()));
 console.log('OCR and PDF assets prepared from installed packages and the official English model.');
}else{
 const parts=await Promise.all([1,2,3].map(n=>fs.readFile(path.join(root,'source-'+n+'.json.gz.b64'),'utf8')));
 const files=JSON.parse(zlib.gunzipSync(Buffer.from(parts.join('').replace(/\s/g,''),'base64')).toString('utf8'));
 for(const [name,file] of Object.entries(files)){
  const destination=path.resolve(root,name);
  if(!destination.startsWith(path.resolve(root)+path.sep)||name.split(/[\\/]/).includes('..'))throw Error('Unsafe bundle path');
  await fs.mkdir(path.dirname(destination),{recursive:true});
  await fs.writeFile(destination,file.encoding==='base64'?Buffer.from(file.data,'base64'):file.data);
 }
 console.log('Restored '+Object.keys(files).length+' original source and asset files. Next: pnpm install --frozen-lockfile; node restore-source.mjs --assets; pnpm dev.');
}
