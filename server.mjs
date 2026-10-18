import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, relative, extname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    const rel=relative(root,path);
    if(rel.startsWith('..')||isAbsolute(rel)){res.writeHead(403);res.end('Forbidden');return;}
    const body=await readFile(path);
    res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(body);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.on('error',error=>{console.error('Could not start local server:',error.message);process.exitCode=1;});
server.listen(4173,'127.0.0.1',()=>console.log('IDOJA roulette: http://127.0.0.1:4173 — Ctrl+C to stop.'));
