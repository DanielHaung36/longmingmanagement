#!/bin/bash
set -e

echo "🗑️  卸载 Inventory 系统..."

kubectl delete -f 60-cloudflared.yaml --ignore-not-found=true
kubectl delete -f 50-ingress.yaml --ignore-not-found=true
kubectl delete -f 40-frontend.yaml --ignore-not-found=true
kubectl delete -f 30-backend.yaml --ignore-not-found=true
kubectl delete -f 20-redis.yaml --ignore-not-found=true
kubectl delete -f 10-postgres.yaml --ignore-not-found=true
kubectl delete -f 00-namespace.yaml --ignore-not-found=true

echo "✅ 卸载完成"
