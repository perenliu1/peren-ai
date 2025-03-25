import { useApiKeyStore } from '@/stores/apiKeyStore'

export const streamCompletion = async (
  { model, temperature, messages },
  { onReasoning, onContent }
) => {
  const apiKeyStore = useApiKeyStore()
  const response = await fetch(
    "https://api.siliconflow.cn/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKeyStore.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: 8730,
        stream: true,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error("请求失败：" + error || "请求失败");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk
      .split("\n")
      .filter((line) => line.trim().startsWith("data: "));

    for (const line of lines) {
      try {
        const jsonStr = line.replace("data: ", "");

        // 新增检查 [DONE] 标记
        if (jsonStr.trim() === "[DONE]") continue;

        const data = JSON.parse(jsonStr);
        const delta = data.choices[0]?.delta || {};

        if (delta.reasoning_content) {
          onReasoning?.(delta.reasoning_content);
        }

        if (delta.content) {
          fullContent += delta.content;
          onContent?.(delta.content);
        }
      } catch (e) {
        console.error("JSON解析错误:", e);
      }
    }
  }
  return fullContent;
};
