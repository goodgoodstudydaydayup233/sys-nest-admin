src/
├── common/                    # 公共模块
│   ├── decorators/           # 自定义装饰器
│   ├── dto/                  # 公共DTO
│   ├── enums/                # 枚举常量
│   ├── exceptions/           # 自定义异常
│   ├── filters/              # 异常过滤器
│   ├── guards/               # 守卫
│   ├── interceptors/         # 拦截器
│   ├── pipes/                # 管道
│   └── utils/                # 工具函数
│
├── core/                      # 核心模块
│   ├── config/               # 配置管理
│   ├── database/             # 数据库配置
│   ├── logger/               # 日志服务
│   └── redis/                # Redis缓存
│
├── modules/                   # 业务模块
│   ├── auth/                 # 认证模块
│   │   ├── dto/              # 数据传输对象
│   │   ├── entities/         # 实体
│   │   ├── guards/           # 认证守卫
│   │   └── strategies/       # 认证策略
│   │
│   ├── captcha/              # 验证码模块
│   │
│   ├── user/                 # 用户管理
│   │   ├── dto/              # 数据传输对象
│   │   ├── entities/         # 实体
│   │   └── vo/               # 视图对象
│   │
│   ├── role/                 # 角色管理
│   │   ├── dto/              # 数据传输对象
│   │   ├── entities/         # 实体
│   │   └── vo/               # 视图对象
│   │
│   └── menu/                 # 菜单管理
│       ├── dto/              # 数据传输对象
│       ├── entities/         # 实体
│       └── vo/               # 视图对象
│
├── app.module.ts              # 根模块
└── main.ts                    # 入口文件
