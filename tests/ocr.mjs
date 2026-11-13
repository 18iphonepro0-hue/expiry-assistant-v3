import {createWorker} from 'tesseract.js';import assert from 'node:assert/strict';import {candidates} from '../src/dates.js';
const worker=await createWorker('eng',1,{langPath:'./test-artifacts',cachePath:'./test-artifacts'});
try{const {data}=await worker.recognize('./test-artifacts/ocr-fixture.png');console.log(data.text);const cs=candidates(data.text);assert.equal(cs.length,2);assert.ok(cs.some(c=>c.year===2026&&c.month===11&&c.day===20));console.log('PASS: real OCR with two distinct date candidates');}finally{await worker.terminate();}
