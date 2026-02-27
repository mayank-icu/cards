
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const ROUTES_TO_TEST = [
    // Core pages
    '/',
    '/login',
    '/register',
    '/cards',
    '/about',
    '/contact',

    // Card creation pages (main features)
    '/valentine/create',
    '/birthday/create',
    '/wish-jar/create',
    '/crush/create',
    '/apology/create',
    '/long-distance/create',
    '/invite/create',
    '/capsule/create',
    '/anniversary/create',
    '/thank-you/create',
    '/congratulations/create',
    '/get-well/create',
    '/graduation/create',
    '/wedding/create',
    '/new-baby/create',
    '/sympathy/create',
    '/just-because/create',
    '/bon-voyage/create',
    '/housewarming/create',
    '/friendship/create',
    '/self-care/create',
    '/missing-you/create',
    '/christmas/create',
    '/new-year/create',
    '/easter/create',
    '/halloween/create',
    '/good-luck/create',
    '/retirement/create',
    '/thinking-of-you/create',
    '/cat-lovers/create',
    '/balloon-celebration/create',
    '/bouquet/create'
];

async function runSmokeTest() {
    console.log('🚀 Starting Smoke Test...');

    // Check if build exists
    const fs = await import('fs');
    if (!fs.existsSync('./dist')) {
        console.error('❌ Build not found. Please run "npm run build" first.');
        process.exit(1);
    }

    // Kill any existing preview server on port 4173
    try {
        const { execSync } = await import('child_process');
        if (process.platform === 'win32') {
            execSync('for /f "tokens=5" %a in (\'netstat -aon ^| find ":4173" ^| find "LISTENING"\') do taskkill /F /PID %a', { stdio: 'ignore' });
        } else {
            execSync('lsof -ti:4173 | xargs kill -9', { stdio: 'ignore' });
        }
        await setTimeout(1000); // Wait for port to be released
    } catch (e) {
        // Port might not be in use, which is fine
    }

    // 1. Start the Vite preview server
    const server = spawn('npm', ['run', 'preview'], {
        stdio: 'pipe',
        shell: true,
    });

    let serverUrl = 'http://localhost:4173';
    let serverReady = false;

    server.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[Server]: ${output.trim()}`);
        // Vite outputs "➜  Local:   http://localhost:4173/"
        if (output.includes('localhost:4173') || output.includes('preview')) {
            console.log('✓ Server ready signal detected!');
            serverReady = true;
        }
    });

    server.stderr.on('data', (data) => {
        console.error(`[Server Error]: ${data.toString().trim()}`);
    });

    console.log('⏳ Waiting for server to start...');

    // Wait for server to be ready (max 15s)
    for (let i = 0; i < 30; i++) {
        if (serverReady) {
            await setTimeout(1000); // Extra wait to ensure server is fully ready
            break;
        }
        await setTimeout(500);
    }

    if (!serverReady) {
        console.error('❌ Server failed to start in time.');
        server.kill();
        process.exit(1);
    }

    console.log(`✅ Server is running at ${serverUrl}`);

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    let errorCount = 0;

    for (const route of ROUTES_TO_TEST) {
        const url = `${serverUrl}${route}`;
        console.log(`\n🔍 Testing: ${route}`);

        let pageErrors = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                pageErrors.push(`[Console Error]: ${msg.text()}`);
            }
        });

        page.on('pageerror', (err) => {
            pageErrors.push(`[Runtime Error]: ${err.toString()}`);
        });

        try {
            // Use longer timeout and more lenient wait strategy for animation-heavy pages
            const heavyPages = ['/', '/crush/create', '/christmas/create', '/easter/create'];
            const timeout = heavyPages.includes(route) ? 30000 : 10000;
            const waitStrategy = heavyPages.includes(route) ? 'domcontentloaded' : 'networkidle0';

            await page.goto(url, { waitUntil: waitStrategy, timeout });

            // Check if page crashed (white screen or error boundary) by looking for root element or specific content
            const rootContent = await page.$('#root');
            if (!rootContent) {
                pageErrors.push('[Error]: Root element not found (Possible Crash)');
            }

        } catch (err) {
            pageErrors.push(`[Navigation Error]: ${err.message}`);
        }

        if (pageErrors.length > 0) {
            console.error(`❌ Errors on ${route}:`);
            pageErrors.forEach(e => console.error(`  - ${e}`));
            errorCount++;
        } else {
            console.log(`✅ ${route} passed.`);
        }
    }

    await browser.close();
    server.kill();

    if (errorCount > 0) {
        console.error(`\n❌ Smoke test failed with errors on ${errorCount} routes.`);
        process.exit(1);
    } else {
        console.log('\n✅ All routes passed smoke test!');
        process.exit(0);
    }
}

runSmokeTest();
