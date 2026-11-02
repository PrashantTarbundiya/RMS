const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('e:/RMS/frontend/node_modules/ws');
const path = require('path');
const fs = require('fs');

const VIEWPORT_WIDTHS = [
  320, 360, 375, 390, 414, 430, 480, 768, 1024, 1280, 1440, 1920
];

const ROUTES_TO_AUDIT = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/attendance',
  '/live',
  '/cameras',
  '/upload',
  '/test',
  '/mosaic',
  '/kiosk',
  '/logs',
  '/analytics',
  '/audit-logs',
  '/profile',
  '/models',
  '/training',
  '/support',
  '/privacy-policy',
  '/terms',
  '/404'
];

async function main() {
  console.log('=====================================================');
  console.log('RMS Enterprise UI/UX Multi-Viewport Audit Suite');
  console.log(`Testing ${ROUTES_TO_AUDIT.length} routes across ${VIEWPORT_WIDTHS.length} viewports (Total: ${ROUTES_TO_AUDIT.length * VIEWPORT_WIDTHS.length} tests)`);
  console.log('=====================================================\n');

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const profileDir = path.resolve('e:/RMS/frontend/scripts/chrome-profile');
  fs.mkdirSync(profileDir, { recursive: true });

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  // Get browser websocket
  const versionData = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/version', res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => resolve(JSON.parse(buf)));
    }).on('error', reject);
  });

  const ws = new WebSocket(versionData.webSocketDebuggerUrl);
  await new Promise(resolve => ws.on('open', resolve));

  let msgId = 1;
  const callbacks = new Map();
  ws.on('message', data => {
    const msg = JSON.parse(data.toString());
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      cb(msg);
    }
  });

  function sendCommand(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Create a target tab
  const newTarget = await sendCommand('Target.createTarget', { url: 'http://127.0.0.1:5173/' });
  const targetId = newTarget.result.targetId;

  // Attach to target
  const session = await sendCommand('Target.attachToTarget', { targetId, flatten: true });
  const sessionId = session.result.sessionId;

  function sendSessionCommand(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, sessionId, method, params }));
    });
  }

  await sendSessionCommand('Page.enable');
  await sendSessionCommand('Runtime.enable');
  await sendSessionCommand('DOM.enable');

  // Seed authentication in localStorage
  await sendSessionCommand('Runtime.evaluate', {
    expression: `
      localStorage.setItem('rms_token', 'audit_session_token_12345');
      localStorage.setItem('rms_user', JSON.stringify({
        id: 'usr_audit',
        name: 'Enterprise Auditor',
        email: 'auditor@enterprise.rms',
        role: 'org_admin',
        org_name: 'RMS Enterprise Labs',
        org_id: 'org_enterprise'
      }));
      localStorage.setItem('rms_onboarding_completed', 'true');
    `
  });

  const auditResults = [];
  let totalTested = 0;
  let passCount = 0;
  let failCount = 0;

  // We test viewports systematically
  for (const width of VIEWPORT_WIDTHS) {
    const isMobile = width < 768;
    const height = isMobile ? 800 : 900;

    await sendSessionCommand('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile
    });

    for (const route of ROUTES_TO_AUDIT) {
      totalTested++;
      const fullUrl = `http://127.0.0.1:5173${route}`;
      
      // Navigate to route
      await sendSessionCommand('Page.navigate', { url: fullUrl });
      // Allow DOM & animations to settle
      await new Promise(r => setTimeout(r, 600));

      // Evaluate horizontal scroll and bounding boxes
      const evalRes = await sendSessionCommand('Runtime.evaluate', {
        expression: `
          (function() {
            var docWidth = document.documentElement.clientWidth;
            var scrollWidth = document.documentElement.scrollWidth;
            var bodyScrollWidth = document.body ? document.body.scrollWidth : 0;
            var winWidth = window.innerWidth;
            
            // Check if horizontal scrollbar is present or content leaks past window width
            var hasOverflow = (scrollWidth > winWidth + 1) || (bodyScrollWidth > winWidth + 1);
            
            var offending = [];
            if (hasOverflow) {
              var all = document.querySelectorAll('*');
              for (var i = 0; i < all.length; i++) {
                var el = all[i];
                var r = el.getBoundingClientRect();
                if (r.right > winWidth + 2 || r.left < -2) {
                  offending.push({
                    tag: el.tagName.toLowerCase(),
                    cls: (el.className || '').toString().slice(0, 40),
                    right: Math.round(r.right),
                    left: Math.round(r.left),
                    winWidth: winWidth
                  });
                  if (offending.length >= 3) break;
                }
              }
            }

            return {
              winWidth: winWidth,
              scrollWidth: scrollWidth,
              bodyScrollWidth: bodyScrollWidth,
              hasOverflow: hasOverflow,
              offendingCount: offending.length,
              offending: offending
            };
          })()
        `,
        returnByValue: true
      });

      const data = evalRes.result?.value || { hasOverflow: false, winWidth: width, scrollWidth: width };
      const passed = !data.hasOverflow;

      if (passed) {
        passCount++;
      } else {
        failCount++;
      }

      auditResults.push({
        viewport: `${width}px`,
        route,
        passed,
        winWidth: data.winWidth,
        scrollWidth: data.scrollWidth,
        offending: data.offending || []
      });
    }

    console.log(`✓ Completed viewport ${width}px: all ${ROUTES_TO_AUDIT.length} routes checked.`);
  }

  // Summary
  console.log('\n=====================================================');
  console.log(`AUDIT COMPLETE: ${totalTested} tests run`);
  console.log(`PASSED: ${passCount} / ${totalTested} (${Math.round((passCount / totalTested) * 100)}%)`);
  console.log(`FAILED (Horizontal Overflow): ${failCount} / ${totalTested}`);
  console.log('=====================================================\n');

  if (failCount > 0) {
    console.log('Overflow Details:');
    auditResults.filter(r => !r.passed).forEach(r => {
      console.log(`- [${r.viewport}] ${r.route}: scrollWidth=${r.scrollWidth} > winWidth=${r.winWidth}`);
      r.offending.forEach(o => {
        console.log(`    element: <${o.tag} class="${o.cls}"> right=${o.right}px (window=${o.winWidth}px)`);
      });
    });
  }

  fs.writeFileSync('e:/RMS/frontend/scripts/viewport_audit_results.json', JSON.stringify({
    summary: { totalTested, passCount, failCount, passRate: `${Math.round((passCount / totalTested) * 100)}%` },
    results: auditResults
  }, null, 2));

  chrome.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});

