import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const AIChatbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Xin chào! Mình là trợ lý AI của CourseDream. Bạn đang muốn tìm khóa học về chủ đề gì?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const currentMessages = [...messages, { role: 'user', text: userText }];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    const aiMessageIndex = currentMessages.length;
    // Tạo một tin nhắn rỗng của AI để chuẩn bị nhận luồng dữ liệu (Stream)
    setMessages(prev => [...prev, { role: 'ai', text: '', courses: [] }]);

    try {
      // Dùng fetch thay vì axios để xử lý Stream
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/chatbot/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history: currentMessages })
      });

      if (!response.body) throw new Error('No readable stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          setIsLoading(false); // Đã bắt đầu nhận luồng, tắt loading
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') {
                done = true;
                break;
              }
              if (dataStr) {
                try {
                  const data = JSON.parse(dataStr);
                  if (data.type === 'courses') {
                    setMessages(prev => {
                      const newMsgs = [...prev];
                      newMsgs[aiMessageIndex] = { ...newMsgs[aiMessageIndex], courses: data.courses };
                      return newMsgs;
                    });
                  } else if (data.type === 'text') {
                    setMessages(prev => {
                      const newMsgs = [...prev];
                      newMsgs[aiMessageIndex] = { ...newMsgs[aiMessageIndex], text: newMsgs[aiMessageIndex].text + data.text };
                      return newMsgs;
                    });
                  }
                } catch (e) {
                  console.error("Error parsing SSE data", e);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[aiMessageIndex] = { role: 'ai', text: 'Xin lỗi, hệ thống AI đang gặp sự cố. Bạn vui lòng thử lại sau nhé.' };
        return newMsgs;
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white p-4 rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {isOpen && (
        <div className="bg-white w-80 sm:w-[400px] rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden" style={{ height: '550px', maxHeight: '80vh' }}>
          {/* Header */}
          <div className="bg-rose-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={24} />
              <span className="font-semibold text-lg">Trợ lý CourseDream</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {messages.map((msg, index) => (
              <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.text && (
                  <div className={`px-4 py-2 rounded-2xl max-w-[85%] ${msg.role === 'user'
                      ? 'bg-rose-600 text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                    }`}>
                    <div className={`text-[15px] leading-relaxed text-justify ${msg.role === 'ai' ? 'markdown-chat' : 'whitespace-pre-wrap'}`}>
                      {msg.role === 'ai' ? (
                        <ReactMarkdown
                          components={{
                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-bold text-gray-900" {...props} />,
                            em: ({ node, ...props }) => <em className="italic" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 ml-1" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 ml-1" {...props} />,
                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                )}

                {/* Courses Card */}
                {msg.courses && msg.courses.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2 w-full max-w-[90%]">
                    {msg.courses.map(course => (
                      <Link key={course._id} to={`/courses/${course.slug}`} className="bg-white border border-gray-200 rounded-lg p-2 flex gap-3 hover:shadow-md transition">
                        <img src={course.thumbnail} alt={course.title} className="w-20 h-14 object-cover rounded-md" />
                        <div className="flex flex-col justify-between flex-1">
                          <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">{course.title}</h4>
                          <span className="text-xs text-rose-600 font-bold">{course.price > 0 ? course.price.toLocaleString() + 'đ' : 'Miễn phí'}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start">
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Hỏi trợ lý tư vấn khóa học..."
              className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-rose-500 border rounded-full px-4 py-2 text-sm outline-none transition"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-rose-600 text-white p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-rose-700 disabled:opacity-50 transition"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatbox;
