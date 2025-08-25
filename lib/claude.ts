import Anthropic from '@anthropic-ai/sdk';

// Claude API 클라이언트 초기화
export const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || '',
});

// 메시지 전송 함수
export async function sendMessage(message: string) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Claude API 오류:', error);
    throw error;
  }
}

// 스트림 메시지 전송 함수
export async function sendStreamMessage(message: string) {
  try {
    const stream = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      stream: true,
    });

    return stream;
  } catch (error) {
    console.error('Claude API 스트림 오류:', error);
    throw error;
  }
}
