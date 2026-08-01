import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../dto/response.dto';

/**
 * 全局响应拦截器
 *
 * 功能：将接口返回的数据自动包装为统一响应格式
 *
 * 响应格式：
 * {
 *   code: 200,        // 状态码
 *   message: "success", // 提示信息
 *   data: ...         // 接口返回的数据
 * }
 *
 * 使用方式：
 * 在 main.ts 中注册为全局拦截器：
 * app.useGlobalInterceptors(new TransformInterceptor());
 *
 * 接口直接返回数据即可，无需手动包装：
 *
 * @Controller('example')
 * export class ExampleController {
 *   // 返回对象 → 自动包装到 data
 *   @Get('list')
 *   async findAll() {
 *     return { list: [], total: 0 };
 *     // 实际返回: { code: 200, message: "success", data: { list: [], total: 0 } }
 *   }
 *
 *   // 返回单个对象
 *   @Get(':id')
 *   async findOne(@Param('id') id: number) {
 *     return { id: 1, name: 'test' };
 *     // 实际返回: { code: 200, message: "success", data: { id: 1, name: 'test' } }
 *   }
 *
 *   // 如果需要自定义 code 和 message，可直接返回 ResponseDto
 *   @Post('custom')
 *   async custom() {
 *     return new ResponseDto(201, '创建成功', { id: 1 });
 *     // 实际返回: { code: 201, message: "创建成功", data: { id: 1 } }
 *   }
 * }
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T>> {
    return next.handle().pipe(
      map((data) => {
        // 如果已经是 ResponseDto 格式，直接返回
        if (data instanceof ResponseDto) {
          return data;
        }
        // 否则自动包装为成功响应
        return ResponseDto.success(data);
      }),
    );
  }
}
