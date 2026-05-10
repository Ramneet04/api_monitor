import { EventEmitter } from 'node:events';

export class ConfirmChannelManager extends EventEmitter {
    constructor({rabbitmq, logger}){
        super();
        if(!rabbitmq){
            throw new Error('Confirm Channel Manager requires RabbitMQ instance');
        }
        this._rabbitmq = rabbitmq;
        this.logger = logger ?? console;
        this._channel = null;
        this._connecting = false;
        this._connectWaiters = [];
    }

    async getChannel(){
        if(this._channel){
            return this._channel;
        }
        if(this._connecting){
            return new Promise((resolve, reject) => {
                this._connectWaiters.push({resolve, reject});
            })
        }
        return this._connect();
    }

    async _connect(){
        this._connecting = true;
        try {
            let connection;
            if(this._rabbitmq.connection){
                connection = this._rabbitmq.connection;
            }
            else{
                await this._rabbitmq.connect();
                if(!this._rabbitmq.connection){
                    throw new Error('Failed to get connection from RabbitMQ');
                }
                connection = this._rabbitmq.connection;
            }
            
            const confirmChannel = await connection.createConfirmChannel();

            confirmChannel.on('drain', ()=> this.emit('drain'));

            confirmChannel.on('close', ()=>{
                this.logger.warn('[ChannelManager] confirm channel closed');
                this._channel = null;
                this.emit('close');
            });

            confirmChannel.on('error', (err)=>{
                this.logger.warn('[ChannelManager] confirm channel error', {
                    error: err.message,
                    stack: err.stack,
                    code: err.code,
                });
                this._channel = null;
                this.emit('error', err);
            });

            this._channel = confirmChannel;

            this.logger.info('[ChannelManager] confirm channel created');

            for(const w of this._connectWaiters) w.resolve(confirmChannel);

            this._connectWaiters = [];
            this._connecting = false;
            return confirmChannel;

        } catch (error) {
            for(const w of this._connectWaiters) w.reject(error);
            this._connectWaiters = [];
            this._connecting = false;
            throw error;
        }
    }
}