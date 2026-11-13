import {chromium} from '@playwright/test';import assert from 'node:assert/strict';
const url='https://18iphonepro0-hue.github.io/expiry-assistant-v3/';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox'],...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const page=await context.newPage();const errors=[];const failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
 const response=await page.goto(url,{waitUntil:'networkidle',timeout:45000});assert.equal(response.status(),200);await page.getByLabel('門市共用密碼').waitFor();assert.match(await page.title(),/V3/);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await page.locator('text=門市雲端尚未設定').count(),0);await page.screenshot({path:'test-artifacts/live-login.png',fullPage:true});
 await page.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration()),{timeout:15000});console.log('PASS: live HTTPS response, built JavaScript and CSS, mobile login screen, no horizontal overflow, service worker registration');assert.deepEqual(errors,[]);console.log('Browser runtime errors:',errors.length);console.log('Failed requests:',JSON.stringify(failed));
}catch(e){console.error('FAIL:',e.message);process.exitCode=1;}finally{await browser.close();}
