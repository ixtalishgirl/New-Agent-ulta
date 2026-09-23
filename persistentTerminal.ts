import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  cwd: string;
  persistent: boolean;
}

class PersistentShellSession {
  private bashProcess: ChildProcess | null = null;
  private pythonProcess: ChildProcess | null = null;
  private currentCwd: string = process.cwd();
  private commandQueue: Array<{
    cmd: string;
    type: 'bash' | 'python';
    timeoutMs: number;
    resolve: (res: CommandResult) => void;
    reject: (err: any) => void;
  }> = [];
  private isExecuting: boolean = false;
  private history: Array<{ command: string; timestamp: number; exitCode: number; durationMs: number; cwd: string }> = [];

  constructor() {
    this.initBash();
    this.initPython();
  }

  private initBash() {
    try {
      this.bashProcess = spawn('/bin/bash', ['-i'], {
        cwd: this.currentCwd,
        env: {
          ...process.env,
          TERM: 'dumb',
          PAGER: 'cat',
          PS1: '',
        },
      });

      this.bashProcess.on('exit', (code) => {
        console.warn(`[PersistentShell] Bash process exited with code ${code}, reviving session...`);
        this.bashProcess = null;
        setTimeout(() => this.initBash(), 500);
      });

      this.bashProcess.on('error', (err) => {
        console.error(`[PersistentShell] Bash process error:`, err);
      });
    } catch (e) {
      console.error(`[PersistentShell] Failed to initialize bash process:`, e);
    }
  }

