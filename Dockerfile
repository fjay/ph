# 构建阶段
FROM node:18-alpine as builder

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY . .

# 创建一个简单的package.json
RUN echo '{"type":"module","scripts":{"build":"mkdir -p dist && cp -r src styles.css index.html dist/"}}' > package.json

# 构建项目
RUN npm run build

# 生产环境阶段
FROM nginx:alpine

# 复制构建产物到nginx服务目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露80端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]