# 使用API

应用开发者可以使用API通过以下步骤：

1. 利用**应用ID**,**应用密钥**换取access_token
2. 使用access_token请求API

## 授权凭证

TAPD开放应用支持OAUTH方式使用API。
利用**应用ID**,**应用密钥**拿到换取access_token

### TAPD-OAUTH流程

![TAPD-OAUTH](/document/img/auth.png)

### 获取授权凭证

* TAPD开放平台会为开放应用发放access_token用于开放应用的API使用。access_token会过期，此时需要重新获取。

## 请求API

开放应用在用户**OAUTH授权**并**安装**开放应用之后，就可以用access_token去使用API了。

只需要在 http header 传 access_token 参数去请求TAPD API 接口，如：

```bash
curl -H 'Authorization: Bearer ACCESS_TOKEN' 'https://api.tapd.cn/bugs?workspace_id=10022001&fields=id,title'
```

## 测试企业调试API

应用开发者团队可以在测试项目处调试换取access_token和使用API（开发者后台 -> 选择应用 -> 应用开发 -> 测试项目)

![获取应用凭证](/document/img/获取应用凭证_cloud.png)

利用**应用ID**,**应用密钥**拿到换取access_token

## API权限控制

开放应用只能使用开放应用已拥有的应用权限的对应模块的API。

## API安全IP控制

如果开放应用设置了安全设置，开放应用只能使用开放应用已设置的**安全IP**去请求API。

---
文档来源: https://open.tapd.cn/document/api-doc/快速入门/开发应用/使用API.html
更新时间: 2024-05-17 19:21:20
