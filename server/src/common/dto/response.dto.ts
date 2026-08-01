export class ResponseDto<T = any> {
  code: number;
  msg: string;
  data: T;

  constructor(code: number = 200, msg: string = 'success', data?: T) {
    this.code = code;
    this.msg = msg;
    this.data = data as T;
  }

  static success<T>(data: T, msg: string = 'success'): ResponseDto<T> {
    return new ResponseDto<T>(200, msg, data);
  }

  static error(msg: string = 'error', code: number = 500): ResponseDto<null> {
    return new ResponseDto<null>(code, msg, null);
  }
}
