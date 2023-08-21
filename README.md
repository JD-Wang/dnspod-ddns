## 腾讯云 DNSPod DDNS

1. 新增一个本地文件.local.json

```
{
  "SECRETID": "...", // https://console.cloud.tencent.com/cam/capi
  "SECRETKEY": "...",
  "DomainIdList": ["..."] // 这里的id从 https://console.cloud.tencent.com/cns/detail/ 域名设置里查找
}

```

2. 修改你的 SubDomain
