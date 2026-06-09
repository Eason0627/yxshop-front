export default class RequestJSON {
  private code: number;
  private msg: string;
  private data: any;

  constructor(code: number, msg: string, data: any) {
    this.code = code;
    this.msg = msg;
    this.data = data;
  }

  public getCode(): number {
    return this.code;
  }
  public getMsg(): string {
    return this.msg;
  }
  public getData(): any {
    return this.data;
  }
  public setCode(code: number): void {
    this.code = code;
  }
  public setMsg(msg: string): void {
    this.msg = msg;
  }
  public setData(data: any): void {
    this.data = data;
  }
}
