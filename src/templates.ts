/**
 * Pre-built templates for Halye Studio
 * Includes: Clean Blank Canvas, Ultra-Realistic SaaS Web App, and Task Matrix.
 */

export const BLANK_CANVAS_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Halye Studio — Blank Workspace</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #000000; }
    code, pre, .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-black text-zinc-100 min-h-screen p-6 sm:p-12 flex flex-col items-center justify-center selection:bg-cyan-500 selection:text-black">
  <div class="max-w-xl mx-auto w-full text-center space-y-6">
    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400">
      <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
      <span>CANVAS CLEARED & READY</span>
    </div>

    <div class="space-y-3">
      <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
        Clean Workspace Canvas
      </h1>
      <p class="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
        Previous code cleared. Ready to build an ultra-realistic website, thousands of lines of raw code, or full Vercel-ready web applications.
      </p>
    </div>

    <div class="p-6 rounded-3xl bg-zinc-950 border border-zinc-850 shadow-2xl text-left space-y-4">
      <div class="text-xs font-mono text-zinc-500 uppercase tracking-wider">Quick Start Options:</div>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onclick="parent.postMessage({ type: 'LOAD_PRESET', preset: 'saas' }, '*')" class="p-4 rounded-2xl bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 text-left transition group cursor-pointer">
          <div class="text-base font-bold text-white group-hover:text-cyan-400 transition flex items-center justify-between">
            <span>🌐 Ultra-Realistic Web</span>
            <span class="text-xs text-zinc-500 font-mono font-normal">SaaS App</span>
          </div>
          <p class="text-xs text-zinc-400 mt-1.5">Multi-section production web app with navbar, pricing, lead forms, and Vercel readiness.</p>
        </button>

        <button onclick="parent.postMessage({ type: 'LOAD_PRESET', preset: 'task' }, '*')" class="p-4 rounded-2xl bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-left transition group cursor-pointer">
          <div class="text-base font-bold text-white group-hover:text-emerald-400 transition flex items-center justify-between">
            <span>⚡ Task Matrix</span>
            <span class="text-xs text-zinc-500 font-mono font-normal">Tool</span>
          </div>
          <p class="text-xs text-zinc-400 mt-1.5">Stealth state management with local persistence, counter, and fast actions.</p>
        </button>
      </div>

      <div class="pt-3 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-500 font-mono">
        <span>💡 Ask Halye in chat to build any custom website, app, or dashboard.</span>
        <span class="text-cyan-400">Halye Live Web Engine</span>
      </div>
    </div>
  </div>
