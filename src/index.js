const tencentcloud = require("tencentcloud-sdk-nodejs-dnspod");
const axios = require("axios");

/**
 * .local.json 配置文件示例
{
  "SECRETID": "AKIDd3EC3l8**********MHyZ1EmLgnrdJl",
  "SECRETKEY": "LOv3b8QaWU*********3NRilYFwMg",
  "Domain": "baidu.com",
  "SubDomain": "abc", // abc.baidu.com
  "DomainIdList": ["850***71"],
  "WebhookUrl": "https://oapi.dingtalk.com/robot/send?access_token=25ba98*****45f0639"
}
 */
const { SECRETID, SECRETKEY, Domain, DomainId, SubDomain, WebhookUrl } = require("../.local.json");

const DnspodClient = tencentcloud.dnspod.v20210323.Client;

const timeout = 5000; // 设置超时时间为5秒

// 实例化一个认证对象，入参需要传入腾讯云账户 SecretId 和 SecretKey，此处还需注意密钥对的保密
// 代码泄露可能会导致 SecretId 和 SecretKey 泄露，并威胁账号下所有资源的安全性。以下代码示例仅供参考，建议采用更安全的方式来使用密钥，请参见：https://cloud.tencent.com/document/product/1278/85305
// 密钥可前往官网控制台 https://console.cloud.tencent.com/cam/capi 进行获取
const clientConfig = {
  credential: {
    secretId: SECRETID,
    secretKey: SECRETKEY,
  },
  region: "",
  profile: {
    httpProfile: {
      endpoint: "dnspod.tencentcloudapi.com",
    },
  },
};

// 实例化要请求产品的client对象,clientProfile是可选的
const client = new DnspodClient(clientConfig);

async function fetchIp() {
  try {
    const result1 = axios("https://qifu-api.baidubce.com/ip/local/geo/v1/district", { timeout })
      .then((res) => res.data.ip)
      .catch((e) => console.log(e));
    const result2 = axios("https://www.taobao.com/help/getip.php", { timeout }).then((res) => {
      const regex = /[0-9.]+/;
      const match = res?.data?.match(regex);
      return match?.[0];
    });

    return await Promise.race([result1, result2]);
  } catch (error) {}
}

/**
 * 发送机器人消息
 * @returns
 */
async function sendDingdingTalk(ip) {
  // 根据关键字触发钉钉机器人
  if (ip) {
    // 将YOUR_KEYWORD替换为您希望触发机器人的关键字
    await axios.post(WebhookUrl, {
      msgtype: "text",
      text: {
        content: `服务器ip变动: ${ip}`, // 根据您的需求，修改发送的消息内容
      },
    });

    console.log("消息发送成功");
    return true;
  } else {
    console.error("ip 缺失");
  }

  console.error("消息发送失败");
  return false;
}

async function task() {
  const ip = await fetchIp();
  if (!ip) {
    return;
  }

  const recordData = await client.DescribeRecordList({ Domain: Domain });

  const record = recordData.RecordList.find((item) => item.Name === SubDomain);
  if (!record) {
    client
      .CreateRecord({
        Domain: Domain,
        SubDomain: SubDomain,
        RecordType: "A",
        Value: ip,
        RecordLine: "默认",
      })
      .then((data) => {
        console.log(`${new Date()} 新增解析成功: ${ip}`);
        sendDingdingTalk(`新增解析：${ip}`);
      })
      .catch((e) => console.log(e));
  }
  const recordId = recordData.RecordList.find((item) => item.Name === SubDomain)?.RecordId;
  if (!recordId) return;

  await client
    .ModifyRecord({
      Domain: Domain,
      SubDomain: SubDomain,
      RecordType: "A",
      Value: ip,
      RecordLine: "默认",
      RecordId: recordId,
    })
    .then((data) => {
      console.log(`${new Date()} 修改解析成功: ${ip}`);
      sendDingdingTalk(`修改解析：${ip}`);
    })
    .catch((e) => console.log(e));
}

async function repeatTask(fn, time) {
  await fn();
  setTimeout(() => {
    repeatTask(fn, time);
  }, time);
}

module.exports = {
  task,
  repeatTask,
  sendDingdingTalk,
};
