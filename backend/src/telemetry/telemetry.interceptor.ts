import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TelemetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TelemetryInterceptor.name);
  private readonly logDir = path.join(process.cwd(), 'logs');
  private readonly logFile = path.join(this.logDir, 'telemetry.log');
  private logStream: fs.WriteStream;

  constructor() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const startTime = Date.now();
    const startCpu = process.cpuUsage();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          this.writeLog(req, res.statusCode, startTime, startCpu);
        },
        error: (err) => {
          const status = err?.status || 500;
          this.writeLog(req, status, startTime, startCpu);
        },
      }),
    );
  }

  private writeLog(req: any, statusCode: number, startTime: number, startCpu: NodeJS.CpuUsage): void {
    const executionTimeMs = Date.now() - startTime;
    const cpuUsage = process.cpuUsage(startCpu);
    const memoryUsage = process.memoryUsage();

    const logEntry = {
      timestamp: new Date().toISOString(),
      route: req.url,
      method: req.method,
      statusCode,
      executionTimeMs,
      memoryUsageMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
      cpuUsageUser: cpuUsage.user,
      cpuUsageSystem: cpuUsage.system,
    };

    const line = JSON.stringify(logEntry) + '\n';
    
    this.logStream.write(line, (err) => {
      if (err) {
        this.logger.error(`Failed to write telemetry log: ${err.message}`);
      }
    });
  }
}
