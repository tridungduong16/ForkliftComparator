import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your forklift assistant. I can help you find the perfect forklift for your needs, compare models, or answer questions about specifications. What would you like to know?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Capacity-related queries
    if (message.includes('capacity') || message.includes('weight') || message.includes('kg') || message.includes('tonne')) {
      return "Our forklifts range from 2-3.5 tonnes capacity. For 2-2.5 tonnes, consider our ENTRY tier models like Bobcat NXP25 or Hyster UT Series. For 3-3.5 tonnes, check out our PREMIUM models like Linde HT Series or Crown C-5 Series Diesel. What's your typical load requirement?";
    }
    
    // Brand-specific queries
    if (message.includes('toyota')) {
      return "Toyota offers excellent reliability with their 8 Series (MID tier). It features 2500kg capacity, 190mm lift height, and costs $37k-$43k. Toyota is known for exceptional build quality and 24-month warranty. Would you like to compare it with other brands?";
    }
    
    if (message.includes('hyster')) {
      return "Hyster has strong options across all tiers: UT Series (ENTRY) for budget-conscious buyers, XT Series (MID) for balanced performance, and FT Series (PREMIUM) for heavy-duty applications. Which tier interests you most?";
    }
    
    if (message.includes('bobcat')) {
      return "Bobcat offers great value with NXP25/NXP30 (ENTRY), 7 Series (MID), and NXS35 (PREMIUM). They're known for compact design and excellent maneuverability. The 7 Series is particularly popular for warehouses. Need specific specs?";
    }
    
    // Power type queries
    if (message.includes('diesel') || message.includes('lpg') || message.includes('gas') || message.includes('fuel')) {
      return "Most models offer dual fuel options (LPG/Diesel). Diesel provides more power and efficiency for heavy loads, while LPG offers cleaner operation and lower emissions. Some dedicated diesel models like Crown C-5 Series Diesel offer maximum performance. What's your preference?";
    }
    
    // Price-related queries
    if (message.includes('price') || message.includes('cost') || message.includes('budget')) {
      return "Pricing by tier: ENTRY ($28k-$40k) - basic operations, MID ($35k-$46k) - balanced features, PREMIUM ($42k-$50k) - advanced capabilities. Most models include 12-24 month warranties. What's your budget range?";
    }
    
    // Comparison queries
    if (message.includes('compare') || message.includes('vs') || message.includes('difference')) {
      return "I can help you compare any models! Our comparison tool shows side-by-side specs, pricing, and performance scores. Try our brand grid to drag models for comparison, or tell me which specific models you're considering?";
    }
    
    // Tier-related queries
    if (message.includes('tier') || message.includes('entry') || message.includes('premium') || message.includes('mid')) {
      return "We classify forklifts into tiers: ENTRY (price-sensitive, basic features), MID (balanced performance), PREMIUM (advanced features, heavy-duty). Each tier has different warranty periods and capabilities. Which tier matches your needs?";
    }
    
    // AI/brochure queries
    if (message.includes('brochure') || message.includes('upload') || message.includes('scan')) {
      return "Our AI scanner can automatically extract specifications from manufacturer brochures! Just upload a PDF and it will detect fuel types, classify tiers, and populate all specs. Very handy for keeping your database current. Want to try it?";
    }
    
    // General help
    if (message.includes('help') || message.includes('how') || message.includes('guide')) {
      return "I can help you with: finding models by capacity/budget, comparing specifications, understanding tier differences, brand recommendations, pricing information, and using our AI brochure scanner. What specific area interests you?";
    }
    
    // Default responses
    const responses = [
      "That's a great question! Could you be more specific about what you're looking for? I can help with capacity requirements, brand comparisons, pricing, or technical specifications.",
      "I'd be happy to help you find the right forklift. Are you looking for a specific capacity range, budget, or do you have particular brands in mind?",
      "Let me assist you with that. What's your primary use case - warehouse operations, outdoor work, or mixed applications? This helps narrow down the best options.",
      "I can provide detailed information about any of our 23+ forklift models. What specific requirements or questions do you have?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-16 w-16 shadow-lg hover:shadow-xl transition-all duration-300 bg-blue-600 hover:bg-blue-700"
        >
          <MessageCircle className="h-8 w-8" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px]">
      <Card className="h-full flex flex-col shadow-2xl border-2">
        <CardHeader className="bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6" />
              <CardTitle className="text-lg">Forklift Assistant</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-blue-100 text-sm">Ask me about forklifts, specs, or comparisons!</p>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    message.sender === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3 text-sm",
                      message.sender === 'user'
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    )}
                  >
                    {message.text}
                  </div>
                  
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 text-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about forklifts..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                size="sm"
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}