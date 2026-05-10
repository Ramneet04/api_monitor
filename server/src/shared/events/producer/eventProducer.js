import { EVENT_TYPES } from "../eventContracts.js";
import { isRetryable } from "./RetryStrategy.js";

export class EventProducer {
    constructor({ channelManager, circuitBreaker, retryStrategy, logger, queueName }) {
        if (!channelManager) throw new Error('EventProducer requires channelManager');
        if (!circuitBreaker) throw new Error('EventProducer requires circuitBreaker');
        if (!retryStrategy) throw new Error('EventProducer requires retryStrategy');
        if (!queueName) throw new Error('EventProducer requires queueName');

        this._channelManager = channelManager;
        this._circuitBreaker = circuitBreaker;
        this._retry = retryStrategy;
        this._logger = logger ?? console;
        this._queueName = queueName;

        this._metrics = {
            published: 0,
            failed: 0,
            retriesExhausted: 0
        }

        this._shuttingDown = false
    }

}