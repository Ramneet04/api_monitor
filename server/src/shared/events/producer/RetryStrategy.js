const RETRYABLE_PATTERNS = [
    'channel closed',
    'connection closed',
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'buffer full',
    'heartbeat timeout',
    'not available',
    'server connection closed',
];

export function isRetryable(err) {
    if(!err){
        return false;
    }

    const msg = (err.message || '').toLowerCase()
    const code = (err.code || '').toUpperCase();

    if (code === 'ENOTFOUND') return true;
    return RETRYABLE_PATTERNS.some(
        (p) => msg.includes(p.toLowerCase()) || code.includes(p.toUpperCase())
    )
}

export class RetryStrategy {
    constructor(opts = {}){
        this.maxRetries = opts.maxRetries ?? 3;
        this.baseDelayMs = opts.baseDelayMs ?? 200;
        this.maxDelayMs = opts.maxDelayMs ?? 5000;
        this.jitterFactor = opts.jitterFactor ?? 0.3;
    }

    shouldRetry(attempt) {
        return attempt < this.maxRetries;
    }

    delay(attempt){
        const expDelay = Math.min(this.baseDelayMs * (2 ** attempt), this.maxDelayMs);
        const jitter = expDelay * this.jitterFactor * (Math.random() - 0.5) * 2; 
        return Math.max(0, Math.round(expDelay + jitter));
    }

    wait(attempt){
        const ms = this.delay(attempt);
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}