  private initPython() {
    try {
      this.pythonProcess = spawn('python3', ['-u', '-i'], {
        cwd: this.currentCwd,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
        },
      });

      this.pythonProcess.on('exit', (code) => {
        console.warn(`[PersistentShell] Python session exited with code ${code}, reviving session...`);
        this.pythonProcess = null;
        setTimeout(() => this.initPython(), 500);
      });

      this.pythonProcess.on('error', (err) => {
        console.error(`[PersistentShell] Python process error:`, err);
      });
    } catch (e) {
      console.error(`[PersistentShell] Failed to initialize python process:`, e);
    }
  }

  public async exec(cmd: string, timeoutMs: number = 60000): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      this.commandQueue.push({ cmd, type: 'bash', timeoutMs, resolve, reject });
      this.processQueue();
    });
  }

  public async execPython(code: string, timeoutMs: number = 60000): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      this.commandQueue.push({ cmd: code, type: 'python', timeoutMs, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isExecuting || this.commandQueue.length === 0) return;
    this.isExecuting = true;
    const task = this.commandQueue.shift()!;

    const startTime = Date.now();
    try {
      let result: CommandResult;
      if (task.type === 'python') {
        result = await this.runInPython(task.cmd, task.timeoutMs, startTime);
      } else {
        result = await this.runInBash(task.cmd, task.timeoutMs, startTime);
      }
      this.history.push({
        command: task.cmd,
        timestamp: Date.now(),
        exitCode: result.exitCode,
        durationMs: result.durationMs,
        cwd: result.cwd,
      });
      task.resolve(result);
    } catch (err) {
      task.reject(err);
    } finally {
      this.isExecuting = false;
      this.processQueue();
    }
  }

  private runInBash(cmd: string, timeoutMs: number, startTime: number): Promise<CommandResult> {
    return new Promise((resolve) => {
      if (!this.bashProcess || !this.bashProcess.stdin || !this.bashProcess.stdout) {
        this.initBash();
      }

      const boundary = `__HALYE_EXEC_END_${Date.now()}_${Math.random().toString(36).substring(2, 7)}__`;
      let stdoutAccum = '';
      let stderrAccum = '';
      let finished = false;

      const timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          cleanup();
          resolve({
            stdout: stdoutAccum,
            stderr: stderrAccum + `\n[Timeout: Persistent execution exceeded ${timeoutMs}ms]`,
            exitCode: 124,
            durationMs: Date.now() - startTime,
            cwd: this.currentCwd,
            persistent: true,
          });
        }
      }, timeoutMs);

      const onStdout = (chunk: Buffer) => {
        const text = chunk.toString();
        stdoutAccum += text;
        if (stdoutAccum.includes(boundary)) {
          finish();
        }
      };

      const onStderr = (chunk: Buffer) => {
        stderrAccum += chunk.toString();
      };

      const cleanup = () => {
        clearTimeout(timer);
        if (this.bashProcess && this.bashProcess.stdout) {
          this.bashProcess.stdout.removeListener('data', onStdout);
        }
        if (this.bashProcess && this.bashProcess.stderr) {
          this.bashProcess.stderr.removeListener('data', onStderr);
        }
      };

      const finish = () => {
        if (finished) return;
        finished = true;
        cleanup();

        const pattern = new RegExp(`${boundary}:(-?\\d+):(.*):END`);
        const match = stdoutAccum.match(pattern);
        let exitCode = 0;
        let cleanStdout = stdoutAccum;

        if (match) {
          exitCode = parseInt(match[1], 10);
          if (match[2] && fs.existsSync(match[2].trim())) {
            this.currentCwd = match[2].trim();
          }
          cleanStdout = stdoutAccum.replace(pattern, '').replace(boundary, '').trim();
        } else {
          cleanStdout = stdoutAccum.replace(boundary, '').trim();
        }

        resolve({
          stdout: cleanStdout,
          stderr: stderrAccum.trim(),
          exitCode,
          durationMs: Date.now() - startTime,
          cwd: this.currentCwd,
          persistent: true,
        });
      };

      this.bashProcess!.stdout!.on('data', onStdout);
      this.bashProcess!.stderr!.on('data', onStderr);

      // Execute command, track exit code and updated cwd, then echo boundary token
      const fullCmd = `${cmd}\n__HALYE_CODE__=$?\necho "${boundary}:\${__HALYE_CODE__}:\$(pwd):END"\n`;
      this.bashProcess!.stdin!.write(fullCmd);
    });
  }

  private runInPython(code: string, timeoutMs: number, startTime: number): Promise<CommandResult> {
    return new Promise((resolve) => {
      if (!this.pythonProcess || !this.pythonProcess.stdin || !this.pythonProcess.stdout) {
        this.initPython();
      }

      const boundary = `__HALYE_PY_END_${Date.now()}_${Math.random().toString(36).substring(2, 7)}__`;
      let stdoutAccum = '';
      let stderrAccum = '';
      let finished = false;

      const timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          cleanup();
          resolve({
            stdout: stdoutAccum,
            stderr: stderrAccum + `\n[Timeout: Persistent python execution exceeded ${timeoutMs}ms]`,
            exitCode: 124,
            durationMs: Date.now() - startTime,
            cwd: this.currentCwd,
            persistent: true,
          });
        }
      }, timeoutMs);

      const onStdout = (chunk: Buffer) => {
        stdoutAccum += chunk.toString();
        if (stdoutAccum.includes(boundary)) {
          finish();
        }
      };

      const onStderr = (chunk: Buffer) => {
        stderrAccum += chunk.toString();
      };

      const cleanup = () => {
        clearTimeout(timer);
        if (this.pythonProcess && this.pythonProcess.stdout) {
          this.pythonProcess.stdout.removeListener('data', onStdout);
        }
        if (this.pythonProcess && this.pythonProcess.stderr) {
          this.pythonProcess.stderr.removeListener('data', onStderr);
        }
      };

      const finish = () => {
        if (finished) return;
        finished = true;
        cleanup();
        const cleanStdout = stdoutAccum.replace(boundary, '').trim();
        resolve({
          stdout: cleanStdout,
          stderr: stderrAccum.trim(),
          exitCode: 0,
          durationMs: Date.now() - startTime,
          cwd: this.currentCwd,
          persistent: true,
        });
      };

      this.pythonProcess!.stdout!.on('data', onStdout);
      this.pythonProcess!.stderr!.on('data', onStderr);

      const wrapped = `${code}\nprint("${boundary}", flush=True)\n`;
      this.pythonProcess!.stdin!.write(wrapped);
    });
  }

  public getStatus() {
    return {
      bashRunning: !!this.bashProcess && !this.bashProcess.killed,
      pythonRunning: !!this.pythonProcess && !this.pythonProcess.killed,
      cwd: this.currentCwd,
      historyCount: this.history.length,
      queueLength: this.commandQueue.length,
      recentHistory: this.history.slice(-10),
    };
  }

  public reset() {
    if (this.bashProcess) {
      try { this.bashProcess.kill(); } catch {}
    }
    if (this.pythonProcess) {
      try { this.pythonProcess.kill(); } catch {}
    }
    this.bashProcess = null;
    this.pythonProcess = null;
    this.currentCwd = process.cwd();
    this.initBash();
    this.initPython();
    return { status: 'restarted', cwd: this.currentCwd };
  }
}

export const persistentShell = new PersistentShellSession();
