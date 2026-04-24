// Node.js prototype: info_bit_log
// Usage (Node): node js/info_bit_log.js

const fs = require('fs');
const path = require('path');
const LOGFILE = path.join(__dirname, '..', 'logs', 'bit_log.jsonl');

function ensureDir(filePath){
  const dir = path.dirname(filePath);
  if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function logEvent(event){
  ensureDir(LOGFILE);
  const line = JSON.stringify(event) + '\n';
  fs.appendFileSync(LOGFILE, line);
  console.log('Logged event:', event.event_id, 'z=', event.zander_bit);
}

// Simple Zander‑Bit decision: if any amplitude/probability > threshold -> 1, else 0
function decideZanderBit(input){
  // input.probs: array of probabilities or amplitudes (non-negative)
  const threshold = input.threshold || 1e-12;
  const any = (input.probs || []).some(p => p > threshold);
  return any ? 1 : 0;
}

// Example run
if(require.main === module){
  const example = {
    timestamp: new Date().toISOString(),
    event_id: 'evt-' + Date.now(),
    input_complexity: 1024, // example
    probs: [0,0,0.000001,0],
  };
  example.zander_bit = decideZanderBit(example);
  example.payload_summary = example.zander_bit ? { note: 'nonzero amplitude' } : null;
  logEvent(example);
}

module.exports = { decideZanderBit, logEvent };
