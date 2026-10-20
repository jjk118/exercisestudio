const {chromium}=require('playwright'), http=require('http'), fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const pages={'balance-stability':3,'lower-body-strength':4,'flexibility-joint-mobility':6,'walking-endurance-gait':3};
const server=http.createServer((req,res)=>{const p=path.join(root,decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!p.startsWith(root)){res.writeHead(403).end();return;}fs.readFile(p,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',p.endsWith('.html')?'text/html':'text/javascript');res.end(data);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const options={headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']};if(process.env.CHROMIUM_EXECUTABLE)options.executablePath=process.env.CHROMIUM_EXECUTABLE;const browser=await chromium.launch(options);let errors=[];
const ctx=await browser.newContext({viewport:{width:390,height:844}});
await ctx.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.stack));
for(const [name,n] of Object.entries(pages)){
 await page.goto(origin+'/'+name+'.html');await page.waitForSelector('[data-demo]');assert.equal(await page.locator('[data-demo]').count(),n,name);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'mobile horizontal overflow '+name);
 const demos=await page.locator('[data-demo]').evaluateAll(es=>es.map(e=>e.dataset.demo));
 for(const id of demos){
  await page.locator('[data-demo="'+id+'"]').click();await page.waitForTimeout(120);
  assert.equal(await page.locator('#demoDlg').evaluate(e=>e.open),true);
  const canvas=page.locator('#demoCanvas');assert.ok((await canvas.getAttribute('aria-label')).length>10);
  assert.ok((await page.locator('#demoSteps li').count())>=4,id+' has instructions');
  await page.locator('[data-view="0"]').click();await page.locator('[data-view="80"]').click();await page.locator('[data-view="25"]').click();
  await page.locator('#dPlay').click();const frozen=await canvas.evaluate(e=>e.toDataURL());await page.waitForTimeout(90);assert.equal(await canvas.evaluate(e=>e.toDataURL()),frozen,'paused frame '+id);
  await page.locator('#dPlay').click();await page.locator('#dReplay').click();
  await page.waitForTimeout(900);const a=await canvas.evaluate(e=>e.toDataURL());await page.waitForTimeout(250);const b=await canvas.evaluate(e=>e.toDataURL());assert.notEqual(a,b,id+' animates');
  if(process.env.MOBILITY_SCREENSHOTS)await page.screenshot({path:path.join(process.env.MOBILITY_SCREENSHOTS,id+'.png')});
  await page.locator('#demoClose').click();
 }
 await page.locator('#openSettings').click();const inputs=page.locator('#exRows input[data-f="reps"]');await inputs.first().fill('7');await inputs.first().dispatchEvent('change');
 await page.locator('#optHC').check();await page.locator('#closeSettings').click();await page.reload();await page.locator('#openSettings').click();assert.equal(await page.locator('#exRows input[data-f="reps"]').first().inputValue(),'7');assert.equal(await page.locator('#optHC').isChecked(),true);
 await page.locator('#resetTiming').click();await page.locator('#optHC').uncheck();await page.locator('#closeSettings').click();
 await page.locator('[data-start]').first().click();await page.waitForTimeout(5250);assert.equal(await page.locator('#session').isVisible(),true);
 await page.locator('#bPause').click();let timer=await page.locator('#tNum').innerText();await page.waitForTimeout(300);assert.equal(await page.locator('#tNum').innerText(),timer);await page.locator('#bPause').click();await page.locator('#bStop').click();assert.equal(await page.locator('#resumeCard').isVisible(),true);
 assert.equal(await page.locator('nav[aria-label="Exercise Studio"] a').getAttribute('href'),'https://myai118.github.io/exercisestudio/');console.log(name+': '+n+' demos, settings persistence, session pause/resume passed');
}
await page.goto(origin+'/index.html');await page.locator('#pick-btn').click();assert.equal(await page.locator('#pick-list [role="option"]').count(),7,'all 7 routines available offline');
assert.deepEqual(errors,[]);console.log('PASS: 16 animated demos; all 4 routines and home picker.');await browser.close();server.close();})().catch(e=>{console.error(e);server.close();process.exit(1);});
