const { sendDingdingTalk } = require("../src/index.js");

describe("sendIp", () => {
  it("should send IP address to DingTalk", async () => {
    // 获取本机IP地址

    // 发送IP地址到钉钉机器人
    const response = await sendDingdingTalk("1.1.1.1");

    // 验证是否成功发送消息
    expect(response).toBe(true);
  });
});