</body>
</html>`;

export const DEFAULT_SAAS_WEBSITE_CODE = `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AuraCloud — Autonomous Edge & AI Infrastructure</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #000000; color: #f4f4f5; }
    code, pre, .font-mono { font-family: 'JetBrains Mono', monospace; }
    .neon-cyan { text-shadow: 0 0 20px rgba(6, 182, 212, 0.4); }
    .glass-card { background: rgba(9, 9, 11, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(39, 39, 42, 0.8); }
    .glass-card:hover { border-color: rgba(6, 182, 212, 0.4); }
  </style>
</head>
<body class="bg-black text-zinc-100 min-h-screen selection:bg-cyan-500 selection:text-black">

  <!-- Sticky Top Navigation Bar -->
  <header class="sticky top-0 z-50 w-full glass-card border-b border-zinc-800/80">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-black text-black text-lg shadow-lg shadow-cyan-500/20">
          A
        </div>
        <span class="font-extrabold text-lg tracking-tight text-white">AuraCloud<span class="text-cyan-400">.ai</span></span>
        <span class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[11px] font-mono font-semibold">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span> VERCEL READY
        </span>
      </div>

      <!-- Desktop Navigation Links -->
      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
        <a href="#features" class="hover:text-white transition">Features</a>
        <a href="#architecture" class="hover:text-white transition">Architecture</a>
        <a href="#pricing" class="hover:text-white transition">Pricing</a>
        <a href="#audit" class="hover:text-white transition">Health Monitor</a>
        <a href="#faq" class="hover:text-white transition">FAQ</a>
      </nav>

      <!-- Action Buttons -->
      <div class="flex items-center gap-3">
        <button onclick="openLeadModal('Deploy Project')" class="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-xs font-semibold text-zinc-200 transition cursor-pointer">
          Sign In
        </button>
        <button onclick="openLeadModal('Start Free Trial')" class="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-extrabold shadow-lg shadow-cyan-500/20 transition cursor-pointer active:scale-95">
          Deploy to Edge →
        </button>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-zinc-900">
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute top-20 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300 mb-6">
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span>Aura Cloud v3.4 Engine — Zero Cold Starts</span>
      </div>

      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
        Ship Production Web Apps at <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">Sub-Millisecond</span> Speed
      </h1>

      <p class="mt-6 text-zinc-400 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
        Full-stack autonomous infrastructure built for modern AI agents, hyper-realistic web interfaces, and high-frequency backend services.
      </p>

      <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button onclick="openLeadModal('Instant Deployment')" class="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm shadow-xl shadow-cyan-500/25 transition active:scale-95 cursor-pointer">
          Deploy Free on Vercel
        </button>
        <button onclick="scrollToAudit()" class="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2">
          <span>Run Live Health Audit</span>
          <span class="text-cyan-400 font-mono text-xs">100/100</span>
        </button>
      </div>

      <!-- Live Interactive Metrics -->
      <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        <div class="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-850">
          <div class="text-2xl sm:text-3xl font-black text-cyan-400 font-mono" id="stat-latency">8.4ms</div>
          <div class="text-xs text-zinc-500 font-medium mt-1">Global P99 Latency</div>
        </div>
        <div class="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-850">
          <div class="text-2xl sm:text-3xl font-black text-emerald-400 font-mono" id="stat-uptime">99.998%</div>
          <div class="text-xs text-zinc-500 font-medium mt-1">Certified Uptime SLA</div>
        </div>
        <div class="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-850">
          <div class="text-2xl sm:text-3xl font-black text-white font-mono" id="stat-nodes">312,480</div>
          <div class="text-xs text-zinc-500 font-medium mt-1">Active Edge Clusters</div>
        </div>
        <div class="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-850">
          <div class="text-2xl sm:text-3xl font-black text-purple-400 font-mono" id="stat-deployments">4.8M+</div>
          <div class="text-xs text-zinc-500 font-medium mt-1">Daily Invocations</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Interactive Features Grid with Live Category Filters -->
  <section id="features" class="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col md:flex-row md:items-end justify-between mb-12">
      <div>
        <div class="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2">Core Modules</div>
        <h2 class="text-3xl sm:text-4xl font-black text-white tracking-tight">Engineered for Hyper-Scale</h2>
      </div>

      <!-- Category Filter Pills -->
      <div class="flex items-center gap-2 mt-4 md:mt-0 overflow-x-auto pb-2">
        <button onclick="filterFeatures('all')" id="btn-feat-all" class="px-4 py-1.5 rounded-full bg-cyan-500 text-black font-bold text-xs transition cursor-pointer">All</button>
        <button onclick="filterFeatures('cloud')" id="btn-feat-cloud" class="px-4 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-semibold text-xs transition cursor-pointer">Edge & Cloud</button>
        <button onclick="filterFeatures('ai')" id="btn-feat-ai" class="px-4 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-semibold text-xs transition cursor-pointer">AI & Models</button>
        <button onclick="filterFeatures('security')" id="btn-feat-security" class="px-4 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-semibold text-xs transition cursor-pointer">Security & Audit</button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="features-grid">
      <!-- Card 1 -->
      <div data-category="cloud" class="feature-card glass-card p-6 sm:p-8 rounded-3xl transition duration-300">
        <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl font-bold mb-6">
          ⚡
        </div>
        <h3 class="text-xl font-extrabold text-white mb-3">Zero-Cold-Start Edge Functions</h3>
        <p class="text-zinc-400 text-sm leading-relaxed mb-6">
          Execute lightweight WebAssembly and V8 worker isolates in under 1ms across 280 edge locations worldwide.
        </p>
        <div class="flex items-center justify-between pt-4 border-t border-zinc-900 text-xs font-mono text-zinc-500">
          <span>Wasm / Node.js 20</span>
          <span class="text-cyan-400 font-semibold">Active</span>
        </div>
      </div>

      <!-- Card 2 -->
      <div data-category="ai" class="feature-card glass-card p-6 sm:p-8 rounded-3xl transition duration-300">
        <div class="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xl font-bold mb-6">
          🧠
        </div>
        <h3 class="text-xl font-extrabold text-white mb-3">Self-Modifying AI Agent Runtime</h3>
        <p class="text-zinc-400 text-sm leading-relaxed mb-6">
          Autonomous agents that can inspect their own codebase, diagnose memory bottlenecks, and patch bug flaws on the fly.
        </p>
        <div class="flex items-center justify-between pt-4 border-t border-zinc-900 text-xs font-mono text-zinc-500">
          <span>Gemini & Antigravity</span>
          <span class="text-purple-400 font-semibold">Self-Evolving</span>
        </div>
      </div>

      <!-- Card 3 -->
      <div data-category="security" class="feature-card glass-card p-6 sm:p-8 rounded-3xl transition duration-300">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold mb-6">
          🛡️
        </div>
        <h3 class="text-xl font-extrabold text-white mb-3">Continuous Bug Bounty & Auto-Audit</h3>
        <p class="text-zinc-400 text-sm leading-relaxed mb-6">
          Built-in AST parser scans for unclosed DOM elements, memory leaks, unhandled promises, and syntax regressions.
        </p>
        <div class="flex items-center justify-between pt-4 border-t border-zinc-900 text-xs font-mono text-zinc-500">
          <span>OWASP & WCAG Compliant</span>
          <span class="text-emerald-400 font-semibold">100/100 Safe</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Interactive Pricing Matrix with Annual / Monthly Discount Toggle -->
  <section id="pricing" class="py-20 bg-zinc-950/40 border-y border-zinc-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto mb-12">
        <div class="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2">Transparent Economics</div>
        <h2 class="text-3xl sm:text-4xl font-black text-white tracking-tight">Predictable Scale, No Hidden Fees</h2>
        <p class="text-zinc-400 text-sm sm:text-base mt-3">All plans include full Linux shell powers, self-healing runtime, and Vercel zero-config deploy.</p>

        <!-- Billing Switch -->
        <div class="mt-8 inline-flex items-center gap-3 p-1.5 rounded-full bg-zinc-900 border border-zinc-800">
          <button onclick="setBilling('monthly')" id="btn-monthly" class="px-5 py-2 rounded-full bg-cyan-500 text-black font-extrabold text-xs transition cursor-pointer">Monthly</button>
          <button onclick="setBilling('annual')" id="btn-annual" class="px-5 py-2 rounded-full text-zinc-400 hover:text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5">
            <span>Annual</span>
            <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">SAVE 20%</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <!-- Starter Plan -->
        <div class="p-8 rounded-3xl bg-black border border-zinc-850 hover:border-zinc-700 transition flex flex-col justify-between">
          <div>
            <div class="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Developer Starter</div>
            <div class="text-3xl sm:text-4xl font-black text-white font-mono mb-4">
              $<span id="price-starter">0</span><span class="text-zinc-500 text-sm font-sans font-normal"> / mo</span>
            </div>
            <p class="text-xs text-zinc-400 leading-relaxed mb-6">Ideal for hobbyists, personal prototypes, and learning full-stack cloud concepts.</p>
            <ul class="space-y-3 text-xs text-zinc-300 font-medium">
              <li class="flex items-center gap-2">✓ 100,000 monthly edge invocations</li>
              <li class="flex items-center gap-2">✓ Autonomous bug bounty tester</li>
              <li class="flex items-center gap-2">✓ Single-click Vercel export</li>
              <li class="flex items-center gap-2 text-zinc-500">✕ Custom domain SSL certificates</li>
            </ul>
          </div>
          <button onclick="openLeadModal('Developer Starter')" class="mt-8 w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs border border-zinc-800 transition cursor-pointer">
            Get Started Free
          </button>
        </div>

        <!-- Pro Plan (Featured) -->
        <div class="p-8 rounded-3xl bg-zinc-900/60 border-2 border-cyan-500/80 relative shadow-2xl shadow-cyan-500/10 flex flex-col justify-between">
          <div class="absolute -top-3.5 right-6 px-3 py-0.5 rounded-full bg-cyan-500 text-black font-extrabold text-[10px] uppercase font-mono tracking-wider">
            MOST POPULAR
          </div>
          <div>
            <div class="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-2">Autonomous Pro</div>
            <div class="text-3xl sm:text-4xl font-black text-white font-mono mb-4">
              $<span id="price-pro">29</span><span class="text-zinc-500 text-sm font-sans font-normal"> / mo</span>
            </div>
            <p class="text-xs text-zinc-400 leading-relaxed mb-6">For engineers shipping production websites with thousands of lines of code.</p>
            <ul class="space-y-3 text-xs text-zinc-200 font-medium">
              <li class="flex items-center gap-2 text-cyan-400">✓ Unlimited edge invocations</li>
              <li class="flex items-center gap-2">✓ Deep Self-Modifying Python runtime</li>
              <li class="flex items-center gap-2">✓ Full Playwright & Web Eyes navigation</li>
              <li class="flex items-center gap-2">✓ Unlimited custom domains & SSL</li>
              <li class="flex items-center gap-2">✓ Priority 24/7 architecture support</li>
            </ul>
          </div>
          <button onclick="openLeadModal('Autonomous Pro Plan')" class="mt-8 w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer active:scale-95">
            Upgrade to Pro
          </button>
        </div>

        <!-- Enterprise Plan -->
        <div class="p-8 rounded-3xl bg-black border border-zinc-850 hover:border-zinc-700 transition flex flex-col justify-between">
          <div>
            <div class="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Ultra Enterprise</div>
            <div class="text-3xl sm:text-4xl font-black text-white font-mono mb-4">
              $<span id="price-enterprise">149</span><span class="text-zinc-500 text-sm font-sans font-normal"> / mo</span>
            </div>
            <p class="text-xs text-zinc-400 leading-relaxed mb-6">Dedicated edge compute clusters with 99.999% SLA and customized security gates.</p>
            <ul class="space-y-3 text-xs text-zinc-300 font-medium">
              <li class="flex items-center gap-2">✓ Dedicated isolated VPC clusters</li>
              <li class="flex items-center gap-2">✓ Custom model fine-tuning weights</li>
              <li class="flex items-center gap-2">✓ SOC-2 Type II audit report</li>
              <li class="flex items-center gap-2">✓ Dedicated solution architect</li>
            </ul>
          </div>
          <button onclick="openLeadModal('Ultra Enterprise')" class="mt-8 w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs border border-zinc-800 transition cursor-pointer">
            Contact Enterprise
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- Live Health & Bug Bounty Monitor Section -->
  <section id="audit" class="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="p-8 sm:p-10 rounded-3xl bg-zinc-950 border border-zinc-850 shadow-2xl relative overflow-hidden">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-900">
        <div>
          <div class="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>AUTONOMOUS CODE AUDIT ENGINE</span>
          </div>
          <h3 class="text-2xl font-black text-white">Live Code Health & Bug Bounty Score</h3>
        </div>
        <button onclick="runAuditDemo()" class="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition cursor-pointer">
          Re-Audit Code (1 Click)
        </button>
      </div>

      <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-4 rounded-2xl bg-black border border-zinc-900">
          <div class="text-xs text-zinc-500 font-mono">SYNTAX INTEGRITY</div>
          <div class="text-xl font-bold text-emerald-400 mt-1 font-mono">100% Passed</div>
          <div class="text-[11px] text-zinc-500 mt-1">0 unclosed tags, 0 unclosed brackets</div>
        </div>
        <div class="p-4 rounded-2xl bg-black border border-zinc-900">
          <div class="text-xs text-zinc-500 font-mono">RESPONSIVENESS</div>
          <div class="text-xl font-bold text-cyan-400 mt-1 font-mono">Mobile + Desktop</div>
          <div class="text-[11px] text-zinc-500 mt-1">Viewport meta & fluid grid active</div>
        </div>
        <div class="p-4 rounded-2xl bg-black border border-zinc-900">
          <div class="text-xs text-zinc-500 font-mono">DEPLOYMENT READY</div>
          <div class="text-xl font-bold text-white mt-1 font-mono">Vercel Production</div>
          <div class="text-[11px] text-zinc-500 mt-1">Zero config static bundle ready</div>
        </div>
      </div>

      <div id="audit-feedback" class="mt-6 p-4 rounded-2xl bg-black/60 border border-zinc-900 text-xs font-mono text-zinc-400 flex items-center justify-between">
        <span>Status: <strong class="text-emerald-400">EXCELLENT</strong> — All systems validated. Clean architecture.</span>
        <span class="text-zinc-600">Audit Timestamp: Just Now</span>
      </div>
    </div>
  </section>

  <!-- Interactive Accordion FAQ -->
  <section id="faq" class="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-zinc-900">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-black text-white tracking-tight">Frequently Asked Questions</h2>
      <p class="text-zinc-400 text-sm mt-2">Everything you need to know about autonomous deployments and custom projects.</p>
    </div>

    <div class="space-y-3">
      <!-- FAQ 1 -->
      <div class="glass-card rounded-2xl p-5 cursor-pointer" onclick="toggleFaq(1)">
        <div class="flex items-center justify-between font-bold text-sm text-white">
          <span>How do I deploy this website to Vercel?</span>
          <span id="faq-icon-1" class="text-cyan-400 font-mono text-base">+</span>
        </div>
        <div id="faq-body-1" class="hidden text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-850 leading-relaxed">
          You can deploy in under 60 seconds! Click the "Deploy to Vercel" button in Halye Studio to download the pre-configured Vercel bundle (includes <code class="text-cyan-400">vercel.json</code>, <code class="text-cyan-400">package.json</code>, and <code class="text-cyan-400">index.html</code>) or run <code class="text-cyan-400">vercel</code> directly in the Linux terminal.
        </div>
      </div>

      <!-- FAQ 2 -->
      <div class="glass-card rounded-2xl p-5 cursor-pointer" onclick="toggleFaq(2)">
        <div class="flex items-center justify-between font-bold text-sm text-white">
          <span>How does the Self-Modifying AI engine work?</span>
          <span id="faq-icon-2" class="text-cyan-400 font-mono text-base">+</span>
        </div>
        <div id="faq-body-2" class="hidden text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-850 leading-relaxed">
          Halye features an autonomous self-modification engine (<code class="text-cyan-400">power_self_modifier.py</code>) that verifies Python and JavaScript syntax before applying patches, preventing broken code regressions and ensuring tools stay healthy.
        </div>
      </div>

      <!-- FAQ 3 -->
      <div class="glass-card rounded-2xl p-5 cursor-pointer" onclick="toggleFaq(3)">
        <div class="flex items-center justify-between font-bold text-sm text-white">
          <span>Can I edit this existing website in-place?</span>
          <span id="faq-icon-3" class="text-cyan-400 font-mono text-base">+</span>
        </div>
        <div id="faq-body-3" class="hidden text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-850 leading-relaxed">
          Yes! Halye preserves the current working project context. Tell the assistant "Add a cart drawer" or "Update color to emerald" and it will modify the active code directly without wiping your work.
        </div>
      </div>
    </div>
  </section>

  <!-- Interactive Contact / Lead Modal -->
  <div id="lead-modal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
      <button onclick="closeLeadModal()" class="absolute top-5 right-5 text-zinc-500 hover:text-white text-lg">✕</button>
      <h3 id="modal-title" class="text-xl font-bold text-white mb-2">Deploy with AuraCloud</h3>
      <p class="text-xs text-zinc-400 mb-6">Enter your email and project requirements. Our automated pipeline deploys your stack in seconds.</p>

      <form onsubmit="handleLeadSubmit(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-mono text-zinc-400 mb-1">YOUR EMAIL</label>
          <input id="lead-email" required type="email" placeholder="alex@company.com" class="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500">
        </div>
        <div>
          <label class="block text-xs font-mono text-zinc-400 mb-1">PROJECT SCOPE</label>
          <input id="lead-scope" type="text" placeholder="e.g. AI Agent Platform, E-commerce, SaaS" class="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500">
        </div>
        <button type="submit" class="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition cursor-pointer shadow-lg shadow-cyan-500/20">
          Confirm & Launch →
        </button>
      </form>
    </div>
  </div>

  <!-- Toast Notification Container -->
  <div id="toast-container" class="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none"></div>

  <!-- Footer -->
  <footer class="border-t border-zinc-900 bg-black py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
      <div>
        © 2026 AuraCloud Technologies. Built inside Halye AMOLED Studio.
      </div>
      <div class="flex items-center gap-6">
        <a href="#features" class="hover:text-zinc-300">Features</a>
        <a href="#pricing" class="hover:text-zinc-300">Pricing</a>
        <a href="#audit" class="hover:text-zinc-300">Audit Status</a>
        <button onclick="parent.postMessage({ type: 'CLEAR_CANVAS' }, '*')" class="text-rose-400 hover:underline cursor-pointer">Clear Canvas</button>
      </div>
    </div>
  </footer>

  <script>
    function showToast(msg) {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'px-4 py-2.5 rounded-xl bg-zinc-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono shadow-2xl transition duration-300 transform translate-y-2 opacity-0';
      toast.innerText = msg;
      container.appendChild(toast);
      setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
      }, 10);
      setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }

    function setBilling(mode) {
      const btnM = document.getElementById('btn-monthly');
      const btnA = document.getElementById('btn-annual');
      const pStarter = document.getElementById('price-starter');
      const pPro = document.getElementById('price-pro');
      const pEnt = document.getElementById('price-enterprise');

      if (mode === 'annual') {
        btnA.className = 'px-5 py-2 rounded-full bg-cyan-500 text-black font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5';
        btnM.className = 'px-5 py-2 rounded-full text-zinc-400 hover:text-white font-semibold text-xs transition cursor-pointer';
        pStarter.innerText = '0';
        pPro.innerText = '23';
        pEnt.innerText = '119';
        showToast('✔ Applied 20% Annual Discount');
      } else {
        btnM.className = 'px-5 py-2 rounded-full bg-cyan-500 text-black font-extrabold text-xs transition cursor-pointer';
        btnA.className = 'px-5 py-2 rounded-full text-zinc-400 hover:text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5';
        pStarter.innerText = '0';
        pPro.innerText = '29';
        pEnt.innerText = '149';
      }
    }

    function filterFeatures(cat) {
      const cards = document.querySelectorAll('.feature-card');
      const btns = ['all', 'cloud', 'ai', 'security'];
      btns.forEach(b => {
        const el = document.getElementById('btn-feat-' + b);
        if (el) {
          if (b === cat) {
            el.className = 'px-4 py-1.5 rounded-full bg-cyan-500 text-black font-bold text-xs transition cursor-pointer';
          } else {
            el.className = 'px-4 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-semibold text-xs transition cursor-pointer';
          }
        }
      });

      cards.forEach(c => {
        if (cat === 'all' || c.getAttribute('data-category') === cat) {
          c.classList.remove('hidden');
        } else {
          c.classList.add('hidden');
        }
      });
    }

    function toggleFaq(num) {
      const body = document.getElementById('faq-body-' + num);
      const icon = document.getElementById('faq-icon-' + num);
      if (body.classList.contains('hidden')) {
        body.classList.remove('hidden');
        icon.innerText = '−';
      } else {
        body.classList.add('hidden');
        icon.innerText = '+';
      }
    }

    function openLeadModal(title) {
      if (title) document.getElementById('modal-title').innerText = title;
      document.getElementById('lead-modal').classList.remove('hidden');
    }

    function closeLeadModal() {
      document.getElementById('lead-modal').classList.add('hidden');
    }

    function handleLeadSubmit(e) {
      e.preventDefault();
      const email = document.getElementById('lead-email').value;
      closeLeadModal();
      showToast('🚀 Deployment initialized for: ' + email);
    }

    function scrollToAudit() {
      document.getElementById('audit').scrollIntoView({ behavior: 'smooth' });
    }

    function runAuditDemo() {
      showToast('🛡️ Running live AST verification...');
      setTimeout(() => {
        const fb = document.getElementById('audit-feedback');
        fb.innerHTML = '<span>Status: <strong class="text-emerald-400">EXCELLENT (100/100)</strong> — 0 syntax bugs, responsive viewport verified, Vercel ready.</span><span class="text-zinc-500 font-mono">Timestamp: ' + new Date().toLocaleTimeString() + '</span>';
        showToast('✔ Audit complete: 100/100 Healthy');
      }, 700);
    }
  </script>
</body>
</html>`;
