const { spawn } = require('child_process');
const http = require('http');

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--remote-debugging-port=9222',
  '--user-data-dir=e:\\RMS\\frontend\\scripts\\chrome-profile',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
]);

chrome.stderr.on('data', d => console.log('CHROME STDERR:', d.toString()));
chrome.on('exit', code => console.log('Chrome exited with code', code));

setTimeout(() => {
  http.get('http://127.0.0.1:9222/json/version', res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('CDP Version Response:', data);
      chrome.kill();
      process.exit(0);
    });
  }).on('error', err => {
    console.error('HTTP Error:', err.message);
    chrome.kill();
    process.exit(1);
  });
}, 2000);

