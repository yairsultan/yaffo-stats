const {chromium,webkit}=require('playwright');
const engine=process.env.BROWSER_ENGINE==='webkit'?webkit:chromium;
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'dist');
const artifacts=path.join(__dirname,'test-artifacts');fs.mkdirSync(artifacts,{recursive:true});
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.join(root,pathname.replace(/^\/yaffo-stats\//,''));try{const body=fs.readFileSync(file);res.setHeader('Content-Type',file.endsWith('.json')?'application/json':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(body)}catch{res.writeHead(404);res.end('Not found')}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/yaffo-stats/pilot.html`;
const browser=await engine.launch({executablePath:process.env.BROWSER_EXECUTABLE || undefined,headless:true,args:engine===chromium?['--no-sandbox']:[]});const errors=[],outside=[],results=[];
try{
for(const width of [320,360,390,430,820,1280])for(const colorScheme of ['light','dark']){
 const c=await browser.newContext({viewport:{width,height:844},colorScheme});
 await c.addInitScript(()=>{window.events=[];window.addEventListener('pilot:navigation',e=>window.events.push(e.detail))});
 const p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));p.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:'))outside.push(r.url())});
 await p.goto(base);await p.waitForSelector('.gm');assert(p.url().endsWith('#/games'));assert.equal(await p.locator('.gm').count(),2);assert(await p.locator('a.wbtn').count());
 if([320,390,1280].includes(width)&&colorScheme==='light')await p.screenshot({path:artifacts+`/review-season-${width}.png`,fullPage:true});
 const gameLink=await p.locator('.gm').first().getAttribute('href');assert(gameLink.includes('2026-11-18-'));
 await p.locator('.gm').first().click();await p.waitForSelector('.sum');await p.evaluate(()=>{window.header=document.querySelector('#game-header');window.bottom=document.querySelector('.nav');window.scrollTo(0,170)});
 for(const tab of ['players','flow','court','overview']){
  const before=await p.evaluate(()=>scrollY);await p.evaluate(tab=>document.querySelector(`.game-nav a[href*="/${tab}"]`).click(),tab);await p.waitForURL('**/*'+tab);await p.waitForFunction(tab=>document.querySelector('.game-nav a[aria-current=page]')?.getAttribute('href').includes('/'+tab),tab);
  assert.equal(await p.evaluate(()=>scrollY),before,`tab scroll ${width}/${tab}`);assert(await p.evaluate(()=>header===document.querySelector('#game-header')&&bottom===document.querySelector('.nav')));
  if([320,390,1280].includes(width)&&colorScheme==='light')await p.screenshot({path:artifacts+`/review-${tab}-${width}.png`,fullPage:tab!=='players'});
  if(tab==='players')assert.equal(await p.locator('#game-content h2').first().textContent(),'הפועל יפו צעירים');
  if(tab==='flow'){assert.equal(await p.locator('#fl').getAttribute('viewBox'),'0 0 340 320');if(width===390&&colorScheme==='dark'){await p.evaluate(()=>scrollTo(0,380));await p.screenshot({path:artifacts+'/pilot-flow-dark-390.png'})}}
 }
 for(let q=1;q<=4;q++){await p.evaluate(q=>document.querySelectorAll('.chips a')[q].click(),q);await p.waitForURL('**/*q='+q);await p.waitForFunction(q=>document.querySelector('.sum h2')?.textContent==='רבע '+q,q);assert.equal(await p.locator('.sum h2').textContent(),'רבע '+q);}
 const reloadY=await p.evaluate(()=>scrollY);await p.reload();await p.waitForSelector('.sum');assert.equal(await p.evaluate(()=>scrollY),reloadY,'refresh scroll');assert.equal(await p.locator('.sum h2').textContent(),'רבע 4');
 if(width===390&&colorScheme==='light'){await p.evaluate(()=>scrollTo(0,300));await p.screenshot({path:artifacts+'/pilot-quarter-390.png'})}
 // Open copied link in a separate tab and reload it through the nested static base.
 const copied=p.url();const second=await c.newPage();await second.goto(copied);await second.waitForSelector('.sum');assert.equal(await second.locator('.sum h2').textContent(),'רבע 4');await second.close();
 await p.evaluate(()=>document.querySelector('.game-nav a[href*="/players"]').click());await p.waitForURL('**/*players?q=4');await p.waitForSelector('#game-content .pr');await p.evaluate(()=>scrollTo(0,1100));const deepY=await p.evaluate(()=>scrollY);await p.evaluate(()=>document.querySelector('.game-nav a[href*="/court"]').click());await p.waitForURL('**/*court?q=4');await p.waitForSelector('#game-content .crt');assert.equal(await p.evaluate(()=>scrollY),deepY);
 await p.goBack();await p.waitForURL('**/*players?q=4');assert.equal(await p.locator('#game-content h2').first().textContent(),'הפועל יפו צעירים');
 await p.goForward();await p.waitForURL('**/*court?q=4');
 await p.locator('.nav a[href="#/players"]').click();await p.waitForSelector('table');assert.equal(await p.locator('tbody tr').count(),15);if([320,390,1280].includes(width)&&colorScheme==='light')await p.screenshot({path:artifacts+`/review-season-players-${width}.png`,fullPage:true});assert((await p.locator('tr').filter({hasText:'י. מוראדי'}).textContent()).includes('לא זמין'));
 await p.locator('.nav a[href="#/team"]').click();await p.waitForSelector('.cmp');assert((await p.locator('h1').textContent()).includes('נתוני הקבוצה'));if([320,390,1280].includes(width)&&colorScheme==='light')await p.screenshot({path:artifacts+`/review-team-${width}.png`,fullPage:true});
 assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),`overflow ${width}`);
 // Direct compatibility link opens the actual schedule.
 await p.goto(base+'#full');await p.waitForSelector('.fx');assert.equal(await p.locator('.fx').getAttribute('open'),'');
 await p.goto(base+'#/games/not-a-real-game/overview');await p.waitForSelector('h1');assert.equal(await p.locator('h1').textContent(),'המסך לא נמצא');
 results.push({width,colorScheme});await c.close();
}
for (const width of [320, 360, 390, 430]) {
 const c = await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});
 const p = await c.newPage(); await p.goto(base); await p.waitForSelector('.gm'); await p.locator('.gm').first().tap();
 for (const tab of ['players','flow','court','overview']) {
  await p.evaluate(()=>scrollTo(0,150)); const before=await p.evaluate(()=>scrollY);
  const a=p.locator(`.game-nav a[href*="/${tab}"]`); const box=await a.boundingBox();
  assert(box.y>=0 && box.y+box.height<844); await p.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
  await p.waitForURL('**/*'+tab);await p.waitForFunction(tab=>document.querySelector('.game-nav a[aria-current=page]')?.getAttribute('href').includes('/'+tab),tab); await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  assert.equal(await p.evaluate(()=>scrollY),before,`trusted touch ${width}/${tab}`);
 }
 await c.close();
}
assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
// StrictMode duplicate mount and quarter filters never emit duplicate screen events.
const c=await browser.newContext();await c.addInitScript(()=>{window.events=[];window.addEventListener('pilot:navigation',e=>events.push(e.detail))});const p=await c.newPage();await p.goto(base);await p.waitForSelector('.gm');await p.locator('.gm').first().click();await p.waitForSelector('.sum');await p.locator('.chips a').nth(2).click();await p.locator('.chips a').nth(3).click();assert.deepEqual(await p.evaluate(()=>events.map(e=>e.name)),['tab_view','game_open','tab_view']);await p.locator('.game-nav a').nth(1).click();await p.waitForFunction(()=>events.length===4);assert.deepEqual(await p.evaluate(()=>events.map(e=>e.name)),['tab_view','game_open','tab_view','tab_view']);await c.close();
console.log(JSON.stringify({configurations:results.length,errors,outsideRequests:outside,strictModeEvents:true}));fs.writeFileSync(artifacts+'/pilot-browser-tests.json',JSON.stringify({results,errors,outside,strictModeEvents:true},null,2));
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
