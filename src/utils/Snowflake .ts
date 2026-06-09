class Snowflake {
  private readonly epoch: number = 1609459200000; // 2021-01-01 00:00:00 UTC
  private readonly workerIdBits: number = 5;
  private readonly datacenterIdBits: number = 5;
  private readonly sequenceBits: number = 12;

  private readonly maxWorkerId: number = -1 ^ (-1 << this.workerIdBits);
  private readonly maxDatacenterId: number = -1 ^ (-1 << this.datacenterIdBits);

  private readonly workerIdShift: number = this.sequenceBits;
  private readonly datacenterIdShift: number = this.sequenceBits + this.workerIdBits;
  private readonly timestampLeftShift: number = this.sequenceBits + this.workerIdBits + this.datacenterIdBits;

  private sequence: number = 0;
  private lastTimestamp: number = -1;

  constructor(private workerId: number, private datacenterId: number) {
    if (workerId > this.maxWorkerId || workerId < 0) {
      throw new Error(`workerId can't be greater than ${this.maxWorkerId} or less than 0`);
    }
    if (datacenterId > this.maxDatacenterId || datacenterId < 0) {
      throw new Error(`datacenterId can't be greater than ${this.maxDatacenterId} or less than 0`);
    }
  }

  public nextId(): bigint {
    let timestamp = this.currentTime();

    if (timestamp < this.lastTimestamp) {
      throw new Error(`Clock moved backwards. Refusing to generate id for ${this.lastTimestamp - timestamp} milliseconds`);
    }

    if (this.lastTimestamp === timestamp) {
      this.sequence = (this.sequence + 1) & ((-1 ^ (-1 << this.sequenceBits)));
      if (this.sequence === 0) {
        timestamp = this.tilNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    return ((BigInt(timestamp - this.epoch) << BigInt(this.timestampLeftShift)) |
      (BigInt(this.datacenterId) << BigInt(this.datacenterIdShift)) |
      (BigInt(this.workerId) << BigInt(this.workerIdShift)) |
      BigInt(this.sequence));
  }

  private tilNextMillis(lastTimestamp: number): number {
    let timestamp = this.currentTime();
    while (timestamp <= lastTimestamp) {
      timestamp = this.currentTime();
    }
    return timestamp;
  }

  private currentTime(): number {
    return Date.now();
  }
}

export default Snowflake;