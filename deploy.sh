#!/bin/bash
# 养殖场管理 PWA - 部署脚本
# 使用方法: ./deploy.sh [服务器地址]

set -e

# 配置
SERVER=${1:-"user@your-server.com"}
REMOTE_PATH="/var/www/farm-app"
BUILD_DIR="dist"

echo "🚀 开始部署养殖场管理 PWA..."
echo "目标服务器: $SERVER"
echo "目标路径: $REMOTE_PATH"

# 1. 构建生产版本
echo ""
echo "📦 构建生产版本..."
NODE_ENV=production npm run build

# 2. 检查构建结果
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ 构建失败: $BUILD_DIR 目录不存在"
    exit 1
fi

echo "✅ 构建完成"
ls -la $BUILD_DIR

# 3. 上传到服务器
echo ""
echo "📤 上传文件到服务器..."
ssh $SERVER "mkdir -p $REMOTE_PATH"
rsync -avz --delete $BUILD_DIR/ $SERVER:$REMOTE_PATH/

# 4. 设置权限
echo ""
echo "🔧 设置文件权限..."
ssh $SERVER "chmod -R 755 $REMOTE_PATH"
ssh $SERVER "chown -R www-data:www-data $REMOTE_PATH" 2>/dev/null || true

# 5. 重载 nginx
echo ""
echo "🔄 重载 nginx..."
ssh $SERVER "sudo nginx -t && sudo nginx -s reload" || echo "⚠️ nginx 重载失败，请手动检查配置"

echo ""
echo "✅ 部署完成！"
echo ""
echo "📝 后续步骤:"
echo "1. 确保 nginx 配置已正确设置"
echo "2. 访问 https://your-domain.com/farm-app/ 测试"
echo "3. 检查 PWA 安装功能是否正常"
echo ""
echo "🔧 Nginx 配置参考: nginx.conf"
